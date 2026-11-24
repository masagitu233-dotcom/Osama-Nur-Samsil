import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Search } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import type { ProjectCategory, ProjectItem } from '../types/portfolio';
import { filterProjects } from '../utils/portfolioLogic';
import { SafeImage } from '../components/ui/SafeImage';
import { Modal } from '../components/ui/Modal';
import { getCardTone } from '../utils/cardVariants';

const PROJECT_TABS: Array<{ value: ProjectCategory | 'all'; label: string }> = [
  { value: 'all', label: 'Semua Karya' },
  { value: 'dars_with_osama', label: 'Dars with Osama' },
  { value: 'website_digital', label: 'Website & Digital' },
  { value: 'article_writing', label: 'Artikel & Tulisan' },
  { value: 'learning_material', label: 'Materi Pembelajaran' },
  { value: 'design_media', label: 'Desain & Media' },
  { value: 'other', label: 'Lainnya' },
];

const PROJECT_CAT_LABELS: Record<ProjectCategory, string> = {
  dars_with_osama: 'Dars with Osama',
  website_digital: 'Website & Digital',
  article_writing: 'Artikel & Tulisan',
  learning_material: 'Materi Pembelajaran',
  design_media: 'Desain & Media',
  other: 'Proyek Lainnya',
};

export const ProjectsPage: React.FC = () => {
  const { publicData } = usePortfolio();
  const [category, setCategory] = useState<ProjectCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

  const filtered = useMemo(
    () => filterProjects(publicData.projects, category, query),
    [publicData.projects, category, query]
  );

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
          Eksplorasi platform pembelajaran digital Dars with Osama, proyek website, artikel ilmiah, materi ajar, serta karya desain dan media.
        </p>
      </motion.header>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div role="tablist" aria-label="Filter kategori proyek" className="flex flex-wrap gap-2">
          {PROJECT_TABS.map((tab) => {
            const active = category === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCategory(tab.value)}
                className={`px-3.5 py-2 text-xs font-bold border-2 border-brutal cursor-pointer whitespace-nowrap transition-colors ${
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
            placeholder="Cari proyek atau karya..."
            aria-label="Cari proyek"
            className="w-full brutal-input pl-10 pr-4 py-2 text-sm"
          />
        </div>
      </div>

      {/* Projects Grid (Planned 5-Color Variation Cycle) */}
      {filtered.length === 0 ? (
        <div className="brutal-card card-beige p-10 text-center">
          <p className="font-display text-lg font-bold">Belum ada proyek pada kategori ini.</p>
          <button
            type="button"
            onClick={() => {
              setCategory('all');
              setQuery('');
            }}
            className="mt-4 brutal-btn brutal-btn-secondary px-4 py-2 text-xs font-bold cursor-pointer"
          >
            Tampilkan Semua Proyek
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filtered.map((proj, idx) => {
            const tone = getCardTone(idx, ['beige', 'green', 'bordo', 'blue', 'midnight']);
            const imgBorder =
              tone.tone === 'beige'
                ? 'border-[#6C151E]'
                : tone.tone === 'blue'
                ? 'border-[#013A42]'
                : 'border-[#8ACCD5]';
            return (
              <article
                key={proj.id}
                className={`brutal-card brutal-card-interactive overflow-hidden flex flex-col ${tone.cardClass} ${tone.frameClass}`}
              >
                <div className={`aspect-[16/10] border-b-[3px] ${imgBorder} overflow-hidden bg-[#F8F8E1]`}>
                  <SafeImage
                    src={proj.imageUrls[0]}
                    alt={proj.title}
                    fallbackLabel={proj.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs font-mono-num">
                      <span className={tone.badgeClass}>
                        {String(idx + 1).padStart(2, '0')}. {PROJECT_CAT_LABELS[proj.category]}
                      </span>
                      <span className="font-bold">{proj.period || 'Aktif'}</span>
                    </div>
                    <h2 className="font-display text-2xl font-extrabold mt-3">{proj.title}</h2>
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
                        <span>Buka Tautan</span>
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

      {/* Project Detail Modal */}
      <Modal
        open={Boolean(selectedProject)}
        onClose={() => setSelectedProject(null)}
        title={selectedProject?.title || ''}
        subtitle={
          selectedProject
            ? `${PROJECT_CAT_LABELS[selectedProject.category]} · ${selectedProject.period || 'Aktif'}`
            : undefined
        }
        maxWidthClass="max-w-4xl"
      >
        {selectedProject && (
          <div className="space-y-6">
            {selectedProject.imageUrls.length > 0 && (
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
