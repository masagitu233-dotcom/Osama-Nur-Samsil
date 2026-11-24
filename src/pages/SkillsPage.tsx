import React, { useState } from 'react';
import { motion } from 'motion/react';
import { usePortfolio } from '../context/PortfolioContext';
import type { InterestCategory, SkillCategory } from '../types/portfolio';

type FilterGroup = 'all' | 'skills' | 'languages' | 'interests';

const SKILL_GROUPS: Array<{ key: SkillCategory; index: string; title: string; subtitle: string }> = [
  { key: 'technical', index: '01.', title: 'Technical Skills', subtitle: 'Pengembangan web, deployment, database, dan sistem digital' },
  { key: 'tool', index: '02.', title: 'Perangkat & AI Tools', subtitle: 'Aplikasi produktivitas, desain, dokumentasi, dan kecerdasan buatan' },
  { key: 'soft', index: '03.', title: 'Soft Skills', subtitle: 'Kepemimpinan, pembinaan, komunikasi, dan manajemen tim' },
  { key: 'academic', index: '04.', title: 'Academic Skills', subtitle: 'Kajian hukum keluarga, keilmuan Islam, dan penulisan ilmiah' },
  { key: 'language', index: '05.', title: 'Language Skills', subtitle: 'Penguasaan bahasa dengan tingkat deskriptif mandiri' },
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
        <span className="brutal-badge">05. Kapabilitas &amp; Potensi</span>
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
                  ? 'surface-highlight shadow-[3px_3px_0_0_var(--shadow)]'
                  : 'surface-card hover:bg-[#8ACCD5] hover:text-[#013A42]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Skills Groups */}
      {visibleSkillGroups.length > 0 && (
        <div className="space-y-10">
          {visibleSkillGroups.map((sec) => {
            const items = skills.filter((s) => s.category === sec.key);
            const isLanguageGroup = sec.key === 'language';
            return (
              <section key={sec.key} aria-labelledby={`skill-sec-${sec.key}`}>
                <div className="mb-5">
                  <span className="brutal-badge">{sec.index}</span>
                  <h2 id={`skill-sec-${sec.key}`} className="font-display text-2xl sm:text-3xl font-extrabold mt-2">
                    {sec.title}
                  </h2>
                  <p className="text-sm text-muted mt-1">{sec.subtitle}</p>
                </div>

                {items.length === 0 ? (
                  <div className="brutal-card surface-card p-6 text-sm text-muted">
                    Belum ada item pada kategori {sec.title}. Tambahkan melalui Dashboard Admin.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {items.map((item) => (
                      <article
                        key={item.id}
                        className={`brutal-card p-5 flex flex-col justify-between ${
                          isLanguageGroup ? 'surface-highlight' : 'surface-card'
                        }`}
                      >
                        <div>
                          <div className="flex items-baseline justify-between gap-3">
                            <h3 className="font-display text-lg font-extrabold">{item.name}</h3>
                            {item.proficiencyLabel && (
                              <span
                                className={`shrink-0 ${
                                  isLanguageGroup ? 'brutal-badge-inverse' : 'brutal-badge'
                                }`}
                              >
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
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Interests & Talents Groups */}
      {showInterests && (
        <div className="pt-8 border-t-2 border-brutal grid grid-cols-1 md:grid-cols-2 gap-6">
          {INTEREST_GROUPS.map((sec, idx) => {
            const items = interests.filter((i) => i.category === sec.key);
            const isHighlighted = idx === 3;
            return (
              <section
                key={sec.key}
                className={`brutal-card p-6 ${isHighlighted ? 'surface-highlight' : 'surface-card'}`}
              >
                <span className={isHighlighted ? 'brutal-badge-inverse' : 'brutal-badge'}>
                  {sec.index}
                </span>
                <h2 className="font-display text-xl font-extrabold mt-2 mb-4">{sec.title}</h2>
                {items.length === 0 ? (
                  <p className="text-sm text-muted">Belum ada item ditambahkan.</p>
                ) : (
                  <ul className="divide-y divide-[var(--border-subtle)]">
                    {items.map((item) => (
                      <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                        <p className="font-bold text-sm sm:text-base">{item.title}</p>
                        {item.description && (
                          <p className="text-sm text-muted mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        )}
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
