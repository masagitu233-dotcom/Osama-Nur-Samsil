import React, { useEffect, useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import type { InterestCategory, SkillCategory } from '../types/portfolio';
import { getCardTone, type CardTone } from '../utils/cardVariants';
import { getAosStaggerDelay, refreshAos } from '../utils/aos';
import { SafeImage } from '../components/ui/SafeImage';

type FilterGroup = 'all' | 'skills' | 'languages' | 'interests';

const SKILL_GROUPS: Array<{
  key: SkillCategory;
  index: string;
  title: string;
  subtitle: string;
  sequence: CardTone[];
  sectionBadge: string;
}> = [
  {
    key: 'technical',
    index: '01.',
    title: 'Technical Skills',
    subtitle: 'Pengembangan web, deployment, database, dan sistem digital',
    sequence: ['beige', 'blue', 'green', 'bordo'],
    sectionBadge: 'brutal-badge',
  },
  {
    key: 'tool',
    index: '02.',
    title: 'Perangkat & AI Tools',
    subtitle: 'Aplikasi produktivitas, desain, dokumentasi, dan kecerdasan buatan',
    sequence: ['blue', 'beige', 'midnight', 'green'],
    sectionBadge: 'brutal-badge-green',
  },
  {
    key: 'soft',
    index: '03.',
    title: 'Soft Skills',
    subtitle: 'Kepemimpinan, pembinaan, komunikasi, dan manajemen tim',
    sequence: ['green', 'beige', 'bordo', 'blue'],
    sectionBadge: 'brutal-badge-bordo',
  },
  {
    key: 'academic',
    index: '04.',
    title: 'Academic Skills',
    subtitle: 'Kajian hukum keluarga, keilmuan Islam, dan penulisan ilmiah',
    sequence: ['beige', 'bordo', 'blue', 'midnight'],
    sectionBadge: 'brutal-badge',
  },
  {
    key: 'language',
    index: '05.',
    title: 'Language Skills',
    subtitle: 'Penguasaan bahasa dengan tingkat deskriptif mandiri',
    sequence: ['bordo', 'midnight', 'green'],
    sectionBadge: 'brutal-badge-bordo',
  },
];

const INTEREST_GROUPS: Array<{ key: InterestCategory; index: string; title: string }> = [
  { key: 'professional_interest', index: '06.', title: 'Professional Interests' },
  { key: 'personal_interest', index: '07.', title: 'Personal Interests' },
  { key: 'talent_strength', index: '08.', title: 'Talents & Strengths' },
  { key: 'career_interest', index: '09.', title: 'Career Interests' },
  { key: 'academic_interest', index: '10.', title: 'Academic & Scholarly Interests' },
];

export const SkillsPage: React.FC = () => {
  const { publicData } = usePortfolio();
  const { skills, interests } = publicData;
  const [group, setGroup] = useState<FilterGroup>('all');

  const visibleSkillGroups = SKILL_GROUPS.filter((g) => {
    if (group === 'all') return true;
    if (group === 'languages') return g.key === 'language';
    if (group === 'skills') return g.key !== 'language';
    return false;
  });

  const showInterests = group === 'all' || group === 'interests';

  useEffect(() => {
    refreshAos(true);
  }, [group]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
      <header data-aos="fade-up" className="border-b-2 border-brutal pb-5 sm:pb-6">
        <span className="brutal-badge-green">05. Kapabilitas &amp; Potensi</span>
        <h1 className="font-display text-2xl sm:text-3xl lg:text-[34px] font-extrabold mt-2.5 text-balance leading-tight">
          Skills, Interests &amp; Talents
        </h1>
        <p className="mt-2.5 text-sm sm:text-[15px] text-muted max-w-2xl leading-relaxed">
          Keahlian teknis, perangkat kerja, kemampuan bahasa, minat profesional, serta bakat personal — seluruh tingkat kemampuan dideskripsikan secara objektif oleh pemilik portofolio tanpa skor persentase otomatis.
        </p>
      </header>

      {/* Filter Controls */}
      <div role="tablist" aria-label="Filter bagian keahlian dan minat" className="flex flex-wrap gap-2">
        {[
          { value: 'all' as FilterGroup, label: 'Semua Kategori' },
          { value: 'skills' as FilterGroup, label: 'Technical, Tools, Soft & Academic' },
          { value: 'languages' as FilterGroup, label: 'Bahasa' },
          { value: 'interests' as FilterGroup, label: 'Minat, Bakat & Karier' },
        ].map((tab) => {
          const active = group === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setGroup(tab.value)}
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

      {/* Skills Groups */}
      {visibleSkillGroups.length > 0 && (
        <div className="space-y-8">
          {visibleSkillGroups.map((sec) => {
            const items = skills.filter((s) => s.category === sec.key);
            return (
              <section key={sec.key} aria-labelledby={`skill-sec-${sec.key}`}>
                <div data-aos="fade-up" className="mb-3.5">
                  <span className={sec.sectionBadge}>{sec.index}</span>
                  <h2 id={`skill-sec-${sec.key}`} className="font-display text-xl sm:text-2xl font-extrabold mt-1.5">
                    {sec.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted mt-0.5">{sec.subtitle}</p>
                </div>

                {items.length === 0 ? (
                  <div data-aos="fade-up" className="brutal-card card-beige p-5 text-sm text-muted">
                    Belum ada item pada kategori {sec.title}. Tambahkan melalui Dashboard Admin.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item, idx) => {
                      const tone = getCardTone(idx, sec.sequence);
                      return (
                        <article
                          key={item.id}
                          data-aos="fade-up"
                          data-aos-delay={getAosStaggerDelay(idx, 100, 3)}
                          className={`brutal-card p-4 flex flex-col justify-between ${tone.cardClass} ${tone.frameClass}`}
                        >
                          <div>
                            {item.imageUrl && (
                              <div className="aspect-[16/9] mb-3 border-2 border-[#013A42] bg-[#F8F8E1] overflow-hidden">
                                <SafeImage
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex items-baseline justify-between gap-2.5">
                              <h3 className="font-display text-base font-extrabold">{item.name}</h3>
                              {item.proficiencyLabel && (
                                <span className={`shrink-0 ${tone.badgeClass}`}>
                                  {item.proficiencyLabel}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs sm:text-sm text-muted mt-2 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Interests & Talents Groups */}
      {showInterests && (
        <div className="pt-6 border-t-2 border-brutal grid grid-cols-1 md:grid-cols-2 gap-5">
          {INTEREST_GROUPS.map((sec, idx) => {
            const items = interests.filter((i) => i.category === sec.key);
            const tone = getCardTone(idx, ['beige', 'blue', 'green', 'bordo', 'midnight']);
            return (
              <section
                key={sec.key}
                data-aos="fade-up"
                data-aos-delay={getAosStaggerDelay(idx, 100, 2)}
                className={`brutal-card p-5 ${tone.cardClass} ${tone.frameClass}`}
              >
                <span className={tone.badgeClass}>
                  {sec.index}
                </span>
                <h2 className="font-display text-lg font-extrabold mt-2 mb-3">{sec.title}</h2>
                {items.length === 0 ? (
                  <p className="text-sm text-muted">Belum ada item ditambahkan.</p>
                ) : (
                  <ul className="divide-y divide-[var(--card-border-subtle)]">
                    {items.map((item) => (
                      <li key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3">
                        {item.imageUrl && (
                          <div className="w-12 h-12 shrink-0 border-2 border-[#013A42] bg-[#F8F8E1] overflow-hidden">
                            <SafeImage
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm">{item.title}</p>
                          {item.description && (
                            <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};
