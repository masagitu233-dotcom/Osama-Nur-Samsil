export const DARS_SITE_BASE_URL = 'https://darswithosama.netlify.app';
export const DARS_FIREBASE_PROJECT_ID = 'premium-generator-4lxdt';
export const DARS_FIRESTORE_DATABASE_ID =
  'ai-studio-remixdarswithosa-978e37b7-a164-496c-8e6a-39738edc5d93';
export const DARS_ARTICLES_COLLECTION = 'blogPosts';

export interface DarsPublicationItem {
  id: string;
  title: string;
  slug: string;
  url: string;
  coverImageUrl: string;
  category: string;
  publishedAt: string;
  publishedTimestamp: number;
  updatedAt?: string;
  authorName?: string;
  readingTimeMinutes?: number;
}

export interface FirestoreRestFieldValue {
  stringValue?: string;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
  timestampValue?: string;
  nullValue?: null;
}

export interface FirestoreRestDocument {
  name?: string;
  fields?: Record<string, FirestoreRestFieldValue>;
  createTime?: string;
  updateTime?: string;
}

export interface FirestoreRunQueryRow {
  document?: FirestoreRestDocument;
  readTime?: string;
}

/**
 * Legacy seed posts filtered out by Dars with Osama itself unless explicitly modified by the owner.
 */
const RETIRED_SEED_IDS = new Set(['post-1', 'post-2', 'post-3']);
const RETIRED_SEED_SLUGS = new Set([
  'menuntut-ilmu-syari-keutamaan-niat-dan-adab',
  'panduan-tadabbur-al-quran-memahami-makna-dan-renungan',
  'panduan-tadabbur-al-quran-memahami-makna-ayat',
  'urgensi-mempelajari-bahasa-arab-dan-ilmu-nahwu',
]);

const LOWERCASE_CONNECTORS = new Set(['dan', 'di', 'ke', 'dari', 'yang', 'untuk', 'pada', 'atau', 'dalam']);

export function buildDarsArticleUrl(slug?: string, id?: string): string {
  const cleanSlug = (slug || '').trim().replace(/^\/+|\/+$/g, '');
  if (cleanSlug) {
    return `${DARS_SITE_BASE_URL}/article/${encodeURIComponent(cleanSlug)}`;
  }
  const cleanId = (id || '').trim();
  if (cleanId) {
    return `${DARS_SITE_BASE_URL}/?view=blog-detail&id=${encodeURIComponent(cleanId)}`;
  }
  return `${DARS_SITE_BASE_URL}/?view=blog`;
}

export function normalizeDarsCategoryLabel(raw?: string): string {
  const cleaned = (raw || '').trim().replace(/\s+/g, ' ');
  if (!cleaned) return '';

  return cleaned
    .split(' ')
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && LOWERCASE_CONNECTORS.has(lower)) {
        return lower;
      }
      if (word.length <= 3 && word === word.toUpperCase()) {
        return word;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

export function parseIsoTimestamp(raw?: string): number {
  if (!raw) return 0;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : 0;
}

export function formatPublicationDateId(isoDate?: string): string {
  const ms = parseIsoTimestamp(isoDate);
  if (!ms) return '';

  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Makassar',
    }).format(new Date(ms));
  } catch {
    return new Date(ms).toISOString().slice(0, 10);
  }
}

export function isRetiredDarsSeedPost(input: {
  id: string;
  slug: string;
  isUserModified?: boolean;
  isCustomPost?: boolean;
  createdAt?: string;
  updatedAt?: string;
}): boolean {
  if (input.isUserModified || input.isCustomPost) return false;
  const normalizedId = input.id.trim();
  const normalizedSlug = input.slug.trim().toLowerCase();
  const matchesSeed = RETIRED_SEED_IDS.has(normalizedId) || RETIRED_SEED_SLUGS.has(normalizedSlug);
  if (!matchesSeed) return false;
  return !(input.updatedAt && input.createdAt && input.updatedAt !== input.createdAt);
}

function readString(fields: Record<string, FirestoreRestFieldValue>, key: string): string {
  const val = fields[key];
  if (!val) return '';
  if (typeof val.stringValue === 'string') return val.stringValue.trim();
  if (typeof val.timestampValue === 'string') return val.timestampValue.trim();
  return '';
}

