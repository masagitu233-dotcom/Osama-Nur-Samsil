import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import type { PublicRoute } from '../types/portfolio';
import { SafeImage } from '../components/ui/SafeImage';
import { getCardTone } from '../utils/cardVariants';
import { getAosStaggerDelay } from '../utils/aos';
import {
  extractCareerInterestItems,
  parseBiographyParagraphs,
  parseMissionPoints,
} from '../utils/careerInterests';

interface AboutPageProps {
  onNavigate: (route: PublicRoute) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const { publicData } = usePortfolio();
  const { profile, education, interests } = publicData;

  const biographyParagraphs = useMemo(
    () => parseBiographyParagraphs(profile.biography || profile.shortBio),
    [profile.biography, profile.shortBio]
  );

  const missionPoints = useMemo(
    () => parseMissionPoints(profile.mission || ''),
    [profile.mission]
  );

  const professionalInterests = useMemo(
    () => interests.filter((item) => item.category === 'professional_interest'),
    [interests]
  );

  const academicInterests = useMemo(
    () => interests.filter((item) => item.category === 'academic_interest'),
    [interests]
  );

  const personalTalents = useMemo(
    () => interests.filter((item) => item.category === 'talent_strength'),
    [interests]
  );

  const careerInterests = useMemo(
    () => extractCareerInterestItems(interests),
    [interests]
  );

  const careerOverview = (profile.careerInterestsOverview || '').trim();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 sm:space-y-14">
      {/* Page Masthead */}
      <header data-aos="fade-up" className="border-b-2 border-brutal pb-6">
        <span className="brutal-badge-bordo">01. Tentang Saya</span>
        <h1 className="font-display text-2xl sm:text-3xl lg:text-[38px] font-extrabold mt-3 text-balance leading-[1.15]">
          Biografi, Visi &amp; Arah Profesional
        </h1>
        <p className="mt-3 text-[15px] sm:text-base text-muted max-w-3xl leading-relaxed">
          {profile.headline} &middot; {profile.domicile}
        </p>
      </header>

