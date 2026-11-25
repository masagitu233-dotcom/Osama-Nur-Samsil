import type { PortfolioBundle, PublicRoute } from '../types/portfolio';

export const DEFAULT_PRODUCTION_SITE_URL = 'https://osamanursamsil.netlify.app';
export const DEFAULT_OG_IMAGE_PATH = '/og-preview.jpg';
export const PORTFOLIO_OWNER_NAME = 'Osama Nur Samsil';
export const DARS_WITH_OSAMA_URL = 'https://darswithosama.netlify.app/';
export const YOUTUBE_CHANNEL_URL = 'https://youtube.com/@osamanursamsil7944';

export const HOME_SEO_TITLE = 'Osama Nur Samsil | Personal Portfolio';
export const HOME_SEO_DESCRIPTION =
  'Website portofolio Osama Nur Samsil, Sarjana Hukum Keluarga Universitas Muhammadiyah Makassar. Menampilkan profil, pengalaman organisasi, pendidikan, pelatihan, penelitian, serta karya dan pengembangan media pendidikan digital.';

export interface PublicRouteSeoConfig {
  route: Exclude<PublicRoute, '/admin'>;
  title: string;
  description: string;
  ogType: 'website' | 'profile';
  changefreq: 'weekly' | 'monthly';
  priority: string;
  pageName: string;
}

export const PUBLIC_SEO_ROUTES: ReadonlyArray<PublicRouteSeoConfig> = [
  {
    route: '/',
    title: HOME_SEO_TITLE,
    description: HOME_SEO_DESCRIPTION,
    ogType: 'website',
    changefreq: 'weekly',
    priority: '1.0',
    pageName: 'Beranda — Osama Nur Samsil',
  },
  {
    route: '/about',
    title: 'Tentang Osama Nur Samsil | Profil, Visi Misi & Minat Karier',
    description:
      'Profil lengkap Osama Nur Samsil, Sarjana Hukum Keluarga (Ahwal Syakhsiyah) Universitas Muhammadiyah Makassar, visi misi, nilai kerja, riwayat pendidikan, dan bidang karier yang diminati.',
    ogType: 'profile',
    changefreq: 'monthly',
    priority: '0.9',
    pageName: 'Tentang Osama Nur Samsil',
  },
  {
    route: '/experience',
    title: 'Pengalaman & Organisasi | Osama Nur Samsil',
    description:
      'Rekam jejak pengalaman pembinaan, pengajaran, kepemimpinan, dan kepanitiaan organisasi Osama Nur Samsil di lingkungan kampus, pesantren, dan masyarakat.',
    ogType: 'website',
    changefreq: 'monthly',
    priority: '0.8',
    pageName: 'Pengalaman & Organisasi — Osama Nur Samsil',
  },
  {
    route: '/education',
    title: 'Pendidikan & Penelitian | Osama Nur Samsil',
    description:
      'Riwayat pendidikan formal Hukum Keluarga (Ahwal Syakhsiyah) Universitas Muhammadiyah Makassar serta bidang studi, publikasi, dan minat penelitian Osama Nur Samsil.',
    ogType: 'website',
    changefreq: 'monthly',
    priority: '0.8',
    pageName: 'Pendidikan & Penelitian — Osama Nur Samsil',
  },
  {
    route: '/certificates',
    title: 'Sertifikat & Pelatihan | Osama Nur Samsil',
    description:
      'Arsip sertifikat dan ringkasan pelatihan nasional serta internasional yang diikuti oleh Osama Nur Samsil dalam pengembangan kompetensi akademik, teknologi, dan kepemimpinan.',
    ogType: 'website',
    changefreq: 'monthly',
    priority: '0.8',
    pageName: 'Sertifikat & Pelatihan — Osama Nur Samsil',
  },
  {
    route: '/skills',
    title: 'Keahlian, Bahasa & Minat | Osama Nur Samsil',
    description:
      'Daftar keahlian profesional Osama Nur Samsil mencakup Hukum Keluarga Islam, pengajaran, bahasa Arab dan Inggris, media digital, web, dan pemanfaatan perangkat AI.',
    ogType: 'website',
    changefreq: 'monthly',
    priority: '0.8',
    pageName: 'Keahlian & Minat — Osama Nur Samsil',
  },
  {
    route: '/projects',
    title: 'Proyek & Karya Digital — Dars with Osama | Osama Nur Samsil',
    description:
      'Katalog proyek website, media pendidikan digital Dars with Osama, serta kumpulan artikel dan tulisan ilmiah karya Osama Nur Samsil.',
    ogType: 'website',
    changefreq: 'weekly',
    priority: '0.9',
    pageName: 'Proyek & Karya Digital — Osama Nur Samsil',
  },
  {
    route: '/contact',
    title: 'Kontak & Kolaborasi | Osama Nur Samsil',
    description:
      'Hubungi Osama Nur Samsil untuk peluang kerja remote, freelance, full-time, kolaborasi pendidikan Islam digital, riset, dan administrasi profesional.',
    ogType: 'website',
    changefreq: 'monthly',
    priority: '0.7',
    pageName: 'Kontak — Osama Nur Samsil',
  },
];

