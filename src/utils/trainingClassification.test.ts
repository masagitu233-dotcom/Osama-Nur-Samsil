import test from 'node:test';
import assert from 'node:assert/strict';
import type { CertificateItem, TrainingItem } from '../types/portfolio';
import {
  CANONICAL_DOMESTIC_CATEGORY,
  CANONICAL_INTERNATIONAL_CATEGORY,
  cleanDisplayBulletPrefix,
  groupCertificatesByTrainingScope,
  groupTrainingsByScope,
  normalizeCertificateCategoryLabel,
  normalizeTrainingScope,
} from './trainingClassification';

const makeCert = (id: string, category: string, issuer = 'Lembaga'): CertificateItem => ({
  id,
  title: `Pelatihan ${id}`,
  issuer,
  year: '2026',
  category,
  field: 'Teknologi Informasi',
  description: 'Keterangan pelatihan',
  fileUrl: 'https://drive.google.com/file/d/abc123456789/view',
  fileType: 'image',
  fileName: `${id}.jpg`,
  thumbnailUrl: 'https://drive.google.com/file/d/abc123456789/view',
  status: 'published',
  isVisible: true,
  displayOrder: 1,
});

test('normalizeTrainingScope handles all Indonesian & English domestic/international category variants', () => {
  for (const val of ['Dalam Negeri', 'dalam negeri', 'Nasional', 'NASIONAL', 'domestic', 'Dalam Negeri (Nasional)']) {
    assert.equal(normalizeTrainingScope(val), 'domestic', `Expected domestic for ${val}`);
    assert.equal(normalizeCertificateCategoryLabel(val), CANONICAL_DOMESTIC_CATEGORY);
  }
  for (const val of [
    'Internasional',
    'internasional',
    'Luar Negeri',
    'luar negeri',
    'Internasional / Luar Negeri',
    'international',
  ]) {
    assert.equal(normalizeTrainingScope(val), 'international', `Expected international for ${val}`);
    assert.equal(normalizeCertificateCategoryLabel(val), CANONICAL_INTERNATIONAL_CATEGORY);
  }
});

test('groupCertificatesByTrainingScope uses ONLY saved category and never guesses from issuer name', () => {
  const certs = [
    makeCert('c1', 'Dalam Negeri', 'Anthropic'), // saved as Dalam Negeri -> must stay domestic!
    makeCert('c2', 'nasional', 'BISA.AI'),
    makeCert('c3', 'Internasional', 'Anthropic'),
    makeCert('c4', 'Luar Negeri', 'Masjid Nabawi'),
    makeCert('c5', '', 'Anthropic'), // empty category -> must NOT guess international from Anthropic!
  ];

  const grouped = groupCertificatesByTrainingScope(certs);
  assert.deepEqual(
    grouped.domestic.map((c) => c.id),
    ['c1', 'c2']
  );
  assert.deepEqual(
    grouped.international.map((c) => c.id),
    ['c3', 'c4']
  );
  assert.deepEqual(
    grouped.uncategorized.map((c) => c.id),
    ['c5']
  );
});

test('groupTrainingsByScope classifies trainings consistently and cleanDisplayBulletPrefix trims bullets', () => {
  const trainings: TrainingItem[] = [
    {
      id: 't1',
      title: 'Pelatihan Nasional',
      scope: 'domestic',
      organizer: 'Unismuh',
      year: '2025',
      category: 'Kepemimpinan',
      topics: ['Kepemimpinan'],
      description: 'Desc',
      status: 'published',
      isVisible: true,
      displayOrder: 1,
    },
    {
      id: 't2',
      title: 'Pelatihan Luar Negeri',
      scope: 'international',
      organizer: 'Anthropic',
      year: '2026',
      category: 'AI',
      topics: ['AI'],
      description: 'Desc',
      status: 'published',
      isVisible: true,
      displayOrder: 2,
    },
  ];

  const grouped = groupTrainingsByScope(trainings);
  assert.equal(grouped.domestic.length, 1);
  assert.equal(grouped.international.length, 1);
  assert.equal(cleanDisplayBulletPrefix('• Claude 101.'), 'Claude 101.');
});
