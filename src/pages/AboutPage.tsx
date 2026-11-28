import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import type { PublicRoute } from '../types/portfolio';
import { SafeImage } from '../components/ui/SafeImage';
import { getSectionCardTone } from '../utils/cardVariants';
import { getAosStaggerDelay } from '../utils/aos';
import {
  HERO_CUTOUT_ASSET_URL,
  shouldUsePreprocessedHeroCutout,
} from '../utils/designMode';
import {
  extractCareerInterestItems,
  parseBiographyParagraphs,
  parseMissionPoints,
} from '../utils/careerInterests';

interface AboutPageProps {
  onNavigate: (route: PublicRoute) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const { publicData, designMode } = usePortfolio();
  const { profile, education, interests } = publicData;
  const isMinimal = designMode === 'minimalis_elegan';
  const useCutoutPortrait = shouldUsePreprocessedHeroCutout(profile.photoUrl);

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
    <div
      data-sizing-scope="about"
      className="sizing-page-shell max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10"
    >
      {/* Page Masthead */}
      <header data-aos="fade-up" className="border-b-2 border-brutal pb-5">
        <span className="brutal-badge-bordo">01. Tentang Saya</span>
        <h1 className="font-display text-2xl sm:text-3xl lg:text-[38px] font-extrabold mt-3 text-balance leading-[1.15]">
          Biografi, Visi &amp; Arah Profesional
        </h1>
        <p className="mt-3 text-[15px] sm:text-base text-muted max-w-3xl leading-relaxed">
          {profile.headline} &middot; {profile.domicile}
        </p>
      </header>