export interface ResolvedSeoMeta {
  route: PublicRoute;
  title: string;
  description: string;
  canonicalUrl: string | null;
  robots: string;
  isIndexable: boolean;
  ogType: 'website' | 'profile';
  ogSiteName: string;
  ogLocale: string;
  ogTitle: string;
  ogDescription: string;
  ogUrl: string | null;
  ogImage: string;
  ogImageAlt: string;
  twitterCard: 'summary_large_image';
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
}

const PREVIEW_HOST_PATTERNS: RegExp[] = [
  /^localhost$/i,
  /^127\.0\.0\.1$/,
  /^0\.0\.0\.0$/,
  /\.run\.app$/i,
  /\.aistudio\./i,
  /\.webcontainer\./i,
  /^deploy-preview-\d+--/i,
  /^[a-f0-9]{24}--/i,
];

/**
 * Checks whether a hostname is a local/dev or ephemeral preview host that MUST NEVER
 * be emitted in canonical URLs, sitemaps, or structured data.
 */
export function isPreviewOrLocalHost(hostname: string): boolean {
  const clean = hostname.trim().toLowerCase();
  if (!clean) return true;
  return PREVIEW_HOST_PATTERNS.some((pattern) => pattern.test(clean));
}

/**
 * Normalizes an HTTP(S) origin string without trailing slash.
 * Returns null if invalid or if it points to a local/preview host.
 */
export function normalizeProductionOrigin(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    if (isPreviewOrLocalHost(parsed.hostname)) return null;
    // Enforce HTTPS for production canonical origins
    return `https://${parsed.host}`;
  } catch {
    return null;
  }
}

/**
 * Resolves the canonical production origin in priority order:
 * 1. Explicit env URL (VITE_SITE_URL or Netlify URL)
 * 2. Runtime browser origin (only if it is a real production host, never localhost/preview)
 * 3. Safe production fallback (DEFAULT_PRODUCTION_SITE_URL)
 */
export function resolveCanonicalOrigin(
  envUrl?: string | null,
  runtimeOrigin?: string | null
): string {
  const fromEnv = normalizeProductionOrigin(envUrl);
  if (fromEnv) return fromEnv;

  const fromRuntime = normalizeProductionOrigin(runtimeOrigin);
  if (fromRuntime) return fromRuntime;

  return DEFAULT_PRODUCTION_SITE_URL;
}

/**
 * Builds an absolute canonical URL for a public route.
 */
export function buildCanonicalUrl(siteOrigin: string, route: Exclude<PublicRoute, '/admin'>): string {
  const cleanOrigin = siteOrigin.replace(/\/+$/, '');
  if (route === '/') return `${cleanOrigin}/`;
  return `${cleanOrigin}${route}`;
}

/**
 * Resolves a crawler-safe absolute HTTPS image URL for og:image / twitter:image.
 * Rejects non-image HTML pages such as Google Drive `/file/d/.../view` links and
 * local bundler paths, falling back to `${siteOrigin}/og-preview.jpg`.
 */
