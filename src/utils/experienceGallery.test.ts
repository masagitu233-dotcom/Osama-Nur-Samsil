import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addExperiencePhotos,
  getLightboxStep,
  MAX_EXPERIENCE_PHOTOS,
  normalizeExperienceGallery,
  removeExperiencePhotoAt,
  reorderExperiencePhoto,
  resolveExperiencePrimaryPhoto,
  selectPrimaryExperiencePhoto,
} from './experienceGallery';

test('backward compatibility: legacy experience with 1 photo and no primaryImageUrl uses imageUrls[0] as primary', () => {
  const legacyUrls = ['https://drive.google.com/file/d/LEGACY_PHOTO_1/view'];
  assert.equal(resolveExperiencePrimaryPhoto(legacyUrls, undefined), legacyUrls[0]);
  assert.equal(resolveExperiencePrimaryPhoto(legacyUrls, ''), legacyUrls[0]);
  assert.equal(resolveExperiencePrimaryPhoto([], undefined), '');
});

test('multi-photo batch and incremental uploads preserve all photos up to 20 without overwriting', () => {
  const batch1 = [
    'https://example.com/photo-portrait.jpg',
    'https://example.com/photo-landscape.jpg',
    'https://example.com/photo-square.jpg',
    'https://example.com/photo-wide.jpg',
    'https://example.com/photo-tall.jpg',
  ];
  const step1 = addExperiencePhotos([], batch1, '');
  assert.equal(step1.imageUrls.length, 5);
  assert.equal(step1.primaryImageUrl, batch1[0]);

  // Add 3 more incrementally + 1 duplicate (should deduplicate cleanly)
  const step2 = addExperiencePhotos(
    step1.imageUrls,
    [
      'https://example.com/photo-6.jpg',
      'https://example.com/photo-7.jpg',
      'https://example.com/photo-8.jpg',
      'https://example.com/photo-portrait.jpg',
    ],
    step1.primaryImageUrl
  );
  assert.equal(step2.imageUrls.length, 8);
  assert.equal(step2.primaryImageUrl, batch1[0]);

  // Respects MAX_EXPERIENCE_PHOTOS cap
  const many = Array.from({ length: 25 }, (_, i) => `https://example.com/p-${i}.jpg`);
  const capped = normalizeExperienceGallery(many);
  assert.equal(capped.imageUrls.length, MAX_EXPERIENCE_PHOTOS);
});

test('admin can switch primary photo without re-uploading and reordering preserves chosen primary photo', () => {
  const urls = [
    'https://example.com/1-portrait.jpg',
    'https://example.com/2-landscape.jpg',
    'https://example.com/3-square.jpg',
    'https://example.com/4-panorama.jpg',
  ];

  // Choose photo #3 as primary
  const selected = selectPrimaryExperiencePhoto(urls, urls[2]);
  assert.equal(selected.primaryImageUrl, urls[2]);
  assert.deepEqual(selected.imageUrls, urls);

  // Move photo #3 (index 2) to index 0 -> primaryImageUrl stays bound to photo #3
  const reordered = reorderExperiencePhoto(selected.imageUrls, 2, 0, selected.primaryImageUrl);
  assert.equal(reordered.imageUrls[0], urls[2]);
  assert.equal(reordered.imageUrls[1], urls[0]);
  assert.equal(reordered.primaryImageUrl, urls[2]);

  // Move photo #1 (now at index 1) to index 3 -> primaryImageUrl STILL stays photo #3
  const reordered2 = reorderExperiencePhoto(reordered.imageUrls, 1, 3, reordered.primaryImageUrl);
  assert.equal(reordered2.primaryImageUrl, urls[2]);
  assert.equal(reordered2.imageUrls[3], urls[0]);
});

test('removing photos falls back cleanly when primary is deleted and does not mutate other experience arrays', () => {
  const expAPhotos = [
    'https://example.com/expA-1.jpg',
    'https://example.com/expA-2.jpg',
    'https://example.com/expA-3.jpg',
  ];
  const expBPhotos = ['https://example.com/expB-1.jpg'];

  // Delete primary photo (index 1) from Experience A
  const afterDeletePrimary = removeExperiencePhotoAt(expAPhotos, 1, expAPhotos[1]);
  assert.deepEqual(afterDeletePrimary.imageUrls, [expAPhotos[0], expAPhotos[2]]);
  assert.equal(afterDeletePrimary.primaryImageUrl, expAPhotos[0]);

  // Delete non-primary photo (index 1 -> expA-3) -> primary stays expA-1
  const afterDeleteNonPrimary = removeExperiencePhotoAt(
    afterDeletePrimary.imageUrls,
    1,
    afterDeletePrimary.primaryImageUrl
  );
  assert.deepEqual(afterDeleteNonPrimary.imageUrls, [expAPhotos[0]]);
  assert.equal(afterDeleteNonPrimary.primaryImageUrl, expAPhotos[0]);

  // Original arrays and Experience B remain completely untouched
  assert.equal(expAPhotos.length, 3);
  assert.deepEqual(expBPhotos, ['https://example.com/expB-1.jpg']);
});

test('getLightboxStep wraps cleanly across multi-photo galleries', () => {
  assert.equal(getLightboxStep(5, 0, -1), 4);
  assert.equal(getLightboxStep(5, 4, 1), 0);
  assert.equal(getLightboxStep(5, 2, 1), 3);
  assert.equal(getLightboxStep(1, 0, 1), 0);
});