function readBoolean(fields: Record<string, FirestoreRestFieldValue>, key: string): boolean {
  return fields[key]?.booleanValue === true;
}

function readNumber(fields: Record<string, FirestoreRestFieldValue>, key: string): number | undefined {
  const val = fields[key];
  if (!val) return undefined;
  if (typeof val.doubleValue === 'number' && Number.isFinite(val.doubleValue)) {
    return val.doubleValue;
  }
  if (typeof val.integerValue === 'string' && val.integerValue.trim()) {
    const parsed = Number(val.integerValue);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function extractDocumentId(name?: string): string {
  if (!name) return '';
  const parts = name.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

export function parseDarsFirestoreRunQueryResponse(rows: unknown): DarsPublicationItem[] {
  if (!Array.isArray(rows)) return [];

  const parsed: DarsPublicationItem[] = [];
  const seenIds = new Set<string>();

  for (const row of rows as FirestoreRunQueryRow[]) {
    const doc = row?.document;
    if (!doc || !doc.fields) continue;

    const fields = doc.fields;
    const status = readString(fields, 'status').toLowerCase();
    if (status !== 'published') continue;

    // Respect optional soft-delete/visibility flags if ever introduced in source DB
    if (readBoolean(fields, 'isDeleted') || fields.isVisible?.booleanValue === false) {
      continue;
    }

    const id = extractDocumentId(doc.name) || readString(fields, 'id');
    const title = readString(fields, 'title');
    if (!id || !title || seenIds.has(id)) continue;

    const slug = readString(fields, 'slug');
    const createdAt = readString(fields, 'createdAt') || doc.createTime || '';
    const updatedAt = readString(fields, 'updatedAt') || doc.updateTime || '';
    const isUserModified = readBoolean(fields, 'isUserModified');
    const isCustomPost = readBoolean(fields, 'isCustomPost');

    if (
      isRetiredDarsSeedPost({
        id,
        slug,
        isUserModified,
        isCustomPost,
        createdAt,
        updatedAt,
      })
    ) {
      continue;
    }

    const publishedAt = readString(fields, 'publishedAt') || createdAt;
    const publishedTimestamp = parseIsoTimestamp(publishedAt) || parseIsoTimestamp(createdAt);
    const coverImageUrl =
      readString(fields, 'coverImageUrl') ||
      readString(fields, 'coverImage') ||
      readString(fields, 'thumbnailUrl');
    const category = normalizeDarsCategoryLabel(
      readString(fields, 'category') || readString(fields, 'categoryName') || readString(fields, 'genre')
    );
    const authorName = readString(fields, 'authorName') || undefined;
    const readingTimeMinutes = readNumber(fields, 'readingTimeMinutes');

    seenIds.add(id);
    parsed.push({
      id,
      title,
      slug,
      url: buildDarsArticleUrl(slug, id),
      coverImageUrl,
      category,
      publishedAt,
      publishedTimestamp,
      updatedAt: updatedAt || undefined,
      authorName,
      readingTimeMinutes,
    });
  }

  return parsed.sort((a, b) => {
    if (b.publishedTimestamp !== a.publishedTimestamp) {
      return b.publishedTimestamp - a.publishedTimestamp;
    }
    return a.title.localeCompare(b.title, 'id');
  });
}

export function extractDarsCategories(items: DarsPublicationItem[]): string[] {
  return Array.from(new Set(items.map((item) => item.category).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, 'id')
  );
}

export function filterDarsPublications(
  items: DarsPublicationItem[],
  category: string,
  query: string
): DarsPublicationItem[] {
  const normalizedCategory = category.trim().toLowerCase();
  const normalizedQuery = query.trim().toLowerCase();

  return items.filter((item) => {
    const matchesCategory =
      !normalizedCategory ||
      normalizedCategory === 'all' ||
      item.category.toLowerCase() === normalizedCategory;

    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;

    return (
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.category.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function paginateDarsPublications(
  items: DarsPublicationItem[],
  visibleCount: number
): {
  visibleItems: DarsPublicationItem[];
  hasMore: boolean;
  remainingCount: number;
} {
  const safeCount = Math.max(1, visibleCount);
  const visibleItems = items.slice(0, safeCount);
  const remainingCount = Math.max(0, items.length - visibleItems.length);
  return {
    visibleItems,
    hasMore: remainingCount > 0,
    remainingCount,
  };
}
