import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Search } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import type { ProjectItem } from '../types/portfolio';
import { SafeImage } from '../components/ui/SafeImage';
import { DarsLogo } from '../components/ui/DarsLogo';
import { Modal } from '../components/ui/Modal';
import { getCardTone } from '../utils/cardVariants';
import {
  ACTIVE_PROJECT_CATEGORY_LABELS,
  ACTIVE_PROJECT_TABS,
  filterManualArticleProjects,
  filterWebsiteProjectsByQuery,
  hasCustomUploadedDarsAsset,
  isDarsPlatformProject,
  normalizeProjectCategory,
  prepareWebsiteProjects,
  type ActiveProjectTab,
} from '../utils/projectsCatalog';
import { DarsPublicationsCatalog } from '../components/publications/DarsPublicationsCatalog';

export const ProjectsPage: React.FC = () => {
  const { publicData } = usePortfolio();
  const [category, setCategory] = useState<ActiveProjectTab>('all');
  const [query, setQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

  const allWebsiteProjects = useMemo(
    () => prepareWebsiteProjects(publicData.projects),
    [publicData.projects]
  );

  const filteredWebsiteProjects = useMemo(
    () => filterWebsiteProjectsByQuery(allWebsiteProjects, query),
    [allWebsiteProjects, query]
  );

  const filteredManualArticles = useMemo(
    () => filterManualArticleProjects(publicData.projects, query),
    [publicData.projects, query]
  );

  const showWebsiteSection = category === 'all' || category === 'website_digital';
  const showArticleSection = category === 'all' || category === 'article_writing';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="border-b-2 border-brutal pb-8"
      >
        <span className="brutal-badge-bordo">06. Karya &amp; Inisiatif Digital</span>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold mt-3 text-balance">
          Projects &amp; Works
        </h1>
        <p className="mt-4 text-base text-muted max-w-3xl">
          Katalog proyek website dan inisiatif digital, termasuk platform pembelajaran keislaman Dars with Osama beserta arsip artikel dan tulisan yang terbit secara otomatis.
        </p>
      </motion.header>

      {/* Filters (Strictly 3 Categories) & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div role="tablist" aria-label="Filter kategori proyek" className="flex flex-wrap gap-2">
          {ACTIVE_PROJECT_TABS.map((tab) => {
            const active = category === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCategory(tab.value)}
                className={`px-4 py-2 text-xs sm:text-sm font-bold border-2 border-brutal cursor-pointer whitespace-nowrap transition-colors ${
                  active
                    ? 'card-blue shadow-[3px_3px_0_0_#013A42]'
                    : 'card-beige hover:bg-[#8ACCD5] hover:text-[#013A42]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative sm:w-72">
          <Search
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari proyek atau artikel..."
            aria-label="Cari proyek atau artikel"
            className="w-full brutal-input pl-10 pr-4 py-2 text-sm"
          />
        </div>
      </div>

      {/* SECTION A: WEBSITE & DIGITAL (Platform Projects Only — Includes Dars with Osama Card) */}
      {showWebsiteSection && (
        <section aria-labelledby="website-projects-heading" className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3 pb-3 border-b-2 border-brutal">
            <div>
              <span className="brutal-badge-green">Website &amp; Digital</span>
              <h2 id="website-projects-heading" className="font-display text-2xl sm:text-3xl font-extrabold mt-2">
                Proyek Website &amp; Platform Digital
              </h2>
            </div>
            <span className="font-mono-num text-xs font-bold text-muted">
              {filteredWebsiteProjects.length} Proyek
            </span>
          </div>

          {filteredWebsiteProjects.length === 0 ? (
            <div className="brutal-card card-beige p-10 text-center">
              <p className="font-display text-lg font-bold">
                Tidak ada proyek Website &amp; Digital yang cocok dengan pencarian.
              </p>
              <button
                type="button"
                onClick={() => setQuery('')}
                className="mt-4 brutal-btn brutal-btn-secondary px-4 py-2 text-xs font-bold cursor-pointer"
              >
                Reset Pencarian
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              {filteredWebsiteProjects.map((proj, idx) => {
                const isDars = isDarsPlatformProject(proj);
                const useCustomAsset = hasCustomUploadedDarsAsset(proj);
                const tone = getCardTone(idx, ['beige', 'green', 'bordo', 'blue', 'midnight']);
                const imgBorder =
                  tone.tone === 'beige'
                    ? 'border-[#6C151E]'
                    : tone.tone === 'blue'
                    ? 'border-[#013A42]'
                    : 'border-[#8ACCD5]';
                const catLabel = ACTIVE_PROJECT_CATEGORY_LABELS[normalizeProjectCategory(proj.category)];

                return (
                  <article
                    key={proj.id}
                    className={`brutal-card brutal-card-interactive overflow-hidden flex flex-col h-full ${tone.cardClass} ${tone.frameClass}`}
                  >
                    {isDars && !useCustomAsset ? (
                      <div
                        className={`aspect-[16/9] border-b-[3px] ${imgBorder} bg-[#013A42] text-[#F8F8E1] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-center gap-5 shrink-0`}
                      >
                        <div className="p-2 bg-[#F8F8E1] border-[3px] border-[#8ACCD5] shadow-[5px_5px_0_0_#6C151E] shrink-0">
                          <DarsLogo className="w-20 h-20 sm:w-24 sm:h-24" />
                        </div>
                        <div className="text-center sm:text-left space-y-1.5 min-w-0">
                          <p className="font-mono-num text-[11px] font-bold uppercase tracking-widest text-[#8ACCD5]">
                            Platform Website Resmi
                          </p>
                          <p className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8F8E1]">
                            {proj.title}
                          </p>
                          <p className="text-xs font-mono-num text-[#F8F8E1]/80 truncate">
                            darswithosama.netlify.app
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className={`aspect-[16/9] border-b-[3px] ${imgBorder} overflow-hidden bg-[#F8F8E1] shrink-0`}>
                        <SafeImage
                          src={proj.imageUrls[0]}
                          alt={proj.title}
                          fallbackLabel={proj.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 text-xs font-mono-num">
                          <span className={tone.badgeClass}>
                            {String(idx + 1).padStart(2, '0')}. {catLabel}
                          </span>
                          <span className="font-bold">{proj.period || 'Aktif'}</span>
                        </div>
                        <h3 className="font-display text-2xl font-extrabold mt-3">{proj.title}</h3>
                        <p className="text-sm sm:text-base text-muted mt-3 leading-relaxed">
                          {proj.description}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-subtle flex flex-wrap items-center gap-3">
                        {proj.liveUrl && (
                          <a
                            href={proj.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${tone.buttonClass} px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap`}
                          >
                            <span>{isDars ? 'Kunjungi Dars with Osama' : 'Buka Tautan'}</span>
                            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedProject(proj)}
                          className={`${tone.secondaryButtonClass} px-4 py-2 text-xs font-bold cursor-pointer whitespace-nowrap`}
                        >
                          Dokumentasi &amp; Detail
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* SECTION B: ARTIKEL & TULISAN (Auto-Synced Live Published Articles from Dars with Osama) */}
      {showArticleSection && (
        <section aria-labelledby="articles-works-heading" className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3 pb-3 border-b-2 border-brutal">
            <div>
              <span className="brutal-badge-bordo">Artikel &amp; Tulisan</span>
              <h2 id="articles-works-heading" className="font-display text-2xl sm:text-3xl font-extrabold mt-2">
                Artikel &amp; Karya Tulis (Dars with Osama)
              </h2>
            </div>
          </div>

          <DarsPublicationsCatalog
            externalQuery={query}
            hideSearchBar
            compactHeader
            initialPageSize={9}
          />

          {/* Preserve any manually stored article_writing items in portfolio Firestore without deleting them */}
          {filteredManualArticles.length > 0 && (
            <div className="pt-4 space-y-4">
              <h3 className="font-display text-xl font-extrabold">
                Tulisan &amp; Arsip Tambahan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {filteredManualArticles.map((proj, idx) => {
                  const tone = getCardTone(idx, ['beige', 'blue', 'green']);
                  return (
                    <article
                      key={proj.id}
                      className={`brutal-card brutal-card-interactive overflow-hidden flex flex-col h-full ${tone.cardClass} ${tone.frameClass}`}
                    >
                      {proj.imageUrls[0] && (
                        <div className="aspect-[16/9] border-b-[3px] border-[#013A42] overflow-hidden bg-[#F8F8E1] shrink-0">
                          <SafeImage
                            src={proj.imageUrls[0]}
                            alt={proj.title}
                            fallbackLabel={proj.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4">
                        <div>
                          <span className={tone.badgeClass}>Artikel &amp; Tulisan</span>
                          <h4 className="font-display text-lg font-extrabold mt-2.5 leading-snug">
                            {proj.title}
                          </h4>
                          <p className="text-sm text-muted mt-2 line-clamp-3">{proj.description}</p>
                        </div>
                        <div className="mt-auto pt-3 border-t border-subtle flex flex-wrap gap-2">
                          {proj.liveUrl && (
                            <a
                              href={proj.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${tone.buttonClass} px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1.5`}
                            >
                              <span>Baca Tulisan</span>
                              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedProject(proj)}
                            className={`${tone.secondaryButtonClass} px-3.5 py-2 text-xs font-bold cursor-pointer`}
                          >
                            Detail
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Project Detail Modal */}
      <Modal
        open={Boolean(selectedProject)}
        onClose={() => setSelectedProject(null)}
        title={selectedProject?.title || ''}
        subtitle={
          selectedProject
            ? `${ACTIVE_PROJECT_CATEGORY_LABELS[normalizeProjectCategory(selectedProject.category)]} · ${selectedProject.period || 'Aktif'}`
            : undefined
        }
        maxWidthClass="max-w-4xl"
      >
        {selectedProject && (
          <div className="space-y-6">
            {isDarsPlatformProject(selectedProject) && !hasCustomUploadedDarsAsset(selectedProject) ? (
              <div className="border-[3px] border-[#013A42] bg-[#013A42] text-[#F8F8E1] p-6 flex flex-col sm:flex-row items-center gap-5 shadow-[4px_4px_0_0_#6C151E]">
                <div className="p-2 bg-[#F8F8E1] border-2 border-[#8ACCD5] shrink-0">
                  <DarsLogo className="w-20 h-20" />
                </div>
                <div>
                  <p className="font-mono-num text-xs font-bold uppercase text-[#8ACCD5]">
                    Platform Pembelajaran &amp; Publikasi Keislaman
                  </p>
                  <p className="font-display text-2xl font-extrabold mt-1">{selectedProject.title}</p>
                  <p className="text-xs font-mono-num text-[#F8F8E1]/80 mt-1">
                    {selectedProject.liveUrl}
                  </p>
                </div>
              </div>
            ) : (
              selectedProject.imageUrls.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedProject.imageUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className={`border-[3px] aspect-[4/3] overflow-hidden shadow-[4px_4px_0_0_#013A42] ${
                        idx % 2 === 0 ? 'border-[#6C151E]' : 'border-[#0F3D3A]'
                      }`}
                    >
                      <SafeImage
                        src={url}
                        alt={`${selectedProject.title} gambar ${idx + 1}`}
                        fallbackLabel={selectedProject.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )
            )}

            <div>
              <h3 className="font-display font-bold text-base mb-1.5">Deskripsi Proyek</h3>
              <p className="text-sm sm:text-base text-muted leading-relaxed whitespace-pre-line">
                {selectedProject.description}
              </p>
            </div>

            {selectedProject.documentation && (
              <div>
                <h3 className="font-display font-bold text-base mb-1.5">Dokumentasi &amp; Catatan Pengembangan</h3>
                <p className="text-sm sm:text-base text-muted leading-relaxed whitespace-pre-line">
                  {selectedProject.documentation}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              {selectedProject.liveUrl && (
                <a
                  href={selectedProject.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="brutal-btn brutal-btn-primary px-4 py-2.5 text-xs font-bold inline-flex items-center gap-2"
                >
                  <span>Kunjungi Tautan Langsung</span>
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                </a>
              )}
              {selectedProject.repoUrl && (
                <a
                  href={selectedProject.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="brutal-btn brutal-btn-secondary px-4 py-2.5 text-xs font-bold inline-flex items-center gap-2"
                >
                  <span>Lihat Repositori</span>
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
