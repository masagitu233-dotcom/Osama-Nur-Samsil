import type { CertificateItem, TrainingItem, TrainingScope } from '../types/portfolio';

export const CANONICAL_DOMESTIC_CATEGORY = 'Dalam Negeri';
export const CANONICAL_INTERNATIONAL_CATEGORY = 'Internasional';

/**
 * Strictly maps stored training/certificate category strings into `'domestic'` or `'international'`
 * based ONLY on explicit saved category/scope values — NEVER guessing from issuer/organizer names.
 */
export function normalizeTrainingScope(rawValue?: string | null): TrainingScope | null {
  const normalized = (rawValue || '')
    .trim()
    .toLowerCase()
    .replace(/[_/,-]+/g, ' ')
    .replace(/\s+/g, ' ');

  if (!normalized) return null;

  // Check international / luar negeri markers first to handle hybrid labels like "Internasional / Luar Negeri"
  if (
    normalized === 'international' ||
    normalized === 'internasional' ||
    normalized === 'luar negeri' ||
    normalized === 'mancanegara' ||
    normalized === 'global' ||
    normalized.includes('internasional') ||
    normalized.includes('international') ||
    normalized.includes('luar negeri') ||
    normalized.includes('mancanegara')
  ) {
    return 'international';
  }

  if (
    normalized === 'domestic' ||
    normalized === 'dalam negeri' ||
    normalized === 'nasional' ||
    normalized === 'national' ||
    normalized === 'lokal' ||
    normalized === 'indonesia' ||
    normalized.includes('dalam negeri') ||
    normalized.includes('nasional') ||
    normalized.includes('domestic')
  ) {
    return 'domestic';
  }

  return null;
}

/**
 * Returns canonical category label (`Dalam Negeri` or `Internasional`) when the raw value
 * maps to a recognized training scope; otherwise returns the trimmed original string.
 */
export function normalizeCertificateCategoryLabel(rawCategory?: string | null): string {
  const scope = normalizeTrainingScope(rawCategory);
  if (scope === 'domestic') return CANONICAL_DOMESTIC_CATEGORY;
  if (scope === 'international') return CANONICAL_INTERNATIONAL_CATEGORY;
  return (rawCategory || '').trim();
}

/**
 * Strips leading decorative bullet characters (e.g. "• ") often pasted from document notes
 * without altering the underlying stored text in Firestore.
 */
export function cleanDisplayBulletPrefix(text?: string | null): string {
  return (text || '').replace(/^\s*[•·▪◦-]+\s*/, '').trim();
}

export interface GroupedTrainingCertificates {
  domestic: CertificateItem[];
  international: CertificateItem[];
  uncategorized: CertificateItem[];
}

export function groupCertificatesByTrainingScope(
  certificates: CertificateItem[]
): GroupedTrainingCertificates {
  const domestic: CertificateItem[] = [];
  const international: CertificateItem[] = [];
  const uncategorized: CertificateItem[] = [];

  for (const cert of certificates) {
    const scope = normalizeTrainingScope(cert.category);
    if (scope === 'domestic') {
      domestic.push(cert);
    } else if (scope === 'international') {
      international.push(cert);
    } else {
      uncategorized.push(cert);
    }
  }

  return { domestic, international, uncategorized };
}

export function groupTrainingsByScope(trainings: TrainingItem[]): {
  domestic: TrainingItem[];
  international: TrainingItem[];
} {
  const domestic: TrainingItem[] = [];
  const international: TrainingItem[] = [];

  for (const item of trainings) {
    const resolved =
      normalizeTrainingScope(item.scope) ?? normalizeTrainingScope(item.category);
    if (resolved === 'international') {
      international.push(item);
    } else if (resolved === 'domestic') {
      domestic.push(item);
    }
  }

  return { domestic, international };
}
