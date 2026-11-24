import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDarsArticleUrl,
  extractDarsCategories,
  filterDarsPublications,
  formatPublicationDateId,
  normalizeDarsCategoryLabel,
  paginateDarsPublications,
  parseDarsFirestoreRunQueryResponse,
} from './darsPublications';

test('buildDarsArticleUrl points to exact original article page on Dars with Osama', () => {
  assert.equal(
    buildDarsArticleUrl('cairan-kewanitaan-dalam-fikih-thaharah', 'post-123'),
    'https://darswithosama.netlify.app/article/cairan-kewanitaan-dalam-fikih-thaharah'
  );
  assert.equal(
    buildDarsArticleUrl('', 'post-123'),
    'https://darswithosama.netlify.app/?view=blog-detail&id=post-123'
  );
});

test('normalizeDarsCategoryLabel formats Indonesian academic categories cleanly', () => {
  assert.equal(normalizeDarsCategoryLabel('ushul fikih'), 'Ushul Fikih');
  assert.equal(normalizeDarsCategoryLabel('sejarah dan sosiologi'), 'Sejarah dan Sosiologi');
  assert.equal(normalizeDarsCategoryLabel('Kajian Umum'), 'Kajian Umum');
  assert.equal(normalizeDarsCategoryLabel(''), '');
});

test('parseDarsFirestoreRunQueryResponse keeps only published articles, excludes drafts/retired seeds, and sorts newest first', () => {
  const rows = [
    {
      document: {
        name: 'projects/p/databases/d/documents/blogPosts/post-old',
        fields: {
          title: { stringValue: 'Artikel Lama' },
          slug: { stringValue: 'artikel-lama' },
          status: { stringValue: 'published' },
          category: { stringValue: 'nahwu' },
          publishedAt: { stringValue: '2026-10-17T08:51:08.636Z' },
          coverImageUrl: { stringValue: 'https://drive.google.com/file/d/abc123456789/view?usp=drive_link' },
        },
      },
    },
    {
      document: {
        name: 'projects/p/databases/d/documents/blogPosts/post-draft',
        fields: {
          title: { stringValue: 'Draft Rahasia' },
          slug: { stringValue: 'draft-rahasia' },
          status: { stringValue: 'draft' },
          publishedAt: { stringValue: '2026-11-25T00:00:00.000Z' },
        },
      },
    },
    {
      document: {
        name: 'projects/p/databases/d/documents/blogPosts/post-1',
        fields: {
          title: { stringValue: 'Seed Lama' },
          slug: { stringValue: 'menuntut-ilmu-syari-keutamaan-niat-dan-adab' },
          status: { stringValue: 'published' },
          createdAt: { stringValue: '2026-10-01T00:00:00.000Z' },
          updatedAt: { stringValue: '2026-10-01T00:00:00.000Z' },
        },
      },
    },
    {
      document: {
        name: 'projects/p/databases/d/documents/blogPosts/post-newest',
        fields: {
          title: { stringValue: 'Hukum Mendonasikan Rambut untuk Penderita Kanker' },
          slug: { stringValue: 'hukum-mendonasikan-rambut-untuk-penderita-kanker' },
          status: { stringValue: 'published' },
          category: { stringValue: 'fikih' },
          publishedAt: { stringValue: '2026-11-20T12:53:51.389Z' },
          coverImageUrl: { stringValue: 'https://drive.google.com/file/d/xyz987654321/view' },
        },
      },
    },
  ];

  const result = parseDarsFirestoreRunQueryResponse(rows);
  assert.equal(result.length, 2);
  assert.equal(result[0].id, 'post-newest');
  assert.equal(result[0].category, 'Fikih');
  assert.equal(
    result[0].url,
    'https://darswithosama.netlify.app/article/hukum-mendonasikan-rambut-untuk-penderita-kanker'
  );
  assert.equal(result[1].id, 'post-old');
  assert.equal(result[1].category, 'Nahwu');
});

test('filter, categories, date formatting, and pagination work deterministically', () => {
  const rows = [
    {
      document: {
        name: 'projects/p/databases/d/documents/blogPosts/a1',
        fields: {
          title: { stringValue: 'Artikel Fikih Satu' },
          slug: { stringValue: 'artikel-fikih-satu' },
          status: { stringValue: 'published' },
          category: { stringValue: 'fikih' },
          publishedAt: { stringValue: '2026-11-20T10:00:00.000Z' },
        },
      },
    },
    {
      document: {
        name: 'projects/p/databases/d/documents/blogPosts/a2',
        fields: {
          title: { stringValue: 'Artikel Nahwu Dua' },
          slug: { stringValue: 'artikel-nahwu-dua' },
          status: { stringValue: 'published' },
          category: { stringValue: 'nahwu' },
          publishedAt: { stringValue: '2026-11-18T10:00:00.000Z' },
        },
      },
    },
    {
      document: {
        name: 'projects/p/databases/d/documents/blogPosts/a3',
        fields: {
          title: { stringValue: 'Artikel Fikih Tiga' },
          slug: { stringValue: 'artikel-fikih-tiga' },
          status: { stringValue: 'published' },
          category: { stringValue: 'fikih' },
          publishedAt: { stringValue: '2026-11-15T10:00:00.000Z' },
        },
      },
    },
  ];

  const items = parseDarsFirestoreRunQueryResponse(rows);
  assert.deepEqual(extractDarsCategories(items), ['Fikih', 'Nahwu']);
  assert.equal(filterDarsPublications(items, 'Fikih', '').length, 2);
  assert.equal(filterDarsPublications(items, 'all', 'nahwu').length, 1);

  const page = paginateDarsPublications(items, 2);
  assert.equal(page.visibleItems.length, 2);
  assert.equal(page.hasMore, true);
  assert.equal(page.remainingCount, 1);

  const formatted = formatPublicationDateId('2026-11-20T12:53:51.389Z');
  assert.match(formatted, /2026/);
});
