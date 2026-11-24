import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ExternalLink, RefreshCw } from 'lucide-react';
import {
  DARS_ARTICLES_COLLECTION,
  DARS_FIRESTORE_DATABASE_ID,
  DARS_SITE_BASE_URL,
  formatPublicationDateId,
  type DarsPublicationItem,
} from '../../utils/darsPublications';
import { fetchDarsPublications } from '../../services/darsPublicationsService';
import { refreshAos } from '../../utils/aos';

export const DarsPublicationsSyncPanel: React.FC = () => {
  const [articles, setArticles] = useState<DarsPublicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSyncStatus = useCallback(async (forceRefresh = false, signal?: AbortSignal) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage(null);
    try {
      const res = await fetchDarsPublications({ forceRefresh, signal });
      setArticles(res.items);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Gagal memeriksa sinkronisasi artikel dari Dars with Osama.'
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
    loadSyncStatus(false, controller.signal);
    return () => controller.abort();
  }, [loadSyncStatus]);

  useEffect(() => {
    if (!loading) {
      refreshAos(true);
    }
  }, [loading, articles.length]);

  return (
    <div className="space-y-5">
      <div data-aos="fade-up" className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3.5 border-b-2 border-brutal">
        <div>
          <span className="brutal-badge-green">Integrasi Read-Only Otomatis</span>
          <h1 className="font-display text-xl sm:text-2xl font-extrabold mt-1.5">
            Publikasi &amp; Karya Tulis (Dars with Osama)
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-2xl">
            Bagian Publikasi &amp; Karya Tulis terhubung langsung secara read-only ke artikel terbit di Dars with Osama. Penulisan, pengeditan, dan penghapusan artikel dilakukan terpusat di Dars with Osama agar tidak terjadi duplikasi konten.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => loadSyncStatus(true)}
            disabled={loading || refreshing}
            className="brutal-btn brutal-btn-outline px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Menyegarkan...' : 'Segarkan Data'}</span>
          </button>
          <a
            href={DARS_SITE_BASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="brutal-btn brutal-btn-primary px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <span>Kelola Artikel di Dars with Osama</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Integration Architecture Summary */}
      <div data-aos="fade-up" data-aos-delay={100} className="brutal-card card-beige frame-shadow-green p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#0F3D3A]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Sumber Tunggal Aktif: {DARS_SITE_BASE_URL}</span>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-subtle text-xs">
          <div>
            <dt className="font-mono-num uppercase text-muted font-bold">Koleksi Sumber</dt>
            <dd className="font-mono-num font-bold mt-1">{DARS_ARTICLES_COLLECTION} (status = published)</dd>
          </div>
          <div>
            <dt className="font-mono-num uppercase text-muted font-bold">Mode Akses</dt>
            <dd className="font-bold mt-1">Read-Only (Tanpa Salinan ke Database Portofolio)</dd>
          </div>
          <div>
            <dt className="font-mono-num uppercase text-muted font-bold">Total Artikel Tersinkron</dt>
            <dd className="font-mono-num font-extrabold text-sm sm:text-base mt-0.5">
              {loading ? 'Memeriksa...' : errorMessage ? 'Gagal Memuat' : `${articles.length} Artikel`}
            </dd>
          </div>
        </dl>
        <p className="text-[11px] font-mono-num text-muted break-all">
          Database Sumber: {DARS_FIRESTORE_DATABASE_ID}
        </p>
      </div>

      {errorMessage && (
        <div role="alert" className="brutal-card card-bordo p-4 flex items-start gap-2.5 text-xs sm:text-sm text-[#F8F8E1]">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#8ACCD5]" />
          <div>
            <p className="font-bold">Sinkronisasi Sedang Terkendala</p>
            <p className="mt-0.5 opacity-90">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Read-only preview of latest synced articles */}
      {!loading && !errorMessage && articles.length > 0 && (
        <section data-aos="fade-up" className="brutal-card card-beige p-4 sm:p-5 space-y-3">
          <h2 className="font-display text-base sm:text-lg font-extrabold">
            Pratinjau Artikel Terbaru yang Tampil di Halaman Publik
          </h2>
          <div className="divide-y divide-[var(--border-subtle)]">
            {articles.slice(0, 10).map((item) => (
              <div
                key={item.id}
                className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono-num text-muted">
                    {item.category && <span className="brutal-badge">{item.category}</span>}
                    {item.publishedAt && <span>{formatPublicationDateId(item.publishedAt)}</span>}
                  </div>
                  <p className="font-display font-bold text-sm mt-1 truncate">
                    {item.title}
                  </p>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="brutal-btn brutal-btn-outline px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                >
                  <span>Buka Artikel</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
          {articles.length > 10 && (
            <p className="text-xs text-muted font-mono-num">
              + {articles.length - 10} artikel terbit lainnya juga tampil otomatis pada halaman Pendidikan &amp; Publikasi.
            </p>
          )}
        </section>
      )}
    </div>
  );
};
