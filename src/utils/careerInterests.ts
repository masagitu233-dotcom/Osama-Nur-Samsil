import type { InterestItem } from '../types/portfolio';
import { sortByDisplayOrder } from './portfolioLogic';

export const CAREER_OVERVIEW_MAX_LENGTH = 2000;
export const CAREER_ITEM_TITLE_MAX_LENGTH = 160;
export const CAREER_ITEM_DESC_MAX_LENGTH = 1000;

export interface CareerInterestValidationResult {
  valid: boolean;
  error?: string;
  title: string;
  description: string;
}

export interface CareerOverviewValidationResult {
  valid: boolean;
  error?: string;
  value: string;
}

export interface MissionPoint {
  indexLabel: string | null;
  text: string;
}

/**
 * Extracts Section 06 ("Bidang Pekerjaan yang Diminati") items from the interests collection,
 * sorted deterministically by displayOrder then title.
 */
export function extractCareerInterestItems(interests: InterestItem[]): InterestItem[] {
  return sortByDisplayOrder(interests.filter((item) => item.category === 'career_interest'));
}

/**
 * Validates the general overview text for Section 06 against blueprint limits.
 */
export function validateCareerOverview(rawOverview: string): CareerOverviewValidationResult {
  const value = String(rawOverview ?? '').trim();
  if (value.length > CAREER_OVERVIEW_MAX_LENGTH) {
    return {
      valid: false,
      error: `Uraian umum maksimal ${CAREER_OVERVIEW_MAX_LENGTH} karakter.`,
      value,
    };
  }
  return { valid: true, value };
}

/**
 * Validates a single job/career interest entry before saving to Firestore.
 */
export function validateCareerInterestForm(input: {
  title: string;
  description: string;
}): CareerInterestValidationResult {
  const title = String(input.title ?? '').trim();
  const description = String(input.description ?? '').trim();

  if (title.length < 2) {
    return {
      valid: false,
      error: 'Nama bidang pekerjaan wajib diisi (minimal 2 karakter).',
      title,
      description,
    };
  }
  if (title.length > CAREER_ITEM_TITLE_MAX_LENGTH) {
    return {
      valid: false,
      error: `Nama bidang pekerjaan maksimal ${CAREER_ITEM_TITLE_MAX_LENGTH} karakter.`,
      title,
      description,
    };
  }
  if (description.length > CAREER_ITEM_DESC_MAX_LENGTH) {
    return {
      valid: false,
      error: `Deskripsi bidang pekerjaan maksimal ${CAREER_ITEM_DESC_MAX_LENGTH} karakter.`,
      title,
      description,
    };
  }

  return { valid: true, title, description };
}

/**
 * Computes the next sequential displayOrder for a newly added career interest item.
 */
export function buildNextCareerInterestOrder(items: InterestItem[]): number {
  if (items.length === 0) return 1;
  const maxOrder = items.reduce((max, item) => {
    const order = Number.isFinite(item.displayOrder) ? item.displayOrder : 0;
    return order > max ? order : max;
  }, 0);
  return Math.min(10000, Math.max(items.length + 1, maxOrder + 1));
}

/**
 * Computes deterministic displayOrder updates to swap an item up (-1) or down (+1).
 * Re-normalizes the list sequentially (1..N) when duplicate or unsorted displayOrder values exist,
 * guaranteeing that the visual move always persists cleanly in Firestore.
 */
export function computeCareerReorderUpdates(
  items: InterestItem[],
  index: number,
  direction: -1 | 1
): Array<{ item: InterestItem; nextOrder: number }> {
  const targetIndex = index + direction;
  if (index < 0 || index >= items.length || targetIndex < 0 || targetIndex >= items.length) {
    return [];
  }

  const reordered = [...items];
  const [moved] = reordered.splice(index, 1);
  reordered.splice(targetIndex, 0, moved);

  const updates: Array<{ item: InterestItem; nextOrder: number }> = [];
  reordered.forEach((item, idx) => {
    const desiredOrder = idx + 1;
    if (item.displayOrder !== desiredOrder) {
      updates.push({ item, nextOrder: desiredOrder });
    }
  });
  return updates;
}

/**
 * Splits multi-paragraph biography text into clean paragraphs while preserving all prose.
 */
export function parseBiographyParagraphs(text: string): string[] {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) return [];
  return trimmed
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/\n+/g, ' ').trim())
    .filter(Boolean);
}

/**
 * Parses numbered or multi-line mission text into structured points without dropping content.
 */
export function parseMissionPoints(text: string): MissionPoint[] {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) return [];

  const lines = trimmed
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return [{ indexLabel: null, text: trimmed }];
  }

  return lines.map((line, idx) => {
    const numberedMatch = line.match(/^(\d+)[.)]\s+(.*)$/);
    if (numberedMatch) {
      return {
        indexLabel: String(numberedMatch[1]).padStart(2, '0'),
        text: numberedMatch[2].trim(),
      };
    }
    const bulletMatch = line.match(/^[-*•]\s+(.*)$/);
    if (bulletMatch) {
      return {
        indexLabel: String(idx + 1).padStart(2, '0'),
        text: bulletMatch[1].trim(),
      };
    }
    return {
      indexLabel: String(idx + 1).padStart(2, '0'),
      text: line,
    };
  });
}
