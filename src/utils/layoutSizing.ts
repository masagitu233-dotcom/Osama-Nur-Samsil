import type { DesignMode } from './designMode';

export type ScalePresetId = 'compact' | 'normal' | 'spacious';
export type DeviceBreakpoint = 'desktop' | 'tablet' | 'mobile';
export type ImageAspectRatioOption = 'auto' | '16/9' | '4/3' | '3/2' | '1/1' | '4/5';
export type ImageFitPositionOption = 'center' | 'top' | 'upper';

export interface LayoutFrameSizing {
  contentMaxWidth: number; // px (920 - 1280)
  heroMaxWidth: number; // px (880 - 1240)
  paddingX: number; // px (12 - 44)
  paddingY: number; // px (16 - 56)
  sectionGap: number; // px (24 - 72)
  sectionMinHeight: number; // px (0 - 320)
  frameRadius: number; // px (0 - 28)
}

export interface CardItemSizing {
  cardMinWidth: number; // px (220 - 400)
  cardMinHeight: number; // px (0 - 300)
  cardPadding: number; // px (12 - 32)
  cardGap: number; // px (10 - 32)
  cardRadius: number; // px (0 - 24)
  borderWidth: number; // px (0 - 4)
}

export interface ImageSizing {
  imageWidthPct: number; // % (60 - 100)
  imageMaxHeight: number; // px (130 - 380)
  imageRatio: ImageAspectRatioOption;
  thumbnailSize: number; // px (56 - 160)
  imageRadius: number; // px (0 - 24)
  imagePosition: ImageFitPositionOption;
}

export interface TypographySizing {
  heroTitleSize: number; // px (24 - 52)
  sectionTitleSize: number; // px (18 - 32)
  cardTitleSize: number; // px (14 - 22)
  bodyTextSize: number; // px (13 - 18)
  metaTextSize: number; // px (10 - 14)
  lineHeight: number; // ratio (1.3 - 1.9)
  headingGap: number; // px (4 - 18)
}

export interface ButtonIconSizing {
  buttonHeight: number; // px (30 - 48)
  buttonPaddingX: number; // px (10 - 26)
  buttonTextSize: number; // px (11 - 16)
  iconSize: number; // px (12 - 22)
  iconGap: number; // px (4 - 12)
  buttonRadius: number; // px (0 - 20)
}

export interface SpacingSizing {
  titleDescGap: number; // px (4 - 18)
  componentGap: number; // px (8 - 28)
  mediaTextGap: number; // px (8 - 26)
  cardSectionGap: number; // px (12 - 32)
}

export interface ComponentSizingOverrides {
  hero: {
    paddingY: number; // px (16 - 48)
    portraitHeight: number; // px (220 - 440)
    circleSize: number; // px (160 - 300)
    titleSize: number; // px (24 - 52)
  };
  education: {
    cardPadding: number; // px (12 - 32)
    photoMaxHeight: number; // px (150 - 360)
    thumbnailSize: number; // px (56 - 130)
    titleSize: number; // px (15 - 24)
  };
  projects: {
    cardPadding: number; // px (12 - 28)
    imageRatio: ImageAspectRatioOption;
    imageMaxHeight: number; // px (140 - 320)
    titleSize: number; // px (14 - 24)
  };
  certificates: {
    cardPadding: number; // px (10 - 28)
    thumbnailHeight: number; // px (120 - 280)
    titleSize: number; // px (13 - 20)
  };
  experience: {
    cardPadding: number; // px (12 - 28)
    imageMaxHeight: number; // px (140 - 300)
    titleSize: number; // px (14 - 22)
  };
  about: {
    cardPadding: number; // px (14 - 32)
    portraitMaxHeight: number; // px (200 - 400)
    bodyTextSize: number; // px (13 - 18)
  };
}

export interface ResponsiveBreakpointTuning {
  scaleFactor: number; // 0.78 - 1.15
  paddingX: number; // px (10 - 44)
  cardGap: number; // px (8 - 32)
}

export interface ResponsiveSizingConfig {
  desktop: ResponsiveBreakpointTuning;
  tablet: ResponsiveBreakpointTuning;
  mobile: ResponsiveBreakpointTuning;
}

export interface ModeSizingConfig {
  preset: ScalePresetId;
  layout: LayoutFrameSizing;
  cards: CardItemSizing;
  images: ImageSizing;
  typography: TypographySizing;
  buttons: ButtonIconSizing;
  spacing: SpacingSizing;
  components: ComponentSizingOverrides;
  responsive: ResponsiveSizingConfig;
}

export interface LayoutSizingSettings {
  minimalis_elegan: ModeSizingConfig;
  neo_brutalist: ModeSizingConfig;
}

export type SizingGroupKey =
  | 'layout'
  | 'cards'
  | 'images'
  | 'typography'
  | 'buttons'
  | 'spacing'
  | 'components'
  | 'responsive';

export interface ScalePresetDefinition {
  id: ScalePresetId;
  name: string;
  badge: string;
  description: string;
  highlights: string[];
}

export const LAYOUT_SIZING_STORAGE_KEY = 'osama_portfolio_layout_sizing_v1';
export const DEFAULT_SCALE_PRESET: ScalePresetId = 'normal';

