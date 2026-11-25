import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PRODUCTION_SITE_URL,
  DARS_WITH_OSAMA_URL,
  HOME_SEO_DESCRIPTION,
  HOME_SEO_TITLE,
  PUBLIC_SEO_ROUTES,
  YOUTUBE_CHANNEL_URL,
  buildRouteSeoMeta,
  buildStructuredDataGraph,
  generateRobotsTxt,
  generateSitemapXml,
  isPreviewOrLocalHost,
  renderRouteHtmlWithSeo,
  resolveCanonicalOrigin,
  resolveOgImageUrl,
  sanitizeSameAsUrl,
} from './seo';
import { normalizeRoute } from './router';

test('all 8 public routes have unique titles and descriptions without duplication', () => {
  assert.equal(PUBLIC_SEO_ROUTES.length, 8);
  const titles = new Set<string>();
  const descriptions = new Set<string>();

  for (const item of PUBLIC_SEO_ROUTES) {
    assert.ok(item.title.length >= 25, `Title too short for ${item.route}`);
    assert.ok(item.description.length >= 80, `Description too short for ${item.route}`);
    assert.equal(titles.has(item.title), false, `Duplicate title found: ${item.title}`);
    assert.equal(
      descriptions.has(item.description),
      false,
      `Duplicate description found for ${item.route}`
    );
    titles.add(item.title);
    descriptions.add(item.description);
  }

  const home = buildRouteSeoMeta('/', null, DEFAULT_PRODUCTION_SITE_URL);
  assert.equal(home.title, HOME_SEO_TITLE);
  assert.equal(home.description, HOME_SEO_DESCRIPTION);
  assert.equal(home.canonicalUrl, `${DEFAULT_PRODUCTION_SITE_URL}/`);
  assert.equal(home.isIndexable, true);
  assert.match(home.robots, /index,\s*follow/);
});

test('/admin route enforces noindex, nofollow, noarchive and omits canonical URL', () => {
  const adminMeta = buildRouteSeoMeta('/admin', null, 'https://osamanursamsil.netlify.app');
  assert.equal(adminMeta.isIndexable, false);
  assert.equal(adminMeta.robots, 'noindex, nofollow, noarchive');
  assert.equal(adminMeta.canonicalUrl, null);
  assert.equal(adminMeta.ogUrl, null);
});

test('resolveCanonicalOrigin rejects localhost and AI Studio preview URLs', () => {
  assert.equal(isPreviewOrLocalHost('localhost'), true);
  assert.equal(isPreviewOrLocalHost('127.0.0.1'), true);
  assert.equal(isPreviewOrLocalHost('ais-dev-abc123.asia-southeast1.run.app'), true);
  assert.equal(isPreviewOrLocalHost('osamanursamsil.netlify.app'), false);

  assert.equal(
    resolveCanonicalOrigin('', 'https://ais-dev-xyz.asia-southeast1.run.app'),
    DEFAULT_PRODUCTION_SITE_URL
  );
  assert.equal(
    resolveCanonicalOrigin('', 'http://localhost:3000'),
    DEFAULT_PRODUCTION_SITE_URL
  );
  assert.equal(
    resolveCanonicalOrigin('https://custom-portfolio.netlify.app/', 'http://localhost:3000'),
    'https://custom-portfolio.netlify.app'
  );
  assert.equal(
    resolveCanonicalOrigin('', 'https://osama-portfolio.netlify.app'),
    'https://osama-portfolio.netlify.app'
  );
});

test('resolveOgImageUrl rejects Google Drive HTML /view links and falls back to static /og-preview.jpg', () => {
  const origin = 'https://osamanursamsil.netlify.app';
  assert.equal(
    resolveOgImageUrl(
      'https://drive.google.com/file/d/1nTujdaLHPcja7gU43PcxI11kjBjXuCfu/view?usp=drivesdk',
      origin
    ),
    `${origin}/og-preview.jpg`
  );
  assert.equal(
    resolveOgImageUrl('/src/assets/images/hero_osama_portrait_1795494774895.jpg', origin),
    `${origin}/og-preview.jpg`
  );
  assert.equal(
    resolveOgImageUrl('https://cdn.example.com/osama-card.jpg', origin),
    'https://cdn.example.com/osama-card.jpg'
  );
});

test('generateSitemapXml includes all 8 public routes and strictly excludes /admin and preview hosts', () => {
  const origin = 'https://osamanursamsil.netlify.app';
  const xml = generateSitemapXml(origin, '2026-11-25');

  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(xml.includes('<loc>https://osamanursamsil.netlify.app/</loc>'));
  assert.ok(xml.includes('<loc>https://osamanursamsil.netlify.app/about</loc>'));
  assert.ok(xml.includes('<loc>https://osamanursamsil.netlify.app/experience</loc>'));
  assert.ok(xml.includes('<loc>https://osamanursamsil.netlify.app/education</loc>'));
  assert.ok(xml.includes('<loc>https://osamanursamsil.netlify.app/certificates</loc>'));
  assert.ok(xml.includes('<loc>https://osamanursamsil.netlify.app/skills</loc>'));
  assert.ok(xml.includes('<loc>https://osamanursamsil.netlify.app/projects</loc>'));
  assert.ok(xml.includes('<loc>https://osamanursamsil.netlify.app/contact</loc>'));

  const locMatches = xml.match(/<loc>/g) || [];
  assert.equal(locMatches.length, 8);
  assert.equal(xml.includes('/admin'), false);
  assert.equal(xml.includes('run.app'), false);
  assert.equal(xml.includes('localhost'), false);
});