      {/* Section A & B: Professional Biography + Collaboration & Career Focus */}
      <section aria-labelledby="bio-heading" className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-start">
        {/* Left: Portrait & Identity Card */}
        <aside
          data-aos="fade-up"
          className="lg:col-span-4 max-w-sm mx-auto lg:max-w-none w-full brutal-card card-bordo frame-midnight overflow-hidden"
        >
          <div className="aspect-[4/4.4] bg-[#F8F8E1] overflow-hidden">
            <SafeImage
              src={profile.photoUrl}
              alt={profile.fullName}
              fallbackLabel={profile.fullName}
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="p-5 sm:p-6 border-t-2 border-[#013A42] space-y-2.5">
            <div>
              <p className="font-display font-extrabold text-lg sm:text-xl text-[#F8F8E1] leading-snug">
                {profile.fullName}
              </p>
              <p className="text-sm font-semibold text-[#8ACCD5] mt-0.5">
                {profile.domicile}
              </p>
            </div>
            {education[0] && (
              <div className="pt-3 border-t border-[var(--card-border-subtle)] space-y-1">
                <p className="text-xs sm:text-[13px] font-bold text-[#F8F8E1] leading-snug">
                  {education[0].degree}
                </p>
                <p className="font-mono-num text-xs text-[#F8F8E1]/85 leading-snug">
                  {education[0].institution} ({education[0].graduationYear})
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Right: Biography Prose + Career Focus */}
        <div className="lg:col-span-8 space-y-5">
          <article
            data-aos="fade-up"
            data-aos-delay="100"
            className="brutal-card card-beige frame-shadow-green p-6 sm:p-8"
          >
            <span className="font-mono-num text-[11px] font-bold uppercase tracking-wider text-[#6C151E]">
              Profil &amp; Latar Belakang
            </span>
            <h2 id="bio-heading" className="font-display text-xl sm:text-2xl font-extrabold mt-1 leading-tight">
              Biografi Profesional
            </h2>
            <p className="text-sm sm:text-[15px] font-semibold text-[#0F3D3A] mt-2 pb-4 border-b border-[var(--card-border-subtle)] leading-snug">
              {profile.headline}
            </p>
            <div className="mt-4 space-y-4 text-[15px] sm:text-base leading-[1.8] text-[#013A42]/90">
              {biographyParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </article>

          {profile.careerFocus && (
            <article
              data-aos="fade-up"
              data-aos-delay="180"
              className="brutal-card card-blue frame-shadow-bordo p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                <span className="brutal-badge-inverse">Arah Karier</span>
                <h2 className="font-display text-lg sm:text-xl font-extrabold leading-tight">
                  Fokus Kolaborasi &amp; Karier
                </h2>
              </div>
              <p className="text-[15px] sm:text-base leading-[1.75] font-medium">
                {profile.careerFocus}
              </p>
            </article>
          )}
        </div>
      </section>

      {/* Section C: Vision & Mission (Proportional & Content-Fit) */}
      <section aria-labelledby="vision-mission-heading" className="space-y-5">
        <div data-aos="fade-up">
          <span className="brutal-badge-green">02. Prinsip Kerja</span>
          <h2 id="vision-mission-heading" className="font-display text-xl sm:text-2xl font-extrabold mt-2">
            Visi &amp; Misi
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          <article
            data-aos="fade-up"
            data-aos-delay="0"
            className="md:col-span-5 brutal-card card-green frame-midnight p-6 sm:p-7"
          >
            <h3 className="font-display text-lg sm:text-xl font-extrabold text-[#8ACCD5] pb-3 border-b border-[var(--card-border-subtle)]">
              Visi
            </h3>
            <p className="mt-4 text-[15px] sm:text-base leading-[1.8] text-[#F8F8E1] whitespace-pre-line">
              {profile.vision || 'Belum ditambahkan. Dapat diperbarui melalui Dashboard Admin.'}
            </p>
          </article>

          <article
            data-aos="fade-up"
            data-aos-delay="100"
            className="md:col-span-7 brutal-card card-midnight frame-shadow-bordo p-6 sm:p-7"
          >
            <h3 className="font-display text-lg sm:text-xl font-extrabold text-[#8ACCD5] pb-3 border-b border-[var(--card-border-subtle)]">
              Misi
            </h3>
            {missionPoints.length === 0 ? (
              <p className="mt-4 text-[15px] sm:text-base leading-[1.8] text-[#F8F8E1]">
                Belum ditambahkan. Dapat diperbarui melalui Dashboard Admin.
              </p>
            ) : missionPoints.length === 1 && !missionPoints[0].indexLabel ? (
              <p className="mt-4 text-[15px] sm:text-base leading-[1.8] text-[#F8F8E1]">
                {missionPoints[0].text}
              </p>
            ) : (
              <ol className="mt-4 space-y-3.5">
                {missionPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3.5">
                    {point.indexLabel && (
                      <span className="font-mono-num text-xs font-extrabold text-[#8ACCD5] pt-1.5 shrink-0">
                        {point.indexLabel}
                      </span>
                    )}
                    <span className="text-[15px] sm:text-base leading-[1.75] text-[#F8F8E1]">
                      {point.text}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </article>
        </div>
      </section>

      {/* Section D: Education Journey Editorial Timeline */}
      <section aria-labelledby="about-edu-heading" className="space-y-5">
        <div
          data-aos="fade-up"
          className="flex flex-wrap items-end justify-between gap-3 pb-3.5 border-b-2 border-brutal"
        >
          <div>
            <span className="font-mono-num text-[11px] font-bold uppercase tracking-wider text-[#6C151E]">
              Latar Akademik
            </span>
            <h2 id="about-edu-heading" className="font-display text-xl sm:text-2xl font-extrabold mt-1">
              Riwayat &amp; Perjalanan Pendidikan
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/education')}
            className="text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 hover:bg-[#8ACCD5] hover:text-[#013A42] px-3 py-1.5 border-2 border-transparent hover:border-[#013A42] cursor-pointer transition-colors whitespace-nowrap"
          >
            <span>Lihat Halaman Education &amp; Knowledge</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <ol className="space-y-4">
          {education.map((edu, idx) => {
            const tone = getCardTone(idx, ['beige', 'blue', 'green']);
            const periodLabel = edu.period && edu.period.trim() !== edu.graduationYear ? edu.period : null;
            return (
              <li
                key={edu.id}
                data-aos="fade-up"
                data-aos-delay={getAosStaggerDelay(idx, 100, 2)}
                className={`brutal-card overflow-hidden grid grid-cols-1 md:grid-cols-12 ${tone.cardClass} ${tone.frameClass}`}
              >
                {/* Timeline Year & Metadata Column */}
                <div className="md:col-span-3 p-5 sm:p-6 border-b-2 md:border-b-0 md:border-r-2 border-[#013A42] flex flex-col justify-center gap-1.5">
                  <span className="font-mono-num text-2xl sm:text-[28px] font-extrabold leading-none">
                    {edu.graduationYear}
                  </span>
                  {periodLabel && (
                    <span className="font-mono-num text-xs font-bold opacity-85">
                      {periodLabel}
                    </span>
                  )}
                  <span className="text-xs font-bold uppercase tracking-wide text-muted mt-1">
                    {edu.category || 'Pendidikan Formal'}
                  </span>
                  <span className="text-xs text-muted">
                    {edu.location || profile.domicile}
                  </span>
                </div>

                {/* Main Education Content Column */}
                <div className="md:col-span-9 p-5 sm:p-6 flex flex-col justify-center">
                  <h3 className="font-display text-lg sm:text-xl font-extrabold leading-snug">
                    {edu.degree} &mdash; {edu.fieldOfStudy}
                  </h3>
                  <p className="text-sm sm:text-[15px] font-bold text-muted mt-1">
                    {edu.institution}
                  </p>
                  {edu.description && (
                    <p className="text-[15px] leading-[1.75] text-muted mt-3 max-w-3xl">
                      {edu.description}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Section E: 03. Professional Interests & 04. Academic Interests (items-start, ZERO forced stretch!) */}
      <section
        aria-label="Minat Profesional dan Akademik"
        data-testid="about-interests-grid"
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
      >
        {/* 03. Minat Profesional */}
        <article
          data-aos="fade-up"
          data-testid="about-card-professional"
          className="lg:col-span-5 self-start brutal-card card-beige frame-shadow-green p-6 sm:p-7"
        >
          <span className="brutal-badge">03.</span>
          <h2 className="font-display text-xl font-extrabold mt-2.5 pb-4 border-b border-[var(--card-border-subtle)]">
            Minat Profesional
          </h2>
          {professionalInterests.length === 0 ? (
            <p className="text-[15px] text-muted mt-4 leading-relaxed">
              Belum ada data dipublikasikan untuk bagian ini.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-[var(--card-border-subtle)]">
              {professionalInterests.map((item) => (
                <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                  <h3 className="font-display font-extrabold text-base sm:text-[17px] leading-snug">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-[15px] text-muted mt-2 leading-[1.75] whitespace-pre-line">
                      {item.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </article>

        {/* 04. Minat Akademik & Keilmuan */}
        <article
          data-aos="fade-up"
          data-aos-delay="100"
          data-testid="about-card-academic"
          className="lg:col-span-7 self-start brutal-card card-blue frame-shadow-bordo p-6 sm:p-7"
        >
          <span className="brutal-badge-inverse">04.</span>
          <h2 className="font-display text-xl font-extrabold mt-2.5 pb-4 border-b border-[var(--card-border-subtle)]">
            Minat Akademik &amp; Keilmuan
          </h2>
          {academicInterests.length === 0 ? (
            <p className="text-[15px] text-muted mt-4 leading-relaxed">
              Belum ada data dipublikasikan untuk bagian ini.
            </p>
          ) : (
            <ol className="mt-4 divide-y divide-[var(--card-border-subtle)]">
              {academicInterests.map((item, idx) => (
                <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-mono-num text-xs font-extrabold opacity-75 shrink-0">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <h3 className="font-display font-extrabold text-base sm:text-[17px] leading-snug">
                      {item.title}
                    </h3>
                  </div>
                  {item.description && (
                    <p className="text-[15px] text-muted mt-2 leading-[1.75] whitespace-pre-line">
                      {item.description}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </article>
      </section>

      {/* Section F: 05. Talents & Personal Strengths */}
      <section aria-labelledby="about-talents-heading" className="space-y-5">
        <div data-aos="fade-up">
          <span className="brutal-badge-green">05.</span>
          <h2 id="about-talents-heading" className="font-display text-xl sm:text-2xl font-extrabold mt-2">
            Bakat &amp; Kemampuan Personal
          </h2>
        </div>

        {personalTalents.length === 0 ? (
          <div data-aos="fade-up" className="brutal-card card-beige frame-midnight p-6">
            <p className="text-[15px] text-muted leading-relaxed">
              Belum ada data bakat dan kemampuan personal yang dipublikasikan.
            </p>
          </div>
        ) : personalTalents.length === 1 ? (
          <article
            data-aos="fade-up"
            className="brutal-card card-green frame-midnight p-6 sm:p-7 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-7 items-start"
          >
            <div className="md:col-span-4 md:pr-4 md:border-r border-[var(--card-border-subtle)]">
              <span className="font-mono-num text-[11px] font-bold uppercase tracking-wider text-[#8ACCD5]">
                Keahlian Praktis
              </span>
              <h3 className="font-display text-xl font-extrabold text-[#F8F8E1] mt-1 leading-snug">
                {personalTalents[0].title}
              </h3>
            </div>
            <div className="md:col-span-8">
              <p className="text-[15px] sm:text-base leading-[1.8] text-[#F8F8E1]/95 whitespace-pre-line">
                {personalTalents[0].description}
              </p>
            </div>
          </article>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
            {personalTalents.map((item, idx) => {
              const tone = getCardTone(idx, ['green', 'beige', 'blue']);
              return (
                <article
                  key={item.id}
                  data-aos="fade-up"
                  data-aos-delay={getAosStaggerDelay(idx, 100, 3)}
                  className={`brutal-card p-6 ${tone.cardClass} ${tone.frameClass}`}
                >
                  <span className="font-mono-num text-xs font-extrabold opacity-75">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-display text-lg font-extrabold mt-1.5 leading-snug">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-[15px] text-muted mt-2.5 leading-[1.75] whitespace-pre-line">
                      {item.description}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Section G: 06. Bidang Pekerjaan yang Diminati */}
      <section
        aria-labelledby="about-career-interests-heading"
        data-testid="about-section-06"
        className="space-y-5"
      >
        <div data-aos="fade-up" className="pb-3.5 border-b-2 border-brutal">
          <span className="brutal-badge-bordo">06.</span>
          <h2
            id="about-career-interests-heading"
            className="font-display text-xl sm:text-2xl font-extrabold mt-2"
          >
            Bidang Pekerjaan yang Diminati
          </h2>
        </div>

        {/* Level 1: General Overview (Uraian Umum) */}
        {careerOverview && (
          <div
            data-aos="fade-up"
            data-testid="about-career-overview"
            className="brutal-card card-beige frame-midnight p-5 sm:p-6"
          >
            <p className="text-[15px] sm:text-base leading-[1.8] text-[#013A42]/95 whitespace-pre-line max-w-4xl">
              {careerOverview}
            </p>
          </div>
        )}

        {/* Level 2: Career Interest Cards (Dynamic Height, Responsive Grid) */}
        {careerInterests.length > 0 ? (
          <div
            data-testid="about-career-grid"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start"
          >
            {careerInterests.map((item, idx) => {
              const tone = getCardTone(idx, ['beige', 'blue', 'green', 'midnight', 'bordo']);
              return (
                <article
                  key={item.id}
                  data-aos="fade-up"
                  data-aos-delay={getAosStaggerDelay(idx, 100, 3)}
                  className={`brutal-card p-6 ${tone.cardClass} ${tone.frameClass}`}
                >
                  <span
                    className={`font-mono-num text-xs font-extrabold ${
                      tone.isDark ? 'text-[#8ACCD5]' : 'text-[#6C151E]'
                    }`}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-display text-lg font-extrabold mt-2 leading-snug">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-[15px] text-muted mt-2.5 leading-[1.75] whitespace-pre-line">
                      {item.description}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        ) : !careerOverview ? (
          <div
            data-aos="fade-up"
            data-testid="about-career-empty"
            className="brutal-card card-beige frame-midnight p-6 sm:p-7"
          >
            <p className="font-display text-base font-extrabold">
              Belum ada bidang pekerjaan yang dipublikasikan.
            </p>
            <p className="text-sm sm:text-[15px] text-muted mt-1.5 leading-relaxed max-w-2xl">
              Informasi orientasi kerja dan daftar bidang pekerjaan yang diminati sedang disiapkan dan dapat ditambahkan melalui Dashboard Admin.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
};