export const SCALE_PRESET_DEFINITIONS: Record<ScalePresetId, ScalePresetDefinition> = {
  compact: {
    id: 'compact',
    name: 'Compact',
    badge: 'Efisien & Ringkas',
    description:
      'Proporsi lebih rapat dan hemat ruang layar agar lebih banyak informasi serta kartu tampil utuh dalam satu layar desktop tanpa kehilangan keterbacaan.',
    highlights: [
      'Padding frame & kartu lebih ringkas',
      'Jarak antarsection dan ukuran media lebih ramping',
      'Ideal untuk penelusuran cepat oleh rekruter & reviewer',
    ],
  },
  normal: {
    id: 'normal',
    name: 'Normal',
    badge: 'Standar Seimbang',
    description:
      'Proporsi standar yang seimbang antara efisiensi ruang, kenyamanan membaca, dan estetika editorial modern pada layar desktop, tablet, maupun mobile.',
    highlights: [
      'Hero & kartu ringkasan tampil utuh pada satu layar desktop',
      'Tipografi dan jarak antarbagian terasa proporsional',
      'Keseimbangan optimal antara ruang napas & kepadatan info',
    ],
  },
  spacious: {
    id: 'spacious',
    name: 'Spacious',
    badge: 'Lapang & Editorial',
    description:
      'Tampilan lebih lega dengan ruang putih ekstra, kartu lebih besar, serta fokus visual yang lebih dominan seperti majalah editorial portofolio.',
    highlights: [
      'Whitespace antarsection dan dalam kartu lebih lega',
      'Judul utama serta potret Hero tampil lebih dominan',
      'Cocok untuk presentasi visual berlayar lebar',
    ],
  },
};

export const SCALE_PRESET_LIST: ScalePresetDefinition[] = [
  SCALE_PRESET_DEFINITIONS.compact,
  SCALE_PRESET_DEFINITIONS.normal,
  SCALE_PRESET_DEFINITIONS.spacious,
];

export const IMAGE_RATIO_OPTIONS: Array<{ value: ImageAspectRatioOption; label: string }> = [
  { value: 'auto', label: 'Otomatis (Asli)' },
  { value: '16/9', label: '16 : 9 (Widescreen)' },
  { value: '3/2', label: '3 : 2 (Editorial)' },
  { value: '4/3', label: '4 : 3 (Klasik)' },
  { value: '1/1', label: '1 : 1 (Persegi)' },
  { value: '4/5', label: '4 : 5 (Potret)' },
];

export const IMAGE_POSITION_OPTIONS: Array<{ value: ImageFitPositionOption; label: string; cssValue: string }> = [
  { value: 'upper', label: 'Fokus Atas-Tengah (Wajah/Objek)', cssValue: '50% 20%' },
  { value: 'top', label: 'Rata Atas', cssValue: '50% 0%' },
  { value: 'center', label: 'Tengah Penuh', cssValue: '50% 50%' },
];

export const SIZING_RANGES = {
  layout: {
    contentMaxWidth: { min: 920, max: 1280, step: 10 },
    heroMaxWidth: { min: 880, max: 1240, step: 10 },
    paddingX: { min: 12, max: 44, step: 2 },
    paddingY: { min: 16, max: 56, step: 2 },
    sectionGap: { min: 20, max: 72, step: 2 },
    sectionMinHeight: { min: 0, max: 320, step: 10 },
    frameRadius: { min: 0, max: 28, step: 2 },
  },
  cards: {
    cardMinWidth: { min: 220, max: 400, step: 10 },
    cardMinHeight: { min: 0, max: 300, step: 10 },
    cardPadding: { min: 12, max: 32, step: 1 },
    cardGap: { min: 10, max: 32, step: 2 },
    cardRadius: { min: 0, max: 24, step: 1 },
    borderWidth: { min: 0, max: 4, step: 0.5 },
  },
  images: {
    imageWidthPct: { min: 60, max: 100, step: 2 },
    imageMaxHeight: { min: 130, max: 380, step: 5 },
    thumbnailSize: { min: 56, max: 160, step: 4 },
    imageRadius: { min: 0, max: 24, step: 1 },
  },
  typography: {
    heroTitleSize: { min: 24, max: 52, step: 1 },
    sectionTitleSize: { min: 18, max: 32, step: 1 },
    cardTitleSize: { min: 14, max: 22, step: 0.5 },
    bodyTextSize: { min: 13, max: 18, step: 0.5 },
    metaTextSize: { min: 10, max: 14, step: 0.5 },
    lineHeight: { min: 1.3, max: 1.9, step: 0.05 },
    headingGap: { min: 4, max: 18, step: 1 },
  },
  buttons: {
    buttonHeight: { min: 30, max: 48, step: 1 },
    buttonPaddingX: { min: 10, max: 26, step: 1 },
    buttonTextSize: { min: 11, max: 16, step: 0.5 },
    iconSize: { min: 12, max: 22, step: 1 },
    iconGap: { min: 4, max: 12, step: 1 },
    buttonRadius: { min: 0, max: 20, step: 1 },
  },
  spacing: {
    titleDescGap: { min: 4, max: 18, step: 1 },
    componentGap: { min: 8, max: 28, step: 1 },
    mediaTextGap: { min: 8, max: 26, step: 1 },
    cardSectionGap: { min: 12, max: 32, step: 2 },
  },
  components: {
    hero: {
      paddingY: { min: 16, max: 48, step: 2 },
      portraitHeight: { min: 220, max: 440, step: 8 },
      circleSize: { min: 160, max: 300, step: 6 },
      titleSize: { min: 24, max: 52, step: 1 },
    },
    education: {
      cardPadding: { min: 12, max: 32, step: 1 },
      photoMaxHeight: { min: 150, max: 360, step: 10 },
      thumbnailSize: { min: 56, max: 130, step: 4 },
      titleSize: { min: 15, max: 24, step: 1 },
    },
    projects: {
      cardPadding: { min: 12, max: 28, step: 1 },
      imageMaxHeight: { min: 140, max: 320, step: 10 },
      titleSize: { min: 14, max: 24, step: 1 },
    },
    certificates: {
      cardPadding: { min: 10, max: 28, step: 1 },
      thumbnailHeight: { min: 120, max: 280, step: 10 },
      titleSize: { min: 13, max: 20, step: 1 },
    },
    experience: {
      cardPadding: { min: 12, max: 28, step: 1 },
      imageMaxHeight: { min: 140, max: 300, step: 10 },
      titleSize: { min: 14, max: 22, step: 1 },
    },
    about: {
      cardPadding: { min: 14, max: 32, step: 1 },
      portraitMaxHeight: { min: 200, max: 400, step: 10 },
      bodyTextSize: { min: 13, max: 18, step: 0.5 },
    },
  },
  responsive: {
    scaleFactor: { min: 0.78, max: 1.15, step: 0.02 },
    paddingX: { min: 10, max: 44, step: 2 },
    cardGap: { min: 8, max: 32, step: 2 },
  },
} as const;

