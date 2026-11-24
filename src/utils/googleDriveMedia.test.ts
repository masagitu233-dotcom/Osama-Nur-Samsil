import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractGoogleDriveInfo,
  getGoogleDriveImageCandidates,
  getImageCandidateUrls,
  isGoogleDriveUrl,
  normalizeGoogleDriveImageUrl,
  normalizeGoogleDrivePdfEmbedUrl,
} from './googleDriveMedia';

const SAMPLE_ID = '1sI95x9PxvZR3g1sPUwfm7YK0kSB7yb-S';
const SAMPLE_SHARE_URL = `https://drive.google.com/file/d/${SAMPLE_ID}/view?usp=drive_link`;

test('extractGoogleDriveInfo extracts ID from standard /file/d/FILE_ID/view?usp=drive_link', () => {
  const info = extractGoogleDriveInfo(SAMPLE_SHARE_URL);
  assert.ok(info);
  assert.equal(info.fileId, SAMPLE_ID);
  assert.equal(info.resourceKey, undefined);
});

test('extractGoogleDriveInfo supports /open?id=, /uc?id=, /thumbnail?id=, /file/u/0/d/, usercontent, and lh3 formats', () => {
  const urls = [
    `https://drive.google.com/open?id=${SAMPLE_ID}`,
    `https://drive.google.com/uc?id=${SAMPLE_ID}`,
    `https://drive.google.com/uc?export=view&id=${SAMPLE_ID}`,
    `https://drive.google.com/uc?export=download&id=${SAMPLE_ID}`,
    `https://drive.google.com/thumbnail?id=${SAMPLE_ID}&sz=w800`,
    `https://drive.google.com/file/u/1/d/${SAMPLE_ID}/view?usp=sharing`,
    `https://drive.usercontent.google.com/download?id=${SAMPLE_ID}&export=view`,
    `https://lh3.googleusercontent.com/d/${SAMPLE_ID}=w1600`,
  ];

  for (const url of urls) {
    const info = extractGoogleDriveInfo(url);
    assert.ok(info, `Expected to parse: ${url}`);
    assert.equal(info.fileId, SAMPLE_ID, `Mismatch on: ${url}`);
  }
});

test('extractGoogleDriveInfo preserves resourcekey parameter across all candidate URLs', () => {
  const rk = '0-AbCdEfGh123456';
  const url = `https://drive.google.com/file/d/${SAMPLE_ID}/view?usp=sharing&resourcekey=${rk}`;
  const info = extractGoogleDriveInfo(url);
  assert.ok(info);
  assert.equal(info.fileId, SAMPLE_ID);
  assert.equal(info.resourceKey, rk);

  const candidates = getGoogleDriveImageCandidates(url);
  assert.equal(candidates.length, 5);
  assert.equal(
    candidates[0],
    `https://drive.google.com/thumbnail?id=${SAMPLE_ID}&sz=w1600&resourcekey=${rk}`
  );
  assert.equal(candidates[1], `https://lh3.googleusercontent.com/d/${SAMPLE_ID}=w1600`);
  assert.ok(candidates[3].includes(`/.netlify/functions/gdrive-image?id=${SAMPLE_ID}`));
  assert.ok(candidates[3].includes(`resourcekey=${rk}`));
  assert.ok(candidates[4].includes(`resourcekey=${rk}`));
});

test('getImageCandidateUrls prioritizes compatible thumbnail and lh3 endpoints before legacy uc?export=view', () => {
  const candidates = getImageCandidateUrls(SAMPLE_SHARE_URL);
  assert.equal(candidates[0], `https://drive.google.com/thumbnail?id=${SAMPLE_ID}&sz=w1600`);
  assert.equal(candidates[1], `https://lh3.googleusercontent.com/d/${SAMPLE_ID}=w1600`);
  assert.equal(candidates[2], `https://drive.google.com/thumbnail?id=${SAMPLE_ID}&sz=w1000`);
  assert.equal(candidates[3], `/.netlify/functions/gdrive-image?id=${SAMPLE_ID}&sz=w1600`);
  assert.equal(candidates[4], `https://drive.google.com/uc?export=view&id=${SAMPLE_ID}`);
  assert.equal(normalizeGoogleDriveImageUrl(SAMPLE_SHARE_URL), candidates[0]);
});

test('non-Google Drive URLs and lookalike/malicious URLs are NOT misclassified', () => {
  const firebaseUrl = 'https://firebasestorage.googleapis.com/v0/b/app.appspot.com/o/img.webp?alt=media';
  assert.equal(isGoogleDriveUrl(firebaseUrl), false);
  assert.deepEqual(getImageCandidateUrls(firebaseUrl), [firebaseUrl]);

  const localAsset = '/assets/hero-portrait.png';
  assert.equal(isGoogleDriveUrl(localAsset), false);
  assert.deepEqual(getImageCandidateUrls(localAsset), [localAsset]);

  assert.equal(isGoogleDriveUrl('https://drive.google.com.evil.com/file/d/1sI95x9PxvZR3g1sPUwfm7YK0kSB7yb-S/view'), false);
  assert.equal(isGoogleDriveUrl('javascript:alert(1)'), false);
  assert.equal(isGoogleDriveUrl('https://drive.google.com/file/d/short/view'), false);
});

test('normalizeGoogleDrivePdfEmbedUrl converts Drive /view link to iframe-safe /preview URL', () => {
  assert.equal(
    normalizeGoogleDrivePdfEmbedUrl(SAMPLE_SHARE_URL),
    `https://drive.google.com/file/d/${SAMPLE_ID}/preview`
  );
  assert.equal(
    normalizeGoogleDrivePdfEmbedUrl('https://example.com/doc.pdf'),
    'https://example.com/doc.pdf'
  );
});
