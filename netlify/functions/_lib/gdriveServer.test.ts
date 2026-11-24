import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  decryptJsonPayload,
  encryptJsonPayload,
  generateRandomNonce,
  parseEncryptionKey,
  signOAuthState,
  verifyOAuthState,
} from './cryptoVault.mts';
import {
  __setVaultStoreForTests,
  consumeOAuthStateNonce,
  loadEncryptedDriveCredentials,
  saveEncryptedDriveCredentials,
  saveOAuthStateNonce,
} from './blobStore.mts';
import {
  DRIVE_SUBFOLDER_NAMES,
  resolveDriveSubfolderName,
  validateGoogleDriveUploadUri,
  validateUploadMetadata,
} from './gdriveApi.mts';
import gdriveStatusHandler from '../gdrive-status.mts';
import gdriveUploadInitHandler from '../gdrive-upload-init.mts';
import gdriveUploadChunkHandler from '../gdrive-upload-chunk.mts';
import gdriveUploadFinalizeHandler from '../gdrive-upload-finalize.mts';
import gdriveOAuthCallbackHandler from '../gdrive-oauth-callback.mts';

function createMemoryVault() {
  const map = new Map<string, unknown>();
  return {
    async getJson<T>(key: string): Promise<T | null> {
      return (map.get(key) as T | undefined) ?? null;
    },
    async setJson(key: string, value: unknown): Promise<void> {
      map.set(key, JSON.parse(JSON.stringify(value)));
    },
    async deleteKey(key: string): Promise<void> {
      map.delete(key);
    },
  };
}

test('AES-256-GCM encryption round-trips refresh tokens and rejects tampering', () => {
  const hexKey = crypto.randomBytes(32).toString('hex');
  const key = parseEncryptionKey(hexKey);
  assert.equal(key.length, 32);

  // Also accepts 32-byte base64 key
  const b64Key = parseEncryptionKey(crypto.randomBytes(32).toString('base64'));
  assert.equal(b64Key.length, 32);

  const secret = { refreshToken: '1//0g_test_refresh_token', connectedEmail: 'osamanursamsil@gmail.com' };
  const encrypted = encryptJsonPayload(secret, key);

  assert.notEqual(encrypted.ciphertext, secret.refreshToken);
  assert.equal(encrypted.alg, 'aes-256-gcm');

  const decrypted = decryptJsonPayload<typeof secret>(encrypted, key);
  assert.deepEqual(decrypted, secret);

  // Tampered auth tag must throw
  const tamperedTag = {
    ...encrypted,
    tag: crypto.randomBytes(16).toString('base64'),
  };
  assert.throws(() => decryptJsonPayload(tamperedTag, key));
});

test('HMAC-SHA256 OAuth state signing validates authentic state and rejects expiry/tampering', () => {
  const key = crypto.randomBytes(32);
  const nonce = generateRandomNonce();
  const payload = {
    nonce,
    uid: 'admin-uid-123',
    email: 'osamanursamsil@gmail.com',
    returnOrigin: 'https://osamanursamsil.netlify.app',
    exp: Date.now() + 60_000,
  };

  const token = signOAuthState(payload, key);
  const verified = verifyOAuthState(token, key);
  assert.deepEqual(verified, payload);

  // Expired state rejected
  assert.throws(() => verifyOAuthState(token, key, payload.exp + 1000));

  // Tampered signature rejected
  assert.throws(() => verifyOAuthState(`${token}x`, key));
});

test('Encrypted blob vault stores/loads credentials and consumes OAuth CSRF nonce single-use', async () => {
  const prevKey = process.env.GDRIVE_TOKEN_ENCRYPTION_KEY;
  process.env.GDRIVE_TOKEN_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
  __setVaultStoreForTests(createMemoryVault());

  try {
    await saveEncryptedDriveCredentials({
      refreshToken: '1//0g_secret_refresh',
      connectedEmail: 'osamanursamsil@gmail.com',
      connectedAt: '2026-11-24T00:00:00.000Z',
      scope: 'https://www.googleapis.com/auth/drive.file openid email',
    });

    const loaded = await loadEncryptedDriveCredentials();
    assert.equal(loaded?.refreshToken, '1//0g_secret_refresh');
    assert.equal(loaded?.connectedEmail, 'osamanursamsil@gmail.com');

    const nonce = generateRandomNonce();
    await saveOAuthStateNonce(nonce, {
      uid: 'uid-1',
      email: 'osamanursamsil@gmail.com',
      exp: Date.now() + 60_000,
    });
    const firstConsume = await consumeOAuthStateNonce(nonce);
    assert.equal(firstConsume?.uid, 'uid-1');
    const secondConsume = await consumeOAuthStateNonce(nonce);
    assert.equal(secondConsume, null);
  } finally {
    __setVaultStoreForTests(null);
    if (prevKey === undefined) delete process.env.GDRIVE_TOKEN_ENCRYPTION_KEY;
    else process.env.GDRIVE_TOKEN_ENCRYPTION_KEY = prevKey;
  }
});

