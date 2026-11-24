import React, { useState } from 'react';
import { motion } from 'motion/react';
import { usePortfolio } from '../context/PortfolioContext';
import type { InterestCategory, SkillCategory } from '../types/portfolio';
import { getCardTone, type CardTone } from '../utils/cardVariants';
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="border-b-2 border-brutal pb-8"
      >
        <span className="brutal-badge-green">05. Kapabilitas &amp; Potensi</span>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold mt-3 text-balance">
          Skills, Interests &amp; Talents
        </h1>
        <p className="mt-4 text-base text-muted max-w-3xl">
          Keahlian teknis, perangkat kerja, kemampuan bahasa, minat profesional, serta bakat personal — seluruh tingkat kemampuan dideskripsikan secara objektif oleh pemilik portofolio tanpa skor persentase otomatis.
        </p>
      </motion.header>

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

      {/* Skills Groups (Planned Multi-Color Card Rhythm) */}
      {visibleSkillGroups.length > 0 && (
        <div className="space-y-10">
          {visibleSkillGroups.map((sec) => {
            const items = skills.filter((s) => s.category === sec.key);
            return (
              <section key={sec.key} aria-labelledby={`skill-sec-${sec.key}`}>
                <div className="mb-5">
                  <span className={sec.sectionBadge}>{sec.index}</span>
                  <h2 id={`skill-sec-${sec.key}`} className="font-display text-2xl sm:text-3xl font-extrabold mt-2">
                    {sec.title}
                  </h2>
                  <p className="text-sm text-muted mt-1">{sec.subtitle}</p>
                </div>

                {items.length === 0 ? (
                  <div className="brutal-card card-beige p-6 text-sm text-muted">
                    Belum ada item pada kategori {sec.title}. Tambahkan melalui Dashboard Admin.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {items.map((item, idx) => {
                      const tone = getCardTone(idx, sec.sequence);
                      return (
                        <article
                          key={item.id}
                          className={`brutal-card p-5 flex flex-col justify-between ${tone.cardClass} ${tone.frameClass}`}
                        >
                          <div>
                            {item.imageUrl && (
                              <div className="aspect-[16/9] mb-3.5 border-2 border-[#013A42] bg-[#F8F8E1] overflow-hidden">
                                <SafeImage
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex items-baseline justify-between gap-3">
                              <h3 className="font-display text-lg font-extrabold">{item.name}</h3>
                              {item.proficiencyLabel && (
                                <span className={`shrink-0 ${tone.badgeClass}`}>
                                  {item.proficiencyLabel}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted mt-2.5 leading-relaxed">
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

      {/* Interests & Talents Groups (All 5 Card Variants Across 5 Groups) */}
      {showInterests && (
        <div className="pt-8 border-t-2 border-brutal grid grid-cols-1 md:grid-cols-2 gap-6">
          {INTEREST_GROUPS.map((sec, idx) => {
            const items = interests.filter((i) => i.category === sec.key);
            const tone = getCardTone(idx, ['beige', 'blue', 'green', 'bordo', 'midnight']);
            return (
              <section
                key={sec.key}
                className={`brutal-card p-6 ${tone.cardClass} ${tone.frameClass}`}
              >
                <span className={tone.badgeClass}>
                  {sec.index}
                </span>
                <h2 className="font-display text-xl font-extrabold mt-2 mb-4">{sec.title}</h2>
                {items.length === 0 ? (
                  <p className="text-sm text-muted">Belum ada item ditambahkan.</p>
                ) : (
                  <ul className="divide-y divide-[var(--card-border-subtle)]">
                    {items.map((item) => (
                      <li key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                        {item.imageUrl && (
                          <div className="w-14 h-14 shrink-0 border-2 border-[#013A42] bg-[#F8F8E1] overflow-hidden">
                            <SafeImage
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm sm:text-base">{item.title}</p>
                          {item.description && (
                            <p className="text-sm text-muted mt-1 leading-relaxed">
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
