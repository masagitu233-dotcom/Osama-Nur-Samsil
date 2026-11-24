import { getAdminOwnerEmail } from './firebaseAuth.mts';
import {
  deleteDriveCredentials,
  loadEncryptedDriveCredentials,
  loadFolderMap,
  saveEncryptedDriveCredentials,
  saveFolderMap,
  type StoredDriveCredentials,
  type StoredFolderMap,
} from './blobStore.mts';

export const DRIVE_ROOT_FOLDER_NAME = 'Portfolio Website';

export const DRIVE_SUBFOLDER_NAMES = [
  'Foto Profil',
  'Pengalaman',
  'Pendidikan',
  'Sertifikat',
  'Dokumen',
  'Proyek dan Karya',
  'File Lainnya',
] as const;

export type DriveSubfolderName = (typeof DRIVE_SUBFOLDER_NAMES)[number];

export type UploadCategory =
  | 'profile'
  | 'experiences'
  | 'organizations'
  | 'education'
  | 'certificates'
  | 'cv'
  | 'documents'
  | 'projects'
  | 'skills'
  | 'interests'
  | 'seo'
  | 'media'
  | 'other';

export const ALLOWED_UPLOAD_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_PDF_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

export const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'openid',
  'email',
].join(' ');

export function resolveDriveSubfolderName(category: string): DriveSubfolderName {
  switch (category) {
    case 'profile':
      return 'Foto Profil';
    case 'experiences':
    case 'organizations':
      return 'Pengalaman';
    case 'education':
      return 'Pendidikan';
    case 'certificates':
      return 'Sertifikat';
    case 'cv':
    case 'documents':
      return 'Dokumen';
    case 'projects':
      return 'Proyek dan Karya';
    case 'skills':
    case 'interests':
    case 'seo':
    case 'media':
    case 'other':
    default:
      return 'File Lainnya';
  }
}

export function getMissingDriveEnvVars(): string[] {
  const missing: string[] = [];
  if (!(process.env.GOOGLE_DRIVE_CLIENT_ID || '').trim()) {
    missing.push('GOOGLE_DRIVE_CLIENT_ID');
  }
  if (!(process.env.GOOGLE_DRIVE_CLIENT_SECRET || '').trim()) {
    missing.push('GOOGLE_DRIVE_CLIENT_SECRET');
  }
  if (!(process.env.GDRIVE_TOKEN_ENCRYPTION_KEY || '').trim()) {
    missing.push('GDRIVE_TOKEN_ENCRYPTION_KEY');
  }
  return missing;
}

export function resolveOAuthRedirectUri(req: Request): string {
  const configured = (process.env.GOOGLE_DRIVE_REDIRECT_URI || '').trim();
  if (configured) {
    return configured;
  }

  const baseFromEnv = (process.env.URL || process.env.DEPLOY_PRIME_URL || '').trim().replace(/\/+$/, '');
  if (baseFromEnv) {
    return `${baseFromEnv}/.netlify/functions/gdrive-oauth-callback`;
  }

  const reqUrl = new URL(req.url);
  return `${reqUrl.origin}/.netlify/functions/gdrive-oauth-callback`;
}

