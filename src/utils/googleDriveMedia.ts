export interface GoogleDriveFileInfo {
  fileId: string;
  resourceKey?: string;
  originalUrl: string;
}

const VALID_DRIVE_ID_REGEX = /^[a-zA-Z0-9_-]{10,120}$/;
const VALID_RESOURCE_KEY_REGEX = /^[a-zA-Z0-9_-]{4,120}$/;

const GOOGLE_DRIVE_HOSTS = new Set([
  'drive.google.com',
  'www.drive.google.com',
  'docs.google.com',
  'drive.usercontent.google.com',
  'lh3.googleusercontent.com',
  'lh4.googleusercontent.com',
  'lh5.googleusercontent.com',
  'lh6.googleusercontent.com',
]);

function sanitizeFileId(candidate: string | null | undefined): string | null {
  if (!candidate) return null;
  // Strip any lh3 size suffix like "=w1600" or "=s0"
  const clean = candidate.trim().split('=')[0].split('?')[0].split('#')[0];
  return VALID_DRIVE_ID_REGEX.test(clean) ? clean : null;
}

function extractResourceKey(url: URL): string | undefined {
  for (const [key, value] of url.searchParams.entries()) {
    if (key.toLowerCase() === 'resourcekey') {
      const trimmed = value.trim();
      if (VALID_RESOURCE_KEY_REGEX.test(trimmed)) {
        return trimmed;
      }
    }
  }
  return undefined;
}

/**
 * Recognizes Google Drive links across common sharing and direct formats:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=drive_link
 * - https://drive.google.com/file/u/0/d/FILE_ID/view?resourcekey=...
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID (& export=view / export=download)
 * - https://drive.google.com/thumbnail?id=FILE_ID&sz=w1600
 * - https://drive.usercontent.google.com/download?id=FILE_ID&export=view
 * - https://lh3.googleusercontent.com/d/FILE_ID=w1600
 */
export function extractGoogleDriveInfo(rawUrl: string | undefined | null): GoogleDriveFileInfo | null {
  const trimmed = (rawUrl ?? '').trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  if (!GOOGLE_DRIVE_HOSTS.has(host)) {
    return null;
  }

  const pathname = parsed.pathname;
  let fileId: string | null = null;

  // Pattern 1: /file/d/FILE_ID/... or /file/u/0/d/FILE_ID/... or /d/FILE_ID...
  const pathMatch = pathname.match(/\/(?:file\/(?:u\/\d+\/)?)?d\/([^/]+)/i);
  if (pathMatch?.[1]) {
    fileId = sanitizeFileId(pathMatch[1]);
  }

  // Pattern 2: /open?id=FILE_ID, /uc?id=FILE_ID, /thumbnail?id=FILE_ID, /download?id=FILE_ID
  if (!fileId) {
    const idParam = parsed.searchParams.get('id');
    fileId = sanitizeFileId(idParam);
  }

  if (!fileId) {
    return null;
  }

  const resourceKey = extractResourceKey(parsed);
  return {
    fileId,
    ...(resourceKey ? { resourceKey } : {}),
    originalUrl: trimmed,
  };
}

export function isGoogleDriveUrl(rawUrl: string | undefined | null): boolean {
  return extractGoogleDriveInfo(rawUrl) !== null;
}

/**
 * Generates an ordered, resilient fallback chain of image-compatible URLs for a Google Drive file.
 * Does NOT rely solely on uc?export=view (which sends Cross-Origin-Resource-Policy: same-site).
 *
 * Order:
 * 1. Google Drive Thumbnail endpoint (returns 302 -> lh3.googleusercontent.com image/*, supports resourcekey)
 * 2. Direct Google User Content CDN (lh3.googleusercontent.com/d/ID=w...)
 * 3. Alternate Drive Thumbnail width (w1000)
 * 4. Hardened Netlify Function proxy (/.netlify/functions/gdrive-image)
 * 5. Legacy uc?export=view fallback (last resort)
 */
export function getGoogleDriveImageCandidates(
  rawUrl: string,
  preferredWidth: 800 | 1000 | 1600 | 2000 = 1600
): string[] {
  const info = extractGoogleDriveInfo(rawUrl);
  if (!info) {
    const trimmed = rawUrl.trim();
    return trimmed ? [trimmed] : [];
  }

  const { fileId, resourceKey } = info;
  const rkQuery = resourceKey ? `&resourcekey=${encodeURIComponent(resourceKey)}` : '';

  const candidates = [
    `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w${preferredWidth}${rkQuery}`,
    `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}=w${preferredWidth}`,
    `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1000${rkQuery}`,
    `/.netlify/functions/gdrive-image?id=${encodeURIComponent(fileId)}&sz=w${preferredWidth}${rkQuery}`,
    `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}${rkQuery}`,
  ];

  // Deduplicate while preserving priority order
  return Array.from(new Set(candidates));
}

/**
 * Central resolver used by SafeImage and all image components across public & admin views.
 * Preserves non-Google Drive URLs (Firebase Storage, local assets, external HTTPS URLs) unchanged.
 */
export function getImageCandidateUrls(
  rawUrl: string | undefined | null,
  preferredWidth: 800 | 1000 | 1600 | 2000 = 1600
): string[] {
  const trimmed = (rawUrl ?? '').trim();
  if (!trimmed) return [];
  if (isGoogleDriveUrl(trimmed)) {
    return getGoogleDriveImageCandidates(trimmed, preferredWidth);
  }
  return [trimmed];
}

/**
 * Returns the primary display-ready image URL for a given raw URL.
 */
export function normalizeGoogleDriveImageUrl(
  rawUrl: string | undefined | null,
  preferredWidth: 800 | 1000 | 1600 | 2000 = 1600
): string {
  const candidates = getImageCandidateUrls(rawUrl, preferredWidth);
  return candidates[0] ?? '';
}

/**
 * Converts Google Drive file URLs into iframe-embeddable /preview URLs (for PDF documents).
 */
export function normalizeGoogleDrivePdfEmbedUrl(rawUrl: string | undefined | null): string {
  const trimmed = (rawUrl ?? '').trim();
  if (!trimmed) return '';
  const info = extractGoogleDriveInfo(trimmed);
  if (!info) return trimmed;
  const rk = info.resourceKey ? `?resourcekey=${encodeURIComponent(info.resourceKey)}` : '';
  return `https://drive.google.com/file/d/${encodeURIComponent(info.fileId)}/preview${rk}`;
}
