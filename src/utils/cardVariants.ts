export type CardTone = 'beige' | 'blue' | 'bordo' | 'green' | 'midnight';

export interface CardToneConfig {
  tone: CardTone;
  cardClass: string;
  frameClass: string;
  badgeClass: string;
  secondaryBadgeClass: string;
  buttonClass: string;
  secondaryButtonClass: string;
  isDark: boolean;
}

const TONE_MAP: Record<CardTone, CardToneConfig> = {
  beige: {
    tone: 'beige',
    cardClass: 'card-beige',
    frameClass: 'frame-midnight',
    badgeClass: 'brutal-badge',
    secondaryBadgeClass: 'brutal-badge-bordo',
    buttonClass: 'brutal-btn brutal-btn-primary',
    secondaryButtonClass: 'brutal-btn brutal-btn-secondary',
    isDark: false,
  },
  blue: {
    tone: 'blue',
    cardClass: 'card-blue',
    frameClass: 'frame-shadow-bordo',
    badgeClass: 'brutal-badge-inverse',
    secondaryBadgeClass: 'brutal-badge-beige',
    buttonClass: 'brutal-btn brutal-btn-primary',
    secondaryButtonClass: 'brutal-btn brutal-btn-outline',
    isDark: false,
  },
  bordo: {
    tone: 'bordo',
    cardClass: 'card-bordo',
    frameClass: 'frame-midnight',
    badgeClass: 'brutal-badge-beige',
    secondaryBadgeClass: 'brutal-badge',
    buttonClass: 'brutal-btn-on-dark',
    secondaryButtonClass: 'brutal-btn-on-dark-outline',
    isDark: true,
  },
  green: {
    tone: 'green',
    cardClass: 'card-green',
    frameClass: 'frame-shadow-bordo',
    badgeClass: 'brutal-badge',
    secondaryBadgeClass: 'brutal-badge-beige',
    buttonClass: 'brutal-btn-on-dark',
    secondaryButtonClass: 'brutal-btn-on-dark-outline',
    isDark: true,
  },
  midnight: {
    tone: 'midnight',
    cardClass: 'card-midnight',
    frameClass: 'frame-shadow-bordo',
    badgeClass: 'brutal-badge',
    secondaryBadgeClass: 'brutal-badge-bordo',
    buttonClass: 'brutal-btn-on-dark',
    secondaryButtonClass: 'brutal-btn-on-dark-outline',
    isDark: true,
  },
};

export function getCardTone(index: number, sequence: CardTone[] = ['beige', 'blue', 'green', 'bordo', 'midnight']): CardToneConfig {
  const tone = sequence[index % sequence.length];
  return TONE_MAP[tone];
}

export function getToneConfig(tone: CardTone): CardToneConfig {
  return TONE_MAP[tone];
}
