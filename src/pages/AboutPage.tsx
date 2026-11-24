import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import type { InterestCategory, PublicRoute } from '../types/portfolio';
import { SafeImage } from '../components/ui/SafeImage';
import { getCardTone } from '../utils/cardVariants';

interface AboutPageProps {
  onNavigate: (route: PublicRoute) => void;
}

const INTEREST_SECTIONS: Array<{
  key: InterestCategory;
  index: string;
  title: string;
}> = [
  { key: 'professional_interest', index: '03.', title: 'Minat Profesional' },
  { key: 'academic_interest', index: '04.', title: 'Minat Akademik & Keilmuan' },
  { key: 'talent_strength', index: '05.', title: 'Bakat & Kemampuan Personal' },
  { key: 'career_interest', index: '06.', title: 'Bidang Pekerjaan yang Diminati' },
];

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const { publicData } = usePortfolio();
  const { profile, education, interests } = publicData;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Page Header */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="border-b-2 border-brutal pb-8"
      >
        <span className="brutal-badge-bordo">01. Tentang Saya</span>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold mt-3 text-balance">
          Biografi, Visi &amp; Arah Profesional
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted max-w-3xl leading-relaxed">
          {profile.headline} &middot; {profile.domicile}
        </p>
      </motion.header>

      {/* Biography Split (Portrait on LEFT in Bordo frame, Bio & Focus on RIGHT) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 brutal-card card-bordo frame-midnight overflow-hidden">
          <div className="aspect-[3/4] bg-[#F8F8E1]">
            <SafeImage
              src={profile.photoUrl}
              alt={profile.fullName}
              fallbackLabel={profile.fullName}
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="p-5 border-t-[2.5px] border-[#013A42] space-y-2 text-sm">
            <p className="font-display font-extrabold text-lg text-[#F8F8E1]">{profile.fullName}</p>
            <p className="text-[#8ACCD5] font-semibold">{profile.domicile}</p>
            {education[0] && (
              <p className="font-mono-num text-xs pt-2 border-t border-subtle font-semibold text-[#F8F8E1]/90">
                {education[0].degree} &middot; {education[0].institution} ({education[0].graduationYear})
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="brutal-card card-beige frame-shadow-green p-6 sm:p-8">
            <h2 className="font-display text-2xl font-extrabold mb-4">Biografi Profesional</h2>
            <div className="space-y-4 text-base leading-relaxed text-muted whitespace-pre-line">
              {profile.biography || profile.shortBio}
            </div>
          </div>

          {profile.careerFocus && (
            <div className="brutal-card card-blue frame-shadow-bordo p-6 sm:p-8">
              <span className="brutal-badge-inverse mb-2">Arah Karier</span>
              <h2 className="font-display text-xl font-extrabold mb-2">Fokus Kolaborasi &amp; Karier</h2>
              <p className="text-sm sm:text-base leading-relaxed font-medium">{profile.careerFocus}</p>
            </div>
          )}
        </div>
      </section>

      {/* Vision & Mission (Green Card + Midnight Card) */}
      <section aria-labelledby="vision-mission-heading">
        <div className="mb-6">
          <span className="brutal-badge-green">02. Prinsip Kerja</span>
          <h2 id="vision-mission-heading" className="font-display text-3xl font-extrabold mt-2">
            Visi &amp; Misi
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="brutal-card card-green frame-midnight p-6 sm:p-8">
            <h3 className="font-display text-xl font-extrabold text-[#8ACCD5] mb-3">Visi</h3>
            <p className="text-sm sm:text-base leading-relaxed text-[#F8F8E1] whitespace-pre-line">
              {profile.vision || 'Belum ditambahkan. Dapat diperbarui melalui Dashboard Admin.'}
            </p>
          </div>
          <div className="brutal-card card-midnight frame-shadow-bordo p-6 sm:p-8">
            <h3 className="font-display text-xl font-extrabold text-[#8ACCD5] mb-3">Misi</h3>
            <p className="text-sm sm:text-base leading-relaxed text-[#F8F8E1] whitespace-pre-line">
              {profile.mission || 'Belum ditambahkan. Dapat diperbarui melalui Dashboard Admin.'}
            </p>
          </div>
        </div>
      </section>

      {/* Education Journey Snapshot */}
      <section aria-labelledby="about-edu-heading">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6 pb-3 border-b-2 border-brutal">
          <div>
            <h2 id="about-edu-heading" className="font-display text-2xl sm:text-3xl font-extrabold">
              Riwayat &amp; Perjalanan Pendidikan
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/education')}
            className="text-sm font-bold inline-flex items-center gap-1.5 hover:bg-[#8ACCD5] hover:text-[#013A42] px-2.5 py-1.5 border-2 border-transparent hover:border-[#013A42] cursor-pointer transition-colors"
          >
            <span>Lihat Halaman Education &amp; Knowledge</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4">
          {education.map((edu, idx) => {
            const tone = getCardTone(idx, ['beige', 'blue', 'green']);
            return (
              <div
                key={edu.id}
                className={`brutal-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 ${tone.cardClass} ${tone.frameClass}`}
              >
                <div>
                  <span className={tone.secondaryBadgeClass}>
                    {edu.graduationYear} &middot; {edu.location || profile.domicile}
                  </span>
                  <h3 className="font-display text-xl font-extrabold mt-2">
                    {edu.degree} — {edu.fieldOfStudy}
                  </h3>
                  <p className="text-sm font-bold text-muted mt-0.5">
                    {edu.institution}
                  </p>
                  {edu.description && (
                    <p className="text-sm text-muted mt-2 max-w-3xl">
                      {edu.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interests, Talents & Career Interests (4 Distinct Planned Card Colors: Beige, Blue, Green, Bordo) */}
      <section aria-label="Minat dan bakat" className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {INTEREST_SECTIONS.map((sec, idx) => {
          const items = interests.filter((i) => i.category === sec.key);
          const tone = getCardTone(idx, ['beige', 'blue', 'green', 'bordo']);
          return (
            <div
              key={sec.key}
              className={`brutal-card p-6 sm:p-7 ${tone.cardClass} ${tone.frameClass}`}
            >
              <span className={tone.badgeClass}>
                {sec.index}
              </span>
              <h3 className="font-display text-xl font-extrabold mt-2 mb-4">{sec.title}</h3>
              {items.length === 0 ? (
                <p className="text-sm text-muted">
                  Belum ada data dipublikasikan untuk bagian ini.
                </p>
              ) : (
                <ul className="divide-y divide-[var(--card-border-subtle)]">
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
            </div>
          );
        })}
      </section>
    </div>
  );
};