export function buildPresetModeConfig(mode: DesignMode, preset: ScalePresetId): ModeSizingConfig {
  const isMinimal = mode === 'minimalis_elegan';

  if (preset === 'compact') {
    return {
      preset: 'compact',
      layout: {
        contentMaxWidth: 1020,
        heroMaxWidth: 1020,
        paddingX: 20,
        paddingY: 22,
        sectionGap: 30,
        sectionMinHeight: 0,
        frameRadius: isMinimal ? 14 : 0,
      },
      cards: {
        cardMinWidth: 250,
        cardMinHeight: 0,
        cardPadding: 14,
        cardGap: 14,
        cardRadius: isMinimal ? 12 : 0,
        borderWidth: isMinimal ? 1 : 2,
      },
      images: {
        imageWidthPct: 100,
        imageMaxHeight: 175,
        imageRatio: '16/9',
        thumbnailSize: 74,
        imageRadius: isMinimal ? 8 : 0,
        imagePosition: 'upper',
      },
      typography: {
        heroTitleSize: isMinimal ? 32 : 29,
        sectionTitleSize: 20,
        cardTitleSize: 15,
        bodyTextSize: 13.5,
        metaTextSize: 11,
        lineHeight: 1.5,
        headingGap: 6,
      },
      buttons: {
        buttonHeight: 34,
        buttonPaddingX: 13,
        buttonTextSize: 12,
        iconSize: 14,
        iconGap: 6,
        buttonRadius: isMinimal ? 8 : 0,
      },
      spacing: {
        titleDescGap: 6,
        componentGap: 10,
        mediaTextGap: 12,
        cardSectionGap: 14,
      },
      components: {
        hero: {
          paddingY: 22,
          portraitHeight: 288,
          circleSize: 196,
          titleSize: isMinimal ? 32 : 29,
        },
        education: {
          cardPadding: 16,
          photoMaxHeight: 200,
          thumbnailSize: 72,
          titleSize: 17,
        },
        projects: {
          cardPadding: 14,
          imageRatio: '16/9',
          imageMaxHeight: 170,
          titleSize: 15,
        },
        certificates: {
          cardPadding: 13,
          thumbnailHeight: 150,
          titleSize: 14,
        },
        experience: {
          cardPadding: 14,
          imageMaxHeight: 170,
          titleSize: 15,
        },
        about: {
          cardPadding: 16,
          portraitMaxHeight: 225,
          bodyTextSize: 14,
        },
      },
      responsive: {
        desktop: { scaleFactor: 1.0, paddingX: 20, cardGap: 14 },
        tablet: { scaleFactor: 0.94, paddingX: 18, cardGap: 12 },
        mobile: { scaleFactor: 0.88, paddingX: 14, cardGap: 10 },
      },
    };
  }

  if (preset === 'spacious') {
    return {
      preset: 'spacious',
      layout: {
        contentMaxWidth: 1160,
        heroMaxWidth: 1160,
        paddingX: 32,
        paddingY: 40,
        sectionGap: 56,
        sectionMinHeight: 0,
        frameRadius: isMinimal ? 22 : 0,
      },
      cards: {
        cardMinWidth: 300,
        cardMinHeight: 0,
        cardPadding: 24,
        cardGap: 24,
        cardRadius: isMinimal ? 18 : 0,
        borderWidth: isMinimal ? 1 : 2,
      },
      images: {
        imageWidthPct: 100,
        imageMaxHeight: 250,
        imageRatio: '16/9',
        thumbnailSize: 102,
        imageRadius: isMinimal ? 12 : 0,
        imagePosition: 'upper',
      },
      typography: {
        heroTitleSize: isMinimal ? 44 : 38,
        sectionTitleSize: 25,
        cardTitleSize: 17.5,
        bodyTextSize: 15,
        metaTextSize: 12.5,
        lineHeight: 1.65,
        headingGap: 11,
      },
      buttons: {
        buttonHeight: 42,
        buttonPaddingX: 20,
        buttonTextSize: 13.5,
        iconSize: 16,
        iconGap: 8,
        buttonRadius: isMinimal ? 12 : 0,
      },
      spacing: {
        titleDescGap: 11,
        componentGap: 18,
        mediaTextGap: 18,
        cardSectionGap: 24,
      },
      components: {
        hero: {
          paddingY: 38,
          portraitHeight: 388,
          circleSize: 262,
          titleSize: isMinimal ? 44 : 38,
        },
        education: {
          cardPadding: 24,
          photoMaxHeight: 290,
          thumbnailSize: 96,
          titleSize: 21,
        },
        projects: {
          cardPadding: 22,
          imageRatio: '16/9',
          imageMaxHeight: 240,
          titleSize: 18,
        },
        certificates: {
          cardPadding: 20,
          thumbnailHeight: 210,
          titleSize: 16,
        },
        experience: {
          cardPadding: 22,
          imageMaxHeight: 230,
          titleSize: 17.5,
        },
        about: {
          cardPadding: 26,
          portraitMaxHeight: 300,
          bodyTextSize: 16,
        },
      },
      responsive: {
        desktop: { scaleFactor: 1.0, paddingX: 32, cardGap: 24 },
        tablet: { scaleFactor: 0.94, paddingX: 24, cardGap: 20 },
        mobile: { scaleFactor: 0.88, paddingX: 16, cardGap: 14 },
      },
    };
  }

  // NORMAL (Refined, balanced default — fits Hero + Stats comfortably in 1 desktop screen)
  return {
    preset: 'normal',
    layout: {
      contentMaxWidth: 1080,
      heroMaxWidth: 1080,
      paddingX: 24,
      paddingY: 28,
      sectionGap: 40,
      sectionMinHeight: 0,
      frameRadius: isMinimal ? 18 : 0,
    },
    cards: {
      cardMinWidth: 270,
      cardMinHeight: 0,
      cardPadding: 18,
      cardGap: 18,
      cardRadius: isMinimal ? 14 : 0,
      borderWidth: isMinimal ? 1 : 2,
    },
    images: {
      imageWidthPct: 100,
      imageMaxHeight: 205,
      imageRatio: '16/9',
      thumbnailSize: 84,
      imageRadius: isMinimal ? 10 : 0,
      imagePosition: 'upper',
    },
    typography: {
      heroTitleSize: isMinimal ? 36 : 33,
      sectionTitleSize: 22,
      cardTitleSize: 16,
      bodyTextSize: 14,
      metaTextSize: 11.5,
      lineHeight: 1.55,
      headingGap: 8,
    },
    buttons: {
      buttonHeight: 38,
      buttonPaddingX: 16,
      buttonTextSize: 13,
      iconSize: 15,
      iconGap: 7,
      buttonRadius: isMinimal ? 10 : 0,
    },
    spacing: {
      titleDescGap: 8,
      componentGap: 14,
      mediaTextGap: 14,
      cardSectionGap: 18,
    },
    components: {
      hero: {
        paddingY: 28,
        portraitHeight: 336,
        circleSize: 226,
        titleSize: isMinimal ? 36 : 33,
      },
      education: {
        cardPadding: 20,
        photoMaxHeight: 240,
        thumbnailSize: 82,
        titleSize: 19,
      },
      projects: {
        cardPadding: 18,
        imageRatio: '16/9',
        imageMaxHeight: 200,
        titleSize: 16,
      },
      certificates: {
        cardPadding: 16,
        thumbnailHeight: 175,
        titleSize: 15,
      },
      experience: {
        cardPadding: 18,
        imageMaxHeight: 195,
        titleSize: 16,
      },
      about: {
        cardPadding: 22,
        portraitMaxHeight: 260,
        bodyTextSize: 15,
      },
    },
    responsive: {
      desktop: { scaleFactor: 1.0, paddingX: 24, cardGap: 18 },
      tablet: { scaleFactor: 0.94, paddingX: 20, cardGap: 16 },
      mobile: { scaleFactor: 0.88, paddingX: 14, cardGap: 12 },
    },
  };
}