export function resolveOgImageUrl(rawUrl: string | undefined | null, siteOrigin: string): string {
  const cleanOrigin = siteOrigin.replace(/\/+$/, '');
  const fallback = `${cleanOrigin}${DEFAULT_OG_IMAGE_PATH}`;

  if (!rawUrl || typeof rawUrl !== 'string') return fallback;
  const trimmed = rawUrl.trim();
  if (!trimmed) return fallback;

  // Google Drive /view pages return HTML, not an image file — use verified static OG preview image
  if (/drive\.google\.com\/file\/d\/[^/]+\/(view|preview)/i.test(trimmed)) {
    return fallback;
  }

  // Local source paths or relative assets resolve to our clean static public OG preview image
  if (trimmed.startsWith('/src/') || trimmed.startsWith('src/') || trimmed.startsWith('data:')) {
    return fallback;
  }

  if (trimmed.startsWith('/')) {
    return `${cleanOrigin}${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') return fallback;
    if (isPreviewOrLocalHost(parsed.hostname)) return fallback;
    // Ensure direct image extension or known direct image CDN
    if (/\.(jpe?g|png|webp|avif)(\?.*)?$/i.test(parsed.pathname)) {
      return parsed.toString();
    }
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Finds the SEO config for a public route.
 */
export function getPublicRouteSeoConfig(route: Exclude<PublicRoute, '/admin'>): PublicRouteSeoConfig {
  return PUBLIC_SEO_ROUTES.find((entry) => entry.route === route) || PUBLIC_SEO_ROUTES[0];
}

/**
 * Builds complete, unique, route-specific SEO metadata for any route including `/admin`.
 */
export function buildRouteSeoMeta(
  route: PublicRoute,
  bundle: Partial<PortfolioBundle> | null | undefined,
  siteOrigin: string
): ResolvedSeoMeta {
  const ogImage = resolveOgImageUrl(bundle?.siteSettings?.ogImageUrl, siteOrigin);
  const ownerName = bundle?.profile?.fullName?.trim() || PORTFOLIO_OWNER_NAME;

  if (route === '/admin') {
    return {
      route: '/admin',
      title: `Admin CMS | ${ownerName}`,
      description: 'Halaman pengelolaan konten internal portofolio. Tidak untuk diindeks oleh mesin pencari.',
      canonicalUrl: null,
      robots: 'noindex, nofollow, noarchive',
      isIndexable: false,
      ogType: 'website',
      ogSiteName: ownerName,
      ogLocale: 'id_ID',
      ogTitle: `Admin CMS | ${ownerName}`,
      ogDescription: 'Halaman pengelolaan konten internal portofolio.',
      ogUrl: null,
      ogImage,
      ogImageAlt: `Potret ${ownerName}`,
      twitterCard: 'summary_large_image',
      twitterTitle: `Admin CMS | ${ownerName}`,
      twitterDescription: 'Halaman pengelolaan konten internal portofolio.',
      twitterImage: ogImage,
    };
  }

  const routeConfig = getPublicRouteSeoConfig(route);
  const canonicalUrl = buildCanonicalUrl(siteOrigin, route);

  return {
    route,
    title: routeConfig.title,
    description: routeConfig.description,
    canonicalUrl,
    robots: 'index, follow, max-image-preview:large, max-snippet:-1',
    isIndexable: true,
    ogType: routeConfig.ogType,
    ogSiteName: ownerName,
    ogLocale: 'id_ID',
    ogTitle: routeConfig.title,
    ogDescription: routeConfig.description,
    ogUrl: canonicalUrl,
    ogImage,
    ogImageAlt: `Foto profil ${ownerName} — Personal Portfolio`,
    twitterCard: 'summary_large_image',
    twitterTitle: routeConfig.title,
    twitterDescription: routeConfig.description,
    twitterImage: ogImage,
  };
}

/**
 * Cleans and validates a public profile URL for Schema.org `sameAs`.
 * Strips noisy tracking query parameters (such as `?si=...` on YouTube) and rejects placeholders.
 */
export function sanitizeSameAsUrl(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    if (isPreviewOrLocalHost(parsed.hostname)) return null;
    // Strip tracking params like YouTube `si`
    parsed.searchParams.delete('si');
    parsed.searchParams.delete('utm_source');
    parsed.searchParams.delete('utm_medium');
    parsed.searchParams.delete('utm_campaign');
    const normalized = `https://${parsed.host}${parsed.pathname}${parsed.search}`;
    return normalized.endsWith('/') && parsed.pathname === '/' ? normalized : normalized.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

/**
 * Collects strictly verified, real public URLs owned by Osama Nur Samsil for `Person.sameAs`.
 */
export function collectVerifiedSameAs(bundle?: Partial<PortfolioBundle> | null): string[] {
  const candidates: Array<string | null | undefined> = [
    DARS_WITH_OSAMA_URL,
    YOUTUBE_CHANNEL_URL,
    bundle?.contacts?.websiteUrl,
    bundle?.contacts?.linkedinUrl,
    bundle?.contacts?.githubUrl,
    bundle?.contacts?.instagramUrl,
  ];

  const unique = new Set<string>();
  for (const raw of candidates) {
    const clean = sanitizeSameAsUrl(raw);
    if (clean) unique.add(clean);
  }
  return Array.from(unique);
}

/**
 * Generates valid Schema.org JSON-LD (`@graph` with `Person`, `WebSite`, and route `WebPage`)
 * using strictly verified facts about Osama Nur Samsil.
 */
export function buildStructuredDataGraph(
  route: Exclude<PublicRoute, '/admin'>,
  bundle: Partial<PortfolioBundle> | null | undefined,
  siteOrigin: string
): Record<string, unknown> {
  const cleanOrigin = siteOrigin.replace(/\/+$/, '');
  const homeUrl = `${cleanOrigin}/`;
  const routeConfig = getPublicRouteSeoConfig(route);
  const pageUrl = buildCanonicalUrl(cleanOrigin, route);
  const ogImage = resolveOgImageUrl(bundle?.siteSettings?.ogImageUrl, cleanOrigin);
  const ownerName = bundle?.profile?.fullName?.trim() || PORTFOLIO_OWNER_NAME;
  const sameAs = collectVerifiedSameAs(bundle);

  const personId = `${homeUrl}#person`;
  const websiteId = `${homeUrl}#website`;
  const pageId = `${pageUrl}#webpage`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': personId,
        name: ownerName,
        url: homeUrl,
        image: ogImage,
        description: HOME_SEO_DESCRIPTION,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Makassar',
          addressRegion: 'Sulawesi Selatan',
          addressCountry: 'ID',
        },
        alumniOf: {
          '@type': 'CollegeOrUniversity',
          name: 'Universitas Muhammadiyah Makassar',
        },
        hasCredential: {
          '@type': 'EducationalOccupationalCredential',
          credentialCategory: 'degree',
          educationalLevel: 'Sarjana (S1)',
          about: 'Hukum Keluarga (Ahwal Syakhsiyah)',
          recognizedBy: {
            '@type': 'CollegeOrUniversity',
            name: 'Universitas Muhammadiyah Makassar',
          },
        },
        knowsAbout: [
          'Hukum Keluarga Islam (Ahwal Syakhsiyah)',
          'Pendidikan Islam Digital',
          'Pengajaran & Pembinaan Mahasiswa',
          'Penelitian & Penulisan Ilmiah',
          'Pengembangan Media Pendidikan Digital',
        ],
        sameAs,
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        name: HOME_SEO_TITLE,
        alternateName: ownerName,
        url: homeUrl,
        inLanguage: 'id-ID',
        description: HOME_SEO_DESCRIPTION,
        author: { '@id': personId },
        publisher: { '@id': personId },
      },
      {
        '@type': route === '/about' ? 'ProfilePage' : 'WebPage',
        '@id': pageId,
        url: pageUrl,
        name: routeConfig.title,
        description: routeConfig.description,
        inLanguage: 'id-ID',
        isPartOf: { '@id': websiteId },
        about: { '@id': personId },
        mainEntity: { '@id': personId },
      },
    ],
  };
}