      {/* FRAME 1 (Unified Profile + Biography) & FRAME 2 (Full-Width Career Focus) */}
      <section aria-labelledby="bio-heading" className="sizing-about-stack flex flex-col gap-5">
        {/* FRAME 1: Single Unified Ink Navy (#1B2A3D) Container — Left Profile (33%) + Right Biography (67%) */}
        <article
          data-aos="fade-up"
          data-testid="about-unified-profile-bio-frame"
          className="brutal-card card-navy frame-navy sizing-about-card relative overflow-hidden p-6 sm:p-7 lg:p-8"
        >
          {/* Layer 0: Subtle architectural geometric arcs clipped neatly inside the single Ink Navy frame */}
          {isMinimal && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
            >
              <div className="absolute -top-20 -left-20 w-56 h-56 rounded-full border border-[#D9B44A]/14" />
              <div className="absolute -bottom-24 -right-20 w-64 h-64 rounded-full border border-[#F8F8E1]/8" />
            </div>
          )}

          {/* Unified 2-Column Composition (No nested cards, no inner borders, single background) */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-7 lg:gap-9 items-center">
            {/* LEFT COLUMN (33%): Transparent Cutout Portrait + Name, Domicile & Education */}
            <div
              data-testid="about-profile-column"
              className="md:col-span-4 flex flex-col items-center text-center"
            >
              {/* Portrait Composition Stage — directly on Ink Navy surface (no extra card or square frame) */}
              <div
                data-testid="about-portrait-stage"
                className="sizing-about-portrait relative isolate flex items-end justify-center w-full max-w-[260px] mx-auto"
                style={{
                  height: 'var(--sz-about-portrait-h, 250px)',
                }}
              >
                {/* Layer 1 (z-10): Outer subtle geometric halo ring strictly BEHIND portrait */}
                <div
                  aria-hidden="true"
                  data-testid="about-portrait-halo-ring"
                  className="pointer-events-none absolute bottom-1.5 left-1/2 -translate-x-1/2 z-10 rounded-full border border-[#D9B44A]/35"
                  style={{
                    width: 'calc(var(--sz-about-portrait-h, 250px) * 0.8)',
                    height: 'calc(var(--sz-about-portrait-h, 250px) * 0.8)',
                  }}
                />

                {/* Layer 1 (z-10): Primary Muted Golden Yellow (#D9B44A) circle strictly BEHIND portrait */}
                <div
                  aria-hidden="true"
                  data-testid="about-portrait-yellow-circle"
                  className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 z-10 rounded-full bg-[#D9B44A] shadow-[0_12px_28px_-12px_rgba(0,31,36,0.5)]"
                  style={{
                    width: 'calc(var(--sz-about-portrait-h, 250px) * 0.7)',
                    height: 'calc(var(--sz-about-portrait-h, 250px) * 0.7)',
                  }}
                />

                {/* Layer 2 (z-20): 100% Opaque Cutout Portrait strictly IN FRONT of yellow circle */}
                {useCutoutPortrait ? (
                  <img
                    src={HERO_CUTOUT_ASSET_URL}
                    alt={profile.fullName}
                    data-testid="about-cutout-portrait"
                    loading="eager"
                    decoding="async"
                    className="relative z-20 h-full w-auto max-w-full object-contain object-bottom block opacity-100 select-none pointer-events-none drop-shadow-[0_10px_18px_rgba(0,31,36,0.3)]"
                  />
                ) : (
                  <div
                    data-testid="about-cutout-portrait"
                    className="relative z-20 rounded-t-[999px] overflow-hidden"
                    style={{
                      width: 'calc(var(--sz-about-portrait-h, 250px) * 0.72)',
                      height: 'calc(var(--sz-about-portrait-h, 250px) * 0.92)',
                    }}
                  >
                    <SafeImage
                      src={profile.photoUrl}
                      alt={profile.fullName}
                      fallbackLabel={profile.fullName}
                      className="w-full h-full object-cover object-[50%_14%]"
                    />
                  </div>
                )}

                {/* Layer 3 (z-30): Smooth Ink Navy (#1B2A3D) bottom overlay ABOVE both photo & circle */}
                <div
                  aria-hidden="true"
                  data-testid="about-portrait-bottom-fade"
                  className="pointer-events-none absolute -inset-x-4 -bottom-px z-30 about-bottom-navy-fade"
                  style={{
                    height: 'calc(var(--sz-about-portrait-h, 250px) * 0.24)',
                  }}
                />
              </div>

              {/* Identity Details Directly Below Portrait */}
              <div className="mt-3.5 w-full max-w-[260px] space-y-2.5">
                <div>
                  <p className="font-display font-extrabold text-lg sm:text-[20px] text-[#F8F8E1] leading-snug tracking-tight">
                    {profile.fullName}
                  </p>
                  <p className="font-mono-num text-xs sm:text-[13px] font-bold text-[#D9B44A] mt-0.5 tracking-wide">
                    {profile.domicile}
                  </p>
                </div>

                {education[0] && (
                  <div className="pt-2.5 border-t border-[#D9B44A]/30 space-y-0.5">
                    <p className="text-xs sm:text-[13.5px] font-bold text-[#F8F8E1] leading-snug">
                      {education[0].degree}
                    </p>
                    <p className="font-mono-num text-[11px] sm:text-xs text-[#F8F8E1]/80 leading-snug">
                      {education[0].institution} ({education[0].graduationYear})
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN (67%): Biografi Profesional Directly Inside the Same Ink Navy Frame */}
            <div data-testid="about-biography-column" className="md:col-span-8 min-w-0">
              <span className="font-mono-num text-[11px] font-bold uppercase tracking-wider text-[#D9B44A]">
                Profil &amp; Latar Belakang
              </span>
              <h2
                id="bio-heading"
                className="font-display text-xl sm:text-[22px] font-extrabold mt-1 leading-tight text-[#F8F8E1]"
              >
                Biografi Profesional
              </h2>
              <p className="text-sm sm:text-[15px] font-bold text-[#D9B44A] mt-1.5 pb-3.5 border-b border-[var(--card-border-subtle)] leading-snug">
                {profile.headline}
              </p>
              <div className="sizing-about-prose mt-4 space-y-3.5 text-[15px] leading-[1.72] text-[#F8F8E1]/95">
                {biographyParagraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </article>

        {/* FRAME 2: Standalone Full-Width Horizontal Ink Navy Frame — Fokus Kolaborasi & Karier */}
        {profile.careerFocus && (
          <article
            data-aos="fade-up"
            data-aos-delay="100"
            data-testid="about-career-focus-frame"
            className="brutal-card card-navy frame-navy sizing-about-card w-full p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center gap-2.5 pb-3 border-b border-[var(--card-border-subtle)]">
              <span className="brutal-badge">Arah Karier</span>
              <h2 className="font-display text-lg sm:text-[19px] font-extrabold leading-tight text-[#F8F8E1]">
                Fokus Kolaborasi &amp; Karier
              </h2>
            </div>
            <p className="sizing-about-prose mt-3.5 text-[15px] leading-[1.7] font-normal text-[#F8F8E1]/95 max-w-5xl">
              {profile.careerFocus}
            </p>
          </article>
        )}
      </section>

      {/* Section C: Vision & Mission (Uniform Green #0F3D3A + Beige #F8F8E1) */}
      <section aria-labelledby="vision-mission-heading" className="space-y-4">
        <div data-aos="fade-up" className="pb-3 border-b-2 border-brutal">
          <span className="brutal-badge-green">02. Prinsip Kerja</span>
          <h2 id="vision-mission-heading" className="font-display text-xl sm:text-2xl font-extrabold mt-1.5 text-[#1B2A3D]">
            Visi &amp; Misi
          </h2>
        </div>

        <div className="sizing-card-grid grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          <article
            data-aos="fade-up"
            data-aos-delay="0"
            data-testid="about-vision-card"
            className="md:col-span-5 brutal-card card-green frame-green sizing-about-card p-5 sm:p-6"
          >
            <span className="font-mono-num text-[10.5px] font-bold uppercase tracking-wider text-[#D9B44A]/90">
              Arah Jangka Panjang
            </span>
            <h3 className="font-display text-lg sm:text-xl font-extrabold text-[#D9B44A] mt-0.5 pb-3 border-b border-[#D9B44A]/30">
              Visi
            </h3>
            <p className="sizing-about-prose mt-3.5 text-[15px] leading-[1.72] text-[#F8F8E1]/95 whitespace-pre-line">
              {profile.vision || 'Belum ditambahkan. Dapat diperbarui melalui Dashboard Admin.'}
            </p>
          </article>

          <article
            data-aos="fade-up"
            data-aos-delay="100"
            data-testid="about-mission-card"
            className="md:col-span-7 brutal-card card-green frame-green sizing-about-card p-5 sm:p-6"
          >
            <span className="font-mono-num text-[10.5px] font-bold uppercase tracking-wider text-[#D9B44A]/90">
              Langkah &amp; Komitmen
            </span>
            <h3 className="font-display text-lg sm:text-xl font-extrabold text-[#D9B44A] mt-0.5 pb-3 border-b border-[#D9B44A]/30">
              Misi
            </h3>
            {missionPoints.length === 0 ? (
              <p className="sizing-about-prose mt-3.5 text-[15px] leading-[1.72] text-[#F8F8E1]/95">
                Belum ditambahkan. Dapat diperbarui melalui Dashboard Admin.
              </p>
            ) : missionPoints.length === 1 && !missionPoints[0].indexLabel ? (
              <p className="sizing-about-prose mt-3.5 text-[15px] leading-[1.72] text-[#F8F8E1]/95">
                {missionPoints[0].text}
              </p>
            ) : (
              <ol className="mt-3.5 space-y-3">
                {missionPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="font-mono-num text-[11px] font-extrabold text-[#D9B44A] bg-[#D9B44A]/12 border border-[#D9B44A]/40 rounded px-1.5 py-0.5 mt-0.5 shrink-0 leading-none">
                      {point.indexLabel || String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="sizing-about-prose text-[15px] leading-[1.68] text-[#F8F8E1]/95">
                      {point.text}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </article>
        </div>
      </section>

      {/* Section D: Education Journey Editorial Timeline (Uniform Ink Navy #1B2A3D + Beige #F8F8E1) */}
      <section aria-labelledby="about-edu-heading" className="space-y-5">
        <div
          data-aos="fade-up"
          className="flex flex-wrap items-end justify-between gap-3 pb-3.5 border-b-2 border-brutal"
        >
          <div>
            <span className="font-mono-num text-[11px] font-bold uppercase tracking-wider text-[#6C151E]">
              Latar Akademik
            </span>
            <h2 id="about-edu-heading" className="font-display text-xl sm:text-2xl font-extrabold mt-1 text-[#1B2A3D]">
              Riwayat &amp; Perjalanan Pendidikan
            </h2>
          </div>
          <a
            href="/education"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/education');
            }}
            className="text-xs sm:text-sm font-bold text-[#1B2A3D] inline-flex items-center gap-1.5 hover:bg-[#D9B44A] hover:text-[#001F24] px-3 py-1.5 border-2 border-transparent hover:border-[#001F24] cursor-pointer transition-colors whitespace-nowrap"
          >
            <span>Lihat Halaman Education &amp; Knowledge</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>

        <ol className="space-y-4">
          {education.map((edu, idx) => {
            const tone = getSectionCardTone('education');
            const periodLabel = edu.period && edu.period.trim() !== edu.graduationYear ? edu.period : null;
            return (
              <li
                key={edu.id}
                data-aos="fade-up"
                data-aos-delay={getAosStaggerDelay(idx, 100, 2)}
                className={`brutal-card overflow-hidden grid grid-cols-1 md:grid-cols-12 ${tone.cardClass} ${tone.frameClass}`}
              >
                {/* Timeline Year & Metadata Column */}
                <div className="md:col-span-3 p-5 sm:p-6 border-b-2 md:border-b-0 md:border-r-2 border-[#D9B44A]/60 flex flex-col justify-center gap-1.5 text-[#F8F8E1]">
                  <span className="font-mono-num text-2xl sm:text-[28px] font-bold leading-none text-[#D9B44A]">
                    {edu.graduationYear}
                  </span>
                  {periodLabel && (
                    <span className="font-mono-num text-xs font-semibold text-[#F8F8E1]">
                      {periodLabel}
                    </span>
                  )}
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#D9B44A] mt-1">
                    {edu.category || 'Pendidikan Formal'}
                  </span>
                  <span className="text-xs font-normal text-muted">
                    {edu.location || profile.domicile}
                  </span>
                </div>

                {/* Main Education Content Column */}
                <div className="md:col-span-9 p-5 sm:p-6 flex flex-col justify-center text-[#F8F8E1]">
                  <h3 className="font-display text-lg sm:text-xl font-bold leading-snug text-[#F8F8E1]">
                    {edu.degree} &mdash; {edu.fieldOfStudy}
                  </h3>
                  <p className="text-sm sm:text-[15px] font-semibold text-[#D9B44A] mt-1">
                    {edu.institution}
                  </p>
                  {edu.description && (
                    <p className="text-[15px] font-normal leading-[1.75] text-[#F8F8E1]/90 mt-3 max-w-3xl">
                      {edu.description}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Section E: 03. Professional Interests & 04. Academic Interests (Uniform Ink Navy #1B2A3D + Beige #F8F8E1) */}
      <section
        aria-label="Minat Profesional dan Akademik"
        data-testid="about-interests-grid"
        className="sizing-card-grid grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
      >
        {/* 03. Minat Profesional */}
        <article
          data-aos="fade-up"
          data-testid="about-card-professional"
          className="lg:col-span-5 self-start brutal-card card-navy frame-navy sizing-about-card p-6 sm:p-7"
        >
          <span className="brutal-badge">03.</span>
          <h2 className="font-display text-xl font-extrabold mt-2.5 pb-4 border-b border-[var(--card-border-subtle)] text-[#F8F8E1]">
            Minat Profesional
          </h2>
          {professionalInterests.length === 0 ? (
            <p className="sizing-about-prose text-[15px] text-muted mt-4 leading-relaxed">
              Belum ada data dipublikasikan untuk bagian ini.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-[var(--card-border-subtle)]">
              {professionalInterests.map((item) => (
                <li key={item.id} className="py-3.5 first:pt-0 last:pb-0">
                  <h3 className="font-display font-extrabold text-base sm:text-[17px] leading-snug text-[#F8F8E1]">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="sizing-about-prose text-[15px] text-muted mt-1.5 leading-[1.7] whitespace-pre-line">
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
          className="lg:col-span-7 self-start brutal-card card-navy frame-navy sizing-about-card p-6 sm:p-7"
        >
          <span className="brutal-badge">04.</span>
          <h2 className="font-display text-xl font-extrabold mt-2.5 pb-4 border-b border-[var(--card-border-subtle)] text-[#F8F8E1]">
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
                    <span className="font-mono-num text-xs font-extrabold text-[#D9B44A] shrink-0">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <h3 className="font-display font-extrabold text-base sm:text-[17px] leading-snug text-[#F8F8E1]">
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

      {/* Section F: 05. Talents & Personal Strengths (Uniform Muted Golden Yellow #D9B44A + Deep Midnight Ink #001F24) */}
      <section aria-labelledby="about-talents-heading" className="space-y-5">
        <div data-aos="fade-up">
          <span className="brutal-badge">05.</span>
          <h2 id="about-talents-heading" className="font-display text-xl sm:text-2xl font-extrabold mt-2 text-[#1B2A3D]">
            Bakat &amp; Kemampuan Personal
          </h2>
        </div>

        {personalTalents.length === 0 ? (
          <div data-aos="fade-up" className="brutal-card card-gold frame-gold p-6">
            <p className="text-[15px] text-[#001F24] leading-relaxed">
              Belum ada data bakat dan kemampuan personal yang dipublikasikan.
            </p>
          </div>
        ) : personalTalents.length === 1 ? (
          <article
            data-aos="fade-up"
            className="brutal-card card-gold frame-gold p-6 sm:p-7 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-7 items-start"
          >
            <div className="md:col-span-4 md:pr-4 md:border-r border-[var(--card-border-subtle)]">
              <span className="font-mono-num text-[11px] font-bold uppercase tracking-wider text-[#001F24]">
                Keahlian Praktis
              </span>
              <h3 className="font-display text-xl font-extrabold text-[#001F24] mt-1 leading-snug">
                {personalTalents[0].title}
              </h3>
            </div>
            <div className="md:col-span-8">
              <p className="text-[15px] sm:text-base leading-[1.8] text-[#001F24] whitespace-pre-line">
                {personalTalents[0].description}
              </p>
            </div>
          </article>
        ) : (
          <div className="sizing-card-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
            {personalTalents.map((item, idx) => {
              const tone = getSectionCardTone('skills');
              return (
                <article
                  key={item.id}
                  data-aos="fade-up"
                  data-aos-delay={getAosStaggerDelay(idx, 100, 3)}
                  className={`brutal-card sizing-about-card p-6 ${tone.cardClass} ${tone.frameClass}`}
                >
                  <span className="font-mono-num text-xs font-extrabold text-[#001F24]">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-display text-lg font-extrabold mt-1.5 leading-snug text-[#001F24]">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="sizing-about-prose text-[15px] text-[#001F24] mt-2 leading-[1.7] whitespace-pre-line">
                      {item.description}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Section G: 06. Bidang Pekerjaan yang Diminati (Uniform Green #0F3D3A + Beige #F8F8E1) */}
      <section
        aria-labelledby="about-career-interests-heading"
        data-testid="about-section-06"
        className="space-y-5"
      >
        <div data-aos="fade-up" className="pb-3.5 border-b-2 border-brutal">
          <span className="brutal-badge-green">06.</span>
          <h2
            id="about-career-interests-heading"
            className="font-display text-xl sm:text-2xl font-extrabold mt-2 text-[#1B2A3D]"
          >
            Bidang Pekerjaan yang Diminati
          </h2>
        </div>

        {/* Level 1: General Overview (Uraian Umum) */}
        {careerOverview && (
          <div
            data-aos="fade-up"
            data-testid="about-career-overview"
            className="brutal-card card-green frame-green sizing-about-card p-5 sm:p-6"
          >
            <p className="sizing-about-prose text-[15px] sm:text-base leading-[1.75] text-[#F8F8E1] whitespace-pre-line max-w-4xl">
              {careerOverview}
            </p>
          </div>
        )}

        {/* Level 2: Career Interest Cards (Uniform Green #0F3D3A, Dynamic Height, Responsive Grid) */}
        {careerInterests.length > 0 ? (
          <div
            data-testid="about-career-grid"
            className="sizing-card-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start"
          >
            {careerInterests.map((item, idx) => (
              <article
                key={item.id}
                data-aos="fade-up"
                data-aos-delay={getAosStaggerDelay(idx, 100, 3)}
                className="brutal-card card-green frame-green sizing-about-card p-6"
              >
                <span className="font-mono-num text-xs font-extrabold text-[#D9B44A]">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <h3 className="font-display text-lg font-extrabold mt-2 leading-snug text-[#F8F8E1]">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="sizing-about-prose text-[15px] text-muted mt-2 leading-[1.7] whitespace-pre-line">
                    {item.description}
                  </p>
                )}
              </article>
            ))}
          </div>
        ) : !careerOverview ? (
          <div
            data-aos="fade-up"
            data-testid="about-career-empty"
            className="brutal-card card-green frame-green p-6 sm:p-7"
          >
            <p className="font-display text-base font-extrabold text-[#F8F8E1]">
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
