import React, { useState } from 'react';
import {
  ArrowRight,
  Download,
  Share2,
} from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import type { ExperienceItem, ProjectItem, PublicRoute } from '../types/portfolio';
import { SafeImage } from '../components/ui/SafeImage';
import { DarsLogo } from '../components/ui/DarsLogo';
import {
  ExperienceDetailModal,
  type ExperienceDetailViewData,
} from '../components/experience/ExperienceDetailModal';
import { ProjectDetailModal } from '../components/projects/ProjectDetailModal';
import { getSectionCardTone } from '../utils/cardVariants';
import { getGoogleDriveDownloadUrl } from '../utils/googleDriveMedia';
import {
  ACTIVE_PROJECT_CATEGORY_LABELS,
  hasCustomUploadedDarsAsset,
  isDarsPlatformProject,
  normalizeProjectCategory,
  prepareWebsiteProjects,
  resolveProjectPrimaryPhoto,
} from '../utils/projectsCatalog';
import { resolveExperiencePrimaryPhoto } from '../utils/experienceGallery';
import { getAosStaggerDelay } from '../utils/aos';
import { HERO_CUTOUT_ASSET_URL, shouldUsePreprocessedHeroCutout } from '../utils/designMode';

interface HomePageProps {
  onNavigate: (route: PublicRoute) => void;
  onShareProfile: () => void;
}

function getExperienceCategoryLabel(category: ExperienceItem['category']): string {
  switch (category) {
    case 'mentoring':
      return 'Pembinaan';
    case 'teaching':
      return 'Pengajaran';
    case 'committee':
      return 'Kepanitiaan';
    default:
      return 'Pengalaman Kerja';
  }
}

