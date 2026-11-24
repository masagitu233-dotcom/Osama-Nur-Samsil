import {
  DARS_ARTICLES_COLLECTION,
  DARS_FIREBASE_PROJECT_ID,
  DARS_FIRESTORE_DATABASE_ID,
  parseDarsFirestoreRunQueryResponse,
  type DarsPublicationItem,
} from '../utils/darsPublications';

const DARS_FIRESTORE_RUN_QUERY_URL = `https://firestore.googleapis.com/v1/projects/${DARS_FIREBASE_PROJECT_ID}/databases/${DARS_FIRESTORE_DATABASE_ID}/documents:runQuery`;

const CACHE_TTL_MS = 60_000;

interface PublicationsCacheEntry {
  items: DarsPublicationItem[];
  fetchedAt: number;
}

let memoryCache: PublicationsCacheEntry | null = null;

export interface DarsPublicationsFetchResult {
  items: DarsPublicationItem[];
  fetchedAt: number;
  fromCache: boolean;
}

/**
 * Strictly read-only live query against Dars with Osama's public Firestore `blogPosts` collection.
 * - Filters server-side to `status == "published"` (drafts and unpublished items are never requested or returned).
 * - Uses field-mask projection (`select`) to avoid downloading large article HTML bodies.
 * - Never writes to Dars with Osama and never duplicates articles into the portfolio's database.
 */
export async function fetchDarsPublications(options?: {
  forceRefresh?: boolean;
  signal?: AbortSignal;
}): Promise<DarsPublicationsFetchResult> {
  const forceRefresh = options?.forceRefresh === true;
  const now = Date.now();

  if (!forceRefresh && memoryCache && now - memoryCache.fetchedAt < CACHE_TTL_MS) {
    return {
      items: memoryCache.items,
      fetchedAt: memoryCache.fetchedAt,
      fromCache: true,
    };
  }

  const requestBody = {
    structuredQuery: {
      select: {
        fields: [
          { fieldPath: 'title' },
          { fieldPath: 'slug' },
          { fieldPath: 'status' },
          { fieldPath: 'category' },
          { fieldPath: 'categoryName' },
          { fieldPath: 'genre' },
          { fieldPath: 'publishedAt' },
          { fieldPath: 'createdAt' },
          { fieldPath: 'updatedAt' },
          { fieldPath: 'coverImageUrl' },
          { fieldPath: 'coverImage' },
          { fieldPath: 'thumbnailUrl' },
          { fieldPath: 'authorName' },
          { fieldPath: 'readingTimeMinutes' },
          { fieldPath: 'isUserModified' },
          { fieldPath: 'isCustomPost' },
          { fieldPath: 'isDeleted' },
          { fieldPath: 'isVisible' },
        ],
      },
      from: [{ collectionId: DARS_ARTICLES_COLLECTION }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'status' },
          op: 'EQUAL',
          value: { stringValue: 'published' },
        },
      },
    },
  };

  let response: Response;
  try {
    response = await fetch(DARS_FIRESTORE_RUN_QUERY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: options?.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    throw new Error(
      'Tidak dapat terhubung ke Dars with Osama saat ini. Periksa koneksi internet Anda lalu coba muat ulang.'
    );
  }

  if (!response.ok) {
    throw new Error(
      `Gagal mengambil daftar artikel dari Dars with Osama (HTTP ${response.status}). Silakan coba lagi beberapa saat.`
    );
  }

  const payload: unknown = await response.json();
  const items = parseDarsFirestoreRunQueryResponse(payload);
  const fetchedAt = Date.now();

  memoryCache = { items, fetchedAt };

  return {
    items,
    fetchedAt,
    fromCache: false,
  };
}

export function clearDarsPublicationsCache(): void {
  memoryCache = null;
}
