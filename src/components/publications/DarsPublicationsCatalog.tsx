import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Calendar, ExternalLink, RefreshCw, Search } from 'lucide-react';
import {
  DARS_SITE_BASE_URL,
  extractDarsCategories,
  filterDarsPublications,
  formatPublicationDateId,
  paginateDarsPublications,
  type DarsPublicationItem,
} from '../../utils/darsPublications';
import { fetchDarsPublications } from '../../services/darsPublicationsService';
import { SafeImage } from '../ui/SafeImage';
import { getCardTone } from '../../utils/cardVariants';

const DEFAULT_PAGE_SIZE = 9;

interface DarsPublicationsCatalogProps {
  externalQuery?: string;
  hideSearchBar?: boolean;
  compactHeader?: boolean;
  initialPageSize?: number;
}

export const DarsPublicationsCatalog: React.FC<DarsPublicationsCatalogProps> = ({
  externalQuery,
  hideSearchBar = false,
  compactHeader = false,
  initialPageSize = DEFAULT_PAGE_SIZE,
}) => {
  const [articles, setArticles] = useState<DarsPublicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [internalQuery, setInternalQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(initialPageSize);

  const effectiveQuery = externalQuery !== undefined ? externalQuery : internalQuery;

  const loadArticles = useCallback(async (forceRefresh = false, signal?: AbortSignal) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage(null);

    try {
      const result = await fetchDarsPublications({ forceRefresh, signal });
      setArticles(result.items);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Gagal memuat daftar artikel dari Dars with Osama.'
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadArticles(false, controller.signal);
    return () => controller.abort();
  }, [loadArticles]);

  const categories = useMemo(() => extractDarsCategories(articles), [articles]);

  const filteredArticles = useMemo(
    () => filterDarsPublications(articles, selectedCategory, effectiveQuery),
    [articles, selectedCategory, effectiveQuery]
  );

  // Reset pagination whenever filters change
  useEffect(() => {
    setVisibleCount(initialPageSize);
  }, [selectedCategory, effectiveQuery, initialPageSize]);

  const { visibleItems, hasMore, remainingCount } = useMemo(
    () => paginateDarsPublications(filteredArticles, visibleCount),
    [filteredArticles, visibleCount]
  );

  return (
    <div className="space-y-5">
      {/* Header & Source Attribution Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3.5">
        <div className="space-y-1">
          <p className={`${compactHeader ? 'text-xs sm:text-sm' : 'text-sm'} text-muted max-w-2xl leading-relaxed`}>
            Seluruh artikel dan karya tulis yang dipublikasikan di{' '}
            <a
              href={DARS_SITE_BASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#6C151E] underline decoration-2 underline-offset-2 hover:text-[#013A42]"
            >
              Dars with Osama
            </a>{' '}
            ditampilkan secara otomatis dan diurutkan dari publikasi terbaru. Klik sampul atau judul artikel untuk membaca naskah lengkap pada situs aslinya.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!loading && !errorMessage && (
            <span className="brutal-badge-green">
              {articles.length} Artikel Terbit
            </span>
          )}
          <button
            type="button"
            onClick={() => loadArticles(true)}
            disabled={loading || refreshing}
            className="brutal-btn brutal-btn-outline px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>{refreshing ? 'Memuat...' : 'Segarkan'}</span>
          </button>
          <a
            href={`${DARS_SITE_BASE_URL}/?view=blog`}
            target="_blank"
            rel="noopener noreferrer"
            className="brutal-btn brutal-btn-primary px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>Buka Dars with Osama</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>

      {/* Filter & Search Controls */}
      {!loading && !errorMessage && articles.length > 0 && (
        <div className="brutal-card card-beige frame-shadow-green p-3.5 sm:p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            {!hideSearchBar ? (
              <div className="relative flex-1 max-w-md">
                <Search
                  className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={internalQuery}
                  onChange={(e) => setInternalQuery(e.target.value)}
                  placeholder="Cari judul artikel atau kategori..."
                  aria-label="Cari publikasi dan karya tulis"
                  className="w-full brutal-input pl-9 pr-3 py-1.5 text-sm"
                />
              </div>
            ) : (
              <p className="text-xs font-mono-num font-bold uppercase text-[#0F3D3A]">
                Filter Kategori Artikel Dars with Osama
              </p>
            )}
            <p className="text-xs font-mono-num font-bold text-muted">
              Menampilkan {visibleItems.length} dari {filteredArticles.length} artikel
            </p>
          </div>

          {categories.length > 0 && (
            <div role="tablist" aria-label="Filter kategori artikel" className="flex flex-wrap gap-1.5">
              <button
                type="button"
                role="tab"
                aria-selected={selectedCategory === 'all'}
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 text-xs font-bold border-2 border-brutal cursor-pointer transition-colors ${
                  selectedCategory === 'all'
                    ? 'card-blue shadow-[2.5px_2.5px_0_0_#013A42]'
                    : 'card-beige hover:bg-[#8ACCD5] hover:text-[#013A42]'
                }`}
              >
                Semua ({articles.length})
              </button>
              {categories.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 text-xs font-bold border-2 border-brutal cursor-pointer transition-colors ${
                      active
                        ? 'card-blue shadow-[2.5px_2.5px_0_0_#013A42]'
                        : 'card-beige hover:bg-[#8ACCD5] hover:text-[#013A42]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div
          aria-busy="true"
          aria-label="Memuat daftar publikasi dari Dars with Osama"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="brutal-card card-beige overflow-hidden flex flex-col"
            >
              <div className="aspect-[16/9] w-full brutal-skeleton animate-pulse border-b-2 border-[#013A42]" />
              <div className="p-4 space-y-2.5">
                <div className="h-4 w-24 brutal-skeleton animate-pulse" />
                <div className="h-5 w-full brutal-skeleton animate-pulse" />
                <div className="h-5 w-3/4 brutal-skeleton animate-pulse" />
                <div className="pt-2.5 border-t border-subtle">
                  <div className="h-8 w-full brutal-skeleton animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Honest Error State */}
      {!loading && errorMessage && (
        <div
          role="alert"
          className="brutal-card card-bordo frame-midnight p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 shrink-0 border-2 border-[#F8F8E1] bg-[#013A42] text-[#8ACCD5] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-display text-base font-extrabold text-[#F8F8E1]">
                Gagal Memuat Artikel dari Dars with Osama
              </h3>
              <p className="text-xs sm:text-sm text-[#F8F8E1]/90 mt-1 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => loadArticles(true)}
            className="brutal-btn-on-dark px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Coba Muat Ulang</span>
          </button>
        </div>
      )}

      {/* Empty Published State */}
      {!loading && !errorMessage && articles.length === 0 && (
        <div className="brutal-card card-beige p-6 text-center space-y-1.5">
          <p className="font-display text-base font-extrabold">
            Belum Ada Artikel yang Dipublikasikan
          </p>
          <p className="text-sm text-muted max-w-xl mx-auto">
            Saat ini belum ada artikel berstatus terbit pada Dars with Osama. Artikel baru yang dipublikasikan akan tampil otomatis di sini.
          </p>
        </div>
      )}

      {/* No Filter Match State */}
      {!loading && !errorMessage && articles.length > 0 && filteredArticles.length === 0 && (
        <div className="brutal-card card-beige p-6 text-center space-y-3">
          <p className="font-display text-base font-bold">
            Tidak ada artikel yang cocok dengan pencarian atau kategori tersebut.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setInternalQuery('');
            }}
            className="brutal-btn brutal-btn-secondary px-4 py-2 text-xs font-bold cursor-pointer"
          >
            Tampilkan Semua Artikel
          </button>
        </div>
      )}

      {/* Live Articles Catalog Grid */}
      {!loading && !errorMessage && visibleItems.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
            {visibleItems.map((article, idx) => {
              const tone = getCardTone(idx, ['beige', 'blue', 'green', 'bordo', 'midnight']);
              const formattedDate = formatPublicationDateId(article.publishedAt);
              const coverBorderClass =
                tone.tone === 'beige'
                  ? 'border-[#6C151E]'
                  : tone.tone === 'blue'
                  ? 'border-[#013A42]'
                  : 'border-[#8ACCD5]';

              return (
                <article
                  key={article.id}
                  className={`brutal-card brutal-card-interactive overflow-hidden flex flex-col h-full ${tone.cardClass} ${tone.frameClass}`}
                >
                  {/* Clickable 16:9 Cover Image -> Original Article URL */}
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Baca artikel: ${article.title}`}
                    className={`block aspect-[16/9] w-full overflow-hidden border-b-2 ${coverBorderClass} bg-[#F8F8E1] shrink-0 group`}
                  >
                    <SafeImage
                      src={article.coverImageUrl}
                      alt={`Sampul artikel ${article.title}`}
                      fallbackLabel={article.title}
                      className="w-full h-full block object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </a>

                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3.5">
                    <div className="space-y-2">
                      {(article.category || formattedDate) && (
                        <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                          {article.category && (
                            <span className={tone.badgeClass}>{article.category}</span>
                          )}
                          {formattedDate && (
                            <time
                              dateTime={article.publishedAt}
                              className="inline-flex items-center gap-1 font-mono-num text-[11px] font-bold text-muted"
                            >
                              <Calendar className="w-3 h-3 shrink-0" aria-hidden="true" />
                              <span>{formattedDate}</span>
                            </time>
                          )}
                        </div>
                      )}

                      <h3 className="font-display text-[15px] sm:text-base font-extrabold leading-snug">
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline decoration-2 underline-offset-4 focus-visible:underline"
                        >
                          {article.title}
                        </a>
                      </h3>
                    </div>

                    <div className="mt-auto pt-3 border-t border-subtle">
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${tone.buttonClass} w-full py-2 px-3.5 text-xs font-bold inline-flex items-center justify-center gap-1.5`}
                      >
                        <span>Baca Artikel Asli</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Progressive Pagination Controls */}
          {hasMore && (
            <div className="pt-1 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + initialPageSize)}
                className="brutal-btn brutal-btn-primary px-5 py-2 text-xs font-bold cursor-pointer"
              >
                Tampilkan Lebih Banyak ({Math.min(initialPageSize, remainingCount)} lagi)
              </button>
              {remainingCount > initialPageSize && (
                <button
                  type="button"
                  onClick={() => setVisibleCount(filteredArticles.length)}
                  className="brutal-btn brutal-btn-outline px-4 py-2 text-xs font-bold cursor-pointer"
                >
                  Tampilkan Semua ({filteredArticles.length})
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