function toExperienceDetail(exp: ExperienceItem): ExperienceDetailViewData {
  return {
    id: exp.id,
    role: exp.role,
    categoryLabel: getExperienceCategoryLabel(exp.category),
    institutionName: exp.institution,
    period: exp.period,
    duration: exp.duration,
    location: exp.location,
    description: exp.description,
    responsibilities: exp.responsibilities,
    responsibilitiesHeading: 'Tanggung Jawab & Program Utama',
    imageUrls: exp.imageUrls,
    primaryImageUrl: exp.primaryImageUrl,
  };
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onShareProfile }) => {
  const { publicData, designMode, showToast } = usePortfolio();
  const { profile, experiences, organizations, education, projects, skills, certificates } = publicData;
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<ExperienceDetailViewData | null>(null);
  const isMinimal = designMode === 'minimalis_elegan';
  const useCutoutHero = shouldUsePreprocessedHeroCutout(profile.photoUrl);

  const featuredExperiences = experiences.filter((e) => e.featured).slice(0, 3);
  const shownExperiences = featuredExperiences.length > 0 ? featuredExperiences : experiences.slice(0, 3);
  const websiteProjects = prepareWebsiteProjects(projects);
  const featuredProject = websiteProjects.find((p) => p.featured) || websiteProjects[0];
  const languageSkills = skills.filter((s) => s.category === 'language');
  const toolSkills = skills.filter((s) => s.category === 'tool' || s.category === 'technical');

  const handleDownloadCv = () => {
    if (profile.cvUrl) {
      const link = document.createElement('a');
      link.href = getGoogleDriveDownloadUrl(profile.cvUrl);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = profile.cvFileName || 'CV-Osama-Nur-Samsil.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('success', 'Mengunduh berkas CV PDF...');
    } else {
      showToast(
        'info',
        'Berkas CV PDF belum diunggah oleh pemilik situs. Anda dapat mengunggahnya melalui Dashboard Admin (/admin).'
      );
    }
  };

  return (
    <div className={isMinimal ? 'space-y-16 sm:space-y-20 pb-10' : 'space-y-12 sm:space-y-14 pb-6'}>
      {/* HERO SECTION: Dual-Mode Composition (Mode A: Minimalis Elegan Editorial Cutout | Mode B: Neo-Brutalist Classic) */}
      <section aria-label="Perkenalan utama" className={isMinimal ? 'pt-8 sm:pt-12 lg:pt-14' : 'pt-5 sm:pt-7'}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {isMinimal ? (
            /* MODE A — MINIMALIS ELEGAN EDITORIAL HERO */
            <div
              data-aos="fade-up"
              data-testid="hero-minimalis-elegan"
              className="relative card-green rounded-3xl border border-[#D9B44A]/25 shadow-[0_28px_64px_-24px_rgba(0,31,36,0.45)] overflow-visible px-6 pt-8 pb-7 sm:px-10 sm:pt-10 sm:pb-9 lg:px-12 lg:pt-11 lg:pb-10"
            >
              {/* Layer 0: Subtle architectural background ring clipped neatly inside the card surface */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-3xl"
              >
                <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full border border-[#D9B44A]/15" />
                <div className="absolute -bottom-32 -left-24 w-80 h-80 rounded-full border border-[#F8F8E1]/10" />
              </div>

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-end">
                {/* RIGHT on Desktop, TOP on Mobile: Dominant Transparent Cutout Portrait with Strict Layering */}
                <div className="order-1 lg:order-2 lg:col-span-5 flex justify-center lg:justify-end overflow-visible">
                  <div className="relative isolate w-[240px] sm:w-[290px] lg:w-[340px] h-[250px] sm:h-[300px] lg:h-[340px] flex items-end justify-center overflow-visible">
                    {/* Layer 1 (z-10): Outer subtle editorial geometric halo ring strictly BEHIND the portrait */}
                    <div
                      aria-hidden="true"
                      data-testid="hero-minimal-halo-ring"
                      className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 z-10 w-[236px] h-[236px] sm:w-[278px] sm:h-[278px] lg:w-[322px] lg:h-[322px] rounded-full border border-[#D9B44A]/35"
                    />

                    {/* Layer 1 (z-10): Primary Geometric Circle Backdrop (#D9B44A) strictly BEHIND the portrait */}
                    <div
                      aria-hidden="true"
                      data-testid="hero-minimal-yellow-circle"
                      className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 z-10 w-[206px] h-[206px] sm:w-[244px] sm:h-[244px] lg:w-[282px] lg:h-[282px] rounded-full bg-[#D9B44A] shadow-[0_18px_40px_-16px_rgba(0,31,36,0.45)]"
                    />

                    {/* Layer 2 (z-20): 100% Opaque Cutout Portrait strictly IN FRONT of the yellow circle (no transparency mask on subject) */}
                    {useCutoutHero ? (
                      <img
                        src={HERO_CUTOUT_ASSET_URL}
                        alt={`Foto profil ${profile.fullName}`}
                        data-testid="hero-minimal-cutout-portrait"
                        loading="eager"
                        decoding="async"
                        className="relative z-20 w-[224px] sm:w-[266px] lg:w-[318px] h-auto max-h-[310px] sm:max-h-[365px] lg:max-h-[430px] object-contain object-bottom -mt-10 sm:-mt-12 lg:-mt-24 select-none pointer-events-none drop-shadow-[0_14px_24px_rgba(0,31,36,0.28)]"
                      />
                    ) : (
                      <div
                        data-testid="hero-minimal-cutout-portrait"
                        className="relative z-20 w-[204px] sm:w-[242px] lg:w-[280px] h-[256px] sm:h-[304px] lg:h-[352px] -mt-6 sm:-mt-8 lg:-mt-16 rounded-t-[999px] overflow-hidden"
                      >
                        <SafeImage
                          src={profile.photoUrl}
                          alt={`Foto profil ${profile.fullName}`}
                          fallbackLabel={profile.fullName}
                          priority
                          className="w-full h-full object-cover object-[50%_14%]"
                        />
                      </div>
                    )}

                    {/* Layer 3 (z-30): Smooth Hero Green (#0F3D3A) bottom overlay ABOVE both photo & circle so subject merges cleanly into background without yellow bleed-through */}
                    <div
                      aria-hidden="true"
                      data-testid="hero-minimal-bottom-fade"
                      className="pointer-events-none absolute -inset-x-4 -bottom-px z-30 h-[108px] sm:h-[126px] lg:h-[146px] hero-bottom-green-fade"
                    />
                  </div>
                </div>

                {/* LEFT on Desktop, BELOW portrait on Mobile: Editorial Typography, Bio & Primary Actions */}
                <div className="order-2 lg:order-1 lg:col-span-7 flex flex-col justify-center">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-mono-num uppercase tracking-[0.14em] text-[#D9B44A] mb-3.5">
                    <span className="inline-flex items-center gap-2 font-bold">
                      <span className="w-5 h-[1.5px] bg-[#D9B44A] inline-block" aria-hidden="true" />
                      <span>{profile.domicile}</span>
                    </span>
                    <span className="text-[#F8F8E1]/35" aria-hidden="true">/</span>
                    <span className="text-[#F8F8E1]/85 font-semibold">
                      {education[0]
                        ? `${education[0].fieldOfStudy} · ${education[0].graduationYear}`
                        : 'Portofolio Profesional'}
                    </span>
                  </div>

                  <h1 className="font-display text-3xl sm:text-4xl lg:text-[48px] font-extrabold tracking-[-0.03em] leading-[1.04] text-balance text-[#F8F8E1]">
                    {profile.fullName}
                  </h1>

                  <p className="mt-3.5 sm:mt-4 font-display text-base sm:text-lg lg:text-[20px] font-semibold leading-snug text-[#D9B44A] max-w-2xl text-balance">
                    {profile.headline}
                  </p>

                  <p className="mt-3.5 text-sm sm:text-[15px] font-normal leading-relaxed text-[#F8F8E1]/90 max-w-xl">
                    {profile.shortBio}
                  </p>

                  {/* Editorial Action Controls */}
                  <div className="mt-6 sm:mt-7 flex flex-wrap items-center gap-3">
                    <a
                      href="/projects"
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate('/projects');
                      }}
                      className="brutal-btn-frame-green font-display font-bold text-xs sm:text-[13px] px-5 py-2.5 inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
                    >
                      <span>Explore Portfolio</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </a>

                    <button
                      type="button"
                      onClick={handleDownloadCv}
                      className="brutal-btn-on-dark-outline font-display font-bold text-xs sm:text-[13px] px-4 py-2.5 inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Download CV</span>
                    </button>

                    <a
                      href="/contact"
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate('/contact');
                      }}
                      className="brutal-btn-on-dark font-display font-bold text-xs sm:text-[13px] px-4 py-2.5 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <span>Contact Me</span>
                    </a>

                    <button
                      type="button"
                      onClick={onShareProfile}
                      aria-label="Bagikan tautan profil"
                      className="px-2.5 py-2 text-xs font-mono-num font-semibold text-[#F8F8E1]/90 hover:text-[#D9B44A] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Bagikan</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Clean Editorial Key Facts Strip */}
              <dl className="relative z-20 mt-7 sm:mt-8 pt-6 border-t border-[#F8F8E1]/16 grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 text-xs">
                <div>
                  <dt className="font-mono-num text-[10px] uppercase tracking-[0.14em] text-[#D9B44A] font-semibold">
                    Pendidikan
                  </dt>
                  <dd className="font-display font-bold text-sm mt-1 text-[#F8F8E1]">
                    {education[0] ? `${education[0].fieldOfStudy}` : 'Hukum Keluarga'}
                  </dd>
                  <dd className="font-normal text-[#F8F8E1]/80 mt-0.5">
                    {education[0] ? `${education[0].institution} (${education[0].graduationYear})` : 'Unismuh Makassar'}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono-num text-[10px] uppercase tracking-[0.14em] text-[#D9B44A] font-semibold">
                    Inisiatif Digital
                  </dt>
                  <dd className="font-display font-bold text-sm mt-1 text-[#F8F8E1]">
                    {featuredProject ? featuredProject.title : 'Dars with Osama'}
                  </dd>
                  <dd className="font-normal text-[#F8F8E1]/80 mt-0.5">
                    Pendidikan Islam &amp; Artikel Ilmiah
                  </dd>
                </div>
                <div>
                  <dt className="font-mono-num text-[10px] uppercase tracking-[0.14em] text-[#D9B44A] font-semibold">
                    Bahasa &amp; Ketersediaan
                  </dt>
                  <dd className="font-display font-bold text-sm mt-1 text-[#F8F8E1]">
                    {languageSkills.length > 0
                      ? languageSkills.map((l) => `${l.name.replace('Bahasa ', '')} (${l.proficiencyLabel})`).join(' · ')
                      : 'Arab (Menengah) · Inggris (Dasar)'}
                  </dd>
                  <dd className="font-normal text-[#F8F8E1]/80 mt-0.5">
                    Open for Remote, Freelance &amp; Full-Time
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            /* MODE B — NEO-BRUTALIST CLASSIC HERO (100% Preserved Original Layout) */
            <div
              data-aos="fade-up"
              data-testid="hero-neo-brutalist"
              className="card-green brutal-card frame-green p-4 sm:p-6 lg:p-8"
            >
              {/* Top Split: Identity & Bio on LEFT, Circular Profile Photo on RIGHT */}
              <div className="flex flex-row items-center justify-between gap-4 sm:gap-6 lg:gap-10">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono-num font-bold mb-2">
                    <span className="brutal-badge">{profile.domicile}</span>
                    <span className="hidden sm:inline font-semibold text-[#D9B44A]">
                      {education[0]
                        ? `${education[0].fieldOfStudy} (${education[0].graduationYear})`
                        : 'Portofolio Profesional'}
                    </span>
                  </div>

                  <h1 className="font-display text-[20px] min-[375px]:text-[23px] sm:text-3xl lg:text-[36px] font-extrabold tracking-tight leading-[1.08] text-balance break-words text-[#F8F8E1]">
                    {profile.fullName.toUpperCase()}
                  </h1>

                  <p className="mt-2 sm:mt-3 font-display text-xs min-[375px]:text-[13px] sm:text-base lg:text-lg font-bold leading-snug border-l-[3px] border-[#D9B44A] pl-2.5 sm:pl-3.5 text-balance text-[#F8F8E1]">
                    {profile.headline}
                  </p>

                  <p className="hidden md:block mt-3 text-sm font-normal leading-relaxed text-[#F8F8E1]/90 max-w-2xl">
                    {profile.shortBio}
                  </p>
                </div>

                {/* Circular 1:1 Profile Photo on RIGHT */}
                <div className="shrink-0 flex flex-col items-center gap-2.5">
                  <div
                    data-testid="hero-profile-photo-circle"
                    className="w-[84px] h-[84px] min-[390px]:w-[96px] min-[390px]:h-[96px] sm:w-28 sm:h-28 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full p-1 sm:p-1.5 bg-[#D9B44A] border-2 border-[#001F24] shadow-[4px_4px_0_0_#001F24]"
                  >
                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#001F24] bg-[#F8F8E1]">
                      <SafeImage
                        src={profile.photoUrl}
                        alt={`Foto profil ${profile.fullName}`}
                        fallbackLabel={profile.fullName}
                        priority
                        className="w-full h-full object-cover object-[50%_18%]"
                      />
                    </div>
                  </div>
                  <span className="hidden md:inline-block font-mono-num text-[11px] font-bold px-2.5 py-0.5 bg-[#D9B44A] text-[#001F24] border-2 border-[#001F24] whitespace-nowrap">
                    Open for Remote &amp; Full-Time
                  </span>
                </div>
              </div>

              {/* Mobile Short Bio */}
              <p className="md:hidden mt-3.5 text-xs min-[390px]:text-sm font-normal leading-relaxed text-[#F8F8E1]/90">
                {profile.shortBio}
              </p>

              {/* Crisp Editorial Key Facts Strip */}
              <dl className="mt-5 pt-4 border-t border-subtle grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                <div>
                  <dt className="font-mono-num text-[11px] uppercase text-[#D9B44A] font-semibold">Pendidikan</dt>
                  <dd className="font-bold text-[13px] mt-0.5 text-[#F8F8E1]">
                    {education[0] ? `${education[0].fieldOfStudy}` : 'Hukum Keluarga'}
                  </dd>
                  <dd className="font-normal text-[#F8F8E1]/85">
                    {education[0] ? `${education[0].institution} (${education[0].graduationYear})` : 'Unismuh Makassar'}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono-num text-[11px] uppercase text-[#D9B44A] font-semibold">Inisiatif Digital</dt>
                  <dd className="font-bold text-[13px] mt-0.5 text-[#F8F8E1]">
                    {featuredProject ? featuredProject.title : 'Dars with Osama'}
                  </dd>
                  <dd className="font-normal text-[#F8F8E1]/85">Pendidikan Islam &amp; Artikel Ilmiah</dd>
                </div>
                <div>
                  <dt className="font-mono-num text-[11px] uppercase text-[#D9B44A] font-semibold">Bahasa &amp; Peran</dt>
                  <dd className="font-bold text-[13px] mt-0.5 text-[#F8F8E1]">
                    {languageSkills.length > 0
                      ? languageSkills.map((l) => `${l.name.replace('Bahasa ', '')} (${l.proficiencyLabel})`).join(' · ')
                      : 'Arab (Menengah) · Inggris (Dasar)'}
                  </dd>
                  <dd className="font-normal text-[#F8F8E1]/85">Remote, Freelance &amp; Full-Time</dd>
                </div>
              </dl>

              {/* Action Controls (Primary CTA matches Green frame with crisp Beige border & Gold shadow) */}
              <div className="mt-5 pt-4 border-t-2 border-[#D9B44A]/45 flex flex-wrap items-center gap-2.5">
                <a
                  href="/projects"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/projects');
                  }}
                  className="brutal-btn-frame-green font-display font-bold text-xs sm:text-[13px] px-3.5 sm:px-4 py-2 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span>Explore Portfolio</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </a>

                <button
                  type="button"
                  onClick={handleDownloadCv}
                  className="brutal-btn-on-dark-outline font-display font-bold text-xs sm:text-[13px] px-3.5 sm:px-4 py-2 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Download CV</span>
                </button>

                <a
                  href="/contact"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/contact');
                  }}
                  className="brutal-btn-on-dark font-display font-bold text-xs sm:text-[13px] px-3.5 sm:px-4 py-2 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span>Contact Me</span>
                </a>

                <button
                  type="button"
                  onClick={onShareProfile}
                  aria-label="Bagikan tautan profil"
                  className="px-2 py-2 text-xs font-mono-num font-bold text-[#F8F8E1] hover:text-[#D9B44A] hover:underline decoration-2 underline-offset-4 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Bagikan</span>
                </button>
              </div>
            </div>
          )}

          {/* Full-Width 4-Column Portfolio Index Strip (Each stat card matches its official category color) */}
          <div className={isMinimal ? 'mt-6 sm:mt-7 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5' : 'mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3.5'}>
            <a
              href="/experience"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/experience');
              }}
              data-aos="fade-up"
              data-aos-delay="0"
              className="block text-left brutal-card brutal-card-interactive card-bordo frame-bordo p-4 cursor-pointer"
            >
              <p className="font-mono-num text-xl sm:text-2xl font-extrabold leading-none text-[#D9B44A]">
                {String(experiences.length + organizations.length).padStart(2, '0')}
              </p>
              <p className="font-display font-bold text-xs sm:text-sm mt-1.5 text-[#F8F8E1]">Pengalaman &amp; Organisasi</p>
              <p className="text-[11px] sm:text-xs font-normal text-muted mt-0.5">
                Pembinaan, pengajaran &amp; kepanitiaan
              </p>
            </a>

            <a
              href="/projects"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/projects');
              }}
              data-aos="fade-up"
              data-aos-delay="100"
              className="block text-left brutal-card brutal-card-interactive card-green frame-green p-4 cursor-pointer"
            >
              <p className="font-mono-num text-xl sm:text-2xl font-extrabold leading-none text-[#D9B44A]">
                {String(Math.max(projects.length, websiteProjects.length)).padStart(2, '0')}
              </p>
              <p className="font-display font-bold text-xs sm:text-sm mt-1.5 text-[#F8F8E1]">Proyek &amp; Karya Digital</p>
              <p className="text-[11px] sm:text-xs text-muted mt-0.5">
                Termasuk Dars with Osama
              </p>
            </a>

            <a
              href="/skills"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/skills');
              }}
              data-aos="fade-up"
              data-aos-delay="200"
              className="block text-left brutal-card brutal-card-interactive card-gold frame-gold p-4 cursor-pointer"
            >
              <p className="font-mono-num text-xl sm:text-2xl font-extrabold leading-none text-[#001F24]">
                {String(skills.length).padStart(2, '0')}
              </p>
              <p className="font-display font-bold text-xs sm:text-sm mt-1.5 text-[#001F24]">Keahlian &amp; Perangkat</p>
              <p className="text-[11px] sm:text-xs font-normal text-[#001F24] mt-0.5">
                Bahasa, AI tools, web &amp; akademik
              </p>
            </a>

            <a
              href="/certificates"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/certificates');
              }}
              data-aos="fade-up"
              data-aos-delay="300"
              className="block text-left brutal-card brutal-card-interactive card-green frame-green p-4 cursor-pointer"
            >
              <p className="font-mono-num text-xl sm:text-2xl font-extrabold leading-none text-[#D9B44A]">
                {String(certificates.length).padStart(2, '0')}
              </p>
              <p className="font-display font-bold text-xs sm:text-sm mt-1.5 text-[#F8F8E1]">Sertifikat &amp; Pelatihan</p>
              <p className="text-[11px] sm:text-xs text-muted mt-0.5">
                Galeri dalam &amp; luar negeri
              </p>
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 01: RINGKASAN BIDANG KEAHLIAN (Uniform Muted Golden Yellow #D9B44A + Deep Midnight Ink #001F24) */}
      <section aria-labelledby="home-skills-heading" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div data-aos="fade-up" className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 pb-3 border-b-2 border-brutal">
          <div>
            <span className="brutal-badge">01. Bidang Keahlian</span>
            <h2 id="home-skills-heading" className="font-display text-xl sm:text-2xl font-extrabold mt-1.5 text-balance text-[#1B2A3D]">
              Kompetensi Lintas Keilmuan &amp; Digital
            </h2>
          </div>
          <a
            href="/skills"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/skills');
            }}
            className="text-xs sm:text-sm font-bold text-[#1B2A3D] inline-flex items-center gap-1.5 hover:bg-[#D9B44A] hover:text-[#001F24] px-2.5 py-1 border-2 border-transparent hover:border-[#001F24] cursor-pointer whitespace-nowrap shrink-0 transition-colors"
          >
            <span>Lihat Semua Keahlian, Minat &amp; Bakat</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div data-aos="fade-up" data-aos-delay="0" className="brutal-card card-gold frame-gold p-5 flex flex-col justify-between">
            <div>
              <p className="font-mono-num text-[11px] font-bold text-[#001F24] uppercase">
                Akademik &amp; Pembinaan
              </p>
              <h3 className="font-display text-lg font-extrabold mt-1.5 text-[#001F24]">
                Hukum Keluarga &amp; Pengajaran
              </h3>
              <p className="text-sm font-normal text-[#001F24] mt-2 leading-relaxed">
                S1 Hukum Keluarga (Ahwal Syakhsiyah) Unismuh Makassar, berpengalaman membina kedisiplinan, administrasi, dan tradisi keilmuan mahasiswa serta mengajar di rumah tahfidz.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-subtle text-xs font-bold text-[#001F24]">
              Fikih &middot; Akidah &middot; Tafsir &middot; Tajwid &middot; Pendidikan Islam
            </div>
          </div>

          <div data-aos="fade-up" data-aos-delay="100" className="brutal-card card-gold frame-gold p-5 flex flex-col justify-between">
            <div>
              <p className="font-mono-num text-[11px] font-bold text-[#001F24] uppercase">
                Teknologi &amp; Perangkat Digital
              </p>
              <h3 className="font-display text-lg font-extrabold mt-1.5 text-[#001F24]">
                AI Tools, Web &amp; Media IT
              </h3>
              <p className="text-sm font-normal text-[#001F24] mt-2 leading-relaxed">
                Terbiasa mengelola publikasi web, dokumentasi digital, desain edukatif, dan pemanfaatan perangkat AI modern untuk riset serta pembelajaran.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-subtle text-xs font-bold text-[#001F24]">
              {toolSkills.slice(0, 6).map((s) => s.name).join(' · ') || 'ChatGPT · Google AI Studio · Netlify · Firebase'}
            </div>
          </div>

          <div data-aos="fade-up" data-aos-delay="200" className="brutal-card card-gold frame-gold p-5 flex flex-col justify-between">
            <div>
              <p className="font-mono-num text-[11px] font-bold text-[#001F24] uppercase">
                Bahasa &amp; Komunikasi
              </p>
              <h3 className="font-display text-lg font-extrabold mt-1.5 text-[#001F24]">
                Penguasaan Bahasa &amp; Kolaborasi
              </h3>
              <div className="mt-3 space-y-2.5">
                {languageSkills.map((lang) => (
                  <div
                    key={lang.id}
                    className="flex items-baseline justify-between gap-3 pb-2 border-b border-subtle last:border-b-0"
                  >
                    <span className="font-bold text-sm text-[#001F24]">{lang.name}</span>
                    <span className="font-mono-num text-xs font-bold text-[#001F24]">
                      {lang.proficiencyLabel || 'Dikelola di Admin'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <a
              href="/about"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/about');
              }}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#001F24] hover:underline decoration-2 underline-offset-4 cursor-pointer transition-colors"
            >
              <span>Baca profil lengkap &amp; visi misi</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 02: PROYEK & PENGALAMAN UNGGULAN (Each card follows its official category color) */}
      <section aria-labelledby="home-featured-heading" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div data-aos="fade-up" className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 pb-3 border-b-2 border-brutal">
          <div>
            <span className="brutal-badge-green">02. Sorotan Utama</span>
            <h2 id="home-featured-heading" className="font-display text-xl sm:text-2xl font-extrabold mt-1.5 text-balance text-[#1B2A3D]">
              Proyek &amp; Pengalaman Pilihan
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#1B2A3D]">
            <a
              href="/projects"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/projects');
              }}
              className="hover:bg-[#D9B44A] hover:text-[#001F24] px-2.5 py-1 border-2 border-transparent hover:border-[#001F24] cursor-pointer whitespace-nowrap transition-colors"
            >
              Semua Proyek
            </a>
            <a
              href="/experience"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/experience');
              }}
              className="hover:bg-[#D9B44A] hover:text-[#001F24] px-2.5 py-1 border-2 border-transparent hover:border-[#001F24] cursor-pointer whitespace-nowrap transition-colors"
            >
              Semua Pengalaman
            </a>
          </div>
        </div>

        <div
          className={
            isMinimal
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-stretch'
              : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch'
          }
        >
          {/* Featured Project Card (Origin: Proyek & Karya Digital -> Green #0F3D3A + Beige #F8F8E1) */}
          {featuredProject && (() => {
            const isDars = isDarsPlatformProject(featuredProject);
            const useCustomAsset = hasCustomUploadedDarsAsset(featuredProject);
            const primaryProjectPhoto = resolveProjectPrimaryPhoto(featuredProject);
            const projectTone = getSectionCardTone('projects');
            const projectCategoryLabel =
              ACTIVE_PROJECT_CATEGORY_LABELS[normalizeProjectCategory(featuredProject.category)];

            if (isMinimal) {
              return (
                <article
                  key={featuredProject.id}
                  data-testid="home-featured-project"
                  data-aos="fade-up"
                  data-aos-delay={getAosStaggerDelay(0, 100, 3)}
                  className={`brutal-card brutal-card-interactive overflow-hidden md:col-span-2 lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 ${projectTone.cardClass} ${projectTone.frameClass}`}
                >
                  <div className={`lg:col-span-6 aspect-[16/10] lg:aspect-auto lg:min-h-[300px] w-full border-b lg:border-b-0 lg:border-r border-[#D9B44A]/30 overflow-hidden shrink-0`}>
                    {isDars && !useCustomAsset ? (
                      <div className="w-full h-full bg-[#F4F4F0] flex items-center justify-center p-6">
                        <DarsLogo className="w-full h-full max-h-[240px] object-contain" />
                      </div>
                    ) : isDars ? (
                      <div className="w-full h-full bg-[#F4F4F0] flex items-center justify-center p-6">
                        <SafeImage
                          src={primaryProjectPhoto}
                          alt={featuredProject.title}
                          fallbackLabel={featuredProject.title}
                          className="w-full h-full max-h-[240px] object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-[#F8F8E1]">
                        <SafeImage
                          src={primaryProjectPhoto}
                          alt={featuredProject.title}
                          fallbackLabel={featuredProject.title}
                          className="w-full h-full block object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between gap-5">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-num">
                        <span className={projectTone.badgeClass}>{projectCategoryLabel}</span>
                        {featuredProject.period && (
                          <span className="font-bold text-[#D9B44A]">{featuredProject.period}</span>
                        )}
                      </div>
                      <h3 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight text-[#F8F8E1]">
                        {featuredProject.title}
                      </h3>
                      {featuredProject.description && (
                        <p className="text-sm sm:text-[15px] leading-relaxed text-[#F8F8E1]/85 line-clamp-3">
                          {featuredProject.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-subtle flex items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => setSelectedProject(featuredProject)}
                        className={`${projectTone.buttonClass} px-5 py-2.5 text-xs sm:text-sm font-bold cursor-pointer inline-flex items-center gap-2`}
                      >
                        <span>Lihat Detail Proyek</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            }

            return (
              <article
                key={featuredProject.id}
                data-testid="home-featured-project"
                data-aos="fade-up"
                data-aos-delay={getAosStaggerDelay(0, 100, 3)}
                className={`brutal-card brutal-card-interactive overflow-hidden flex flex-col h-full ${projectTone.cardClass} ${projectTone.frameClass}`}
              >
                <div className={`aspect-[16/9] w-full border-b-2 ${projectTone.mediaBorderClass} overflow-hidden shrink-0`}>
                  {isDars && !useCustomAsset ? (
                    <div className="w-full h-full bg-[#F4F4F0] flex items-center justify-center p-3">
                      <DarsLogo className="w-full h-full object-contain" />
                    </div>
                  ) : isDars ? (
                    <div className="w-full h-full bg-[#F4F4F0] flex items-center justify-center p-3">
                      <SafeImage
                        src={primaryProjectPhoto}
                        alt={featuredProject.title}
                        fallbackLabel={featuredProject.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-[#F8F8E1]">
                      <SafeImage
                        src={primaryProjectPhoto}
                        alt={featuredProject.title}
                        fallbackLabel={featuredProject.title}
                        className="w-full h-full block object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3.5">
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-num">
                      <span className={projectTone.badgeClass}>{projectCategoryLabel}</span>
                      {featuredProject.period && (
                        <span className="font-bold text-[#D9B44A]">{featuredProject.period}</span>
                      )}
                    </div>
                    <h3 className="font-display text-base sm:text-[17px] font-extrabold leading-snug line-clamp-2 min-h-[2.75rem] text-[#F8F8E1]">
                      {featuredProject.title}
                    </h3>
                  </div>

                  <div className="mt-auto pt-3 border-t border-subtle">
                    <button
                      type="button"
                      onClick={() => setSelectedProject(featuredProject)}
                      className={`${projectTone.buttonClass} w-full py-2 px-3.5 text-xs font-bold cursor-pointer`}
                    >
                      Lihat Detail
                    </button>
                  </div>
                </div>
              </article>
            );
          })()}

          {/* Featured Experience Cards (Origin: Pengalaman & Organisasi -> Bordo #6C151E + Beige #F8F8E1) */}
          {shownExperiences.map((exp, idx) => {
            const cardIndex = featuredProject ? idx + 1 : idx;
            const tone = getSectionCardTone('experience');
            const primaryPhoto = resolveExperiencePrimaryPhoto(exp.imageUrls, exp.primaryImageUrl);
            const minimalSpanClass = isMinimal
              ? shownExperiences.length === 1
                ? 'md:col-span-2 lg:col-span-12'
                : idx === 0
                  ? 'lg:col-span-7'
                  : 'lg:col-span-5'
              : '';

            return (
              <article
                key={exp.id}
                data-testid={`home-featured-exp-${idx}`}
                data-aos="fade-up"
                data-aos-delay={getAosStaggerDelay(cardIndex, 100, 3)}
                className={`brutal-card brutal-card-interactive overflow-hidden flex flex-col h-full ${tone.cardClass} ${tone.frameClass} ${minimalSpanClass}`}
              >
                <div className={`aspect-[16/9] w-full overflow-hidden border-b-2 ${tone.mediaBorderClass} bg-[#F8F8E1] shrink-0`}>
                  <SafeImage
                    src={primaryPhoto}
                    alt={`Foto utama ${exp.institution}`}
                    fallbackLabel={exp.institution}
                    className="w-full h-full block object-cover object-[50%_22%]"
                  />
                </div>

                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3.5">
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-num">
                      <span className={tone.badgeClass}>
                        {getExperienceCategoryLabel(exp.category)}
                      </span>
                      {exp.period && (
                        <span className="font-semibold text-[#D9B44A]">{exp.period}</span>
                      )}
                    </div>
                    <h3 className="font-display text-base sm:text-[17px] font-bold leading-snug line-clamp-2 min-h-[2.75rem] text-[#F8F8E1]">
                      {exp.institution}
                    </h3>
                  </div>

                  <div className="mt-auto pt-3 border-t border-subtle">
                    <button
                      type="button"
                      onClick={() => setSelectedExperience(toExperienceDetail(exp))}
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
      </section>

      {/* Shared Detail Modals (Full descriptions, gallery & external links) */}
      <ProjectDetailModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
      <ExperienceDetailModal
        detail={selectedExperience}
        onClose={() => setSelectedExperience(null)}
      />
    </div>
  );
};
