export const MAX_EDUCATION_PHOTOS = 20;
export const MAX_EDUCATION_URL_LENGTH = 2048;

export type PhotoOrientation = 'landscape' | 'portrait';

export interface EducationGalleryState {
  imageUrls: string[];
  primaryImageUrl: string;
}

export interface ResolvedEducationGallery {
  primaryPhoto: string;
  additionalPhotos: string[];
  allPhotos: string[];
}

export interface GalleryHintGuardInput {
  isInViewport: boolean;
  hasHorizontalOverflow: boolean;
  prefersReducedMotion: boolean;
  isUserInteracting: boolean;
  isAnimating: boolean;
  nowMs: number;
  lastHintAtMs: number;
  lastInteractionAtMs: number;
  hintCooldownMs?: number;
  interactionCooldownMs?: number;
}

function sanitizePhotoUrl(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().slice(0, MAX_EDUCATION_URL_LENGTH);
}

/**
 * Classifies an image's natural orientation from its loaded intrinsic dimensions.
 * - Portrait: height > width
 * - Landscape: width >= height (including square or unknown/invalid dimensions)
 */
export function classifyPhotoOrientation(
  naturalWidth: number,
  naturalHeight: number
): PhotoOrientation {
  if (
    !Number.isFinite(naturalWidth) ||
    !Number.isFinite(naturalHeight) ||
    naturalWidth <= 0 ||
    naturalHeight <= 0
  ) {
    return 'landscape';
  }
  return naturalHeight > naturalWidth ? 'portrait' : 'landscape';
}

/**
 * Normalizes and deduplicates an education entry's primary photo and gallery URLs.
 * Backward-compatible with legacy Firestore education records that only store `imageUrls`
 * without `primaryImageUrl` (automatically promotes `imageUrls[0]` as primary).
 * Always places the resolved primary photo at index 0 of `imageUrls` so public displays
 * and Lightbox indices remain strictly aligned.
 */
export function normalizeEducationGallery(
  imageUrls: unknown,
  primaryImageUrl?: unknown,
  maxPhotos = MAX_EDUCATION_PHOTOS
): EducationGalleryState {
  const limit = Math.max(1, maxPhotos);
  const rawList = Array.isArray(imageUrls) ? imageUrls : [];
  const cleanedPrimary = sanitizePhotoUrl(primaryImageUrl);

  const unique: string[] = [];
  const seen = new Set<string>();

  if (cleanedPrimary) {
    seen.add(cleanedPrimary);
    unique.push(cleanedPrimary);
  }

  for (const item of rawList) {
    const url = sanitizePhotoUrl(item);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    unique.push(url);
    if (unique.length >= limit) break;
  }

  if (unique.length === 0) {
    return { imageUrls: [], primaryImageUrl: '' };
  }

  return {
    imageUrls: unique.slice(0, limit),
    primaryImageUrl: unique[0],
  };
}

/**
 * Splits an education record's photos into primary photo, additional gallery thumbnails,
 * and unified Lightbox photo sequence (`allPhotos[0]` === `primaryPhoto`, `allPhotos[1..n]` === `additionalPhotos`).
 */
export function resolveEducationGallery(
  imageUrls: string[] | undefined,
  primaryImageUrl?: string
): ResolvedEducationGallery {
  const normalized = normalizeEducationGallery(imageUrls, primaryImageUrl);
  if (normalized.imageUrls.length === 0) {
    return {
      primaryPhoto: '',
      additionalPhotos: [],
      allPhotos: [],
    };
  }

  const [primaryPhoto, ...additionalPhotos] = normalized.imageUrls;
  return {
    primaryPhoto,
    additionalPhotos,
    allPhotos: normalized.imageUrls,
  };
}

/**
 * Replaces the primary photo with a newly uploaded/selected URL while preserving
 * all existing additional photos in their current order.
 */
export function replaceEducationPrimaryPhoto(
  imageUrls: string[],
  currentPrimary: string | undefined,
  newPrimaryUrl: string,
  maxPhotos = MAX_EDUCATION_PHOTOS
): EducationGalleryState {
  const cleanedNew = sanitizePhotoUrl(newPrimaryUrl);
  const current = resolveEducationGallery(imageUrls, currentPrimary);
  if (!cleanedNew) {
    return {
      imageUrls: current.allPhotos,
      primaryImageUrl: current.primaryPhoto,
    };
  }

  const remainingAdditional = current.additionalPhotos.filter((url) => url !== cleanedNew);
  return normalizeEducationGallery([cleanedNew, ...remainingAdditional], cleanedNew, maxPhotos);
}

/**
 * Removes the current primary photo. If additional photos exist, promotes the first
 * additional photo to primary so remaining documentation remains accessible.
 */
export function removeEducationPrimaryPhoto(
  imageUrls: string[],
  currentPrimary?: string
): EducationGalleryState {
  const current = resolveEducationGallery(imageUrls, currentPrimary);
  if (!current.primaryPhoto) {
    return { imageUrls: [], primaryImageUrl: '' };
  }
  return normalizeEducationGallery(current.additionalPhotos, current.additionalPhotos[0] || '');
}