/**
 * Generates standards-compliant XML Sitemap containing ONLY verified public routes.
 */
export function generateSitemapXml(siteOrigin: string, lastmod?: string): string {
  const cleanOrigin = siteOrigin.replace(/\/+$/, '');
  const isoDate = lastmod || new Date().toISOString().slice(0, 10);

  const urlNodes = PUBLIC_SEO_ROUTES.map((entry) => {
    const loc = buildCanonicalUrl(cleanOrigin, entry.route);
    return [
      '  <url>',
      `    <loc>${loc}</loc>`,
      `    <lastmod>${isoDate}</lastmod>`,
      `    <changefreq>${entry.changefreq}</changefreq>`,
      `    <priority>${entry.priority}</priority>`,
      '  </url>',
    ].join('\n');
  }).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlNodes,
    '</urlset>',
    '',
  ].join('\n');
}

/**
 * Generates standards-compliant robots.txt allowing public pages and assets,
 * disallowing admin/internal function routes, and referencing the production sitemap.
 */
export function generateRobotsTxt(siteOrigin: string): string {
  const cleanOrigin = siteOrigin.replace(/\/+$/, '');
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /admin/',
    'Disallow: /.netlify/functions/',
    '',
    `Sitemap: ${cleanOrigin}/sitemap.xml`,
    '',
  ].join('\n');
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Injects route-specific SEO tags (title, description, robots, canonical, OG, Twitter, JSON-LD)
 * into a built HTML template for static per-route HTML generation.
 */
