export const MAX_EXPERIENCE_PHOTOS = 20;

export interface ExperienceGalleryState {
  imageUrls: string[];
  primaryImageUrl: string;
}

/**
 * Clean and deduplicate photo URLs while preserving order and enforcing max count.
 */
export function normalizeExperiencePhotoList(
  imageUrls: unknown,
  maxItems: number = MAX_EXPERIENCE_PHOTOS
): string[] {
  if (!Array.isArray(imageUrls)) return [];
  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const entry of imageUrls) {
    if (typeof entry !== 'string') continue;
    const trimmed = entry.trim().slice(0, 2048);
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    cleaned.push(trimmed);
    if (cleaned.length >= maxItems) break;
  }

  return cleaned;
}

/**
 * Resolves the single primary photo URL for an Experience / Organization card.
 * Backward-compatible: if primaryImageUrl is empty or no longer present in imageUrls,
 * automatically treats the first photo (imageUrls[0]) as the primary photo.
 */
export function resolveExperiencePrimaryPhoto(
  imageUrls: readonly string[] | undefined | null,
  primaryImageUrl?: string | null
): string {
  const list = Array.isArray(imageUrls)
    ? imageUrls.map((u) => (typeof u === 'string' ? u.trim() : '')).filter(Boolean)
    : [];
  if (list.length === 0) return '';

  const candidate = (primaryImageUrl ?? '').trim();
  if (candidate && list.includes(candidate)) {
    return candidate;
  }
  return list[0];
}

/**
 * Normalizes both imageUrls and primaryImageUrl together so they always stay consistent.
 */
export function normalizeExperienceGallery(
  imageUrls: unknown,
  primaryImageUrl?: string | null,
  maxItems: number = MAX_EXPERIENCE_PHOTOS
): ExperienceGalleryState {
  const cleaned = normalizeExperiencePhotoList(imageUrls, maxItems);
  const resolvedPrimary = resolveExperiencePrimaryPhoto(cleaned, primaryImageUrl);
  return {
    imageUrls: cleaned,
    primaryImageUrl: resolvedPrimary,
  };
}

/**
 * Appends one or more newly uploaded/linked photo URLs without losing existing photos.
 * If no primary photo was chosen yet, automatically selects the first available photo.
 */
export function addExperiencePhotos(
  currentUrls: readonly string[],
  incomingUrls: readonly string[],
  currentPrimary?: string | null,
  maxItems: number = MAX_EXPERIENCE_PHOTOS
): ExperienceGalleryState {
  const merged = normalizeExperiencePhotoList([...currentUrls, ...incomingUrls], maxItems);
  const primaryImageUrl = resolveExperiencePrimaryPhoto(merged, currentPrimary);
  return {
    imageUrls: merged,
    primaryImageUrl,
  };
}

/**
 * Selects a specific existing photo URL as the primary card photo without re-uploading.
 */
export function selectPrimaryExperiencePhoto(
  currentUrls: readonly string[],
  selectedUrl: string
): ExperienceGalleryState {
  const cleaned = normalizeExperiencePhotoList([...currentUrls]);
  const target = selectedUrl.trim();
  const primaryImageUrl = cleaned.includes(target)
    ? target
    : resolveExperiencePrimaryPhoto(cleaned, '');
  return {
    imageUrls: cleaned,
    primaryImageUrl,
  };
}

/**
 * Removes a photo at a specific index. If the deleted photo was the primary photo,
 * smoothly falls back to the first remaining photo (or empty string if none left).
 */
export function removeExperiencePhotoAt(
  currentUrls: readonly string[],
  indexToRemove: number,
  currentPrimary?: string | null
): ExperienceGalleryState {
  const cleaned = normalizeExperiencePhotoList([...currentUrls]);
  if (indexToRemove < 0 || indexToRemove >= cleaned.length) {
    return {
      imageUrls: cleaned,
      primaryImageUrl: resolveExperiencePrimaryPhoto(cleaned, currentPrimary),
    };
  }
  const nextUrls = cleaned.filter((_, idx) => idx !== indexToRemove);
  const nextPrimary = resolveExperiencePrimaryPhoto(nextUrls, currentPrimary);
  return {
    imageUrls: nextUrls,
    primaryImageUrl: nextPrimary,
  };
}

/**
 * Reorders a photo from `fromIndex` to `toIndex` while keeping `primaryImageUrl`
 * bound to the exact photo URL selected by the admin.
 */
export function reorderExperiencePhoto(
  currentUrls: readonly string[],
  fromIndex: number,
  toIndex: number,
  currentPrimary?: string | null
): ExperienceGalleryState {
  const cleaned = normalizeExperiencePhotoList([...currentUrls]);
  if (
    fromIndex < 0 ||
    fromIndex >= cleaned.length ||
    toIndex < 0 ||
    toIndex >= cleaned.length ||
    fromIndex === toIndex
  ) {
    return {
      imageUrls: cleaned,
      primaryImageUrl: resolveExperiencePrimaryPhoto(cleaned, currentPrimary),
    };
  }

  const nextUrls = [...cleaned];
  const [moved] = nextUrls.splice(fromIndex, 1);
  nextUrls.splice(toIndex, 0, moved);

  return {
    imageUrls: nextUrls,
    primaryImageUrl: resolveExperiencePrimaryPhoto(nextUrls, currentPrimary),
  };
}

/**
 * Computes safe wrap-around navigation indices for the photo lightbox.
 */
export function getLightboxStep(total: number, currentIndex: number, delta: -1 | 1): number {
  if (total <= 1) return 0;
  return (currentIndex + delta + total) % total;
}
