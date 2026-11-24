import crypto from 'node:crypto';

export interface EncryptedBlob {
  v: 1;
  alg: 'aes-256-gcm';
  iv: string; // base64 (12 bytes)
  tag: string; // base64 (16 bytes)
  ciphertext: string; // base64
}

/**
 * Parses a 32-byte (256-bit) encryption key from either:
 * - 64-character hex string (e.g., `openssl rand -hex 32`), or
 * - standard/URL-safe base64 string decoding to 32 bytes (e.g., `openssl rand -base64 32`).
 */
export function parseEncryptionKey(rawKey: string | undefined): Buffer {
  const trimmed = (rawKey ?? '').trim();
  if (!trimmed) {
    throw new Error('GDRIVE_TOKEN_ENCRYPTION_KEY is not configured.');
  }

  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, 'hex');
  }

  const normalizedB64 = trimmed.replace(/-/g, '+').replace(/_/g, '/');
  const buf = Buffer.from(normalizedB64, 'base64');
  if (buf.length === 32) {
    return buf;
  }

  throw new Error(
    'GDRIVE_TOKEN_ENCRYPTION_KEY must be a 32-byte key encoded as 64 hex characters or 44-character base64.'
  );
}

export function encryptJsonPayload<T>(payload: T, key: Buffer): EncryptedBlob {
  if (key.length !== 32) {
    throw new Error('AES-256-GCM requires a 32-byte key.');
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    v: 1,
    alg: 'aes-256-gcm',
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: encrypted.toString('base64'),
  };
}

export function decryptJsonPayload<T>(blob: EncryptedBlob, key: Buffer): T {
  if (key.length !== 32) {
    throw new Error('AES-256-GCM requires a 32-byte key.');
  }
  if (!blob || blob.v !== 1 || blob.alg !== 'aes-256-gcm') {
    throw new Error('Unsupported encrypted vault format.');
  }

  const iv = Buffer.from(blob.iv, 'base64');
  const tag = Buffer.from(blob.tag, 'base64');
  const ciphertext = Buffer.from(blob.ciphertext, 'base64');

  if (iv.length !== 12 || tag.length !== 16) {
    throw new Error('Invalid AES-256-GCM parameters.');
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8')) as T;
}

export interface OAuthStatePayload {
  nonce: string;
  uid: string;
  email: string;
  returnOrigin: string;
  exp: number; // Unix timestamp in milliseconds
}

export function signOAuthState(payload: OAuthStatePayload, key: Buffer): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', key).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifyOAuthState(token: string, key: Buffer, nowMs = Date.now()): OAuthStatePayload {
  const parts = token.split('.');
  if (parts.length !== 2) {
    throw new Error('Format OAuth state tidak valid.');
  }

  const [encoded, providedSig] = parts;
  const expectedSig = crypto.createHmac('sha256', key).update(encoded).digest('base64url');

  const a = Buffer.from(providedSig, 'utf8');
  const b = Buffer.from(expectedSig, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error('Tanda tangan OAuth state tidak valid.');
  }

  const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as OAuthStatePayload;
  if (!parsed || typeof parsed.nonce !== 'string' || typeof parsed.exp !== 'number') {
    throw new Error('Isi OAuth state rusak.');
  }
  if (parsed.exp < nowMs) {
    throw new Error('Sesi otorisasi OAuth telah kedaluwarsa. Silakan ulangi proses menghubungkan Google Drive.');
  }

  return parsed;
}

export function generateRandomNonce(bytes = 24): string {
  return crypto.randomBytes(bytes).toString('base64url');
}