export function sanitizeDriveFileName(rawName: string, mimeType: string): string {
  const cleaned = rawName
    .replace(/[\r\n\t<>:"/\\|?*\u0000-\u001f]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140);

  if (cleaned) return cleaned;

  const ext =
    mimeType === 'application/pdf'
      ? '.pdf'
      : mimeType === 'image/png'
      ? '.png'
      : mimeType === 'image/webp'
      ? '.webp'
      : '.jpg';
  return `portfolio_upload_${Date.now()}${ext}`;
}

export function validateUploadMetadata(input: {
  fileName: unknown;
  mimeType: unknown;
  sizeBytes: unknown;
}): { valid: true; fileName: string; mimeType: string; sizeBytes: number } | { valid: false; error: string } {
  const mimeType = typeof input.mimeType === 'string' ? input.mimeType.trim().toLowerCase() : '';
  const sizeBytes = typeof input.sizeBytes === 'number' ? Math.round(input.sizeBytes) : Number(input.sizeBytes);
  const rawName = typeof input.fileName === 'string' ? input.fileName : '';

  if (!ALLOWED_UPLOAD_MIMES.has(mimeType)) {
    return {
      valid: false,
      error: 'Format file tidak diizinkan. Gunakan gambar JPG, PNG, WebP, atau dokumen PDF.',
    };
  }

  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return { valid: false, error: 'Ukuran file tidak valid atau kosong.' };
  }

  const maxBytes = mimeType === 'application/pdf' ? MAX_PDF_UPLOAD_BYTES : MAX_IMAGE_UPLOAD_BYTES;
  if (sizeBytes > maxBytes) {
    return {
      valid: false,
      error:
        mimeType === 'application/pdf'
          ? 'Ukuran file PDF melebihi batas maksimal 10 MB.'
          : 'Ukuran file gambar melebihi batas maksimal 5 MB.',
    };
  }

  return {
    valid: true,
    fileName: sanitizeDriveFileName(rawName, mimeType),
    mimeType,
    sizeBytes,
  };
}

/**
 * Strictly validates that a resumable upload URI belongs ONLY to Google Drive's
 * resumable upload endpoint to eliminate SSRF risk on chunked fallback uploads.
 */
export function validateGoogleDriveUploadUri(rawUri: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUri.trim());
  } catch {
    throw new Error('URI sesi unggahan tidak valid.');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('URI sesi unggahan harus menggunakan HTTPS.');
  }
  if (parsed.hostname.toLowerCase() !== 'www.googleapis.com') {
    throw new Error('Host URI sesi unggahan tidak diizinkan.');
  }
  if (parsed.pathname !== '/upload/drive/v3/files') {
    throw new Error('Path URI sesi unggahan tidak valid.');
  }
  if (!parsed.searchParams.get('upload_id')) {
    throw new Error('Parameter upload_id tidak ditemukan pada URI sesi unggahan.');
  }
  return parsed;
}

export class DriveReconnectRequiredError extends Error {
  code = 'RECONNECT_REQUIRED' as const;
  constructor(message: string) {
    super(message);
  }
}

export interface TokenExchangeResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  scope: string;
}

export async function exchangeAuthCodeForTokens(
  code: string,
  redirectUri: string
): Promise<TokenExchangeResult> {
  const clientId = (process.env.GOOGLE_DRIVE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GOOGLE_DRIVE_CLIENT_SECRET || '').trim();

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || typeof data.access_token !== 'string') {
    const errDesc =
      typeof data.error_description === 'string'
        ? data.error_description
        : typeof data.error === 'string'
        ? data.error
        : 'Gagal menukar kode otorisasi Google OAuth.';
    throw new Error(errDesc);
  }

  return {
    accessToken: data.access_token,
    refreshToken: typeof data.refresh_token === 'string' ? data.refresh_token : undefined,
    expiresIn: Number(data.expires_in) || 3600,
    scope: typeof data.scope === 'string' ? data.scope : GOOGLE_DRIVE_SCOPES,
  };
}

export async function fetchGoogleAccountEmail(accessToken: string): Promise<{
  email: string;
  emailVerified: boolean;
}> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error('Gagal memverifikasi identitas akun Google yang dihubungkan.');
  }
  const data = (await res.json()) as { email?: string; email_verified?: boolean };
  if (!data.email) {
    throw new Error('Alamat email akun Google tidak ditemukan.');
  }
  return {
    email: data.email.trim().toLowerCase(),
    emailVerified: data.email_verified === true,
  };
}

export async function revokeGoogleToken(token: string): Promise<void> {
  try {
    await fetch('https://oauth2.googleapis.com/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token }).toString(),
    });
  } catch {
    // Best-effort revocation
  }
}

/**
 * Loads the encrypted refresh token from Netlify Blobs and returns a fresh Google Drive access token.
 * Reuses a cached access token if it has > 120 seconds remaining.
 */