export function renderRouteHtmlWithSeo(
  baseHtml: string,
  route: PublicRoute,
  siteOrigin: string
): string {
  const meta = buildRouteSeoMeta(route, null, siteOrigin);
  const structuredData =
    route === '/admin' ? null : buildStructuredDataGraph(route, null, siteOrigin);

  const headSeoBlock = [
    `    <title>${escapeHtmlAttr(meta.title)}</title>`,
    `    <meta name="description" content="${escapeHtmlAttr(meta.description)}" />`,
    `    <meta name="robots" content="${escapeHtmlAttr(meta.robots)}" />`,
    meta.canonicalUrl
      ? `    <link rel="canonical" href="${escapeHtmlAttr(meta.canonicalUrl)}" />`
      : null,
    `    <meta property="og:type" content="${escapeHtmlAttr(meta.ogType)}" />`,
    `    <meta property="og:locale" content="${escapeHtmlAttr(meta.ogLocale)}" />`,
    `    <meta property="og:site_name" content="${escapeHtmlAttr(meta.ogSiteName)}" />`,
    `    <meta property="og:title" content="${escapeHtmlAttr(meta.ogTitle)}" />`,
    `    <meta property="og:description" content="${escapeHtmlAttr(meta.ogDescription)}" />`,
    meta.ogUrl
      ? `    <meta property="og:url" content="${escapeHtmlAttr(meta.ogUrl)}" />`
      : null,
    `    <meta property="og:image" content="${escapeHtmlAttr(meta.ogImage)}" />`,
    `    <meta property="og:image:alt" content="${escapeHtmlAttr(meta.ogImageAlt)}" />`,
    `    <meta name="twitter:card" content="${escapeHtmlAttr(meta.twitterCard)}" />`,
    `    <meta name="twitter:title" content="${escapeHtmlAttr(meta.twitterTitle)}" />`,
    `    <meta name="twitter:description" content="${escapeHtmlAttr(meta.twitterDescription)}" />`,
    `    <meta name="twitter:image" content="${escapeHtmlAttr(meta.twitterImage)}" />`,
    structuredData
      ? `    <script id="portfolio-jsonld" type="application/ld+json">\n${JSON.stringify(
          structuredData,
          null,
          2
        )}\n    </script>`
      : null,
  ]
    .filter(Boolean)
    .join('\n');

  const markerRegex = /<!-- SEO_HEAD_START -->[\s\S]*?<!-- SEO_HEAD_END -->/;
  if (markerRegex.test(baseHtml)) {
    return baseHtml.replace(
      markerRegex,
      `<!-- SEO_HEAD_START -->\n${headSeoBlock}\n    <!-- SEO_HEAD_END -->`
    );
  }

  return baseHtml.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<!-- SEO_HEAD_START -->\n${headSeoBlock}\n    <!-- SEO_HEAD_END -->`
  );
}
