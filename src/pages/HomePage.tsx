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
import { getCardTone } from '../utils/cardVariants';
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
  const { publicData, showToast } = usePortfolio();
  const { profile, experiences, organizations, education, projects, skills, certificates } = publicData;
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<ExperienceDetailViewData | null>(null);

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
    <div className="space-y-12 sm:space-y-14 pb-6">
      {/* HERO SECTION: Balanced split with circular 1:1 profile photo on the RIGHT (Desktop & Mobile) */}
      <section aria-label="Perkenalan utama" className="pt-5 sm:pt-7">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            data-aos="fade-up"
            className="card-beige brutal-card frame-shadow-green p-4 sm:p-6 lg:p-8"
          >
            {/* Top Split: Identity & Bio on LEFT, Circular Profile Photo on RIGHT */}
            <div className="flex flex-row items-center justify-between gap-4 sm:gap-6 lg:gap-10">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono-num font-bold mb-2">
                  <span className="brutal-badge">{profile.domicile}</span>
                  <span className="hidden sm:inline text-muted">
                    {education[0]
                      ? `${education[0].fieldOfStudy} (${education[0].graduationYear})`
                      : 'Portofolio Profesional'}
                  </span>
                </div>

                <h1 className="font-display text-[20px] min-[375px]:text-[23px] sm:text-3xl lg:text-[36px] font-extrabold tracking-tight leading-[1.08] text-balance break-words">
                  {profile.fullName.toUpperCase()}
                </h1>

                <p className="mt-2 sm:mt-3 font-display text-xs min-[375px]:text-[13px] sm:text-base lg:text-lg font-bold leading-snug border-l-[3px] border-[#6C151E] pl-2.5 sm:pl-3.5 text-balance">
                  {profile.headline}
                </p>

                <p className="hidden md:block mt-3 text-sm leading-relaxed text-muted max-w-2xl">
                  {profile.shortBio}
                </p>
              </div>

              {/* Circular 1:1 Profile Photo on RIGHT */}
              <div className="shrink-0 flex flex-col items-center gap-2.5">
                <div
                  data-testid="hero-profile-photo-circle"
                  className="w-[84px] h-[84px] min-[390px]:w-[96px] min-[390px]:h-[96px] sm:w-28 sm:h-28 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full p-1 sm:p-1.5 bg-[#6C151E] border-2 border-[#013A42] shadow-[4px_4px_0_0_#013A42]"
                >
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#F8F8E1] bg-[#F8F8E1]">
                    <SafeImage
                      src={profile.photoUrl}
                      alt={`Foto profil ${profile.fullName}`}
                      fallbackLabel={profile.fullName}
                      priority
                      className="w-full h-full object-cover object-[50%_18%]"
                    />
                  </div>
                </div>
                <span className="hidden md:inline-block font-mono-num text-[11px] font-bold px-2.5 py-0.5 bg-[#013A42] text-[#8ACCD5] border border-[#013A42] whitespace-nowrap">
                  Open for Remote &amp; Full-Time
                </span>
              </div>
            </div>

            {/* Mobile Short Bio */}
            <p className="md:hidden mt-3.5 text-xs min-[390px]:text-sm leading-relaxed text-muted">
              {profile.shortBio}
            </p>

            {/* Crisp Editorial Key Facts Strip */}
            <dl className="mt-5 pt-4 border-t border-subtle grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
              <div>
                <dt className="font-mono-num text-[11px] uppercase text-[#6C151E] font-bold">Pendidikan</dt>
                <dd className="font-bold text-[13px] mt-0.5">
                  {education[0] ? `${education[0].fieldOfStudy}` : 'Hukum Keluarga'}
                </dd>
                <dd className="text-muted">
                  {education[0] ? `${education[0].institution} (${education[0].graduationYear})` : 'Unismuh Makassar'}
                </dd>
              </div>
              <div>
                <dt className="font-mono-num text-[11px] uppercase text-[#0F3D3A] font-bold">Inisiatif Digital</dt>
                <dd className="font-bold text-[13px] mt-0.5">
                  {featuredProject ? featuredProject.title : 'Dars with Osama'}
                </dd>
                <dd className="text-muted">Pendidikan Islam &amp; Artikel Ilmiah</dd>
              </div>
              <div>
                <dt className="font-mono-num text-[11px] uppercase text-[#013A42] font-bold">Bahasa &amp; Peran</dt>
                <dd className="font-bold text-[13px] mt-0.5">
                  {languageSkills.length > 0
                    ? languageSkills.map((l) => `${l.name.replace('Bahasa ', '')} (${l.proficiencyLabel})`).join(' · ')
                    : 'Arab (Menengah) · Inggris (Dasar)'}
                </dd>
                <dd className="text-muted">Remote, Freelance &amp; Full-Time</dd>
              </div>
            </dl>

            {/* Action Controls */}
            <div className="mt-5 pt-4 border-t-2 border-brutal flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => onNavigate('/projects')}
                className="brutal-btn brutal-btn-primary font-display font-bold text-xs sm:text-[13px] px-3.5 sm:px-4 py-2 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>Explore Portfolio</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={handleDownloadCv}
                className="brutal-btn brutal-btn-secondary font-display font-bold text-xs sm:text-[13px] px-3.5 sm:px-4 py-2 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Download CV</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('/contact')}
                className="brutal-btn brutal-btn-outline font-display font-bold text-xs sm:text-[13px] px-3.5 sm:px-4 py-2 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>Contact Me</span>
              </button>

              <button
                type="button"
                onClick={onShareProfile}
                aria-label="Bagikan tautan profil"
                className="px-2 py-2 text-xs font-mono-num font-bold text-muted hover:text-[#6C151E] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Bagikan</span>
              </button>
            </div>
          </div>

          {/* Full-Width 4-Column Portfolio Index Strip */}
          <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <button
              type="button"
              onClick={() => onNavigate('/experience')}
              data-aos="fade-up"
              data-aos-delay="0"
              className="text-left brutal-card brutal-card-interactive card-beige frame-midnight p-4 cursor-pointer"
            >
              <p className="font-mono-num text-xl sm:text-2xl font-extrabold leading-none">
                {String(experiences.length + organizations.length).padStart(2, '0')}
              </p>
              <p className="font-display font-bold text-xs sm:text-sm mt-1.5">Pengalaman &amp; Organisasi</p>
              <p className="text-[11px] sm:text-xs text-muted mt-0.5">
                Pembinaan, pengajaran &amp; kepanitiaan
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/projects')}
              data-aos="fade-up"
              data-aos-delay="100"
              className="text-left brutal-card brutal-card-interactive card-blue frame-shadow-bordo p-4 cursor-pointer"
            >
              <p className="font-mono-num text-xl sm:text-2xl font-extrabold leading-none">
                {String(Math.max(projects.length, websiteProjects.length)).padStart(2, '0')}
              </p>
              <p className="font-display font-bold text-xs sm:text-sm mt-1.5">Proyek &amp; Karya Digital</p>
              <p className="text-[11px] sm:text-xs text-muted mt-0.5">
                Termasuk Dars with Osama
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/skills')}
              data-aos="fade-up"
              data-aos-delay="200"
              className="text-left brutal-card brutal-card-interactive card-green frame-midnight p-4 cursor-pointer"
            >
              <p className="font-mono-num text-xl sm:text-2xl font-extrabold leading-none text-[#8ACCD5]">
                {String(skills.length).padStart(2, '0')}
              </p>
              <p className="font-display font-bold text-xs sm:text-sm mt-1.5">Keahlian &amp; Perangkat</p>
              <p className="text-[11px] sm:text-xs text-muted mt-0.5">
                Bahasa, AI tools, web &amp; akademik
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/certificates')}
              data-aos="fade-up"
              data-aos-delay="300"
              className="text-left brutal-card brutal-card-interactive card-bordo frame-midnight p-4 cursor-pointer"
            >
              <p className="font-mono-num text-xl sm:text-2xl font-extrabold leading-none text-[#8ACCD5]">
                {String(certificates.length).padStart(2, '0')}
              </p>
              <p className="font-display font-bold text-xs sm:text-sm mt-1.5">Sertifikat &amp; Pelatihan</p>
              <p className="text-[11px] sm:text-xs text-muted mt-0.5">
                Galeri dalam &amp; luar negeri
              </p>
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 01: RINGKASAN BIDANG KEAHLIAN */}
      <section aria-labelledby="home-skills-heading" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div data-aos="fade-up" className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 pb-3 border-b-2 border-brutal">
          <div>
            <span className="brutal-badge-bordo">01. Bidang Keahlian</span>
            <h2 id="home-skills-heading" className="font-display text-xl sm:text-2xl font-extrabold mt-1.5 text-balance">
              Kompetensi Lintas Keilmuan &amp; Digital
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/skills')}
            className="text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 hover:bg-[#8ACCD5] hover:text-[#013A42] px-2.5 py-1 border-2 border-transparent hover:border-[#013A42] cursor-pointer whitespace-nowrap shrink-0 transition-colors"
          >
            <span>Lihat Semua Keahlian, Minat &amp; Bakat</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div data-aos="fade-up" data-aos-delay="0" className="brutal-card card-beige frame-shadow-bordo p-5 flex flex-col justify-between">
            <div>
              <p className="font-mono-num text-[11px] font-bold text-[#6C151E] uppercase">
                Akademik &amp; Pembinaan
              </p>
              <h3 className="font-display text-lg font-extrabold mt-1.5">
                Hukum Keluarga &amp; Pengajaran
              </h3>
              <p className="text-sm text-muted mt-2 leading-relaxed">
                S1 Hukum Keluarga (Ahwal Syakhsiyah) Unismuh Makassar, berpengalaman membina kedisiplinan, administrasi, dan tradisi keilmuan mahasiswa serta mengajar di rumah tahfidz.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-subtle text-xs font-semibold text-muted">
              Fikih &middot; Akidah &middot; Tafsir &middot; Tajwid &middot; Pendidikan Islam
            </div>
          </div>

          <div data-aos="fade-up" data-aos-delay="100" className="brutal-card card-green frame-midnight p-5 flex flex-col justify-between">
            <div>
              <p className="font-mono-num text-[11px] font-bold text-[#8ACCD5] uppercase">
                Teknologi &amp; Perangkat Digital
              </p>
              <h3 className="font-display text-lg font-extrabold mt-1.5 text-[#F8F8E1]">
                AI Tools, Web &amp; Media IT
              </h3>
              <p className="text-sm text-muted mt-2 leading-relaxed">
                Terbiasa mengelola publikasi web, dokumentasi digital, desain edukatif, dan pemanfaatan perangkat AI modern untuk riset serta pembelajaran.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-subtle text-xs font-semibold text-[#8ACCD5]">
              {toolSkills.slice(0, 6).map((s) => s.name).join(' · ') || 'ChatGPT · Google AI Studio · Netlify · Firebase'}
            </div>
          </div>

          <div data-aos="fade-up" data-aos-delay="200" className="brutal-card card-midnight frame-shadow-bordo p-5 flex flex-col justify-between">
            <div>
              <p className="font-mono-num text-[11px] font-bold text-[#8ACCD5] uppercase">
                Bahasa &amp; Komunikasi
              </p>
              <h3 className="font-display text-lg font-extrabold mt-1.5 text-[#F8F8E1]">
                Penguasaan Bahasa &amp; Kolaborasi
              </h3>
              <div className="mt-3 space-y-2.5">
                {languageSkills.map((lang) => (
                  <div
                    key={lang.id}
                    className="flex items-baseline justify-between gap-3 pb-2 border-b border-[#8ACCD5]/30 last:border-b-0"
                  >
                    <span className="font-bold text-sm text-[#F8F8E1]">{lang.name}</span>
                    <span className="font-mono-num text-xs font-bold text-[#8ACCD5]">
                      {lang.proficiencyLabel || 'Dikelola di Admin'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/about')}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#8ACCD5] hover:text-[#F8F8E1] hover:underline cursor-pointer transition-colors"
            >
              <span>Baca profil lengkap &amp; visi misi</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 02: PROYEK & PENGALAMAN UNGGULAN (Beserta Foto Masing-Masing) */}
      <section aria-labelledby="home-featured-heading" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div data-aos="fade-up" className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 pb-3 border-b-2 border-brutal">
          <div>
            <span className="brutal-badge-green">02. Sorotan Utama</span>
            <h2 id="home-featured-heading" className="font-display text-xl sm:text-2xl font-extrabold mt-1.5 text-balance">
              Proyek &amp; Pengalaman Pilihan
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
            <button
              type="button"
              onClick={() => onNavigate('/projects')}
              className="hover:bg-[#8ACCD5] hover:text-[#013A42] px-2.5 py-1 border-2 border-transparent hover:border-[#013A42] cursor-pointer whitespace-nowrap transition-colors"
            >
              Semua Proyek
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/experience')}
              className="hover:bg-[#8ACCD5] hover:text-[#013A42] px-2.5 py-1 border-2 border-transparent hover:border-[#013A42] cursor-pointer whitespace-nowrap transition-colors"
            >
              Semua Pengalaman
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {/* Featured Project Card (Uniform 16:9 media, concise metadata, Detail button) */}
          {featuredProject && (() => {
            const isDars = isDarsPlatformProject(featuredProject);
            const useCustomAsset = hasCustomUploadedDarsAsset(featuredProject);
            const primaryProjectPhoto = resolveProjectPrimaryPhoto(featuredProject);
            const projectTone = getCardTone(0, ['beige', 'blue', 'green', 'bordo']);
            const projectCategoryLabel =
              ACTIVE_PROJECT_CATEGORY_LABELS[normalizeProjectCategory(featuredProject.category)];

            return (
              <article
                key={featuredProject.id}
                data-testid="home-featured-project"
                data-aos="fade-up"
                data-aos-delay={getAosStaggerDelay(0, 100, 3)}
                className={`brutal-card brutal-card-interactive overflow-hidden flex flex-col h-full ${projectTone.cardClass} ${projectTone.frameClass}`}
              >
                <div className="aspect-[16/9] w-full border-b-2 border-[#6C151E] overflow-hidden shrink-0">
                  {isDars && !useCustomAsset ? (
                    <div className="w-full h-full bg-[#013A42] flex items-center justify-center p-5">
                      <div className="bg-[#F8F8E1] border-2 border-[#8ACCD5] shadow-[4px_4px_0_0_#6C151E] p-2.5 flex items-center justify-center">
                        <DarsLogo className="w-20 h-20 object-contain" />
                      </div>
                    </div>
                  ) : isDars ? (
                    <div className="w-full h-full bg-[#013A42] flex items-center justify-center p-4">
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
                        <span className="font-bold text-muted">{featuredProject.period}</span>
                      )}
                    </div>
                    <h3 className="font-display text-base sm:text-[17px] font-extrabold leading-snug line-clamp-2 min-h-[2.75rem]">
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

          {/* Featured Experience Cards (Uniform 16:9 media, concise metadata, Detail button) */}
          {shownExperiences.map((exp, idx) => {
            const cardIndex = featuredProject ? idx + 1 : idx;
            const tone = getCardTone(cardIndex, ['beige', 'blue', 'green', 'bordo', 'midnight']);
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
                data-testid={`home-featured-exp-${idx}`}
                data-aos="fade-up"
                data-aos-delay={getAosStaggerDelay(cardIndex, 100, 3)}
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
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-num">
                      <span className={tone.badgeClass}>
                        {getExperienceCategoryLabel(exp.category)}
                      </span>
                      {exp.period && (
                        <span className="font-bold text-muted">{exp.period}</span>
                      )}
                    </div>
                    <h3 className="font-display text-base sm:text-[17px] font-extrabold leading-snug line-clamp-2 min-h-[2.75rem]">
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