test('Folder mapping covers all 7 required Portfolio Website subfolders', () => {
  assert.deepEqual([...DRIVE_SUBFOLDER_NAMES], [
    'Foto Profil',
    'Pengalaman',
    'Pendidikan',
    'Sertifikat',
    'Dokumen',
    'Proyek dan Karya',
    'File Lainnya',
  ]);
  assert.equal(resolveDriveSubfolderName('profile'), 'Foto Profil');
  assert.equal(resolveDriveSubfolderName('experiences'), 'Pengalaman');
  assert.equal(resolveDriveSubfolderName('organizations'), 'Pengalaman');
  assert.equal(resolveDriveSubfolderName('education'), 'Pendidikan');
  assert.equal(resolveDriveSubfolderName('certificates'), 'Sertifikat');
  assert.equal(resolveDriveSubfolderName('cv'), 'Dokumen');
  assert.equal(resolveDriveSubfolderName('documents'), 'Dokumen');
  assert.equal(resolveDriveSubfolderName('projects'), 'Proyek dan Karya');
  assert.equal(resolveDriveSubfolderName('skills'), 'File Lainnya');
  assert.equal(resolveDriveSubfolderName('interests'), 'File Lainnya');
  assert.equal(resolveDriveSubfolderName('media'), 'File Lainnya');
});

test('validateGoogleDriveUploadUri blocks SSRF targets and accepts valid Google Drive resumable URIs', () => {
  const valid = validateGoogleDriveUploadUri(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=ADPycd_test_session_123'
  );
  assert.equal(valid.hostname, 'www.googleapis.com');

  assert.throws(() => validateGoogleDriveUploadUri('http://www.googleapis.com/upload/drive/v3/files?upload_id=123'));
  assert.throws(() => validateGoogleDriveUploadUri('https://169.254.169.254/latest/meta-data/?upload_id=123'));
  assert.throws(() => validateGoogleDriveUploadUri('https://evil.example.com/upload/drive/v3/files?upload_id=123'));
  assert.throws(() => validateGoogleDriveUploadUri('https://www.googleapis.com/drive/v3/files?upload_id=123'));
  assert.throws(() => validateGoogleDriveUploadUri('https://www.googleapis.com/upload/drive/v3/files'));
});

test('validateUploadMetadata enforces MIME allowlist and size caps (5 MB images, 10 MB PDFs)', () => {
  const okImg = validateUploadMetadata({
    fileName: 'foto-profil.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 2 * 1024 * 1024,
  });
  assert.equal(okImg.valid, true);

  const bigImg = validateUploadMetadata({
    fileName: 'huge.png',
    mimeType: 'image/png',
    sizeBytes: 6 * 1024 * 1024,
  });
  assert.equal(bigImg.valid, false);

  const okPdf = validateUploadMetadata({
    fileName: 'CV-Osama.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 8 * 1024 * 1024,
  });
  assert.equal(okPdf.valid, true);

  const badMime = validateUploadMetadata({
    fileName: 'script.svg',
    mimeType: 'image/svg+xml',
    sizeBytes: 1024,
  });
  assert.equal(badMime.valid, false);
});

test('Authenticated Netlify Functions reject unauthenticated requests with 401 and callback rejects invalid state with 400', async () => {
  const statusRes = await gdriveStatusHandler(new Request('https://site.netlify.app/.netlify/functions/gdrive-status'));
  assert.equal(statusRes.status, 401);

  const initRes = await gdriveUploadInitHandler(
    new Request('https://site.netlify.app/.netlify/functions/gdrive-upload-init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: 'a.jpg', mimeType: 'image/jpeg', sizeBytes: 1024 }),
    })
  );
  assert.equal(initRes.status, 401);

  const chunkRes = await gdriveUploadChunkHandler(
    new Request('https://site.netlify.app/.netlify/functions/gdrive-upload-chunk', {
      method: 'PUT',
      body: new Uint8Array([1, 2, 3]),
    })
  );
  assert.equal(chunkRes.status, 401);

  const finRes = await gdriveUploadFinalizeHandler(
    new Request('https://site.netlify.app/.netlify/functions/gdrive-upload-finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId: '1sI95x9PxvZR3g1sPUwfm7YK0kSB7yb-S', visibility: 'public' }),
    })
  );
  assert.equal(finRes.status, 401);

  const cbRes = await gdriveOAuthCallbackHandler(
    new Request('https://site.netlify.app/.netlify/functions/gdrive-oauth-callback?code=abc&state=tampered.state')
  );
  assert.equal(cbRes.status, 400);
});
