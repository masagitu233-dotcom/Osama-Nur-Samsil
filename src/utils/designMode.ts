export type DesignMode = 'minimalis_elegan' | 'neo_brutalist';

export const DEFAULT_DESIGN_MODE: DesignMode = 'minimalis_elegan';
export const DESIGN_MODE_STORAGE_KEY = 'osama_portfolio_design_mode_v1';
export const HERO_CUTOUT_ASSET_URL = '/assets/hero-profile-cutout.png';
export const KNOWN_CUTOUT_SOURCE_FILE_ID = '1sI95x9PxvZR3g1sPUwfm7YK0kSB7yb-S';

export interface DesignModeDefinition {
  id: DesignMode;
  code: string;
  name: string;
  shortLabel: string;
  tagline: string;
  description: string;
  characteristics: string[];
}

export const DESIGN_MODE_DEFINITIONS: Record<DesignMode, DesignModeDefinition> = {
  minimalis_elegan: {
    id: 'minimalis_elegan',
    code: 'Mode A',
    name: 'Minimalis Elegan',
    shortLabel: 'Minimalis Elegan',
    tagline: 'Editorial Portfolio · Lapang, Modern & Berkelas',
    description:
      'Tampilan editorial modern yang bersih dan lapang dengan hierarki tipografi kuat, komposisi potret hero transparan berlatar geometris, kartu minimalis tanpa border tebal, serta transisi yang halus.',
    characteristics: [
      'Hero editorial dengan potret transparan keluar bingkai atas & gradasi halus di bagian bawah',
      'Kartu modern bersudut halus dengan garis tipis dan bayangan ambient lembut',
      'Tipografi editorial tegas dengan ruang bernapas yang lapang di seluruh halaman',
      'Tetap menjaga palet 6 warna resmi dan pemetaan warna per section',
    ],
  },
  neo_brutalist: {
    id: 'neo_brutalist',
    code: 'Mode B',
    name: 'Neo-Brutalist',
    shortLabel: 'Neo-Brutalist',
    tagline: 'Bold Geometric · Tegas, Struktural & Ikonik',
    description:
      'Tampilan Neo-Brutalist asli dengan garis tepi tegas, bayangan geometris keras, pola latar titik presisi, kartu berbingkai kontras tinggi, serta bingkai foto profil lingkaran khas.',
    characteristics: [
      'Identitas Neo-Brutalist penuh dengan border 2px tegas dan offset shadow presisi',
      'Hero klasik dengan foto profil berbingkai lingkaran dan latar titik geometris',
      'Kontras tinggi yang lugas pada kartu, tombol, dan penanda kategori',
      'Seluruh struktur asli halaman tetap utuh tanpa perubahan',
    ],
  },
};

export const DESIGN_MODE_LIST: DesignModeDefinition[] = [
  DESIGN_MODE_DEFINITIONS.minimalis_elegan,
  DESIGN_MODE_DEFINITIONS.neo_brutalist,
];

export function isDesignMode(value: unknown): value is DesignMode {
  return value === 'minimalis_elegan' || value === 'neo_brutalist';
}

export function normalizeDesignMode(value: unknown): DesignMode {
  if (isDesignMode(value)) {
    return value;
  }
  return DEFAULT_DESIGN_MODE;
}

/**
 * Public pages follow the global design mode chosen by the Admin.
 * The Admin Dashboard itself keeps a consistent structured workspace styling
 * so editors never lose contrast or control ergonomics while switching themes.
 */
export function resolveEffectiveRouteDesignMode(
  storedMode: DesignMode,
  isAdminRoute: boolean
): DesignMode {
  if (isAdminRoute) {
    return 'neo_brutalist';
  }
  return normalizeDesignMode(storedMode);
}

/**
 * Determines whether the pre-processed transparent PNG cutout matches the
 * currently configured owner profile photo. If the owner later uploads a
 * completely different profile photo URL, the Hero automatically falls back
 * to rendering that new photo with editorial framing instead of a stale face.
 */
export function shouldUsePreprocessedHeroCutout(profilePhotoUrl?: string | null): boolean {
  const trimmed = (profilePhotoUrl ?? '').trim();
  if (!trimmed) return true;
  if (trimmed.includes(KNOWN_CUTOUT_SOURCE_FILE_ID)) return true;
  if (trimmed.includes('hero_osama_portrait')) return true;
  if (trimmed.includes('hero-profile-cutout.png')) return true;
  return false;
}

export function readCachedDesignMode(): DesignMode {
  if (typeof window === 'undefined') return DEFAULT_DESIGN_MODE;
  try {
    const raw = window.localStorage.getItem(DESIGN_MODE_STORAGE_KEY);
    return normalizeDesignMode(raw);
  } catch {
    return DEFAULT_DESIGN_MODE;
  }
}

export function writeCachedDesignMode(mode: DesignMode): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DESIGN_MODE_STORAGE_KEY, normalizeDesignMode(mode));
  } catch {
    // Ignore storage quota / privacy mode restrictions
  }
}

export function applyDocumentDesignMode(mode: DesignMode): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.designMode = normalizeDesignMode(mode);
}
