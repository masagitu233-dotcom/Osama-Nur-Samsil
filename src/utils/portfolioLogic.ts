import type {
  BaseContentMeta,
  CertificateItem,
  ExperienceCategory,
  ExperienceItem,
  ProjectCategory,
  ProjectItem,
} from '../types/portfolio';

export function filterPublicItems<T extends BaseContentMeta>(items: T[]): T[] {
  return [...items]
    .filter((item) => item.status === 'published' && item.isVisible === true)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

export function sortByDisplayOrder<T extends { displayOrder: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

export interface CertificateFilterParams {
  query: string;
  category: string;
  field: string;
  year: string;
}

export function filterCertificates(
  certificates: CertificateItem[],
  params: CertificateFilterParams
): CertificateItem[] {
  const q = params.query.trim().toLowerCase();
  return certificates.filter((cert) => {
    if (params.category && params.category !== 'all' && cert.category !== params.category) {
      return false;
    }
    if (params.field && params.field !== 'all' && cert.field !== params.field) {
      return false;
    }
    if (params.year && params.year !== 'all' && cert.year !== params.year) {
      return false;
    }
    if (q) {
      const haystack = `${cert.title} ${cert.issuer} ${cert.category} ${cert.field} ${cert.year} ${cert.description}`.toLowerCase();
      return haystack.includes(q);
    }
    return true;
  });
}

export function filterExperiences(
  experiences: ExperienceItem[],
  category: ExperienceCategory | 'all',
  query: string
): ExperienceItem[] {
  const q = query.trim().toLowerCase();
  return experiences.filter((exp) => {
    if (category !== 'all' && exp.category !== category) {
      return false;
    }
    if (q) {
      const haystack = `${exp.institution} ${exp.role} ${exp.period} ${exp.description} ${exp.responsibilities.join(' ')}`.toLowerCase();
      return haystack.includes(q);
    }
    return true;
  });
}

export function filterProjects(
  projects: ProjectItem[],
  category: ProjectCategory | 'all',
  query: string
): ProjectItem[] {
  const q = query.trim().toLowerCase();
  return projects.filter((proj) => {
    if (category !== 'all' && proj.category !== category) {
      return false;
    }
    if (q) {
      const haystack = `${proj.title} ${proj.description} ${proj.documentation} ${proj.period}`.toLowerCase();
      return haystack.includes(q);
    }
    return true;
  });
}

export interface ContactFormValues {
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
}

export interface ContactValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof ContactFormValues, string>>;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContactForm(values: ContactFormValues): ContactValidationResult {
  const errors: Partial<Record<keyof ContactFormValues, string>> = {};
  const name = values.senderName.trim();
  const email = values.senderEmail.trim();
  const subject = values.subject.trim();
  const message = values.message.trim();

  if (name.length < 2) {
    errors.senderName = 'Nama lengkap minimal 2 karakter.';
  } else if (name.length > 120) {
    errors.senderName = 'Nama maksimal 120 karakter.';
  }

  if (!EMAIL_REGEX.test(email) || email.length > 160) {
    errors.senderEmail = 'Masukkan alamat email yang valid.';
  }

  if (subject.length < 2) {
    errors.subject = 'Subjek pesan minimal 2 karakter.';
  } else if (subject.length > 200) {
    errors.subject = 'Subjek maksimal 200 karakter.';
  }

  if (message.length < 10) {
    errors.message = 'Isi pesan minimal 10 karakter agar konteksnya jelas.';
  } else if (message.length > 3000) {
    errors.message = 'Isi pesan maksimal 3000 karakter.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ALLOWED_DOC_MIMES = ['application/pdf'] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10MB

export interface FileValidationResult {
  valid: boolean;
  fileType?: 'image' | 'pdf';
  error?: string;
}

export function validateUploadFile(
  file: { name: string; type: string; size: number },
  allowedMode: 'image' | 'pdf' | 'both' = 'both'
): FileValidationResult {
  const isImage = (ALLOWED_IMAGE_MIMES as readonly string[]).includes(file.type);
  const isPdf = (ALLOWED_DOC_MIMES as readonly string[]).includes(file.type);

  if (allowedMode === 'image' && !isImage) {
    return { valid: false, error: 'Format gambar harus JPG, PNG, atau WebP.' };
  }
  if (allowedMode === 'pdf' && !isPdf) {
    return { valid: false, error: 'Dokumen harus berformat PDF.' };
  }
  if (allowedMode === 'both' && !isImage && !isPdf) {
    return { valid: false, error: 'Format file tidak didukung. Gunakan JPG, PNG, WebP, atau PDF.' };
  }

  if (file.size <= 0) {
    return { valid: false, error: 'File kosong tidak dapat diunggah.' };
  }

  if (isImage && file.size > MAX_IMAGE_BYTES) {
    return { valid: false, error: 'Ukuran gambar maksimal 5 MB.' };
  }

  if (isPdf && file.size > MAX_PDF_BYTES) {
    return { valid: false, error: 'Ukuran file PDF maksimal 10 MB.' };
  }

  return { valid: true, fileType: isPdf ? 'pdf' : 'image' };
}

export function clampString(value: string | undefined | null, maxLen: number): string {
  return (value ?? '').trim().slice(0, maxLen);
}

export function clampStringArray(values: string[] | undefined | null, maxItems: number, maxItemLen = 500): string[] {
  return (values ?? [])
    .map((v) => v.trim().slice(0, maxItemLen))
    .filter((v) => v.length > 0)
    .slice(0, maxItems);
}

export function generateSafeDocId(prefix: string): string {
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24) || 'item';
  const rand = Math.random().toString(36).slice(2, 10);
  return `${cleanPrefix}_${Date.now()}_${rand}`;
}

export function isValidSafeUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('/')) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function formatWhatsAppLink(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';
  const normalized = digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}`;
}