/**
 * Appends one or more newly uploaded photos to the additional gallery while preserving
 * the existing primary photo. If no primary photo exists yet, the first added photo becomes primary.
 */
export function addEducationAdditionalPhotos(
  imageUrls: string[],
  currentPrimary: string | undefined,
  newUrls: string[],
  maxPhotos = MAX_EDUCATION_PHOTOS
): EducationGalleryState {
  const current = resolveEducationGallery(imageUrls, currentPrimary);
  const cleanedIncoming = newUrls.map(sanitizePhotoUrl).filter(Boolean);
  if (cleanedIncoming.length === 0) {
    return {
      imageUrls: current.allPhotos,
      primaryImageUrl: current.primaryPhoto,
    };
  }

  if (!current.primaryPhoto) {
    return normalizeEducationGallery(cleanedIncoming, cleanedIncoming[0], maxPhotos);
  }

  return normalizeEducationGallery(
    [current.primaryPhoto, ...current.additionalPhotos, ...cleanedIncoming],
    current.primaryPhoto,
    maxPhotos
  );
}

/**
 * Deletes a specific photo from the additional gallery by its index in `additionalPhotos`,
 * keeping the primary photo untouched.
 */
export function removeEducationAdditionalPhoto(
  imageUrls: string[],
  currentPrimary: string | undefined,
  additionalIndex: number
): EducationGalleryState {
  const current = resolveEducationGallery(imageUrls, currentPrimary);
  if (additionalIndex < 0 || additionalIndex >= current.additionalPhotos.length) {
    return {
      imageUrls: current.allPhotos,
      primaryImageUrl: current.primaryPhoto,
    };
  }

  const nextAdditional = current.additionalPhotos.filter((_, idx) => idx !== additionalIndex);
  return normalizeEducationGallery(
    current.primaryPhoto ? [current.primaryPhoto, ...nextAdditional] : nextAdditional,
    current.primaryPhoto
  );
}

/**
 * Reorders photos strictly within the additional gallery, keeping the primary photo pinned.
 */
export function reorderEducationAdditionalPhoto(
  imageUrls: string[],
  currentPrimary: string | undefined,
  fromAdditionalIndex: number,
  toAdditionalIndex: number
): EducationGalleryState {
  const current = resolveEducationGallery(imageUrls, currentPrimary);
  const len = current.additionalPhotos.length;
  if (
    fromAdditionalIndex < 0 ||
    toAdditionalIndex < 0 ||
    fromAdditionalIndex >= len ||
    toAdditionalIndex >= len ||
    fromAdditionalIndex === toAdditionalIndex
  ) {
    return {
      imageUrls: current.allPhotos,
      primaryImageUrl: current.primaryPhoto,
    };
  }

  const reordered = [...current.additionalPhotos];
  const [moved] = reordered.splice(fromAdditionalIndex, 1);
  reordered.splice(toAdditionalIndex, 0, moved);

  return normalizeEducationGallery(
    current.primaryPhoto ? [current.primaryPhoto, ...reordered] : reordered,
    current.primaryPhoto
  );
}

/**
 * Promotes an additional photo to become the primary photo and shifts the previous
 * primary photo to the front of `additionalPhotos` so no photo is lost.
 */
export function promoteAdditionalToPrimary(
  imageUrls: string[],
  currentPrimary: string | undefined,
  additionalIndex: number
): EducationGalleryState {
  const current = resolveEducationGallery(imageUrls, currentPrimary);
  if (additionalIndex < 0 || additionalIndex >= current.additionalPhotos.length) {
    return {
      imageUrls: current.allPhotos,
      primaryImageUrl: current.primaryPhoto,
    };
  }

  const promoted = current.additionalPhotos[additionalIndex];
  const restAdditional = current.additionalPhotos.filter((_, idx) => idx !== additionalIndex);
  const nextAdditional = current.primaryPhoto
    ? [current.primaryPhoto, ...restAdditional]
    : restAdditional;

  return normalizeEducationGallery([promoted, ...nextAdditional], promoted);
}

/**
 * Pure guard deciding whether the subtle scroll-triggered horizontal nudge hint
 * should play for an education card's additional photo gallery.
 */
export function shouldTriggerGalleryHint(input: GalleryHintGuardInput): boolean {
  const {
    isInViewport,
    hasHorizontalOverflow,
    prefersReducedMotion,
    isUserInteracting,
    isAnimating,
    nowMs,
    lastHintAtMs,
    lastInteractionAtMs,
    hintCooldownMs = 3200,
    interactionCooldownMs = 4000,
  } = input;

  if (!isInViewport || !hasHorizontalOverflow || prefersReducedMotion) {
    return false;
  }
  if (isUserInteracting || isAnimating) {
    return false;
  }
  if (lastHintAtMs > 0 && nowMs - lastHintAtMs < hintCooldownMs) {
    return false;
  }
  if (lastInteractionAtMs > 0 && nowMs - lastInteractionAtMs < interactionCooldownMs) {
    return false;
  }
  return true;
}
