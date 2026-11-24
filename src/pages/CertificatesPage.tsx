import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Download, ExternalLink, FileText, Search, ZoomIn } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import type { CertificateItem } from '../types/portfolio';
import { filterCertificates } from '../utils/portfolioLogic';
import { SafeImage } from '../components/ui/SafeImage';
import { Modal } from '../components/ui/Modal';
import { getCardTone } from '../utils/cardVariants';

export const CertificatesPage: React.FC = () => {
  const { publicData } = usePortfolio();
  const { certificates, trainings } = publicData;

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [field, setField] = useState('all');
  const [year, setYear] = useState('all');
  const [selectedCert, setSelectedCert] = useState<CertificateItem | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(certificates.map((c) => c.category).filter(Boolean))).sort(),
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

  const domesticTrainings = trainings.filter((t) => t.scope === 'domestic');
  const internationalTrainings = trainings.filter((t) => t.scope === 'international');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="border-b-2 border-brutal pb-8"
      >
        <span className="brutal-badge-bordo">04. Pengembangan Kompetensi</span>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold mt-3 text-balance">
          Sertifikat &amp; Riwayat Pelatihan
        </h1>
        <p className="mt-4 text-base text-muted max-w-3xl">
          Ringkasan bidang pelatihan dalam negeri maupun penyelenggara internasional, dilengkapi galeri dokumen sertifikat (JPG, PNG, WebP, dan PDF) yang dapat dicari, difilter, dan diunduh.
        </p>
      </motion.header>

      {/* SECTION 01: TRAINING DOMAINS (Green Card for Domestic + Bordo Card for International) */}
      <section aria-labelledby="training-domains-heading" className="space-y-6">
        <div>
          <h2 id="training-domains-heading" className="font-display text-2xl sm:text-3xl font-extrabold">
            01. Bidang Pelatihan yang Diikuti
          </h2>
          <p className="text-sm text-muted mt-1">
            Cakupan materi pengembangan kapasitas dari penyelenggara nasional dan internasional.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Domestic: Deep Green Card with Beige Text */}
          <div className="brutal-card card-green frame-midnight p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between gap-2 pb-3 border-b-2 border-[#8ACCD5]/50">
              <h3 className="font-display text-xl font-extrabold text-[#F8F8E1]">Pelatihan Dalam Negeri</h3>
              <span className="brutal-badge">Nasional</span>
            </div>
            {domesticTrainings.length === 0 ? (
              <p className="text-sm text-muted">Belum ada data pelatihan dalam negeri.</p>
            ) : (
              <div className="space-y-5">
                {domesticTrainings.map((t) => (
                  <article key={t.id} className="space-y-2">
                    <p className="font-bold text-base text-[#F8F8E1]">{t.title}</p>
                    {t.organizer && (
                      <p className="text-xs font-mono-num text-[#8ACCD5] font-semibold">
                        {t.organizer} {t.year ? `· ${t.year}` : ''}
                      </p>
                    )}
                    <p className="text-sm text-muted leading-relaxed">{t.description}</p>
                    {t.topics.length > 0 && (
                      <p className="text-xs font-bold pt-1 text-[#8ACCD5]">
                        Bidang: {t.topics.join(' · ')}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* International: Bordo Card with Beige Text */}
          <div className="brutal-card card-bordo frame-midnight p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between gap-2 pb-3 border-b-2 border-[#F8F8E1]/35">
              <h3 className="font-display text-xl font-extrabold text-[#F8F8E1]">Pelatihan Internasional / Luar Negeri</h3>
              <span className="brutal-badge-beige">Internasional</span>
            </div>
            {internationalTrainings.length === 0 ? (
              <p className="text-sm text-muted">Belum ada data pelatihan internasional.</p>
            ) : (
              <div className="space-y-5">
                {internationalTrainings.map((t) => (
                  <article key={t.id} className="space-y-2">
                    <p className="font-bold text-base text-[#F8F8E1]">{t.title}</p>
                    {t.organizer && (
                      <p className="text-xs font-mono-num text-[#8ACCD5] font-semibold">
                        {t.organizer} {t.year ? `· ${t.year}` : ''}
                      </p>
                    )}
                    <p className="text-sm text-muted leading-relaxed">{t.description}</p>
                    {t.topics.length > 0 && (
                      <p className="text-xs font-bold pt-1 text-[#8ACCD5]">
                        Bidang: {t.topics.join(' · ')}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 02: CERTIFICATE GALLERY */}
      <section aria-labelledby="certificate-gallery-heading" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 id="certificate-gallery-heading" className="font-display text-2xl sm:text-3xl font-extrabold">
              02. Galeri Sertifikat Terverifikasi
            </h2>
            <p className="text-sm text-muted mt-1">
              Total ditampilkan: <span className="font-mono-num font-bold">{filteredCertificates.length}</span> sertifikat
            </p>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="brutal-card card-beige frame-shadow-green p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-5 relative">
            <Search
              className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama pelatihan, penyelenggara, atau bidang..."
              aria-label="Cari sertifikat"
              className="w-full brutal-input pl-10 pr-4 py-2 text-sm"
            />
          </div>

          <div className="lg:col-span-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter kategori sertifikat"
              className="w-full brutal-input px-3 py-2 text-sm"
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
              className="w-full brutal-input px-3 py-2 text-sm"
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
              className="w-full brutal-input px-3 py-2 text-sm"
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
          <div className="brutal-card card-blue frame-shadow-bordo p-8 sm:p-12 text-center space-y-3">
            <div>
              <span className="brutal-badge-bordo">Arsip Sertifikat Autentik</span>
            </div>
            <h3 className="font-display text-2xl font-extrabold">
              Belum Ada Dokumen Sertifikat yang Diunggah
            </h3>
            <p className="text-sm sm:text-base text-muted max-w-2xl mx-auto leading-relaxed">
              Demi keaslian informasi, sistem tidak menampilkan data sertifikat fiktif. Pemilik situs dapat mengunggah dokumen sertifikat asli (JPG, PNG, WebP, atau PDF) beserta penyelenggara dan tahunnya satu per satu melalui Dashboard Admin.
            </p>
          </div>
        ) : filteredCertificates.length === 0 ? (
          <div className="brutal-card card-beige p-10 text-center">
            <p className="font-display text-lg font-bold">Sertifikat tidak ditemukan dengan kriteria filter saat ini.</p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setCategory('all');
                setField('all');
                setYear('all');
              }}
              className="mt-4 brutal-btn brutal-btn-secondary px-4 py-2 text-xs font-bold cursor-pointer"
            >
              Reset Filter Pencarian
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCertificates.map((cert, idx) => {
              const tone = getCardTone(idx, ['beige', 'blue', 'green', 'bordo']);
              const certFrameBorder =
                idx % 3 === 0
                  ? 'border-[#6C151E]'
                  : idx % 3 === 1
                  ? 'border-[#013A42]'
                  : 'border-[#0F3D3A]';
              return (
                <article
                  key={cert.id}
                  className={`brutal-card brutal-card-interactive overflow-hidden flex flex-col ${tone.cardClass} ${tone.frameClass}`}
                >
                  {/* Certificate original document frame (ZERO color filters on document!) */}
                  <div className={`aspect-[4/3] border-b-[3px] ${certFrameBorder} bg-[#F8F8E1] overflow-hidden relative`}>
                    {cert.fileType === 'pdf' && !cert.thumbnailUrl ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center card-blue">
                        <div className="w-14 h-14 border-2 border-[#013A42] bg-[#6C151E] text-[#F8F8E1] flex items-center justify-center mb-3">
                          <FileText className="w-7 h-7" aria-hidden="true" />
                        </div>
                        <p className="font-mono-num text-xs font-bold uppercase text-[#013A42]">Dokumen PDF</p>
                        <p className="text-xs text-[#013A42]/80 mt-1 truncate max-w-full">
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

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs font-mono-num">
                        <span className="truncate text-muted font-semibold">
                          {cert.category} &middot; {cert.field}
                        </span>
                        <span className={`${tone.badgeClass} shrink-0`}>{cert.year}</span>
                      </div>
                      <h3 className="font-display text-lg font-extrabold mt-2.5 leading-snug">{cert.title}</h3>
                      <p className="text-sm font-bold text-muted mt-0.5">{cert.issuer}</p>
                      {cert.description && (
                        <p className="text-sm text-muted mt-2 line-clamp-2">
                          {cert.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-subtle flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setSelectedCert(cert)}
                        className={`flex-1 ${tone.buttonClass} py-2 px-3 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer`}
                      >
                        <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Lihat Detail</span>
                      </button>
                      {cert.fileUrl && (
                        <a
                          href={cert.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={cert.fileName || undefined}
                          aria-label={`Unduh dokumen ${cert.title}`}
                          className={`${tone.secondaryButtonClass} p-2`}
                        >
                          <Download className="w-4 h-4" />
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

      {/* Lightbox / Detail Modal (Midnight Green frame + Bordo/Blue document border) */}
      <Modal
        open={Boolean(selectedCert)}
        onClose={() => setSelectedCert(null)}
        title={selectedCert?.title || ''}
        subtitle={
          selectedCert
            ? `${selectedCert.issuer} · ${selectedCert.year} · ${selectedCert.category} · ${selectedCert.field}`
            : undefined
        }
        maxWidthClass="max-w-4xl"
        variant="lightbox"
      >
        {selectedCert && (
          <div className="space-y-6">
            {selectedCert.fileUrl ? (
              selectedCert.fileType === 'pdf' ? (
                <div className="space-y-4">
                  <div className="border-[3px] border-[#6C151E] bg-[#F8F8E1] h-[460px] overflow-hidden shadow-[4px_4px_0_0_#8ACCD5]">
                    <iframe
                      src={selectedCert.fileUrl}
                      title={selectedCert.title}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={selectedCert.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="brutal-btn-on-dark px-4 py-2.5 text-xs font-bold inline-flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                      <span>Buka PDF di Tab Baru</span>
                    </a>
                    <a
                      href={selectedCert.fileUrl}
                      download={selectedCert.fileName || `${selectedCert.title}.pdf`}
                      className="brutal-btn-on-dark-outline px-4 py-2.5 text-xs font-bold inline-flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" aria-hidden="true" />
                      <span>Unduh Dokumen PDF</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-[3px] border-[#6C151E] bg-[#F8F8E1] overflow-hidden shadow-[4px_4px_0_0_#8ACCD5]">
                    <SafeImage
                      src={selectedCert.fileUrl}
                      alt={selectedCert.title}
                      fallbackLabel={selectedCert.title}
                      className="w-full max-h-[540px] object-contain mx-auto"
                    />
                  </div>
                  <a
                    href={selectedCert.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="brutal-btn-on-dark px-4 py-2 text-xs font-bold inline-flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                    <span>Buka Gambar Resolusi Penuh</span>
                  </a>
                </div>
              )
            ) : (
              <div className="p-6 border-2 border-dashed border-[#8ACCD5] text-sm text-[#F8F8E1]/85">
                File gambar atau PDF belum dilampirkan pada sertifikat ini.
              </div>
            )}

            {selectedCert.description && (
              <div>
                <h3 className="font-display font-bold text-base text-[#8ACCD5] mb-1.5">Deskripsi Pelatihan</h3>
                <p className="text-sm sm:text-base text-[#F8F8E1] leading-relaxed whitespace-pre-line">
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
