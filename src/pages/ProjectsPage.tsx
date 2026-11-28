import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import type { ProjectItem } from '../types/portfolio';
import { SafeImage } from '../components/ui/SafeImage';
import { DarsLogo } from '../components/ui/DarsLogo';
import { ProjectDetailModal } from '../components/projects/ProjectDetailModal';
import { getSectionCardTone } from '../utils/cardVariants';
import { getAosStaggerDelay, refreshAos } from '../utils/aos';
import {
  ACTIVE_PROJECT_CATEGORY_LABELS,
  ACTIVE_PROJECT_TABS,
  filterManualArticleProjects,
  filterWebsiteProjectsByQuery,
  hasCustomUploadedDarsAsset,
  isDarsPlatformProject,
  normalizeProjectCategory,
  prepareWebsiteProjects,
  resolveProjectPrimaryPhoto,
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

  useEffect(() => {
    refreshAos(true);
  }, [category, query]);

  return (
    <div
      data-sizing-scope="projects"
      className="sizing-page-shell max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10"
    >
      <header data-aos="fade-up" className="border-b-2 border-brutal pb-5">
        <span className="brutal-badge-bordo">06. Karya &amp; Inisiatif Digital</span>
        <h1 className="font-display text-2xl sm:text-3xl lg:text-[34px] font-extrabold mt-2.5 text-balance leading-tight">
          Projects &amp; Works
        </h1>
        <p className="mt-2.5 text-sm sm:text-[15px] text-muted max-w-2xl leading-relaxed">
          Katalog proyek website dan inisiatif digital, termasuk platform pembelajaran keislaman Dars with Osama beserta arsip artikel dan tulisan yang terbit secara otomatis.
        </p>
      </header>

      {/* Filters (Strictly 3 Categories) & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
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
                className={`px-3.5 py-1.5 text-xs font-bold border-2 border-brutal cursor-pointer whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-[#0F3D3A] text-[#F8F8E1] shadow-[2.5px_2.5px_0_0_#001F24]'
                    : 'bg-[#F8F8E1] text-[#1B2A3D] hover:bg-[#D9B44A] hover:text-[#001F24]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative sm:w-64">
          <Search
            className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#1B2A3D]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari proyek atau artikel..."
            aria-label="Cari proyek atau artikel"
            className="w-full brutal-input pl-9 pr-3 py-1.5 text-sm"
          />
        </div>
      </div>

      {/* SECTION A: WEBSITE & DIGITAL */}
      {showWebsiteSection && (
        <section aria-labelledby="website-projects-heading" className="space-y-5">
          <div data-aos="fade-up" className="flex flex-wrap items-end justify-between gap-3 pb-2.5 border-b-2 border-brutal">
            <div>
              <span className="brutal-badge-green">Website &amp; Digital</span>
              <h2 id="website-projects-heading" className="font-display text-xl sm:text-2xl font-extrabold mt-1.5">
                Proyek Website &amp; Platform Digital
              </h2>
            </div>
            <span className="font-mono-num text-xs font-bold text-muted">
              {filteredWebsiteProjects.length} Proyek
            </span>
          </div>

          {filteredWebsiteProjects.length === 0 ? (
            <div className="brutal-card card-green frame-green p-8 text-center">
              <p className="font-display text-base font-bold text-[#F8F8E1]">
                Tidak ada proyek Website &amp; Digital yang cocok dengan pencarian.
              </p>
              <button
                type="button"
                onClick={() => setQuery('')}
                className="mt-3 brutal-btn-frame-green px-4 py-2 text-xs font-bold cursor-pointer"
              >
                Reset Pencarian
              </button>
            </div>
          ) : (
            <div className="sizing-card-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
              {filteredWebsiteProjects.map((proj, idx) => {
                const isDars = isDarsPlatformProject(proj);
                const useCustomAsset = hasCustomUploadedDarsAsset(proj);
                const primaryPhoto = resolveProjectPrimaryPhoto(proj);
                const tone = getSectionCardTone('projects');
                const catLabel = ACTIVE_PROJECT_CATEGORY_LABELS[normalizeProjectCategory(proj.category)];

                return (
                  <article
                    key={proj.id}
                    data-aos="fade-up"
                    data-aos-delay={getAosStaggerDelay(idx, 100, 3)}
                    className={`brutal-card brutal-card-interactive overflow-hidden flex flex-col h-full ${tone.cardClass} ${tone.frameClass}`}
                  >
                    <div className={`sizing-media-box aspect-[16/9] w-full border-b-2 ${tone.mediaBorderClass} overflow-hidden shrink-0`}>
                      {isDars && !useCustomAsset ? (
                        <div className="w-full h-full bg-[#F4F4F0] flex items-center justify-center p-3">
                          <DarsLogo className="w-full h-full object-contain" />
                        </div>
                      ) : isDars ? (
                        <div className="w-full h-full bg-[#F4F4F0] flex items-center justify-center p-3">
                          <SafeImage
                            src={primaryPhoto}
                            alt={proj.title}
                            fallbackLabel={proj.title}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-[#F8F8E1]">
                          <SafeImage
                            src={primaryPhoto}
                            alt={proj.title}
                            fallbackLabel={proj.title}
                            className="w-full h-full block object-cover"
                          />
                        </div>
                      )}
                    </div>

                    <div className="sizing-media-body p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3.5">
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-num">
                          <span className={tone.badgeClass}>{catLabel}</span>
                          {proj.period && (
                            <span className="font-bold text-muted">{proj.period}</span>
                          )}
                        </div>
                        <h3 className="font-display text-base sm:text-[17px] font-extrabold leading-snug line-clamp-2 min-h-[2.5rem]">
                          {proj.title}
                        </h3>
                      </div>

                      <div className="mt-auto pt-3 border-t border-subtle">
                        <button
                          type="button"
                          onClick={() => setSelectedProject(proj)}
                          className={`${tone.buttonClass} w-full py-2 px-3.5 text-xs font-bold cursor-pointer`}
                        >
                          Lihat Detail
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

      {/* SECTION B: ARTIKEL & TULISAN */}
      {showArticleSection && (
        <section aria-labelledby="articles-works-heading" className="space-y-5">
          <div data-aos="fade-up" className="flex flex-wrap items-end justify-between gap-3 pb-2.5 border-b-2 border-brutal">
            <div>
              <span className="brutal-badge-bordo">Artikel &amp; Tulisan</span>
              <h2 id="articles-works-heading" className="font-display text-xl sm:text-2xl font-extrabold mt-1.5">
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
            <div className="pt-3 space-y-3.5">
              <h3 data-aos="fade-up" className="font-display text-lg font-extrabold">
                Tulisan &amp; Arsip Tambahan
              </h3>
              <div className="sizing-card-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
                {filteredManualArticles.map((proj, idx) => {
                  const tone = getSectionCardTone('projects');
                  return (
                    <article
                      key={proj.id}
                      data-aos="fade-up"
                      data-aos-delay={getAosStaggerDelay(idx, 100, 3)}
                      className={`brutal-card brutal-card-interactive overflow-hidden flex flex-col h-full ${tone.cardClass} ${tone.frameClass}`}
                    >
                      {proj.imageUrls[0] && (
                        <div className={`sizing-media-box aspect-[16/9] border-b-2 ${tone.mediaBorderClass} overflow-hidden bg-[#F8F8E1] shrink-0`}>
                          <SafeImage
                            src={proj.imageUrls[0]}
                            alt={proj.title}
                            fallbackLabel={proj.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="sizing-media-body p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3.5">
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-num">
                            <span className={tone.badgeClass}>Artikel &amp; Tulisan</span>
                            {proj.period && (
                              <span className="font-bold text-muted">{proj.period}</span>
                            )}
                          </div>
                          <h4 className="font-display text-base sm:text-[17px] font-extrabold leading-snug line-clamp-2 min-h-[2.5rem]">
                            {proj.title}
                          </h4>
                        </div>
                        <div className="mt-auto pt-3 border-t border-subtle">
                          <button
                            type="button"
                            onClick={() => setSelectedProject(proj)}
                            className={`${tone.buttonClass} w-full py-2 px-3.5 text-xs font-bold cursor-pointer`}
                          >
                            Lihat Detail
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

      {/* Shared Project Detail Modal */}
      <ProjectDetailModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  );
};
