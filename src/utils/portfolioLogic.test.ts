import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampString,
  clampStringArray,
  filterCertificates,
  filterExperiences,
  filterProjects,
  filterPublicItems,
  formatWhatsAppLink,
  generateSafeDocId,
  isValidSafeUrl,
  validateContactForm,
  validateUploadFile,
} from './portfolioLogic';
import type { CertificateItem, ExperienceItem, ProjectItem } from '../types/portfolio';

test('filterPublicItems returns only published & visible records sorted by displayOrder', () => {
  const items = [
    { id: '1', status: 'published' as const, isVisible: true, displayOrder: 3 },
    { id: '2', status: 'draft' as const, isVisible: true, displayOrder: 1 },
    { id: '3', status: 'published' as const, isVisible: false, displayOrder: 2 },
    { id: '4', status: 'published' as const, isVisible: true, displayOrder: 1 },
  ];
  const result = filterPublicItems(items);
  assert.deepEqual(
    result.map((r) => r.id),
    ['4', '1']
  );
});

test('filterCertificates filters by category, field, year, and keyword query', () => {
  const certs: CertificateItem[] = [
    {
      id: 'c1',
      title: 'AI Fluency Framework',
      issuer: 'Anthropic',
      year: '2025',
      category: 'Internasional',
      field: 'AI',
      description: 'Pelatihan kecerdasan buatan',
      fileUrl: 'https://example.com/c1.pdf',
      fileType: 'pdf',
      fileName: 'c1.pdf',
      thumbnailUrl: '',
      status: 'published',
      isVisible: true,
      displayOrder: 1,
    },
    {
      id: 'c2',
      title: 'Pelatihan Kepemimpinan Mahasiswa',
      issuer: 'Unismuh Makassar',
      year: '2024',
      category: 'Dalam Negeri',
      field: 'Kepemimpinan',
      description: 'Penguatan organisasi',
      fileUrl: 'https://example.com/c2.png',
      fileType: 'image',
      fileName: 'c2.png',
      thumbnailUrl: '',
      status: 'published',
      isVisible: true,
      displayOrder: 2,
    },
  ];

  assert.equal(
    filterCertificates(certs, { query: 'anthropic', category: 'all', field: 'all', year: 'all' }).length,
    1
  );
  assert.equal(
    filterCertificates(certs, { query: '', category: 'Dalam Negeri', field: 'all', year: '2024' }).length,
    1
  );
  assert.equal(
    filterCertificates(certs, { query: '', category: 'Dalam Negeri', field: 'AI', year: 'all' }).length,
    0
  );
});

test('filterExperiences and filterProjects match category and search text', () => {
  const exps: ExperienceItem[] = [
    {
      id: 'e1',
      institution: 'Pesantren Mahasiswa KH. Djamaluddin Amien',
      role: 'Pembina Mahasiswa',
      category: 'mentoring',
      period: '2024–2025',
      duration: '1 tahun',
      location: 'Makassar',
      description: 'Kedisiplinan dan keilmuan',
      responsibilities: ['Administrasi'],
      imageUrls: [],
      featured: true,
      status: 'published',
      isVisible: true,
      displayOrder: 1,
    },
  ];
  assert.equal(filterExperiences(exps, 'mentoring', 'djamaluddin').length, 1);
  assert.equal(filterExperiences(exps, 'teaching', '').length, 0);

  const projs: ProjectItem[] = [
    {
      id: 'p1',
      title: 'Dars with Osama',
      category: 'dars_with_osama',
      period: 'Aktif',
      description: 'Platform pembelajaran digital pendidikan Islam',
      documentation: '',
      liveUrl: 'https://darswithosama.netlify.app/',
      repoUrl: '',
      imageUrls: [],
      featured: true,
      status: 'published',
      isVisible: true,
      displayOrder: 1,
    },
  ];
  assert.equal(filterProjects(projs, 'dars_with_osama', 'islam').length, 1);
  assert.equal(filterProjects(projs, 'design_media', '').length, 0);
});

test('validateContactForm catches invalid inputs and accepts valid submissions', () => {
  const invalid = validateContactForm({
    senderName: 'A',
    senderEmail: 'not-an-email',
    subject: '',
    message: 'Pendek',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.senderName);
  assert.ok(invalid.errors.senderEmail);
  assert.ok(invalid.errors.subject);
  assert.ok(invalid.errors.message);

  const valid = validateContactForm({
    senderName: 'Ahmad Fauzan',
    senderEmail: 'ahmad@example.com',
    subject: 'Undangan Kolaborasi Edukasi',
    message: 'Halo Osama, kami tertarik berdiskusi mengenai kolaborasi konten pembelajaran digital.',
  });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.errors, {});
});

test('validateUploadFile enforces allowed MIME types and size limits', () => {
  assert.equal(
    validateUploadFile({ name: 'cert.webp', type: 'image/webp', size: 1024 * 500 }, 'both').valid,
    true
  );
  assert.equal(
    validateUploadFile({ name: 'cv.pdf', type: 'application/pdf', size: 1024 * 1024 }, 'pdf').valid,
    true
  );
  assert.equal(
    validateUploadFile({ name: 'script.js', type: 'application/javascript', size: 200 }, 'both').valid,
    false
  );
  assert.equal(
    validateUploadFile({ name: 'huge.png', type: 'image/png', size: 9 * 1024 * 1024 }, 'image').valid,
    false
  );
});

test('sanitization, safe IDs, URLs, and WhatsApp link formatting', () => {
  assert.equal(clampString('  hello world  ', 5), 'hello');
  assert.deepEqual(clampStringArray([' a ', '', 'b', 'c'], 2), ['a', 'b']);
  const id = generateSafeDocId('cert');
  assert.match(id, /^[a-zA-Z0-9_-]+$/);
  assert.equal(isValidSafeUrl('https://darswithosama.netlify.app/'), true);
  assert.equal(isValidSafeUrl('javascript:alert(1)'), false);
  assert.equal(formatWhatsAppLink('0812-3456-7890'), 'https://wa.me/6281234567890');
});