export async function getValidDriveAccessToken(forceRefresh = false): Promise<{
  accessToken: string;
  credentials: StoredDriveCredentials;
}> {
  const creds = await loadEncryptedDriveCredentials();
  if (!creds || !creds.refreshToken) {
    throw new DriveReconnectRequiredError(
      'Akun Google Drive belum terhubung. Hubungkan akun Google Drive pengelola terlebih dahulu di Dashboard Admin.'
    );
  }

  const expectedOwner = getAdminOwnerEmail();
  if (creds.connectedEmail.toLowerCase() !== expectedOwner) {
    throw new DriveReconnectRequiredError(
      'Akun Google Drive yang tersimpan tidak sesuai dengan email pemilik website. Silakan hubungkan ulang.'
    );
  }

  const now = Date.now();
  if (
    !forceRefresh &&
    creds.cachedAccessToken &&
    creds.cachedAccessTokenExpiresAt &&
    creds.cachedAccessTokenExpiresAt > now + 120_000
  ) {
    return { accessToken: creds.cachedAccessToken, credentials: creds };
  }

  const clientId = (process.env.GOOGLE_DRIVE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GOOGLE_DRIVE_CLIENT_SECRET || '').trim();

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: creds.refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || typeof data.access_token !== 'string') {
    const errorCode = typeof data.error === 'string' ? data.error : '';
    if (errorCode === 'invalid_grant' || errorCode === 'unauthorized_client') {
      throw new DriveReconnectRequiredError(
        'Akses Google Drive kedaluwarsa atau dicabut (invalid_grant). Silakan klik "Hubungkan Ulang Google Drive".'
      );
    }
    throw new Error(
      typeof data.error_description === 'string'
        ? data.error_description
        : 'Gagal memperbarui access token Google Drive.'
    );
  }

  const expiresInSec = Number(data.expires_in) || 3500;
  const updated: StoredDriveCredentials = {
    ...creds,
    cachedAccessToken: data.access_token,
    cachedAccessTokenExpiresAt: now + expiresInSec * 1000,
  };

  await saveEncryptedDriveCredentials(updated);
  return { accessToken: data.access_token, credentials: updated };
}

function escapeDriveQueryValue(val: string): string {
  return val.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function findOrCreateFolder(
  accessToken: string,
  name: string,
  parentId?: string
): Promise<string> {
  const safeName = escapeDriveQueryValue(name);
  const parentClause = parentId ? ` and '${escapeDriveQueryValue(parentId)}' in parents` : ` and 'root' in parents`;
  const q = `mimeType = 'application/vnd.google-apps.folder' and name = '${safeName}' and trashed = false${parentClause}`;

  const searchUrl = new URL('https://www.googleapis.com/drive/v3/files');
  searchUrl.searchParams.set('q', q);
  searchUrl.searchParams.set('fields', 'files(id,name)');
  searchUrl.searchParams.set('pageSize', '5');
  searchUrl.searchParams.set('spaces', 'drive');

  const searchRes = await fetch(searchUrl.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!searchRes.ok) {
    const errText = await searchRes.text().catch(() => '');
    throw new Error(`Gagal memeriksa folder "${name}" di Google Drive (${searchRes.status}): ${errText.slice(0, 160)}`);
  }

  const searchData = (await searchRes.json()) as { files?: Array<{ id: string; name: string }> };
  if (searchData.files && searchData.files.length > 0 && searchData.files[0].id) {
    return searchData.files[0].id;
  }

  const createBody: Record<string, unknown> = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    createBody.parents = [parentId];
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify(createBody),
  });

  if (!createRes.ok) {
    const errText = await createRes.text().catch(() => '');
    throw new Error(`Gagal membuat folder "${name}" di Google Drive (${createRes.status}): ${errText.slice(0, 160)}`);
  }

  const created = (await createRes.json()) as { id?: string };
  if (!created.id) {
    throw new Error(`Google Drive tidak mengembalikan ID folder untuk "${name}".`);
  }
  return created.id;
}

/**
 * Ensures the "Portfolio Website" root folder and all 7 required subfolders exist,
 * caching their folder IDs in Netlify Blobs so uploads do NOT repeatedly search/create folders.
 */
export async function ensureFolderHierarchy(
  accessToken: string,
  forceRebuild = false
): Promise<StoredFolderMap> {
  if (!forceRebuild) {
    const cached = await loadFolderMap();
    if (
      cached &&
      cached.rootFolderId &&
      DRIVE_SUBFOLDER_NAMES.every((name) => Boolean(cached.subfolders?.[name]))
    ) {
      return cached;
    }
  }

  const rootFolderId = await findOrCreateFolder(accessToken, DRIVE_ROOT_FOLDER_NAME);
  const subfolders: Record<string, string> = {};

  for (const folderName of DRIVE_SUBFOLDER_NAMES) {
    subfolders[folderName] = await findOrCreateFolder(accessToken, folderName, rootFolderId);
  }

  const map: StoredFolderMap = {
    rootFolderId,
    rootFolderName: DRIVE_ROOT_FOLDER_NAME,
    subfolders,
    updatedAt: new Date().toISOString(),
  };

  await saveFolderMap(map);
  return map;
}

