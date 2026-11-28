import React, { useEffect, useMemo, useState } from 'react';
import { Download, ExternalLink, FileText, Search, ZoomIn } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import type { CertificateItem } from '../types/portfolio';
import { filterCertificates } from '../utils/portfolioLogic';
import { SafeImage } from '../components/ui/SafeImage';
import { Modal } from '../components/ui/Modal';
import { getSectionCardTone } from '../utils/cardVariants';
import { getAosStaggerDelay, refreshAos } from '../utils/aos';
import { getGoogleDriveDownloadUrl, normalizeGoogleDrivePdfEmbedUrl } from '../utils/googleDriveMedia';
import {
  groupCertificatesByTrainingScope,
  normalizeCertificateCategoryLabel,
} from '../utils/trainingClassification';

export const CertificatesPage: React.FC = () => {
  const { publicData } = usePortfolio();
  const { certificates } = publicData;

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [field, setField] = useState('all');
  const [year, setYear] = useState('all');
  const [selectedCert, setSelectedCert] = useState<CertificateItem | null>(null);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          certificates
            .map((c) => normalizeCertificateCategoryLabel(c.category))
            .filter(Boolean)
        )
      ).sort(),
    [certificates]
  );
  const fields = useMemo(
    () => Array.from(new Set(certificates.map((c) => c.field).filter(Boolean))).sort(),
    [certificates]
  );
  const years = useMemo(
    () => Array.from(new Set(certificates.map((c) => c.year).filter(Boolean))).sort((a, b) => b.localeCompare(a)),
    [certificates]
  );

  const filteredCertificates = useMemo(
    () => filterCertificates(certificates, { query, category, field, year }),
    [certificates, query, category, field, year]
  );

  const groupedCerts = useMemo(() => groupCertificatesByTrainingScope(certificates), [certificates]);
  const domesticCount = groupedCerts.domestic.length;
  const internationalCount = groupedCerts.international.length;

  useEffect(() => {
    refreshAos(true);
  }, [query, category, field, year]);

  return (
    <div
      data-sizing-scope="certificates"
      className="sizing-page-shell max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10"
    >
      <header data-aos="fade-up" className="border-b-2 border-brutal pb-5">
        <span className="brutal-badge-bordo">04. Pengembangan Kompetensi</span>
        <h1 className="font-display text-2xl sm:text-3xl lg:text-[34px] font-extrabold mt-2.5 text-balance leading-tight">
          Sertifikat &amp; Riwayat Pelatihan
        </h1>
        <p className="mt-2.5 text-sm sm:text-[15px] text-muted max-w-2xl leading-relaxed">
          Ringkasan bidang pelatihan dalam negeri maupun penyelenggara internasional, dilengkapi galeri dokumen sertifikat (JPG, PNG, WebP, dan PDF) yang dapat dicari, difilter, dan diunduh.
        </p>
      </header>

      {/* SECTION 01: TRAINING SUMMARY CARDS (Compact Live Certificate Counts Only) */}
      <section aria-labelledby="training-domains-heading" className="space-y-4">
        <div data-aos="fade-up">
          <h2 id="training-domains-heading" className="font-display text-xl sm:text-2xl font-extrabold">
            01. Bidang Pelatihan yang Diikuti
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Ringkasan jumlah sertifikat pelatihan nasional dan internasional yang dihitung otomatis dari data tersimpan.
          </p>
        </div>

        <div className="sizing-card-grid grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
          {/* Domestic: Uniform Green Card (#0F3D3A) with Beige Text & Gold Accents */}
          <div
            data-testid="training-card-domestic"
            data-aos="fade-up"
            data-aos-delay="0"
            className="brutal-card card-green frame-green sizing-card-pad p-5 flex flex-col justify-between gap-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-[#D9B44A]/45">
              <h3 className="font-display text-lg font-extrabold text-[#F8F8E1]">
                Pelatihan Dalam Negeri
              </h3>
              <span className="brutal-badge">Nasional</span>
            </div>

            <div className="flex items-baseline gap-2.5">
              <span
                data-testid="training-count-domestic"
                className="font-mono-num text-3xl sm:text-4xl font-extrabold leading-none text-[#D9B44A]"
              >
                {domesticCount}
              </span>
              <span className="font-mono-num text-xs font-bold uppercase tracking-wide text-[#F8F8E1]">
                Sertifikat Terdaftar
              </span>
            </div>
          </div>

          {/* International: Uniform Green Card (#0F3D3A) with Beige Text & Gold Accents */}
          <div
            data-testid="training-card-international"
            data-aos="fade-up"
            data-aos-delay="100"
            className="brutal-card card-green frame-green sizing-card-pad p-5 flex flex-col justify-between gap-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-[#D9B44A]/45">
              <h3 className="font-display text-lg font-extrabold text-[#F8F8E1]">
                Pelatihan Internasional / Luar Negeri
              </h3>
              <span className="brutal-badge">Internasional</span>
            </div>

            <div className="flex items-baseline gap-2.5">
              <span
                data-testid="training-count-international"
                className="font-mono-num text-3xl sm:text-4xl font-extrabold leading-none text-[#D9B44A]"
              >
                {internationalCount}
              </span>
              <span className="font-mono-num text-xs font-bold uppercase tracking-wide text-[#F8F8E1]">
                Sertifikat Terdaftar
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 02: CERTIFICATE GALLERY */}
      <section aria-labelledby="certificate-gallery-heading" className="space-y-4">
        <div data-aos="fade-up" className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 id="certificate-gallery-heading" className="font-display text-xl sm:text-2xl font-extrabold">
              02. Galeri Sertifikat Terverifikasi
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-1">
              Total ditampilkan: <span className="font-mono-num font-bold">{filteredCertificates.length}</span> sertifikat
            </p>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="brutal-card card-green frame-green p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
          <div className="lg:col-span-5 relative">
            <Search
              className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#1B2A3D]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama pelatihan, penyelenggara, atau bidang..."
              aria-label="Cari sertifikat"
              className="w-full brutal-input pl-9 pr-3 py-1.5 text-sm"
            />
          </div>

          <div className="lg:col-span-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter kategori sertifikat"
              className="w-full brutal-input px-3 py-1.5 text-sm"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={field}
              onChange={(e) => setField(e.target.value)}
              aria-label="Filter bidang sertifikat"
              className="w-full brutal-input px-3 py-1.5 text-sm"
            >
              <option value="all">Semua Bidang</option>
              {fields.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              aria-label="Filter tahun sertifikat"
              className="w-full brutal-input px-3 py-1.5 text-sm"
            >
              <option value="all">Semua Tahun</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Empty State or Grid */}
        {certificates.length === 0 ? (
          <div className="brutal-card card-green frame-green p-6 sm:p-8 text-center space-y-2.5">
            <div>
              <span className="brutal-badge">Arsip Sertifikat Autentik</span>
            </div>
            <h3 className="font-display text-xl font-extrabold text-[#F8F8E1]">
              Belum Ada Dokumen Sertifikat yang Diunggah
            </h3>
            <p className="text-sm text-muted max-w-xl mx-auto leading-relaxed">
              Demi keaslian informasi, sistem tidak menampilkan data sertifikat fiktif. Pemilik situs dapat mengunggah dokumen sertifikat asli (JPG, PNG, WebP, atau PDF) beserta penyelenggara dan tahunnya satu per satu melalui Dashboard Admin.
            </p>
          </div>
        ) : filteredCertificates.length === 0 ? (
          <div className="brutal-card card-green frame-green p-8 text-center">
            <p className="font-display text-base font-bold text-[#F8F8E1]">Sertifikat tidak ditemukan dengan kriteria filter saat ini.</p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setCategory('all');
                setField('all');
                setYear('all');
              }}
              className="mt-3 brutal-btn-frame-green px-4 py-2 text-xs font-bold cursor-pointer"
            >
              Reset Filter Pencarian
            </button>
          </div>
        ) : (
          <div className="sizing-card-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCertificates.map((cert, idx) => {
              const tone = getSectionCardTone('certificates');
              return (
                <article
                  key={cert.id}
                  data-aos="fade-up"
                  data-aos-delay={getAosStaggerDelay(idx, 100, 3)}
                  className={`brutal-card brutal-card-interactive overflow-hidden flex flex-col ${tone.cardClass} ${tone.frameClass}`}
                >
                  {/* Certificate original document frame */}
                  <div className={`sizing-cert-media aspect-[16/10] border-b-2 ${tone.mediaBorderClass} bg-[#F8F8E1] overflow-hidden relative`}>
                    {cert.fileType === 'pdf' && !cert.thumbnailUrl ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-5 text-center card-gold">
                        <div className="w-12 h-12 border-2 border-[#001F24] bg-[#6C151E] text-[#F8F8E1] flex items-center justify-center mb-2.5">
                          <FileText className="w-6 h-6" aria-hidden="true" />
                        </div>
                        <p className="font-mono-num text-xs font-bold uppercase text-[#001F24]">Dokumen PDF</p>
                        <p className="text-xs font-semibold text-[#001F24] mt-1 truncate max-w-full">
                          {cert.fileName || cert.title}
                        </p>
                      </div>
                    ) : (
                      <SafeImage
                        src={cert.thumbnailUrl || cert.fileUrl}
                        alt={cert.title}
                        fallbackLabel={cert.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  <div className="sizing-media-body p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono-num">
                        <span className="truncate text-[#D9B44A] font-bold">
                          {cert.category} &middot; {cert.field}
                        </span>
                        <span className={`${tone.badgeClass} shrink-0`}>{cert.year}</span>
                      </div>
                      <h3 className="font-display text-base font-extrabold mt-2 leading-snug text-[#F8F8E1]">{cert.title}</h3>
                      <p className="text-xs sm:text-sm font-bold text-muted mt-0.5">{cert.issuer}</p>
                      {cert.description && (
                        <p className="text-xs sm:text-sm text-muted mt-1.5 line-clamp-2">
                          {cert.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-subtle flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCert(cert)}
                        className={`flex-1 ${tone.buttonClass} py-1.5 px-3 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer`}
                      >
                        <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Lihat Detail</span>
                      </button>
                      {cert.fileUrl && (
                        <a
                          href={getGoogleDriveDownloadUrl(cert.fileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={cert.fileName || undefined}
                          aria-label={`Unduh dokumen ${cert.title}`}
                          className={`${tone.secondaryButtonClass} p-1.5`}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Lightbox / Detail Modal */}
      <Modal
        open={Boolean(selectedCert)}
        onClose={() => setSelectedCert(null)}
        title={selectedCert?.title || ''}
        subtitle={
          selectedCert
            ? `${selectedCert.issuer} · ${selectedCert.year} · ${selectedCert.category} · ${selectedCert.field}`
            : undefined
        }
        maxWidthClass="max-w-3xl"
        variant="lightbox"
        tone="green"
      >
        {selectedCert && (
          <div className="space-y-5 text-[#F8F8E1]">
            {selectedCert.fileUrl ? (
              selectedCert.fileType === 'pdf' ? (
                <div className="space-y-3.5">
                  <div className="border-2 border-[#D9B44A] bg-[#F8F8E1] h-[420px] overflow-hidden shadow-[3px_3px_0_0_#001F24]">
                    <iframe
                      src={normalizeGoogleDrivePdfEmbedUrl(selectedCert.fileUrl)}
                      title={selectedCert.title}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <a
                      href={selectedCert.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="brutal-btn-frame-green px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Buka PDF di Tab Baru</span>
                    </a>
                    <a
                      href={getGoogleDriveDownloadUrl(selectedCert.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={selectedCert.fileName || `${selectedCert.title}.pdf`}
                      className="brutal-btn-on-dark-outline px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Unduh Dokumen PDF</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="border-2 border-[#D9B44A] bg-[#F8F8E1] overflow-hidden shadow-[3px_3px_0_0_#001F24]">
                    <SafeImage
                      src={selectedCert.fileUrl}
                      alt={selectedCert.title}
                      fallbackLabel={selectedCert.title}
                      className="w-full max-h-[480px] object-contain mx-auto"
                    />
                  </div>
                  <a
                    href={selectedCert.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="brutal-btn-frame-green px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Buka Gambar Resolusi Penuh</span>
                  </a>
                </div>
              )
            ) : (
              <div className="p-5 border-2 border-dashed border-[#D9B44A] text-sm text-[#F8F8E1]">
                File gambar atau PDF belum dilampirkan pada sertifikat ini.
              </div>
            )}

            {selectedCert.description && (
              <div>
                <h3 className="font-display font-bold text-sm sm:text-base text-[#D9B44A] mb-1">Deskripsi Pelatihan</h3>
                <p className="text-sm text-[#F8F8E1] leading-relaxed whitespace-pre-line">
                  {selectedCert.description}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
