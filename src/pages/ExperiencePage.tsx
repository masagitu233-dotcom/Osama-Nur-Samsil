import React, { useMemo, useState } from 'react';
import { LayoutGrid, List, Search } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import type { ExperienceCategory, ExperienceItem, OrganizationItem } from '../types/portfolio';
import { filterExperiences } from '../utils/portfolioLogic';
import { SafeImage } from '../components/ui/SafeImage';
import { getCardTone } from '../utils/cardVariants';
import { resolveExperiencePrimaryPhoto } from '../utils/experienceGallery';
import { getAosStaggerDelay } from '../utils/aos';
import {
  ExperienceDetailModal,
  type ExperienceDetailViewData,
} from '../components/experience/ExperienceDetailModal';

const CATEGORY_TABS: Array<{ value: ExperienceCategory | 'all'; label: string }> = [
  { value: 'all', label: 'Semua' },
  { value: 'mentoring', label: 'Pembinaan' },
  { value: 'teaching', label: 'Mengajar' },
  { value: 'committee', label: 'Kepanitiaan' },
  { value: 'work', label: 'Pengalaman Kerja' },
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
      return 'Pengalaman Kerja';
  }
}

function toExperienceDetail(exp: ExperienceItem): ExperienceDetailViewData {
  return {
    id: exp.id,
    role: exp.role,
    categoryLabel: categoryLabel(exp.category),
    institutionName: exp.institution,
    period: exp.period,
    duration: exp.duration,
    location: exp.location,
    description: exp.description,
    responsibilities: exp.responsibilities,
    responsibilitiesHeading: 'Tanggung Jawab & Program',
    imageUrls: exp.imageUrls,
    primaryImageUrl: exp.primaryImageUrl,
  };
}

function toOrganizationDetail(org: OrganizationItem): ExperienceDetailViewData {
  return {
    id: org.id,
    role: org.role,
    categoryLabel: org.category || 'Organisasi',
    institutionName: org.organizationName,
    period: org.period,
    description: org.description,
    responsibilities: org.responsibilities,
    responsibilitiesHeading: 'Amanah & Program Kerja',
    imageUrls: org.imageUrls,
    primaryImageUrl: org.primaryImageUrl,
  };
}