test('generateRobotsTxt allows crawling /admin so crawlers can read noindex, disallows functions, and declares Sitemap', () => {
  const origin = 'https://osamanursamsil.netlify.app';
  const txt = generateRobotsTxt(origin);

  assert.ok(txt.includes('User-agent: *'));
  assert.ok(txt.includes('Allow: /'));
  assert.equal(txt.includes('Disallow: /admin'), false);
  assert.ok(txt.includes('Disallow: /.netlify/functions/'));
  assert.ok(txt.includes(`Sitemap: ${origin}/sitemap.xml`));
});

test('normalizeRoute handles /admin, /admin/, and /admin/* subpaths consistently', () => {
  assert.equal(normalizeRoute('/admin'), '/admin');
  assert.equal(normalizeRoute('/admin/'), '/admin');
  assert.equal(normalizeRoute('/admin///'), '/admin');
  assert.equal(normalizeRoute('/admin/login'), '/admin');
});

test('buildStructuredDataGraph outputs valid Person + WebSite + WebPage JSON-LD with verified sameAs only', () => {
  const origin = 'https://osamanursamsil.netlify.app';
  const graphDoc = buildStructuredDataGraph(
    '/',
    {
      contacts: {
        id: 'main',
        email: 'osama@example.com',
        whatsapp: '',
        whatsappLabel: '',
        linkedinUrl: 'https://www.linkedin.com/in/osamanursamsil/',
        githubUrl: '',
        instagramUrl: '',
        websiteUrl: 'https://darswithosama.netlify.app/',
        availabilityNote: '',
        status: 'published',
        isVisible: true,
      },
    },
    origin
  );

  const graph = graphDoc['@graph'] as Array<Record<string, unknown>>;
  assert.equal(graphDoc['@context'], 'https://schema.org');
  assert.equal(graph.length, 3);

  const person = graph.find((node) => node['@type'] === 'Person');
  const website = graph.find((node) => node['@type'] === 'WebSite');
  const webpage = graph.find((node) => node['@type'] === 'WebPage');

  assert.ok(person);
  assert.ok(website);
  assert.ok(webpage);
  assert.equal(person.name, 'Osama Nur Samsil');
  assert.equal(person.url, `${origin}/`);
  assert.deepEqual(person.alumniOf, {
    '@type': 'CollegeOrUniversity',
    name: 'Universitas Muhammadiyah Makassar',
  });

  const sameAs = person.sameAs as string[];
  assert.ok(sameAs.includes(DARS_WITH_OSAMA_URL));
  assert.ok(sameAs.includes(YOUTUBE_CHANNEL_URL));
  assert.ok(sameAs.includes('https://www.linkedin.com/in/osamanursamsil'));
  assert.equal(sameAs.some((u) => u.includes('?si=')), false);
  assert.equal(website.name, HOME_SEO_TITLE);
});

test('sanitizeSameAsUrl strips tracking params and rejects local/preview hosts', () => {
  assert.equal(
    sanitizeSameAsUrl('https://youtube.com/@osamanursamsil7944?si=VEI61UiF0i15evrb'),
    'https://youtube.com/@osamanursamsil7944'
  );
  assert.equal(sanitizeSameAsUrl('http://localhost:3000/test'), null);
  assert.equal(sanitizeSameAsUrl(''), null);
});

test('renderRouteHtmlWithSeo injects unique route head metadata and protects /admin with noindex', () => {
  const template = `<!doctype html><html><head><!-- SEO_HEAD_START --><title>Old</title><!-- SEO_HEAD_END --></head><body></body></html>`;
  const origin = 'https://osamanursamsil.netlify.app';

  const aboutHtml = renderRouteHtmlWithSeo(template, '/about', origin);
  assert.ok(aboutHtml.includes('<title>Tentang Osama Nur Samsil | Profil, Visi Misi &amp; Minat Karier</title>'));
  assert.ok(aboutHtml.includes('<link rel="canonical" href="https://osamanursamsil.netlify.app/about" />'));
  assert.ok(aboutHtml.includes('application/ld+json'));
  assert.ok(aboutHtml.includes('index, follow'));

  const adminHtml = renderRouteHtmlWithSeo(template, '/admin', origin);
  assert.ok(adminHtml.includes('<meta name="robots" content="noindex, nofollow, noarchive" />'));
  assert.equal(adminHtml.includes('rel="canonical"'), false);
  assert.equal(adminHtml.includes('application/ld+json'), false);
});
