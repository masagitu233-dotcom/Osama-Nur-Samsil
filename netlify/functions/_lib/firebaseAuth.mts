import crypto from 'node:crypto';

export const DEFAULT_FIREBASE_PROJECT_ID = 'premium-generator-4lxdt';
export const DEFAULT_ADMIN_EMAIL = 'osamanursamsil@gmail.com';

const GOOGLE_SECURETOKEN_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

interface CertCache {
  certs: Record<string, string>;
  expiresAtMs: number;
}

let cachedCerts: CertCache | null = null;

export interface VerifiedAdminClaims {
  uid: string;
  email: string;
  emailVerified: boolean;
  name?: string;
}

export function getFirebaseProjectId(): string {
  return (process.env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID).trim();
}

export function getAdminOwnerEmail(): string {
  return (process.env.GOOGLE_DRIVE_OWNER_EMAIL || process.env.ADMIN_OWNER_EMAIL || DEFAULT_ADMIN_EMAIL)
    .trim()
    .toLowerCase();
}

function decodeBase64UrlJson<T>(segment: string): T {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as T;
}

async function fetchGooglePublicCerts(forceRefresh = false): Promise<Record<string, string>> {
  const now = Date.now();
  if (!forceRefresh && cachedCerts && cachedCerts.expiresAtMs > now) {
    return cachedCerts.certs;
  }

  const res = await fetch(GOOGLE_SECURETOKEN_CERTS_URL, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error('Gagal mengambil sertifikat publik verifikasi Firebase Auth.');
  }

  const certs = (await res.json()) as Record<string, string>;
  const cacheControl = res.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const maxAgeSeconds = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;

  cachedCerts = {
    certs,
    expiresAtMs: now + Math.max(60, maxAgeSeconds - 60) * 1000,
  };
  return certs;
}

/**
 * Cryptographically verifies a Firebase Auth ID token using Google's official
 * public X.509 certificates (RS256) without requiring Firebase Admin SDK IAM credentials.
 */
export async function verifyFirebaseIdToken(
  idToken: string,
  expectedProjectId = getFirebaseProjectId()
): Promise<Record<string, unknown>> {
  const parts = idToken.trim().split('.');
  if (parts.length !== 3) {
    throw new Error('Format token autentikasi tidak valid.');
  }

  const [headerSeg, payloadSeg, sigSeg] = parts;
  const header = decodeBase64UrlJson<{ alg?: string; kid?: string }>(headerSeg);
  const payload = decodeBase64UrlJson<Record<string, unknown>>(payloadSeg);

  if (header.alg !== 'RS256' || !header.kid) {
    throw new Error('Algoritma atau key ID token tidak valid.');
  }

  let certs = await fetchGooglePublicCerts(false);
  let certPem = certs[header.kid];
  if (!certPem) {
    // Key rotation fallback: refresh once
    certs = await fetchGooglePublicCerts(true);
    certPem = certs[header.kid];
  }
  if (!certPem) {
    throw new Error('Sertifikat penandatangan token tidak ditemukan.');
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${headerSeg}.${payloadSeg}`);
  verifier.end();

  const signature = Buffer.from(sigSeg.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  const signatureValid = verifier.verify(certPem, signature);
  if (!signatureValid) {
    throw new Error('Tanda tangan token autentikasi tidak valid.');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const clockSkewSec = 60;

  const exp = Number(payload.exp);
  const iat = Number(payload.iat);
  const authTime = Number(payload.auth_time);
  const aud = String(payload.aud || '');
  const iss = String(payload.iss || '');
  const sub = String(payload.sub || '');

  if (!Number.isFinite(exp) || exp + clockSkewSec < nowSec) {
    throw new Error('Sesi login admin telah kedaluwarsa. Silakan muat ulang atau login kembali.');
  }
  if (!Number.isFinite(iat) || iat - clockSkewSec > nowSec) {
    throw new Error('Waktu penerbitan token tidak valid.');
  }
  if (Number.isFinite(authTime) && authTime - clockSkewSec > nowSec) {
    throw new Error('Waktu autentikasi token tidak valid.');
  }
  if (aud !== expectedProjectId) {
    throw new Error('Audience token tidak sesuai dengan proyek Firebase website.');
  }
  if (iss !== `https://securetoken.google.com/${expectedProjectId}`) {
    throw new Error('Issuer token tidak valid.');
  }
  if (!sub || sub.length > 128) {
    throw new Error('Subject UID token tidak valid.');
  }

  return payload;
}

export class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Extracts and verifies the Authorization: Bearer <Firebase ID Token> header
 * and strictly enforces single-admin authorization.
 */
export async function requireVerifiedAdmin(req: Request): Promise<VerifiedAdminClaims> {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) {
    throw new AuthError(401, 'Akses ditolak: token autentikasi admin tidak disertakan.');
  }

  let claims: Record<string, unknown>;
  try {
    claims = await verifyFirebaseIdToken(match[1]);
  } catch (err) {
    throw new AuthError(
      401,
      err instanceof Error ? err.message : 'Token autentikasi Firebase tidak valid.'
    );
  }

  const email = typeof claims.email === 'string' ? claims.email.trim().toLowerCase() : '';
  const emailVerified = claims.email_verified === true;
  const expectedOwner = getAdminOwnerEmail();

  if (!emailVerified || !email || email !== expectedOwner) {
    throw new AuthError(
      403,
      'Akses ditolak: hanya akun administrator utama website yang berwenang mengakses integrasi Google Drive.'
    );
  }

  return {
    uid: String(claims.sub),
    email,
    emailVerified: true,
    name: typeof claims.name === 'string' ? claims.name : undefined,
  };
}