export const ExperiencePage: React.FC = () => {
  const { publicData } = usePortfolio();
  const [category, setCategory] = useState<ExperienceCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'timeline'>('cards');
  const [selectedDetail, setSelectedDetail] = useState<ExperienceDetailViewData | null>(null);

  const filteredExperiences = useMemo(
    () => filterExperiences(publicData.experiences, category, query),
    [publicData.experiences, category, query]
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
      <header data-aos="fade-up" className="border-b-2 border-brutal pb-5 sm:pb-6">
        <span className="brutal-badge-green">02. Rekam Jejak &amp; Dedikasi</span>
        <h1 className="font-display text-2xl sm:text-3xl lg:text-[34px] font-extrabold mt-2.5 text-balance leading-tight">
          Pengalaman Pembinaan, Mengajar, Organisasi &amp; Kepanitiaan
        </h1>
        <p className="mt-2.5 text-sm sm:text-[15px] text-muted max-w-2xl leading-relaxed">
          Pilih kartu pengalaman untuk membuka rincian peran, tanggung jawab, dan galeri foto dokumentasi lengkap.
        </p>
      </header>

      {/* Filter & View Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
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
                className={`px-3.5 py-1.5 text-xs font-bold border-2 border-brutal cursor-pointer whitespace-nowrap transition-colors ${
                  active
                    ? 'card-blue shadow-[2.5px_2.5px_0_0_#013A42]'
                    : 'card-beige hover:bg-[#8ACCD5] hover:text-[#013A42]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-60">
            <Search
              className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari lembaga atau peran..."
              aria-label="Cari pengalaman"
              className="w-full brutal-input pl-9 pr-3 py-1.5 text-sm"
            />
          </div>

          <div className="flex border-2 border-brutal card-beige">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              aria-label="Tampilan kartu"
              aria-pressed={viewMode === 'cards'}
              className={`px-2.5 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                viewMode === 'cards' ? 'card-midnight' : 'hover:bg-[#8ACCD5] hover:text-[#013A42]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Kartu</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              aria-label="Tampilan timeline"
              aria-pressed={viewMode === 'timeline'}
              className={`px-2.5 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 border-l-2 border-brutal cursor-pointer transition-colors ${
                viewMode === 'timeline' ? 'card-midnight' : 'hover:bg-[#8ACCD5] hover:text-[#013A42]'
              }`}
            >
              <List className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Timeline</span>
            </button>
          </div>
        </div>
      </div>

      {/* Experience List — Concise Uniform-Height Neo-Brutalist Cards with 16:9 Primary Photo */}
      {filteredExperiences.length === 0 ? (
        <div className="brutal-card card-beige p-8 text-center">
          <p className="font-display text-base font-bold">Tidak ada pengalaman yang cocok dengan filter saat ini.</p>
          <button
            type="button"
            onClick={() => {
              setCategory('all');
              setQuery('');
            }}
            className="mt-3 brutal-btn brutal-btn-secondary px-4 py-2 text-xs font-bold cursor-pointer"
          >
            Reset Filter
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {filteredExperiences.map((exp, idx) => {
            const tone = getCardTone(idx, ['beige', 'blue', 'green', 'bordo', 'midnight']);
            const primaryPhoto = resolveExperiencePrimaryPhoto(exp.imageUrls, exp.primaryImageUrl);
            const photoFrameBorder =
              tone.tone === 'beige'
                ? 'border-[#6C151E]'
                : tone.tone === 'blue'
                ? 'border-[#013A42]'
                : 'border-[#8ACCD5]';

            return (
              <article
                key={exp.id}
                data-aos="fade-up"
                data-aos-delay={getAosStaggerDelay(idx, 70, 3)}
                className={`brutal-card brutal-card-interactive overflow-hidden flex flex-col h-full ${tone.cardClass} ${tone.frameClass}`}
              >
                <div className={`aspect-[16/9] w-full overflow-hidden border-b-2 ${photoFrameBorder} bg-[#F8F8E1] shrink-0`}>
                  <SafeImage
                    src={primaryPhoto}
                    alt={`Foto utama ${exp.institution}`}
                    fallbackLabel={exp.institution}
                    className="w-full h-full block object-cover object-[50%_22%]"
                  />
                </div>

                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3.5">
                  <div className="flex-1 flex flex-col items-start gap-2">
                    <span className={tone.badgeClass}>
                      {categoryLabel(exp.category)}
                    </span>
                    <h2 className="font-display text-base sm:text-[17px] font-extrabold leading-snug min-h-[2.75rem]">
                      {exp.institution}
                    </h2>
                  </div>

                  <div className="mt-auto pt-3 border-t border-subtle">
                    <button
                      type="button"
                      onClick={() => setSelectedDetail(toExperienceDetail(exp))}
                      className={`${tone.buttonClass} w-full py-2 px-3.5 text-xs font-bold cursor-pointer`}
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
        <ol className="space-y-4">
          {filteredExperiences.map((exp, idx) => {
            const tone = getCardTone(idx, ['beige', 'blue', 'green', 'bordo', 'midnight']);
            const primaryPhoto = resolveExperiencePrimaryPhoto(exp.imageUrls, exp.primaryImageUrl);
            return (
              <li
                key={exp.id}
                data-aos="fade-up"
                data-aos-delay={getAosStaggerDelay(idx, 60, 2)}
                className={`brutal-card p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center ${tone.cardClass} ${tone.frameClass}`}
              >
                <div className="md:col-span-4 aspect-[16/9] w-full border-2 border-[#013A42] bg-[#F8F8E1] overflow-hidden">
                  <SafeImage
                    src={primaryPhoto}
                    alt={`Foto utama ${exp.institution}`}
                    fallbackLabel={exp.institution}
                    className="w-full h-full block object-cover object-[50%_22%]"
                  />
                </div>
                <div className="md:col-span-8 flex flex-col items-start gap-2.5">
                  <span className={tone.badgeClass}>{categoryLabel(exp.category)}</span>
                  <h2 className="font-display text-lg sm:text-xl font-extrabold leading-snug">
                    {exp.institution}
                  </h2>
                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={() => setSelectedDetail(toExperienceDetail(exp))}
                      className={`${tone.buttonClass} px-3.5 py-2 text-xs font-bold cursor-pointer`}
                    >
                      Lihat Detail &amp; Tanggung Jawab
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {/* Organizations Section */}
      <section aria-labelledby="org-heading" className="pt-4">
        <div data-aos="fade-up" className="mb-5 pb-3 border-b-2 border-brutal">
          <span className="brutal-badge-bordo">Kepemimpinan Organisasi</span>
          <h2 id="org-heading" className="font-display text-xl sm:text-2xl font-extrabold mt-1.5">
            Pengalaman Organisasi
          </h2>
        </div>

        {publicData.organizations.length === 0 ? (
          <p className="text-sm text-muted">
            Belum ada data organisasi yang dipublikasikan.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
            {publicData.organizations.map((org, idx) => {
              const tone = getCardTone(idx, ['bordo', 'beige', 'green', 'blue']);
              const primaryPhoto = resolveExperiencePrimaryPhoto(org.imageUrls, org.primaryImageUrl);
              const photoFrameBorder =
                tone.tone === 'beige'
                  ? 'border-[#6C151E]'
                  : tone.tone === 'blue'
                  ? 'border-[#013A42]'
                  : 'border-[#8ACCD5]';

              return (
                <article
                  key={org.id}
                  data-aos="fade-up"
                  data-aos-delay={getAosStaggerDelay(idx, 70, 3)}
                  className={`brutal-card brutal-card-interactive overflow-hidden flex flex-col h-full ${tone.cardClass} ${tone.frameClass}`}
                >
                  <div className={`aspect-[16/9] w-full overflow-hidden border-b-2 ${photoFrameBorder} bg-[#F8F8E1] shrink-0`}>
                    <SafeImage
                      src={primaryPhoto}
                      alt={`Foto utama ${org.organizationName}`}
                      fallbackLabel={org.organizationName}
                      className="w-full h-full block object-cover object-[50%_22%]"
                    />
                  </div>

                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3.5">
                    <div className="flex-1 flex flex-col items-start gap-2">
                      <span className={tone.badgeClass}>
                        {org.category || 'Organisasi'}
                      </span>
                      <h3 className="font-display text-base sm:text-[17px] font-extrabold leading-snug min-h-[2.75rem]">
                        {org.organizationName}
                      </h3>
                    </div>

                    <div className="mt-auto pt-3 border-t border-subtle">
                      <button
                        type="button"
                        onClick={() => setSelectedDetail(toOrganizationDetail(org))}
                        className={`${tone.buttonClass} w-full py-2 px-3.5 text-xs font-bold cursor-pointer`}
                      >
                        Lihat Detail &amp; Tanggung Jawab
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Unified Detail Modal + Natural-Ratio Responsive Documentation Gallery + Lightbox */}
      <ExperienceDetailModal
        detail={selectedDetail}
        onClose={() => setSelectedDetail(null)}
      />
    </div>
  );
};
