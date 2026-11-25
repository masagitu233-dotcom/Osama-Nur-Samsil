export type CardTone = 'bordo' | 'navy' | 'green' | 'gold';

export type PortfolioSectionKey =
  | 'experience'
  | 'projects'
  | 'skills'
  | 'certificates'
  | 'education'
  | 'profile'
  | 'contact';

export interface CardToneConfig {
  tone: CardTone;
  cardClass: string;
  frameClass: string;
  badgeClass: string;
  secondaryBadgeClass: string;
  buttonClass: string;
  secondaryButtonClass: string;
  mediaBorderClass: string;
  isDark: boolean;
}

const TONE_MAP: Record<CardTone, CardToneConfig> = {
  bordo: {
    tone: 'bordo',
    cardClass: 'card-bordo',
    frameClass: 'frame-bordo',
    badgeClass: 'brutal-badge',
    secondaryBadgeClass: 'brutal-badge-beige',
    buttonClass: 'brutal-btn-frame-bordo',
    secondaryButtonClass: 'brutal-btn-on-dark-outline',
    mediaBorderClass: 'border-[#D9B44A]',
    isDark: true,
  },
  navy: {
    tone: 'navy',
    cardClass: 'card-navy',
    frameClass: 'frame-navy',
    badgeClass: 'brutal-badge',
    secondaryBadgeClass: 'brutal-badge-beige',
    buttonClass: 'brutal-btn-frame-navy',
    secondaryButtonClass: 'brutal-btn-on-dark-outline',
    mediaBorderClass: 'border-[#D9B44A]',
    isDark: true,
  },
  green: {
    tone: 'green',
    cardClass: 'card-green',
    frameClass: 'frame-green',
    badgeClass: 'brutal-badge',
    secondaryBadgeClass: 'brutal-badge-beige',
    buttonClass: 'brutal-btn-frame-green',
    secondaryButtonClass: 'brutal-btn-on-dark-outline',
    mediaBorderClass: 'border-[#D9B44A]',
    isDark: true,
  },
  gold: {
    tone: 'gold',
    cardClass: 'card-gold',
    frameClass: 'frame-gold',
    badgeClass: 'brutal-badge-navy',
    secondaryBadgeClass: 'brutal-badge-on-gold',
    buttonClass: 'brutal-btn-frame-gold',
    secondaryButtonClass: 'brutal-btn-on-gold',
    mediaBorderClass: 'border-[#001F24]',
    isDark: false,
  },
};

/**
 * Official Strict 6-Color Section-to-Card Mapping (Zero Pastels):
 * 1. Pengalaman & Organisasi  -> Bordo (#6C151E) + Beige (#F8F8E1)
 * 2. Pendidikan               -> Ink Navy (#1B2A3D) + Beige (#F8F8E1)
 * 3. Proyek & Karya Digital   -> Green (#0F3D3A) + Beige (#F8F8E1)
 * 4. Keahlian & Kompetensi    -> Muted Golden Yellow (#D9B44A) + Deep Midnight Ink (#001F24)
 * 5. Sertifikat & Pelatihan   -> Green (#0F3D3A) + Beige (#F8F8E1)
 * 6. Profil / Struktural      -> Ink Navy (#1B2A3D) + Beige (#F8F8E1)
 * 7. Formulir Hubungi Saya    -> Bordo (#6C151E) + Beige (#F8F8E1)
 */
export const SECTION_CARD_TONE_MAP: Record<PortfolioSectionKey, CardTone> = {
  experience: 'bordo',
  education: 'navy',
  projects: 'green',
  skills: 'gold',
  certificates: 'green',
  profile: 'navy',
  contact: 'bordo',
};

export function getToneConfig(tone: CardTone): CardToneConfig {
  return TONE_MAP[tone];
}

export function getSectionCardTone(section: PortfolioSectionKey): CardToneConfig {
  return TONE_MAP[SECTION_CARD_TONE_MAP[section]];
}
