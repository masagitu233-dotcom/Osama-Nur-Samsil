import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_EDUCATION_PHOTOS,
  addEducationAdditionalPhotos,
  classifyPhotoOrientation,
  normalizeEducationGallery,
  promoteAdditionalToPrimary,
  removeEducationAdditionalPhoto,
  removeEducationPrimaryPhoto,
  reorderEducationAdditionalPhoto,
  replaceEducationPrimaryPhoto,
  resolveEducationGallery,
  shouldTriggerGalleryHint,
} from './educationGallery';

describe('educationGallery utilities', () => {
  it('classifies landscape, portrait, square, and invalid image dimensions accurately', () => {
    assert.equal(classifyPhotoOrientation(1600, 900), 'landscape');
    assert.equal(classifyPhotoOrientation(1000, 1000), 'landscape');
    assert.equal(classifyPhotoOrientation(900, 1400), 'portrait');
    assert.equal(classifyPhotoOrientation(0, 0), 'landscape');
    assert.equal(classifyPhotoOrientation(-10, 500), 'landscape');
    assert.equal(classifyPhotoOrientation(Number.NaN, 800), 'landscape');
  });

  it('maintains 100% backward compatibility with legacy Firestore education records without primaryImageUrl', () => {
    const emptyLegacy = resolveEducationGallery(undefined, undefined);
    assert.deepEqual(emptyLegacy, {
      primaryPhoto: '',
      additionalPhotos: [],
      allPhotos: [],
    });

    const singleLegacy = resolveEducationGallery(['https://example.com/campus.jpg']);
    assert.deepEqual(singleLegacy, {
      primaryPhoto: 'https://example.com/campus.jpg',
      additionalPhotos: [],
      allPhotos: ['https://example.com/campus.jpg'],
    });

    const multiLegacy = resolveEducationGallery([
      'https://example.com/p1.jpg',
      'https://example.com/p2.jpg',
      'https://example.com/p3.jpg',
    ]);
    assert.equal(multiLegacy.primaryPhoto, 'https://example.com/p1.jpg');
    assert.deepEqual(multiLegacy.additionalPhotos, [
      'https://example.com/p2.jpg',
      'https://example.com/p3.jpg',
    ]);
    assert.deepEqual(multiLegacy.allPhotos, [
      'https://example.com/p1.jpg',
      'https://example.com/p2.jpg',
      'https://example.com/p3.jpg',
    ]);
  });

  it('aligns explicit primaryImageUrl to index 0 and deduplicates URLs', () => {
    const resolved = resolveEducationGallery(
      [
        'https://example.com/a.jpg',
        'https://example.com/b.jpg',
        'https://example.com/b.jpg',
        '  https://example.com/c.jpg  ',
      ],
      'https://example.com/b.jpg'
    );
    assert.equal(resolved.primaryPhoto, 'https://example.com/b.jpg');
    assert.deepEqual(resolved.additionalPhotos, [
      'https://example.com/a.jpg',
      'https://example.com/c.jpg',
    ]);
    assert.equal(resolved.allPhotos[0], resolved.primaryPhoto);
  });

  it('supports up to MAX_EDUCATION_PHOTOS (20) without overflow', () => {
    const urls = Array.from({ length: 25 }, (_, i) => `https://example.com/edu-${i + 1}.jpg`);
    const normalized = normalizeEducationGallery(urls);
    assert.equal(normalized.imageUrls.length, MAX_EDUCATION_PHOTOS);
    assert.equal(normalized.primaryImageUrl, 'https://example.com/edu-1.jpg');
  });

  it('replaces primary photo while preserving existing additional photos', () => {
    const next = replaceEducationPrimaryPhoto(
      ['https://example.com/old.jpg', 'https://example.com/add1.jpg', 'https://example.com/add2.jpg'],
      'https://example.com/old.jpg',
      'https://example.com/new-primary.jpg'
    );
    assert.equal(next.primaryImageUrl, 'https://example.com/new-primary.jpg');
    assert.deepEqual(next.imageUrls, [
      'https://example.com/new-primary.jpg',
      'https://example.com/add1.jpg',
      'https://example.com/add2.jpg',
    ]);
  });

  it('removes primary photo and cleanly promotes first additional photo if present', () => {
    const withAdditional = removeEducationPrimaryPhoto(
      ['https://example.com/main.jpg', 'https://example.com/add1.jpg', 'https://example.com/add2.jpg'],
      'https://example.com/main.jpg'
    );
    assert.equal(withAdditional.primaryImageUrl, 'https://example.com/add1.jpg');
    assert.deepEqual(withAdditional.imageUrls, [
      'https://example.com/add1.jpg',
      'https://example.com/add2.jpg',
    ]);

    const onlyPrimary = removeEducationPrimaryPhoto(['https://example.com/main.jpg'], 'https://example.com/main.jpg');
    assert.equal(onlyPrimary.primaryImageUrl, '');
    assert.deepEqual(onlyPrimary.imageUrls, []);
  });

  it('adds additional photos without overriding existing primary photo', () => {
    const next = addEducationAdditionalPhotos(
      ['https://example.com/main.jpg', 'https://example.com/add1.jpg'],
      'https://example.com/main.jpg',
      ['https://example.com/add2.jpg', 'https://example.com/add3.jpg']
    );
    assert.equal(next.primaryImageUrl, 'https://example.com/main.jpg');
    assert.deepEqual(next.imageUrls, [
      'https://example.com/main.jpg',
      'https://example.com/add1.jpg',
      'https://example.com/add2.jpg',
      'https://example.com/add3.jpg',
    ]);
  });

  it('deletes and reorders additional photos while keeping primary photo pinned', () => {
    const base = [
      'https://example.com/main.jpg',
      'https://example.com/add1.jpg',
      'https://example.com/add2.jpg',
      'https://example.com/add3.jpg',
    ];

    const reordered = reorderEducationAdditionalPhoto(base, 'https://example.com/main.jpg', 2, 0);
    assert.equal(reordered.primaryImageUrl, 'https://example.com/main.jpg');
    assert.deepEqual(reordered.imageUrls, [
      'https://example.com/main.jpg',
      'https://example.com/add3.jpg',
      'https://example.com/add1.jpg',
      'https://example.com/add2.jpg',
    ]);

    const removed = removeEducationAdditionalPhoto(reordered.imageUrls, reordered.primaryImageUrl, 1);
    assert.equal(removed.primaryImageUrl, 'https://example.com/main.jpg');
    assert.deepEqual(removed.imageUrls, [
      'https://example.com/main.jpg',
      'https://example.com/add3.jpg',
      'https://example.com/add2.jpg',
    ]);
  });

  it('promotes an additional photo to primary without losing the previous primary photo', () => {
    const next = promoteAdditionalToPrimary(
      ['https://example.com/main.jpg', 'https://example.com/add1.jpg', 'https://example.com/add2.jpg'],
      'https://example.com/main.jpg',
      1
    );
    assert.equal(next.primaryImageUrl, 'https://example.com/add2.jpg');
    assert.deepEqual(next.imageUrls, [
      'https://example.com/add2.jpg',
      'https://example.com/main.jpg',
      'https://example.com/add1.jpg',
    ]);
  });

  it('enforces scroll-hint guards for visibility, overflow, reduced motion, user interaction, and cooldowns', () => {
    const baseInput = {
      isInViewport: true,
      hasHorizontalOverflow: true,
      prefersReducedMotion: false,
      isUserInteracting: false,
      isAnimating: false,
      nowMs: 10000,
      lastHintAtMs: 0,
      lastInteractionAtMs: 0,
    };

    assert.equal(shouldTriggerGalleryHint(baseInput), true);
    assert.equal(shouldTriggerGalleryHint({ ...baseInput, isInViewport: false }), false);
    assert.equal(shouldTriggerGalleryHint({ ...baseInput, hasHorizontalOverflow: false }), false);
    assert.equal(shouldTriggerGalleryHint({ ...baseInput, prefersReducedMotion: true }), false);
    assert.equal(shouldTriggerGalleryHint({ ...baseInput, isUserInteracting: true }), false);
    assert.equal(shouldTriggerGalleryHint({ ...baseInput, isAnimating: true }), false);
    assert.equal(shouldTriggerGalleryHint({ ...baseInput, lastHintAtMs: 8500 }), false);
    assert.equal(shouldTriggerGalleryHint({ ...baseInput, lastInteractionAtMs: 8000 }), false);
    assert.equal(shouldTriggerGalleryHint({ ...baseInput, lastHintAtMs: 6000, lastInteractionAtMs: 5000 }), true);
  });
});
