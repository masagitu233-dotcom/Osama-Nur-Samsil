import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  Download,
  ExternalLink,
  Share2,
} from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import type { PublicRoute } from '../types/portfolio';
import { SafeImage } from '../components/ui/SafeImage';

interface HomePageProps {
  onNavigate: (route: PublicRoute) => void;
  onShareProfile: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onShareProfile }) => {
  const { publicData, showToast } = usePortfolio();
  const { profile, experiences, organizations, education, projects, skills, certificates } = publicData;

  const featuredExperiences = experiences.filter((e) => e.featured).slice(0, 3);
  const shownExperiences = featuredExperiences.length > 0 ? featuredExperiences : experiences.slice(0, 3);
  const featuredProject = projects.find((p) => p.featured) || projects[0];
  const languageSkills = skills.filter((s) => s.category === 'language');
  const toolSkills = skills.filter((s) => s.category === 'tool' || s.category === 'technical');

  const handleDownloadCv = () => {
    if (profile.cvUrl) {
      const link = document.createElement('a');
      link.href = profile.cvUrl;
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
    <div className="space-y-20 pb-8">
      {/* HERO SECTION: Asymmetric 2-Column Split (items-stretch) */}
      <section aria-label="Perkenalan utama" className="pt-8 sm:pt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            {/* Left Column: Editorial Typography & Actions */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 flex flex-col justify-between surface-card brutal-card p-6 sm:p-10"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono-num font-bold mb-5">
                  <span className="brutal-badge">{profile.domicile}</span>
                  <span className="text-muted">
                    {education[0]
                      ? `${education[0].fieldOfStudy} (${education[0].graduationYear})`
                      : 'Portofolio Profesional'}
                  </span>
                </div>

                <h1 className="font-display text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.04] text-balance">
                  {profile.fullName.toUpperCase()}
                </h1>

                <p className="mt-5 font-display text-xl sm:text-2xl font-bold leading-snug border-l-4 border-[#8ACCD5] pl-4 text-balance">
                  {profile.headline}
                </p>

                <p className="mt-5 text-base leading-relaxed text-muted max-w-2xl">
                  {profile.shortBio}
                </p>

                {/* Crisp Editorial Key Facts Strip (fills vertical balance cleanly, zero pills) */}
                <dl className="mt-7 pt-5 border-t border-subtle grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <dt className="font-mono-num uppercase text-muted font-bold">Pendidikan</dt>
                    <dd className="font-bold text-sm mt-0.5">
                      {education[0] ? `${education[0].fieldOfStudy}` : 'Hukum Keluarga'}
                    </dd>
                    <dd className="text-muted">
                      {education[0] ? `${education[0].institution} (${education[0].graduationYear})` : 'Unismuh Makassar'}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono-num uppercase text-muted font-bold">Inisiatif Digital</dt>
                    <dd className="font-bold text-sm mt-0.5">
                      {featuredProject ? featuredProject.title : 'Dars with Osama'}
                    </dd>
                    <dd className="text-muted">Pendidikan Islam &amp; Artikel Ilmiah</dd>
                  </div>
                  <div>
                    <dt className="font-mono-num uppercase text-muted font-bold">Bahasa &amp; Peran</dt>
                    <dd className="font-bold text-sm mt-0.5">
                      {languageSkills.length > 0
                        ? languageSkills.map((l) => `${l.name.replace('Bahasa ', '')} (${l.proficiencyLabel})`).join(' · ')
                        : 'Arab (Menengah) · Inggris (Dasar)'}
                    </dd>
                    <dd className="text-muted">Remote, Freelance &amp; Full-Time</dd>
                  </div>
                </dl>
              </div>

              {/* Action Controls */}
              <div className="mt-8 pt-6 border-t-2 border-brutal flex flex-wrap items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => onNavigate('/projects')}
                  className="brutal-btn brutal-btn-primary font-display font-bold text-sm px-5 py-3 inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <span>Explore Portfolio</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCv}
                  className="brutal-btn brutal-btn-secondary font-display font-bold text-sm px-5 py-3 inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  <span>Download CV</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('/contact')}
                  className="brutal-btn brutal-btn-outline font-display font-bold text-sm px-5 py-3 inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <span>Contact Me</span>
                </button>

                <button
                  type="button"
                  onClick={onShareProfile}
                  aria-label="Bagikan tautan profil"
                  className="px-3 py-3 text-xs font-mono-num font-bold text-muted hover:text-[#013A42] dark:hover:text-[#8ACCD5] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
                >
                  <Share2 className="w-4 h-4" aria-hidden="true" />
                  <span>Bagikan</span>
                </button>
              </div>
            </motion.div>

            {/* Right Column: Editorial Portrait Frame */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 relative flex"
            >
              <div className="w-full brutal-card surface-highlight overflow-hidden flex flex-col">
                <div className="relative flex-1 min-h-[340px] sm:min-h-[400px] lg:min-h-0">
                  <SafeImage
                    src={profile.photoUrl}
                    alt={`Foto profil ${profile.fullName}`}
                    fallbackLabel={profile.fullName}
                    priority
                    className="w-full h-full object-cover object-top"
                  />
                  {/* Controlled Geometric Neo-Brutalist Corner Blocks */}
                  <div
                    aria-hidden="true"
                    className="absolute top-0 right-0 w-10 h-10 bg-[#8ACCD5] border-l-2 border-b-2 border-[#013A42]"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 w-6 h-6 bg-[#013A42] border-t-2 border-r-2 border-[#F8F8E1]"
                  />
                </div>
                <div className="px-5 py-3.5 border-t-2 border-brutal surface-card flex items-center justify-between gap-3 text-xs font-mono-num">
                  <span className="font-bold truncate">{profile.domicile}</span>
                  <span className="text-muted whitespace-nowrap shrink-0">
                    Open for Remote &amp; Full-Time
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Full-Width 4-Column Portfolio Index Strip below Hero Split */}
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => onNavigate('/experience')}
              className="text-left brutal-card brutal-card-interactive surface-card p-5 cursor-pointer"
            >
              <p className="font-mono-num text-2xl sm:text-3xl font-extrabold">
                {String(experiences.length + organizations.length).padStart(2, '0')}
              </p>
              <p className="font-display font-bold text-sm mt-1">Pengalaman &amp; Organisasi</p>
              <p className="text-xs text-muted mt-0.5">
                Pembinaan, pengajaran &amp; kepanitiaan
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/projects')}
              className="text-left brutal-card brutal-card-interactive surface-card p-5 cursor-pointer"
            >
              <p className="font-mono-num text-2xl sm:text-3xl font-extrabold">
                {String(projects.length).padStart(2, '0')}
              </p>
              <p className="font-display font-bold text-sm mt-1">Proyek &amp; Karya Digital</p>
              <p className="text-xs text-muted mt-0.5">
                Termasuk Dars with Osama
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/skills')}
              className="text-left brutal-card brutal-card-interactive surface-card p-5 cursor-pointer"
            >
              <p className="font-mono-num text-2xl sm:text-3xl font-extrabold">
                {String(skills.length).padStart(2, '0')}
              </p>
              <p className="font-display font-bold text-sm mt-1">Keahlian &amp; Perangkat</p>
              <p className="text-xs text-muted mt-0.5">
                Bahasa, AI tools, web &amp; akademik
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/certificates')}
              className="text-left brutal-card brutal-card-interactive surface-highlight p-5 cursor-pointer"
            >
              <p className="font-mono-num text-2xl sm:text-3xl font-extrabold">
                {String(certificates.length).padStart(2, '0')}
              </p>
              <p className="font-display font-bold text-sm mt-1">Sertifikat &amp; Pelatihan</p>
              <p className="text-xs text-muted mt-0.5">
                Galeri dalam &amp; luar negeri
              </p>
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 01: RINGKASAN BIDANG KEAHLIAN */}
      <section aria-labelledby="home-skills-heading" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b-2 border-brutal">
          <div>
            <span className="brutal-badge">01. Bidang Keahlian</span>
            <h2 id="home-skills-heading" className="font-display text-3xl sm:text-4xl font-extrabold mt-2 text-balance">
              Kompetensi Lintas Keilmuan &amp; Digital
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/skills')}
            className="text-sm font-bold inline-flex items-center gap-1.5 hover:bg-[#8ACCD5] hover:text-[#013A42] px-2.5 py-1.5 border-2 border-transparent hover:border-[#013A42] cursor-pointer whitespace-nowrap shrink-0 transition-colors"
          >
            <span>Lihat Semua Keahlian, Minat &amp; Bakat</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="brutal-card surface-card p-6 flex flex-col justify-between">
            <div>
              <p className="font-mono-num text-xs font-bold text-muted uppercase">
                Akademik &amp; Pembinaan
              </p>
              <h3 className="font-display text-xl font-extrabold mt-2">
                Hukum Keluarga &amp; Pengajaran
              </h3>
              <p className="text-sm text-muted mt-3 leading-relaxed">
                S1 Hukum Keluarga (Ahwal Syakhsiyah) Unismuh Makassar, berpengalaman membina kedisiplinan, administrasi, dan tradisi keilmuan mahasiswa serta mengajar di rumah tahfidz.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-subtle text-xs font-semibold text-muted">
              Fikih &middot; Akidah &middot; Tafsir &middot; Tajwid &middot; Pendidikan Islam
            </div>
          </div>

          {/* Card 2 */}
          <div className="brutal-card surface-card p-6 flex flex-col justify-between">
            <div>
              <p className="font-mono-num text-xs font-bold text-muted uppercase">
                Teknologi &amp; Perangkat Digital
              </p>
              <h3 className="font-display text-xl font-extrabold mt-2">
                AI Tools, Web &amp; Media IT
              </h3>
              <p className="text-sm text-muted mt-3 leading-relaxed">
                Terbiasa mengelola publikasi web, dokumentasi digital, desain edukatif, dan pemanfaatan perangkat AI modern untuk riset serta pembelajaran.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-subtle text-xs font-semibold text-muted">
              {toolSkills.slice(0, 6).map((s) => s.name).join(' · ') || 'ChatGPT · Google AI Studio · Netlify · Firebase'}
            </div>
          </div>

          {/* Card 3: Midnight Green Identity Emphasis Card */}
          <div className="brutal-card surface-dark p-6 flex flex-col justify-between">
            <div>
              <p className="font-mono-num text-xs font-bold text-[#8ACCD5] uppercase">
                Bahasa &amp; Komunikasi
              </p>
              <h3 className="font-display text-xl font-extrabold mt-2 text-[#F8F8E1]">
                Penguasaan Bahasa &amp; Kolaborasi
              </h3>
              <div className="mt-4 space-y-3">
                {languageSkills.map((lang) => (
                  <div
                    key={lang.id}
                    className="flex items-baseline justify-between gap-3 pb-2.5 border-b border-[#8ACCD5]/30 last:border-b-0"
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
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#8ACCD5] hover:text-[#F8F8E1] hover:underline cursor-pointer transition-colors"
            >
              <span>Baca profil lengkap &amp; visi misi</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 02: PROYEK & PENGALAMAN UNGGULAN */}
      <section aria-labelledby="home-featured-heading" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b-2 border-brutal">
          <div>
            <span className="brutal-badge">02. Sorotan Utama</span>
            <h2 id="home-featured-heading" className="font-display text-3xl sm:text-4xl font-extrabold mt-2 text-balance">
              Proyek &amp; Pengalaman Pilihan
            </h2>
          </div>
          <div className="flex items-center gap-3 text-sm font-bold">
            <button
              type="button"
              onClick={() => onNavigate('/projects')}
              className="hover:bg-[#8ACCD5] hover:text-[#013A42] px-2.5 py-1.5 border-2 border-transparent hover:border-[#013A42] cursor-pointer whitespace-nowrap transition-colors"
            >
              Semua Proyek
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/experience')}
              className="hover:bg-[#8ACCD5] hover:text-[#013A42] px-2.5 py-1.5 border-2 border-transparent hover:border-[#013A42] cursor-pointer whitespace-nowrap transition-colors"
            >
              Semua Pengalaman
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Featured Project Spotlight */}
          {featuredProject && (
            <article className="lg:col-span-7 brutal-card surface-card overflow-hidden flex flex-col">
              <div className="aspect-[16/10] w-full border-b-2 border-brutal overflow-hidden">
                <SafeImage
                  src={featuredProject.imageUrls[0]}
                  alt={featuredProject.title}
                  fallbackLabel={featuredProject.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 text-xs font-mono-num font-bold">
                    <span className="brutal-badge">Proyek Unggulan</span>
                    <span className="text-muted">{featuredProject.period || 'Aktif'}</span>
                  </div>
                  <h3 className="font-display text-2xl sm:text-3xl font-extrabold mt-3">
                    {featuredProject.title}
                  </h3>
                  <p className="text-sm sm:text-base text-muted mt-3 leading-relaxed">
                    {featuredProject.description}
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-subtle flex flex-wrap items-center gap-3">
                  {featuredProject.liveUrl && (
                    <a
                      href={featuredProject.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="brutal-btn brutal-btn-primary px-4 py-2.5 text-sm font-bold inline-flex items-center gap-2 whitespace-nowrap"
                    >
                      <span>Kunjungi Website</span>
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => onNavigate('/projects')}
                    className="brutal-btn brutal-btn-secondary px-4 py-2.5 text-sm font-bold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <span>Detail &amp; Karya Lain</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          )}

          {/* Featured Experiences Stack */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {shownExperiences.map((exp, idx) => {
              const isHighlighted = idx === 1;
              return (
                <article
                  key={exp.id}
                  className={`brutal-card brutal-card-interactive p-5 flex-1 flex flex-col justify-between ${
                    isHighlighted ? 'surface-highlight' : 'surface-card'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs font-mono-num">
                      <span className="font-bold">
                        0{idx + 1}. {exp.category === 'mentoring' ? 'Pembinaan' : exp.category === 'teaching' ? 'Pengajaran' : exp.category === 'committee' ? 'Kepanitiaan' : 'Pekerjaan'}
                      </span>
                      <span className={isHighlighted ? 'brutal-badge-inverse' : 'brutal-badge'}>
                        {exp.period}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-extrabold mt-2 leading-snug">
                      {exp.role}
                    </h3>
                    <p className="text-sm font-bold mt-0.5 text-muted">
                      {exp.institution}
                    </p>
                    <p className="text-sm text-muted mt-2 line-clamp-2">
                      {exp.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-subtle flex items-center justify-between text-xs">
                    <span className="font-mono-num text-muted">
                      {exp.duration || exp.location}
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigate('/experience')}
                      className="font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <span>Selengkapnya</span>
                      <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
