import test from 'node:test';
import assert from 'node:assert/strict';
import type { ProjectItem } from '../types/portfolio';
import {
  ACTIVE_PROJECT_TABS,
  DARS_PLATFORM_URL,
  filterManualArticleProjects,
  filterWebsiteProjectsByQuery,
  hasCustomUploadedDarsAsset,
  isDarsPlatformProject,
  normalizeProjectCategory,
  prepareWebsiteProjects,
  resolveProjectPrimaryPhoto,
} from './projectsCatalog';

const baseMeta = {
  status: 'published' as const,
  isVisible: true,
  displayOrder: 1,
  period: '2026',
  description: 'Deskripsi proyek',
  documentation: '',
  liveUrl: 'https://example.com',
  repoUrl: '',
  imageUrls: [],
  featured: false,
};

test('ACTIVE_PROJECT_TABS contains strictly the 3 requested categories', () => {
  assert.deepEqual(
    ACTIVE_PROJECT_TABS.map((t) => t.label),
    ['Semua Karya', 'Website & Digital', 'Artikel & Tulisan']
  );
});

test('normalizeProjectCategory maps legacy removed categories safely without losing data', () => {
  assert.equal(normalizeProjectCategory('dars_with_osama'), 'website_digital');
  assert.equal(normalizeProjectCategory('website_digital'), 'website_digital');
  assert.equal(normalizeProjectCategory('learning_material'), 'website_digital');
  assert.equal(normalizeProjectCategory('design_media'), 'website_digital');
  assert.equal(normalizeProjectCategory('other'), 'website_digital');
  assert.equal(normalizeProjectCategory('article_writing'), 'article_writing');
});

test('prepareWebsiteProjects injects Dars with Osama platform card when Firestore projects is empty', () => {
  const result = prepareWebsiteProjects([]);
  assert.equal(result.length, 1);
  assert.equal(result[0].title, 'Dars with Osama');
  assert.equal(result[0].category, 'website_digital');
  assert.equal(result[0].liveUrl, DARS_PLATFORM_URL);
});

test('prepareWebsiteProjects preserves saved Firestore Dars project and legacy non-article projects without duplicating Dars', () => {
  const saved: ProjectItem[] = [
    {
      ...baseMeta,
      id: 'proj_dars_custom',
      title: 'Dars with Osama',
      category: 'dars_with_osama',
      description: 'Deskripsi tersimpan dari admin',
      liveUrl: 'https://darswithosama.netlify.app/',
      imageUrls: ['https://drive.google.com/file/d/customlogo12345/view'],
      displayOrder: 1,
    },
    {
      ...baseMeta,
      id: 'proj_legacy_design',
      title: 'Desain Poster Kajian',
      category: 'design_media',
      displayOrder: 2,
    },
    {
      ...baseMeta,
      id: 'proj_article_manual',
      title: 'Artikel Manual',
      category: 'article_writing',
      displayOrder: 3,
    },
  ];

  const websiteProjects = prepareWebsiteProjects(saved);
  assert.equal(websiteProjects.length, 2);
  assert.equal(websiteProjects[0].id, 'proj_dars_custom');
  assert.equal(websiteProjects[0].category, 'website_digital');
  assert.equal(hasCustomUploadedDarsAsset(websiteProjects[0]), true);
  assert.equal(websiteProjects[1].id, 'proj_legacy_design');
  assert.equal(websiteProjects[1].category, 'website_digital');

  const manualArticles = filterManualArticleProjects(saved, '');
  assert.equal(manualArticles.length, 1);
  assert.equal(manualArticles[0].id, 'proj_article_manual');
});

test('isDarsPlatformProject does not mistake individual article links for the platform card', () => {
  assert.equal(
    isDarsPlatformProject({
      id: 'art-1',
      title: 'Cairan Kewanitaan',
      liveUrl: 'https://darswithosama.netlify.app/article/cairan-kewanitaan',
      category: 'article_writing',
    }),
    false
  );
  assert.equal(filterWebsiteProjectsByQuery(prepareWebsiteProjects([]), 'keislaman').length, 1);
});

test('resolveProjectPrimaryPhoto prioritizes primaryImageUrl, skips empty slots, and preserves Drive URLs', () => {
  assert.equal(
    resolveProjectPrimaryPhoto({
      primaryImageUrl: 'https://drive.google.com/file/d/primary123/view',
      imageUrls: ['https://drive.google.com/file/d/other456/view'],
    }),
    'https://drive.google.com/file/d/primary123/view'
  );
  assert.equal(
    resolveProjectPrimaryPhoto({
      imageUrls: ['   ', 'https://drive.google.com/file/d/second789/view?usp=drive_link'],
    }),
    'https://drive.google.com/file/d/second789/view?usp=drive_link'
  );
  assert.equal(resolveProjectPrimaryPhoto({ imageUrls: [] }), '');
});
