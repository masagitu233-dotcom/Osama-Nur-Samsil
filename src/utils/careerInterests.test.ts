import test from 'node:test';
import assert from 'node:assert/strict';
import type { InterestItem } from '../types/portfolio';
import {
  buildNextCareerInterestOrder,
  CAREER_ITEM_DESC_MAX_LENGTH,
  CAREER_ITEM_TITLE_MAX_LENGTH,
  CAREER_OVERVIEW_MAX_LENGTH,
  computeCareerReorderUpdates,
  extractCareerInterestItems,
  parseBiographyParagraphs,
  parseMissionPoints,
  validateCareerInterestForm,
  validateCareerOverview,
} from './careerInterests';

function makeInterest(overrides: Partial<InterestItem> & { id: string; title: string }): InterestItem {
  return {
    category: 'career_interest',
    description: '',
    status: 'published',
    isVisible: true,
    displayOrder: 1,
    ...overrides,
  };
}

test('extractCareerInterestItems filters only career_interest and sorts by displayOrder', () => {
  const mixed: InterestItem[] = [
    makeInterest({ id: 'a', title: 'Editing', category: 'talent_strength', displayOrder: 1 }),
    makeInterest({ id: 'b', title: 'Riset Hukum Islam', category: 'career_interest', displayOrder: 3 }),
    makeInterest({ id: 'c', title: 'Pendidikan Digital', category: 'career_interest', displayOrder: 1 }),
    makeInterest({ id: 'd', title: 'Pengembangan Media', category: 'career_interest', displayOrder: 2 }),
  ];

  const result = extractCareerInterestItems(mixed);
  assert.deepEqual(
    result.map((r) => r.id),
    ['c', 'd', 'b']
  );
});

test('validateCareerInterestForm rejects empty title and enforces max lengths', () => {
  assert.equal(validateCareerInterestForm({ title: '   ', description: 'Desk' }).valid, false);
  assert.equal(validateCareerInterestForm({ title: 'A', description: 'Desk' }).valid, false);
  assert.equal(
    validateCareerInterestForm({ title: 'x'.repeat(CAREER_ITEM_TITLE_MAX_LENGTH + 1), description: '' }).valid,
    false
  );
  assert.equal(
    validateCareerInterestForm({
      title: 'Pendidikan Islam',
      description: 'y'.repeat(CAREER_ITEM_DESC_MAX_LENGTH + 1),
    }).valid,
    false
  );

  const ok = validateCareerInterestForm({
    title: '  Pengembangan Platform Digital  ',
    description: '  Fokus pada sistem pembelajaran daring.  ',
  });
  assert.equal(ok.valid, true);
  assert.equal(ok.title, 'Pengembangan Platform Digital');
  assert.equal(ok.description, 'Fokus pada sistem pembelajaran daring.');
});

test('validateCareerOverview trims text and enforces max length', () => {
  const emptyOk = validateCareerOverview('   ');
  assert.equal(emptyOk.valid, true);
  assert.equal(emptyOk.value, '');

  const tooLong = validateCareerOverview('a'.repeat(CAREER_OVERVIEW_MAX_LENGTH + 1));
  assert.equal(tooLong.valid, false);
});

test('buildNextCareerInterestOrder handles empty, contiguous, and sparse displayOrder values', () => {
  assert.equal(buildNextCareerInterestOrder([]), 1);
  assert.equal(
    buildNextCareerInterestOrder([
      makeInterest({ id: '1', title: 'A', displayOrder: 1 }),
      makeInterest({ id: '2', title: 'B', displayOrder: 5 }),
    ]),
    6
  );
});

test('computeCareerReorderUpdates swaps cleanly even when items share duplicate displayOrder values', () => {
  const items = [
    makeInterest({ id: 'first', title: 'Pertama', displayOrder: 1 }),
    makeInterest({ id: 'second', title: 'Kedua', displayOrder: 1 }),
    makeInterest({ id: 'third', title: 'Ketiga', displayOrder: 1 }),
  ];

  // Move third item up to index 1
  const updates = computeCareerReorderUpdates(items, 2, -1);
  const byId = new Map(updates.map((u) => [u.item.id, u.nextOrder]));
  assert.equal(byId.get('third'), 2);
  assert.equal(byId.get('second'), 3);
  // Boundary guards return empty updates
  assert.deepEqual(computeCareerReorderUpdates(items, 0, -1), []);
  assert.deepEqual(computeCareerReorderUpdates(items, 2, 1), []);
});

test('parseBiographyParagraphs and parseMissionPoints preserve all content cleanly', () => {
  const paragraphs = parseBiographyParagraphs('Paragraf satu.\n\nParagraf dua.\nMasih paragraf dua.');
  assert.deepEqual(paragraphs, ['Paragraf satu.', 'Paragraf dua. Masih paragraf dua.']);

  const mission = parseMissionPoints('1. Pertama\n2. Kedua\n3. Ketiga');
  assert.deepEqual(mission, [
    { indexLabel: '01', text: 'Pertama' },
    { indexLabel: '02', text: 'Kedua' },
    { indexLabel: '03', text: 'Ketiga' },
  ]);

  const singleMission = parseMissionPoints('Satu kalimat misi saja.');
  assert.deepEqual(singleMission, [{ indexLabel: null, text: 'Satu kalimat misi saja.' }]);
});