export function createDefaultLayoutSizingSettings(): LayoutSizingSettings {
  return {
    minimalis_elegan: buildPresetModeConfig('minimalis_elegan', DEFAULT_SCALE_PRESET),
    neo_brutalist: buildPresetModeConfig('neo_brutalist', DEFAULT_SCALE_PRESET),
  };
}

function clampNum(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  const clamped = Math.min(max, Math.max(min, n));
  return Math.round(clamped * 100) / 100;
}

function normalizePreset(value: unknown): ScalePresetId {
  if (value === 'compact' || value === 'normal' || value === 'spacious') return value;
  return DEFAULT_SCALE_PRESET;
}

function normalizeRatio(value: unknown, fallback: ImageAspectRatioOption): ImageAspectRatioOption {
  if (
    value === 'auto' ||
    value === '16/9' ||
    value === '4/3' ||
    value === '3/2' ||
    value === '1/1' ||
    value === '4/5'
  ) {
    return value;
  }
  return fallback;
}

function normalizePosition(value: unknown, fallback: ImageFitPositionOption): ImageFitPositionOption {
  if (value === 'center' || value === 'top' || value === 'upper') return value;
  return fallback;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function normalizeModeSizingConfig(mode: DesignMode, raw: unknown): ModeSizingConfig {
  const obj = isPlainObject(raw) ? raw : {};
  const preset = normalizePreset(obj.preset);
  const base = buildPresetModeConfig(mode, preset);

  const l = isPlainObject(obj.layout) ? obj.layout : {};
  const c = isPlainObject(obj.cards) ? obj.cards : {};
  const img = isPlainObject(obj.images) ? obj.images : {};
  const t = isPlainObject(obj.typography) ? obj.typography : {};
  const b = isPlainObject(obj.buttons) ? obj.buttons : {};
  const s = isPlainObject(obj.spacing) ? obj.spacing : {};
  const comp = isPlainObject(obj.components) ? obj.components : {};
  const resp = isPlainObject(obj.responsive) ? obj.responsive : {};

  const compHero = isPlainObject(comp.hero) ? comp.hero : {};
  const compEdu = isPlainObject(comp.education) ? comp.education : {};
  const compProj = isPlainObject(comp.projects) ? comp.projects : {};
  const compCert = isPlainObject(comp.certificates) ? comp.certificates : {};
  const compExp = isPlainObject(comp.experience) ? comp.experience : {};
  const compAbout = isPlainObject(comp.about) ? comp.about : {};

  const rDesk = isPlainObject(resp.desktop) ? resp.desktop : {};
  const rTab = isPlainObject(resp.tablet) ? resp.tablet : {};
  const rMob = isPlainObject(resp.mobile) ? resp.mobile : {};

  return {
    preset,
    layout: {
      contentMaxWidth: clampNum(l.contentMaxWidth, base.layout.contentMaxWidth, SIZING_RANGES.layout.contentMaxWidth.min, SIZING_RANGES.layout.contentMaxWidth.max),
      heroMaxWidth: clampNum(l.heroMaxWidth, base.layout.heroMaxWidth, SIZING_RANGES.layout.heroMaxWidth.min, SIZING_RANGES.layout.heroMaxWidth.max),
      paddingX: clampNum(l.paddingX, base.layout.paddingX, SIZING_RANGES.layout.paddingX.min, SIZING_RANGES.layout.paddingX.max),
      paddingY: clampNum(l.paddingY, base.layout.paddingY, SIZING_RANGES.layout.paddingY.min, SIZING_RANGES.layout.paddingY.max),
      sectionGap: clampNum(l.sectionGap, base.layout.sectionGap, SIZING_RANGES.layout.sectionGap.min, SIZING_RANGES.layout.sectionGap.max),
      sectionMinHeight: clampNum(l.sectionMinHeight, base.layout.sectionMinHeight, SIZING_RANGES.layout.sectionMinHeight.min, SIZING_RANGES.layout.sectionMinHeight.max),
      frameRadius: clampNum(l.frameRadius, base.layout.frameRadius, SIZING_RANGES.layout.frameRadius.min, SIZING_RANGES.layout.frameRadius.max),
    },
    cards: {
      cardMinWidth: clampNum(c.cardMinWidth, base.cards.cardMinWidth, SIZING_RANGES.cards.cardMinWidth.min, SIZING_RANGES.cards.cardMinWidth.max),
      cardMinHeight: clampNum(c.cardMinHeight, base.cards.cardMinHeight, SIZING_RANGES.cards.cardMinHeight.min, SIZING_RANGES.cards.cardMinHeight.max),
      cardPadding: clampNum(c.cardPadding, base.cards.cardPadding, SIZING_RANGES.cards.cardPadding.min, SIZING_RANGES.cards.cardPadding.max),
      cardGap: clampNum(c.cardGap, base.cards.cardGap, SIZING_RANGES.cards.cardGap.min, SIZING_RANGES.cards.cardGap.max),
      cardRadius: clampNum(c.cardRadius, base.cards.cardRadius, SIZING_RANGES.cards.cardRadius.min, SIZING_RANGES.cards.cardRadius.max),
      borderWidth: clampNum(c.borderWidth, base.cards.borderWidth, SIZING_RANGES.cards.borderWidth.min, SIZING_RANGES.cards.borderWidth.max),
    },
    images: {
      imageWidthPct: clampNum(img.imageWidthPct, base.images.imageWidthPct, SIZING_RANGES.images.imageWidthPct.min, SIZING_RANGES.images.imageWidthPct.max),
      imageMaxHeight: clampNum(img.imageMaxHeight, base.images.imageMaxHeight, SIZING_RANGES.images.imageMaxHeight.min, SIZING_RANGES.images.imageMaxHeight.max),
      imageRatio: normalizeRatio(img.imageRatio, base.images.imageRatio),
      thumbnailSize: clampNum(img.thumbnailSize, base.images.thumbnailSize, SIZING_RANGES.images.thumbnailSize.min, SIZING_RANGES.images.thumbnailSize.max),
      imageRadius: clampNum(img.imageRadius, base.images.imageRadius, SIZING_RANGES.images.imageRadius.min, SIZING_RANGES.images.imageRadius.max),
      imagePosition: normalizePosition(img.imagePosition, base.images.imagePosition),
    },
    typography: {
      heroTitleSize: clampNum(t.heroTitleSize, base.typography.heroTitleSize, SIZING_RANGES.typography.heroTitleSize.min, SIZING_RANGES.typography.heroTitleSize.max),
      sectionTitleSize: clampNum(t.sectionTitleSize, base.typography.sectionTitleSize, SIZING_RANGES.typography.sectionTitleSize.min, SIZING_RANGES.typography.sectionTitleSize.max),
      cardTitleSize: clampNum(t.cardTitleSize, base.typography.cardTitleSize, SIZING_RANGES.typography.cardTitleSize.min, SIZING_RANGES.typography.cardTitleSize.max),
      bodyTextSize: clampNum(t.bodyTextSize, base.typography.bodyTextSize, SIZING_RANGES.typography.bodyTextSize.min, SIZING_RANGES.typography.bodyTextSize.max),
      metaTextSize: clampNum(t.metaTextSize, base.typography.metaTextSize, SIZING_RANGES.typography.metaTextSize.min, SIZING_RANGES.typography.metaTextSize.max),
      lineHeight: clampNum(t.lineHeight, base.typography.lineHeight, SIZING_RANGES.typography.lineHeight.min, SIZING_RANGES.typography.lineHeight.max),
      headingGap: clampNum(t.headingGap, base.typography.headingGap, SIZING_RANGES.typography.headingGap.min, SIZING_RANGES.typography.headingGap.max),
    },
    buttons: {
      buttonHeight: clampNum(b.buttonHeight, base.buttons.buttonHeight, SIZING_RANGES.buttons.buttonHeight.min, SIZING_RANGES.buttons.buttonHeight.max),
      buttonPaddingX: clampNum(b.buttonPaddingX, base.buttons.buttonPaddingX, SIZING_RANGES.buttons.buttonPaddingX.min, SIZING_RANGES.buttons.buttonPaddingX.max),
      buttonTextSize: clampNum(b.buttonTextSize, base.buttons.buttonTextSize, SIZING_RANGES.buttons.buttonTextSize.min, SIZING_RANGES.buttons.buttonTextSize.max),
      iconSize: clampNum(b.iconSize, base.buttons.iconSize, SIZING_RANGES.buttons.iconSize.min, SIZING_RANGES.buttons.iconSize.max),
      iconGap: clampNum(b.iconGap, base.buttons.iconGap, SIZING_RANGES.buttons.iconGap.min, SIZING_RANGES.buttons.iconGap.max),
      buttonRadius: clampNum(b.buttonRadius, base.buttons.buttonRadius, SIZING_RANGES.buttons.buttonRadius.min, SIZING_RANGES.buttons.buttonRadius.max),
    },
    spacing: {
      titleDescGap: clampNum(s.titleDescGap, base.spacing.titleDescGap, SIZING_RANGES.spacing.titleDescGap.min, SIZING_RANGES.spacing.titleDescGap.max),
      componentGap: clampNum(s.componentGap, base.spacing.componentGap, SIZING_RANGES.spacing.componentGap.min, SIZING_RANGES.spacing.componentGap.max),
      mediaTextGap: clampNum(s.mediaTextGap, base.spacing.mediaTextGap, SIZING_RANGES.spacing.mediaTextGap.min, SIZING_RANGES.spacing.mediaTextGap.max),
      cardSectionGap: clampNum(s.cardSectionGap, base.spacing.cardSectionGap, SIZING_RANGES.spacing.cardSectionGap.min, SIZING_RANGES.spacing.cardSectionGap.max),
    },
    components: {
      hero: {
        paddingY: clampNum(compHero.paddingY, base.components.hero.paddingY, SIZING_RANGES.components.hero.paddingY.min, SIZING_RANGES.components.hero.paddingY.max),
        portraitHeight: clampNum(compHero.portraitHeight, base.components.hero.portraitHeight, SIZING_RANGES.components.hero.portraitHeight.min, SIZING_RANGES.components.hero.portraitHeight.max),
        circleSize: clampNum(compHero.circleSize, base.components.hero.circleSize, SIZING_RANGES.components.hero.circleSize.min, SIZING_RANGES.components.hero.circleSize.max),
        titleSize: clampNum(compHero.titleSize, base.components.hero.titleSize, SIZING_RANGES.components.hero.titleSize.min, SIZING_RANGES.components.hero.titleSize.max),
      },
      education: {
        cardPadding: clampNum(compEdu.cardPadding, base.components.education.cardPadding, SIZING_RANGES.components.education.cardPadding.min, SIZING_RANGES.components.education.cardPadding.max),
        photoMaxHeight: clampNum(compEdu.photoMaxHeight, base.components.education.photoMaxHeight, SIZING_RANGES.components.education.photoMaxHeight.min, SIZING_RANGES.components.education.photoMaxHeight.max),
        thumbnailSize: clampNum(compEdu.thumbnailSize, base.components.education.thumbnailSize, SIZING_RANGES.components.education.thumbnailSize.min, SIZING_RANGES.components.education.thumbnailSize.max),
        titleSize: clampNum(compEdu.titleSize, base.components.education.titleSize, SIZING_RANGES.components.education.titleSize.min, SIZING_RANGES.components.education.titleSize.max),
      },
      projects: {
        cardPadding: clampNum(compProj.cardPadding, base.components.projects.cardPadding, SIZING_RANGES.components.projects.cardPadding.min, SIZING_RANGES.components.projects.cardPadding.max),
        imageRatio: normalizeRatio(compProj.imageRatio, base.components.projects.imageRatio),
        imageMaxHeight: clampNum(compProj.imageMaxHeight, base.components.projects.imageMaxHeight, SIZING_RANGES.components.projects.imageMaxHeight.min, SIZING_RANGES.components.projects.imageMaxHeight.max),
        titleSize: clampNum(compProj.titleSize, base.components.projects.titleSize, SIZING_RANGES.components.projects.titleSize.min, SIZING_RANGES.components.projects.titleSize.max),
      },
      certificates: {
        cardPadding: clampNum(compCert.cardPadding, base.components.certificates.cardPadding, SIZING_RANGES.components.certificates.cardPadding.min, SIZING_RANGES.components.certificates.cardPadding.max),
        thumbnailHeight: clampNum(compCert.thumbnailHeight, base.components.certificates.thumbnailHeight, SIZING_RANGES.components.certificates.thumbnailHeight.min, SIZING_RANGES.components.certificates.thumbnailHeight.max),
        titleSize: clampNum(compCert.titleSize, base.components.certificates.titleSize, SIZING_RANGES.components.certificates.titleSize.min, SIZING_RANGES.components.certificates.titleSize.max),
      },
      experience: {
        cardPadding: clampNum(compExp.cardPadding, base.components.experience.cardPadding, SIZING_RANGES.components.experience.cardPadding.min, SIZING_RANGES.components.experience.cardPadding.max),
        imageMaxHeight: clampNum(compExp.imageMaxHeight, base.components.experience.imageMaxHeight, SIZING_RANGES.components.experience.imageMaxHeight.min, SIZING_RANGES.components.experience.imageMaxHeight.max),
        titleSize: clampNum(compExp.titleSize, base.components.experience.titleSize, SIZING_RANGES.components.experience.titleSize.min, SIZING_RANGES.components.experience.titleSize.max),
      },
      about: {
        cardPadding: clampNum(compAbout.cardPadding, base.components.about.cardPadding, SIZING_RANGES.components.about.cardPadding.min, SIZING_RANGES.components.about.cardPadding.max),
        portraitMaxHeight: clampNum(compAbout.portraitMaxHeight, base.components.about.portraitMaxHeight, SIZING_RANGES.components.about.portraitMaxHeight.min, SIZING_RANGES.components.about.portraitMaxHeight.max),
        bodyTextSize: clampNum(compAbout.bodyTextSize, base.components.about.bodyTextSize, SIZING_RANGES.components.about.bodyTextSize.min, SIZING_RANGES.components.about.bodyTextSize.max),
      },
    },
    responsive: {
      desktop: {
        scaleFactor: clampNum(rDesk.scaleFactor, base.responsive.desktop.scaleFactor, SIZING_RANGES.responsive.scaleFactor.min, SIZING_RANGES.responsive.scaleFactor.max),
        paddingX: clampNum(rDesk.paddingX, base.responsive.desktop.paddingX, SIZING_RANGES.responsive.paddingX.min, SIZING_RANGES.responsive.paddingX.max),
        cardGap: clampNum(rDesk.cardGap, base.responsive.desktop.cardGap, SIZING_RANGES.responsive.cardGap.min, SIZING_RANGES.responsive.cardGap.max),
      },
      tablet: {
        scaleFactor: clampNum(rTab.scaleFactor, base.responsive.tablet.scaleFactor, SIZING_RANGES.responsive.scaleFactor.min, SIZING_RANGES.responsive.scaleFactor.max),
        paddingX: clampNum(rTab.paddingX, base.responsive.tablet.paddingX, SIZING_RANGES.responsive.paddingX.min, SIZING_RANGES.responsive.paddingX.max),
        cardGap: clampNum(rTab.cardGap, base.responsive.tablet.cardGap, SIZING_RANGES.responsive.cardGap.min, SIZING_RANGES.responsive.cardGap.max),
      },
      mobile: {
        scaleFactor: clampNum(rMob.scaleFactor, base.responsive.mobile.scaleFactor, SIZING_RANGES.responsive.scaleFactor.min, SIZING_RANGES.responsive.scaleFactor.max),
        paddingX: clampNum(rMob.paddingX, base.responsive.mobile.paddingX, SIZING_RANGES.responsive.paddingX.min, SIZING_RANGES.responsive.paddingX.max),
        cardGap: clampNum(rMob.cardGap, base.responsive.mobile.cardGap, SIZING_RANGES.responsive.cardGap.min, SIZING_RANGES.responsive.cardGap.max),
      },
    },
  };
}

export function normalizeLayoutSizingSettings(raw: unknown): LayoutSizingSettings {
  const obj = isPlainObject(raw) ? raw : {};
  return {
    minimalis_elegan: normalizeModeSizingConfig('minimalis_elegan', obj.minimalis_elegan),
    neo_brutalist: normalizeModeSizingConfig('neo_brutalist', obj.neo_brutalist),
  };
}

export function resetSizingGroup<K extends SizingGroupKey>(
  mode: DesignMode,
  current: ModeSizingConfig,
  group: K
): ModeSizingConfig {
  const baseline = buildPresetModeConfig(mode, current.preset);
  return {
    ...current,
    [group]: baseline[group],
  };
}

export function resolveImagePositionCss(pos: ImageFitPositionOption): string {
  if (pos === 'top') return '50% 0%';
  if (pos === 'center') return '50% 50%';
  return '50% 20%';
}

function scaledPx(value: number, scale: number, minFloor: number): string {
  const computed = Math.max(minFloor, Math.round(value * scale * 10) / 10);
  return `${computed}px`;
}

/**
 * Generates real CSS custom properties (width, max-width, padding, gap, font-size,
 * line-height, border-radius, aspect-ratio, min-height) for a given ModeSizingConfig
 * and target viewport breakpoint. NEVER uses CSS transform: scale().
 */
export function buildSizingCssVariables(
  config: ModeSizingConfig,
  breakpoint: DeviceBreakpoint = 'desktop'
): Record<string, string> {
  const bp = config.responsive[breakpoint];
  const s = bp.scaleFactor;

  return {
    // A. Layout & Frame
    '--sz-content-max-w': `${config.layout.contentMaxWidth}px`,
    '--sz-hero-max-w': `${config.layout.heroMaxWidth}px`,
    '--sz-pad-x': `${bp.paddingX}px`,
    '--sz-pad-y': scaledPx(config.layout.paddingY, s, 14),
    '--sz-section-gap': scaledPx(config.layout.sectionGap, s, 20),
    '--sz-section-min-h': config.layout.sectionMinHeight > 0 ? scaledPx(config.layout.sectionMinHeight, s, 0) : 'auto',
    '--sz-frame-radius': `${config.layout.frameRadius}px`,

    // B. Cards & Items
    '--sz-card-min-w': scaledPx(config.cards.cardMinWidth, s, 200),
    '--sz-card-min-h': config.cards.cardMinHeight > 0 ? scaledPx(config.cards.cardMinHeight, s, 0) : 'auto',
    '--sz-card-pad': scaledPx(config.cards.cardPadding, s, 11),
    '--sz-card-gap': `${bp.cardGap}px`,
    '--sz-card-radius': `${config.cards.cardRadius}px`,
    '--sz-border-w': `${config.cards.borderWidth}px`,

    // C. Images
    '--sz-img-w': `${config.images.imageWidthPct}%`,
    '--sz-img-max-h': scaledPx(config.images.imageMaxHeight, s, 120),
    '--sz-img-ratio': config.images.imageRatio === 'auto' ? 'auto' : config.images.imageRatio,
    '--sz-thumb-size': scaledPx(config.images.thumbnailSize, s, 52),
    '--sz-img-radius': `${config.images.imageRadius}px`,
    '--sz-img-pos': resolveImagePositionCss(config.images.imagePosition),

    // D. Typography
    '--sz-hero-title': scaledPx(config.typography.heroTitleSize, s, 22),
    '--sz-section-title': scaledPx(config.typography.sectionTitleSize, s, 17),
    '--sz-card-title': scaledPx(config.typography.cardTitleSize, s, 14),
    '--sz-body-text': scaledPx(config.typography.bodyTextSize, s, 12.5),
    '--sz-meta-text': scaledPx(config.typography.metaTextSize, s, 10),
    '--sz-line-height': `${config.typography.lineHeight}`,
    '--sz-heading-gap': scaledPx(config.typography.headingGap, s, 4),

    // E. Buttons & Icons
    '--sz-btn-h': scaledPx(config.buttons.buttonHeight, s, 30),
    '--sz-btn-px': scaledPx(config.buttons.buttonPaddingX, s, 10),
    '--sz-btn-text': scaledPx(config.buttons.buttonTextSize, s, 11),
    '--sz-icon-size': scaledPx(config.buttons.iconSize, s, 12),
    '--sz-icon-gap': scaledPx(config.buttons.iconGap, s, 4),
    '--sz-btn-radius': `${config.buttons.buttonRadius}px`,

    // F. Spacing
    '--sz-title-desc-gap': scaledPx(config.spacing.titleDescGap, s, 4),
    '--sz-comp-gap': scaledPx(config.spacing.componentGap, s, 8),
    '--sz-media-text-gap': scaledPx(config.spacing.mediaTextGap, s, 8),
    '--sz-card-section-gap': scaledPx(config.spacing.cardSectionGap, s, 10),

    // Per-Component Overrides
    '--sz-hero-pad-y': scaledPx(config.components.hero.paddingY, s, 16),
    '--sz-hero-portrait-h': scaledPx(config.components.hero.portraitHeight, breakpoint === 'mobile' ? Math.min(s, 0.78) : s, 210),
    '--sz-hero-circle': scaledPx(config.components.hero.circleSize, breakpoint === 'mobile' ? Math.min(s, 0.8) : s, 164),
    '--sz-hero-ring': scaledPx(Math.round(config.components.hero.circleSize * 1.14), breakpoint === 'mobile' ? Math.min(s, 0.8) : s, 186),
    '--sz-hero-comp-title': scaledPx(config.components.hero.titleSize, s, 22),

    '--sz-edu-pad': scaledPx(config.components.education.cardPadding, s, 12),
    '--sz-edu-photo-h': scaledPx(config.components.education.photoMaxHeight, s, 150),
    '--sz-edu-thumb': scaledPx(config.components.education.thumbnailSize, s, 54),
    '--sz-edu-title': scaledPx(config.components.education.titleSize, s, 15),

    '--sz-proj-pad': scaledPx(config.components.projects.cardPadding, s, 12),
    '--sz-proj-ratio': config.components.projects.imageRatio === 'auto' ? 'auto' : config.components.projects.imageRatio,
    '--sz-proj-img-h': scaledPx(config.components.projects.imageMaxHeight, s, 130),
    '--sz-proj-title': scaledPx(config.components.projects.titleSize, s, 14),

    '--sz-cert-pad': scaledPx(config.components.certificates.cardPadding, s, 10),
    '--sz-cert-thumb-h': scaledPx(config.components.certificates.thumbnailHeight, s, 120),
    '--sz-cert-title': scaledPx(config.components.certificates.titleSize, s, 13),

    '--sz-exp-pad': scaledPx(config.components.experience.cardPadding, s, 12),
    '--sz-exp-img-h': scaledPx(config.components.experience.imageMaxHeight, s, 130),
    '--sz-exp-title': scaledPx(config.components.experience.titleSize, s, 14),

    '--sz-about-pad': scaledPx(config.components.about.cardPadding, s, 14),
    '--sz-about-portrait-h': scaledPx(config.components.about.portraitMaxHeight, breakpoint === 'mobile' ? Math.min(s, 0.84) : s, 190),
    '--sz-about-body': scaledPx(config.components.about.bodyTextSize, s, 13.5),
  };
}

const RESPONSIVE_STYLE_TAG_ID = 'portfolio-layout-sizing-vars';

function formatVarBlock(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');
}

/**
 * Generates a scoped stylesheet declaring desktop defaults plus responsive
 * tablet (<=1024px) and mobile (<=640px) custom properties strictly for public routes.
 */
export function buildResponsiveSizingStyleSheet(config: ModeSizingConfig): string {
  const desktopVars = buildSizingCssVariables(config, 'desktop');
  const tabletVars = buildSizingCssVariables(config, 'tablet');
  const mobileVars = buildSizingCssVariables(config, 'mobile');

  return [
    `html[data-sizing-active="true"] {\n${formatVarBlock(desktopVars)}\n}`,
    `@media (max-width: 1024px) {\n  html[data-sizing-active="true"] {\n${formatVarBlock(tabletVars)}\n  }\n}`,
    `@media (max-width: 640px) {\n  html[data-sizing-active="true"] {\n${formatVarBlock(mobileVars)}\n  }\n}`,
  ].join('\n\n');
}

export function applyDocumentLayoutSizing(
  config: ModeSizingConfig,
  isAdminRoute: boolean
): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (isAdminRoute) {
    root.dataset.sizingActive = 'false';
    return;
  }

  root.dataset.sizingActive = 'true';
  root.dataset.scalePreset = config.preset;

  let styleEl = document.getElementById(RESPONSIVE_STYLE_TAG_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = RESPONSIVE_STYLE_TAG_ID;
    document.head.appendChild(styleEl);
  }
  const cssText = buildResponsiveSizingStyleSheet(config);
  if (styleEl.textContent !== cssText) {
    styleEl.textContent = cssText;
  }
}

export function readCachedLayoutSizing(): LayoutSizingSettings {
  if (typeof window === 'undefined') return createDefaultLayoutSizingSettings();
  try {
    const raw = window.localStorage.getItem(LAYOUT_SIZING_STORAGE_KEY);
    if (!raw) return createDefaultLayoutSizingSettings();
    return normalizeLayoutSizingSettings(JSON.parse(raw));
  } catch {
    return createDefaultLayoutSizingSettings();
  }
}

export function writeCachedLayoutSizing(settings: LayoutSizingSettings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      LAYOUT_SIZING_STORAGE_KEY,
      JSON.stringify(normalizeLayoutSizingSettings(settings))
    );
  } catch {
    // Ignore storage quota or private mode restrictions
  }
}

export function areLayoutSizingEqual(a: LayoutSizingSettings, b: LayoutSizingSettings): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
