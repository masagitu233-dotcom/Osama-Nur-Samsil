import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { LayoutGrid, List, Search } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import type { ExperienceCategory, ExperienceItem, OrganizationItem } from '../types/portfolio';
import { filterExperiences } from '../utils/portfolioLogic';
import { SafeImage } from '../components/ui/SafeImage';
import { Modal } from '../components/ui/Modal';

const CATEGORY_TABS: Array<{ value: ExperienceCategory | 'all'; label: string }> = [
  { value: 'all', label: 'Semua' },
  { value: 'mentoring', label: 'Pembinaan' },
  { value: 'teaching', label: 'Mengajar' },
  { value: 'committee', label: 'Kepanitiaan' },
  { value: 'work', label: 'Pekerjaan' },
];

function categoryLabel(cat: ExperienceCategory): string {
  switch (cat) {
    case 'mentoring':
      return 'Pembinaan';
    case 'teaching':
      return 'Pengajaran';
    case 'committee':
      return 'Kepanitiaan';
    case 'work':
      return 'Pekerjaan';
  }
}

export const ExperiencePage: React.FC = () => {
  const { publicData } = usePortfolio();
  const [category, setCategory] = useState<ExperienceCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'timeline'>('cards');
  const [selectedExp, setSelectedExp] = useState<ExperienceItem | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationItem | null>(null);

  const filteredExperiences = useMemo(
    () => filterExperiences(publicData.experiences, category, query),
    [publicData.experiences, category, query]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="border-b-2 border-brutal pb-8"
      >
        <span className="brutal-badge">02. Rekam Jejak &amp; Dedikasi</span>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold mt-3 text-balance">
          Pengalaman Pembinaan, Mengajar, Organisasi &amp; Kepanitiaan
        </h1>
        <p className="mt-4 text-base text-muted max-w-3xl">
          Klik setiap pengalaman untuk membuka dokumentasi foto, rincian tanggung jawab, dan catatan kontribusi secara lengkap.
        </p>
      </motion.header>

      {/* Filter & View Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div role="tablist" aria-label="Filter kategori pengalaman" className="flex flex-wrap gap-2">
          {CATEGORY_TABS.map((tab) => {
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
                    ? 'surface-highlight shadow-[3px_3px_0_0_var(--shadow)]'
                    : 'surface-card hover:bg-[#8ACCD5] hover:text-[#013A42]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search
              className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari lembaga atau peran..."
              aria-label="Cari pengalaman"
              className="w-full brutal-input pl-10 pr-4 py-2 text-sm"
            />
          </div>

          <div className="flex border-2 border-brutal surface-card">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              aria-label="Tampilan kartu"
              aria-pressed={viewMode === 'cards'}
              className={`px-3 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                viewMode === 'cards' ? 'surface-dark' : 'hover:bg-[#8ACCD5] hover:text-[#013A42]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" aria-hidden="true" />
              <span>Kartu</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              aria-label="Tampilan timeline"
              aria-pressed={viewMode === 'timeline'}
              className={`px-3 py-2 text-xs font-bold inline-flex items-center gap-1.5 border-l-2 border-brutal cursor-pointer transition-colors ${
                viewMode === 'timeline' ? 'surface-dark' : 'hover:bg-[#8ACCD5] hover:text-[#013A42]'
              }`}
            >
              <List className="w-4 h-4" aria-hidden="true" />
              <span>Timeline</span>
            </button>
          </div>
        </div>
      </div>

      {/* Experience List */}
      {filteredExperiences.length === 0 ? (
        <div className="brutal-card surface-card p-10 text-center">
          <p className="font-display text-lg font-bold">Tidak ada pengalaman yang cocok dengan filter saat ini.</p>
          <button
            type="button"
            onClick={() => {
              setCategory('all');
              setQuery('');
            }}
            className="mt-4 brutal-btn brutal-btn-secondary px-4 py-2 text-xs font-bold cursor-pointer"
          >
            Reset Filter
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExperiences.map((exp, idx) => {
            const isHighlighted = idx % 3 === 1;
            return (
              <article
                key={exp.id}
                className={`brutal-card brutal-card-interactive overflow-hidden flex flex-col ${
                  isHighlighted ? 'surface-highlight' : 'surface-card'
                }`}
              >
                {exp.imageUrls[0] && (
                  <div className="aspect-[16/10] border-b-2 border-brutal overflow-hidden">
                    <SafeImage
                      src={exp.imageUrls[0]}
                      alt={`${exp.role} di ${exp.institution}`}
                      fallbackLabel={exp.institution}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs font-mono-num">
                      <span className={isHighlighted ? 'brutal-badge-inverse' : 'brutal-badge'}>
                        {String(idx + 1).padStart(2, '0')}. {categoryLabel(exp.category)}
                      </span>
                      <span className="font-bold">{exp.period}</span>
                    </div>
                    <h2 className="font-display text-xl font-extrabold mt-3 leading-snug">{exp.role}</h2>
                    <p className="text-sm font-bold text-muted mt-1">
                      {exp.institution}
                    </p>
                    {exp.duration && (
                      <p className="text-xs font-mono-num text-muted mt-1">
                        Durasi: {exp.duration}
                      </p>
                    )}
                    <p className="text-sm text-muted mt-3 leading-relaxed">
                      {exp.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-subtle">
                    <button
                      type="button"
                      onClick={() => setSelectedExp(exp)}
                      className={`brutal-btn w-full py-2.5 text-xs font-bold cursor-pointer ${
                        isHighlighted ? 'brutal-btn-primary' : 'brutal-btn-outline'
                      }`}
                    >
                      Lihat Detail &amp; Tanggung Jawab
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <ol className="space-y-5">
          {filteredExperiences.map((exp, idx) => (
            <li
              key={exp.id}
              className={`brutal-card p-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-start ${
                idx % 2 === 1 ? 'surface-highlight' : 'surface-card'
              }`}
            >
              <div className="md:col-span-3 space-y-1.5">
                <span className={idx % 2 === 1 ? 'brutal-badge-inverse' : 'brutal-badge'}>
                  {String(idx + 1).padStart(2, '0')}. {categoryLabel(exp.category)}
                </span>
                <p className="font-display font-extrabold text-lg pt-1">{exp.period}</p>
                {exp.duration && (
                  <p className="text-xs font-mono-num text-muted">{exp.duration}</p>
                )}
              </div>
              <div className="md:col-span-9 space-y-3">
                <div>
                  <h2 className="font-display text-xl font-extrabold">{exp.role}</h2>
                  <p className="text-sm font-bold text-muted">{exp.institution}</p>
                </div>
                <p className="text-sm text-muted leading-relaxed">{exp.description}</p>
                {exp.responsibilities.length > 0 && (
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted">
                    {exp.responsibilities.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedExp(exp)}
                  className={`brutal-btn px-4 py-2 text-xs font-bold cursor-pointer ${
                    idx % 2 === 1 ? 'brutal-btn-primary' : 'brutal-btn-secondary'
                  }`}
                >
                  Buka Detail &amp; Dokumentasi
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {/* Organizations Section */}
      <section aria-labelledby="org-heading" className="pt-6">
        <div className="mb-6 pb-3 border-b-2 border-brutal">
          <span className="brutal-badge">Kepemimpinan Organisasi</span>
          <h2 id="org-heading" className="font-display text-3xl font-extrabold mt-2">
            Pengalaman Organisasi
          </h2>
        </div>

        {publicData.organizations.length === 0 ? (
          <p className="text-sm text-muted">
            Belum ada data organisasi yang dipublikasikan.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {publicData.organizations.map((org, idx) => {
              const isHighlighted = idx % 2 === 1;
              return (
                <article
                  key={org.id}
                  className={`brutal-card brutal-card-interactive p-6 flex flex-col justify-between ${
                    isHighlighted ? 'surface-highlight' : 'surface-card'
                  }`}
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-num">
                      <span className={isHighlighted ? 'brutal-badge-inverse' : 'brutal-badge'}>
                        {org.category}
                      </span>
                      <span className="font-bold">{org.period}</span>
                    </div>
                    <h3 className="font-display text-2xl font-extrabold mt-3">{org.role}</h3>
                    <p className="text-sm font-bold text-muted mt-1">
                      {org.organizationName}
                    </p>
                    <p className="text-sm text-muted mt-3 leading-relaxed">
                      {org.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-subtle">
                    <button
                      type="button"
                      onClick={() => setSelectedOrg(org)}
                      className={`brutal-btn px-4 py-2 text-xs font-bold cursor-pointer ${
                        isHighlighted ? 'brutal-btn-primary' : 'brutal-btn-secondary'
                      }`}
                    >
                      Lihat Rincian Organisasi
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Detail Modal: Experience */}
      <Modal
        open={Boolean(selectedExp)}
        onClose={() => setSelectedExp(null)}
        title={selectedExp?.role || ''}
        subtitle={
          selectedExp
            ? `${selectedExp.institution} · ${selectedExp.period}${selectedExp.duration ? ` · ${selectedExp.duration}` : ''}`
            : undefined
        }
      >
        {selectedExp && (
          <div className="space-y-6">
            {selectedExp.imageUrls.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedExp.imageUrls.map((url, idx) => (
                  <div key={idx} className="border-2 border-brutal aspect-[4/3] overflow-hidden">
                    <SafeImage
                      src={url}
                      alt={`Dokumentasi ${selectedExp.institution} ${idx + 1}`}
                      fallbackLabel={selectedExp.institution}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
            <div>
              <h3 className="font-display font-bold text-base mb-2">Deskripsi</h3>
              <p className="text-sm sm:text-base leading-relaxed text-muted whitespace-pre-line">
                {selectedExp.description}
              </p>
            </div>
            {selectedExp.responsibilities.length > 0 && (
              <div>
                <h3 className="font-display font-bold text-base mb-2">Tanggung Jawab Utama</h3>
                <ul className="list-disc pl-5 space-y-1.5 text-sm sm:text-base text-muted">
                  {selectedExp.responsibilities.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Detail Modal: Organization */}
      <Modal
        open={Boolean(selectedOrg)}
        onClose={() => setSelectedOrg(null)}
        title={selectedOrg?.role || ''}
        subtitle={selectedOrg ? `${selectedOrg.organizationName} · ${selectedOrg.period}` : undefined}
      >
        {selectedOrg && (
          <div className="space-y-5">
            {selectedOrg.imageUrls.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedOrg.imageUrls.map((url, idx) => (
                  <div key={idx} className="border-2 border-brutal aspect-[4/3] overflow-hidden">
                    <SafeImage
                      src={url}
                      alt={`Dokumentasi ${selectedOrg.organizationName} ${idx + 1}`}
                      fallbackLabel={selectedOrg.organizationName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm sm:text-base leading-relaxed text-muted whitespace-pre-line">
              {selectedOrg.description}
            </p>
            {selectedOrg.responsibilities.length > 0 && (
              <div>
                <h3 className="font-display font-bold text-base mb-2">Amanah &amp; Program Kerja</h3>
                <ul className="list-disc pl-5 space-y-1.5 text-sm sm:text-base text-muted">
                  {selectedOrg.responsibilities.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
