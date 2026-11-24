import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTransferPercent,
  computeResumableChunks,
  createUploadProgressSnapshot,
  FALLBACK_CHUNK_SIZE_BYTES,
  parseDriveCommittedBytes,
} from './uploadStateMachine';
import {
  buildCanonicalGoogleDriveViewUrl,
  getGoogleDriveDownloadUrl,
} from './googleDriveMedia';

test('calculateTransferPercent caps transfer at 99% and reaches 100% ONLY on confirmed success', () => {
  assert.equal(calculateTransferPercent(0, 1000, 'idle'), 0);
  assert.equal(calculateTransferPercent(500, 1000, 'initiating'), 0);
  assert.equal(calculateTransferPercent(0, 1000, 'uploading'), 0);
  assert.equal(calculateTransferPercent(500, 1000, 'uploading'), 50);
  assert.equal(calculateTransferPercent(1000, 1000, 'uploading'), 99);
  assert.equal(calculateTransferPercent(1000, 1000, 'finalizing'), 99);
  assert.equal(calculateTransferPercent(1000, 1000, 'success'), 100);
  assert.equal(calculateTransferPercent(400, 1000, 'cancelled'), 0);
});

test('createUploadProgressSnapshot produces accurate stage labels and byte counts', () => {
  const uploading = createUploadProgressSnapshot('uploading', 1_500_000, 3_000_000, {
    transportMode: 'direct',
  });
  assert.equal(uploading.percent, 50);
  assert.equal(uploading.loadedBytes, 1_500_000);
  assert.equal(uploading.totalBytes, 3_000_000);
  assert.equal(uploading.message, 'Mengunggah file');

  const done = createUploadProgressSnapshot('success', 0, 3_000_000);
  assert.equal(done.percent, 100);
  assert.equal(done.loadedBytes, 3_000_000);
  assert.equal(done.message, 'Berhasil');
});

test('computeResumableChunks slices files into exact 2 MiB multiples of 256 KiB', () => {
  assert.equal(FALLBACK_CHUNK_SIZE_BYTES % (256 * 1024), 0);
  assert.equal(FALLBACK_CHUNK_SIZE_BYTES, 2 * 1024 * 1024);

  const total = 5 * 1024 * 1024; // 5 MiB
  const chunks = computeResumableChunks(total);
  assert.equal(chunks.length, 3);
  assert.equal(chunks[0].contentRange, `bytes 0-${2 * 1024 * 1024 - 1}/${total}`);
  assert.equal(chunks[1].contentRange, `bytes ${2 * 1024 * 1024}-${4 * 1024 * 1024 - 1}/${total}`);
  assert.equal(chunks[2].contentRange, `bytes ${4 * 1024 * 1024}-${total - 1}/${total}`);
  assert.equal(chunks.reduce((acc, c) => acc + c.size, 0), total);
});

test('parseDriveCommittedBytes parses Google Drive HTTP 308 Range headers', () => {
  assert.equal(parseDriveCommittedBytes('bytes=0-2097151'), 2097152);
  assert.equal(parseDriveCommittedBytes('bytes=0-0'), 1);
  assert.equal(parseDriveCommittedBytes(null), 0);
  assert.equal(parseDriveCommittedBytes('invalid'), 0);
});

test('Google Drive download and canonical view URL helpers preserve resourcekey and ignore non-Drive URLs', () => {
  const sample = 'https://drive.google.com/file/d/1sI95x9PxvZR3g1sPUwfm7YK0kSB7yb-S/view?usp=drive_link&resourcekey=0-AbCdEf123';
  assert.equal(
    getGoogleDriveDownloadUrl(sample),
    'https://drive.google.com/uc?export=download&id=1sI95x9PxvZR3g1sPUwfm7YK0kSB7yb-S&resourcekey=0-AbCdEf123'
  );
  assert.equal(
    buildCanonicalGoogleDriveViewUrl('1sI95x9PxvZR3g1sPUwfm7YK0kSB7yb-S', '0-AbCdEf123'),
    'https://drive.google.com/file/d/1sI95x9PxvZR3g1sPUwfm7YK0kSB7yb-S/view?resourcekey=0-AbCdEf123'
  );
  assert.equal(
    getGoogleDriveDownloadUrl('https://example.com/cv.pdf'),
    'https://example.com/cv.pdf'
  );
});