export async function initiateDriveResumableSession(params: {
  accessToken: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  parentFolderId: string;
  browserOrigin?: string | null;
}): Promise<{ uploadUri: string }> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${params.accessToken}`,
    'Content-Type': 'application/json; charset=UTF-8',
    'X-Upload-Content-Type': params.mimeType,
    'X-Upload-Content-Length': String(params.sizeBytes),
  };

  // CRITICAL: Forwarding the browser's Origin header allows Google Drive to return
  // Access-Control-Allow-Origin for direct browser XHR PUT uploads to the resumable URI.
  if (params.browserOrigin) {
    headers.Origin = params.browserOrigin;
  }

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,mimeType,size,webViewLink,webContentLink,createdTime',
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: params.fileName,
        parents: [params.parentFolderId],
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    const err = new Error(
      `Gagal menginisiasi sesi unggahan resumable Google Drive (HTTP ${res.status}): ${errText.slice(0, 180)}`
    ) as Error & { httpStatus?: number };
    err.httpStatus = res.status;
    throw err;
  }

  const location = res.headers.get('location') || res.headers.get('Location');
  if (!location) {
    throw new Error('Google Drive tidak mengembalikan URI sesi unggahan (header Location kosong).');
  }

  validateGoogleDriveUploadUri(location);
  return { uploadUri: location };
}

export interface FinalizedDriveFile {
  fileId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  webViewLink: string;
  downloadUrl: string;
  createdTime: string;
  visibility: 'public' | 'private';
}

const VALID_FILE_ID_REGEX = /^[a-zA-Z0-9_-]{10,120}$/;

export async function finalizeDriveFile(params: {
  accessToken: string;
  fileId: string;
  visibility: 'public' | 'private';
}): Promise<FinalizedDriveFile> {
  const cleanId = params.fileId.trim();
  if (!VALID_FILE_ID_REGEX.test(cleanId)) {
    throw new Error('ID file Google Drive tidak valid.');
  }

  // 1. Verify the file genuinely exists in Google Drive before setting permissions or returning success
  const metaRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(cleanId)}?fields=id,name,mimeType,size,webViewLink,webContentLink,createdTime,trashed`,
    {
      headers: { Authorization: `Bearer ${params.accessToken}` },
    }
  );

  if (!metaRes.ok) {
    throw new Error(`File tidak ditemukan atau belum terkonfirmasi di Google Drive (HTTP ${metaRes.status}).`);
  }

  const meta = (await metaRes.json()) as {
    id?: string;
    name?: string;
    mimeType?: string;
    size?: string;
    webViewLink?: string;
    webContentLink?: string;
    createdTime?: string;
    trashed?: boolean;
  };

  if (!meta.id || meta.trashed) {
    throw new Error('Konfirmasi metadata file dari Google Drive tidak valid.');
  }

  // 2. Apply read-only public permission ONLY when visibility === 'public'.
  // Private files intentionally remain restricted to the Google Drive owner.
  if (params.visibility === 'public') {
    const permRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(cleanId)}/permissions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone',
        }),
      }
    );

    if (!permRes.ok) {
      const errText = await permRes.text().catch(() => '');
      throw new Error(
        `File berhasil diunggah, tetapi gagal mengatur izin baca publik di Google Drive (${permRes.status}): ${errText.slice(0, 140)}`
      );
    }
  }

  const webViewLink = meta.webViewLink || `https://drive.google.com/file/d/${encodeURIComponent(meta.id)}/view`;
  const downloadUrl =
    meta.webContentLink || `https://drive.google.com/uc?export=download&id=${encodeURIComponent(meta.id)}`;

  return {
    fileId: meta.id,
    fileName: meta.name || `file_${meta.id}`,
    mimeType: meta.mimeType || 'application/octet-stream',
    sizeBytes: Number(meta.size) || 0,
    webViewLink,
    downloadUrl,
    createdTime: meta.createdTime || new Date().toISOString(),
    visibility: params.visibility,
  };
}

export async function trashDriveFile(accessToken: string, fileId: string): Promise<void> {
  const cleanId = fileId.trim();
  if (!VALID_FILE_ID_REGEX.test(cleanId)) {
    throw new Error('ID file Google Drive tidak valid.');
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(cleanId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 404) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gagal menghapus file di Google Drive (${res.status}): ${errText.slice(0, 140)}`);
  }
}

export async function disconnectDriveAccount(): Promise<void> {
  const existing = await loadEncryptedDriveCredentials().catch(() => null);
  if (existing?.refreshToken) {
    await revokeGoogleToken(existing.refreshToken);
  }
  await deleteDriveCredentials();
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
