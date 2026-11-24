import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPublicProfilePayload,
  resolveExternalPublicPhoto,
  shouldSyncPublicProfile,
} from './publicProfileSync';
import type { EducationItem, ExperienceItem, SkillItem } from '../types/portfolio';

test('resolveExternalPublicPhoto normalizes Google Drive links to external-safe HTTPS URLs without relative proxy paths', () => {
  const driveUrl = 'https://drive.google.com/file/d/1sI95x9PxvZR3g1sPUwfm7YK0kSB7yb-S/view?usp=drive_link';
  const resolved = resolveExternalPublicPhoto(driveUrl);

  assert.equal(
    resolved.photoUrl,
    'https://drive.google.com/thumbnail?id=1sI95x9PxvZR3g1sPUwfm7YK0kSB7yb-S&sz=w1600'
  );
  assert.equal(resolved.photoSourceUrl, driveUrl);
  assert.ok(resolved.photoFallbackUrls.length >= 3);
  assert.ok(resolved.photoFallbackUrls.every((u) => u.startsWith('https://')));
  assert.ok(!resolved.photoFallbackUrls.some((u) => u.includes('/.netlify/functions/')));
});

test('resolveExternalPublicPhoto preserves resourcekey and direct HTTPS URLs, and rejects relative dev paths', () => {
  const withRk = resolveExternalPublicPhoto(
    'https://drive.google.com/file/d/1sI95x9PxvZR3g1sPUwfm7YK0kSB7yb-S/view?resourcekey=0-AbCdEf12'
  );
  assert.ok(withRk.photoUrl.includes('resourcekey=0-AbCdEf12'));

  const direct = resolveExternalPublicPhoto('https://cdn.example.com/osama.jpg');
  assert.equal(direct.photoUrl, 'https://cdn.example.com/osama.jpg');
  assert.deepEqual(direct.photoFallbackUrls, ['https://cdn.example.com/osama.jpg']);

  const relative = resolveExternalPublicPhoto('/src/assets/images/hero.jpg');
  assert.equal(relative.photoUrl, '');
  assert.deepEqual(relative.photoFallbackUrls, []);
  assert.equal(relative.photoSourceUrl, '');
});

test('shouldSyncPublicProfile returns true only when profile is published and visible', () => {
  assert.equal(shouldSyncPublicProfile({ status: 'published', isVisible: true }), true);
  assert.equal(shouldSyncPublicProfile({ status: 'draft', isVisible: true }), false);
  assert.equal(shouldSyncPublicProfile({ status: 'published', isVisible: false }), false);
  assert.equal(shouldSyncPublicProfile(null), false);
});

test('buildPublicProfilePayload projects only published visible data sorted by displayOrder and omits private/admin fields', () => {
  const education: EducationItem[] = [
    {
      id: 'edu-2',
      institution: 'Draft School',
      degree: 'S2',
      fieldOfStudy: 'Draft Field',
      graduationYear: '2028',
      period: '2026-2028',
      location: 'Makassar',
      description: 'Should not appear',
      category: 'Pendidikan Tinggi',
      status: 'draft',
      isVisible: true,
      displayOrder: 1,
    },
    {
      id: 'edu-1',
      institution: 'Universitas Muhammadiyah Makassar',
      degree: 'S1',
      fieldOfStudy: 'Hukum Keluarga (Ahwal Syakhsiyah)',
      graduationYear: '2026',
      period: '2022-2026',
      location: 'Makassar, Sulawesi Selatan',
      description: 'Detail',
      category: 'Pendidikan Tinggi',
      status: 'published',
      isVisible: true,
      displayOrder: 2,
    },
  ];

  const experiences: ExperienceItem[] = [
    {
      id: 'exp-2',
      institution: 'Rumah Tahfidz Ibnu Abbas',
      role: 'Pengajar',
      category: 'teaching',
      period: '2024',
      duration: '6 bulan',
      location: 'Makassar',
      description: 'Mengajar',
      responsibilities: ['Membina'],
      imageUrls: ['https://example.com/a.jpg'],
      featured: false,
      status: 'published',
      isVisible: true,
      displayOrder: 2,
    },
    {
      id: 'exp-1',
      institution: 'Pesantren Mahasiswa KH. Djamaluddin Amien',
      role: 'Pembina Mahasiswa',
      category: 'mentoring',
      period: '2024-2025',
      duration: '1 tahun',
      location: 'Makassar',
      description: 'Pembinaan mahasiswa',
      responsibilities: ['Pembinaan harian'],
      imageUrls: [],
      featured: true,
      status: 'published',
      isVisible: true,
      displayOrder: 1,
    },
    {
      id: 'exp-hidden',
      institution: 'Hidden Org',
      role: 'Hidden Role',
      category: 'work',
      period: '2023',
      duration: '1 bulan',
      location: 'Makassar',
      description: 'Hidden',
      responsibilities: [],
      imageUrls: [],
      featured: false,
      status: 'published',
      isVisible: false,
      displayOrder: 0,
    },
  ];

  const skills: SkillItem[] = [
    {
      id: 'skill-1',
      name: 'Bahasa Arab',
      category: 'language',
      proficiencyLabel: 'Menengah',
      description: 'Membaca kitab dan teks akademik',
      status: 'published',
      isVisible: true,
      displayOrder: 1,
    },
    {
      id: 'skill-draft',
      name: 'Draft Skill',
      category: 'technical',
      proficiencyLabel: 'Dasar',
      description: 'Hidden',
      status: 'draft',
      isVisible: true,
      displayOrder: 0,
    },
  ];

  const payload = buildPublicProfilePayload({
    profile: {
      fullName: 'Osama Nur Samsil',
      headline: 'Sarjana Hukum Keluarga, Pembina Akademik & Kreator Pendidikan Digital',
      shortBio: 'Biografi singkat resmi',
      domicile: 'Makassar, Sulawesi Selatan',
      photoUrl: 'https://drive.google.com/file/d/1sI95x9PxvZR3g1sPUwfm7YK0kSB7yb-S/view?usp=drive_link',
    },
    education,
    experiences,
    skills,
  });

  assert.equal(payload.fullName, 'Osama Nur Samsil');
  assert.equal(
    payload.photoUrl,
    'https://drive.google.com/thumbnail?id=1sI95x9PxvZR3g1sPUwfm7YK0kSB7yb-S&sz=w1600'
  );
  assert.equal(payload.education.length, 1);
  assert.equal(payload.education[0].institution, 'Universitas Muhammadiyah Makassar');

  assert.equal(payload.experiences.length, 2);
  assert.equal(payload.experiences[0].role, 'Pembina Mahasiswa');
  assert.equal(payload.experiences[1].role, 'Pengajar');

  assert.equal(payload.skills.length, 1);
  assert.equal(payload.skills[0].name, 'Bahasa Arab');

  const keys = Object.keys(payload);
  assert.ok(!keys.includes('email'));
  assert.ok(!keys.includes('whatsapp'));
  assert.ok(!keys.includes('cvUrl'));
  assert.ok(!keys.includes('status'));
});
