import React from 'react';
import { motion } from 'motion/react';
import { ExternalLink } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import type { PublicationCategory } from '../types/portfolio';
import { getCardTone } from '../utils/cardVariants';

const PUB_LABELS: Record<PublicationCategory, string> = {
  study_field: 'Bidang Keilmuan & Kajian',
  research_interest: 'Minat Penelitian',
  publication: 'Publikasi Ilmiah',
  article: 'Artikel & Karya Tulis',
};

export const EducationPage: React.FC = () => {
  const { publicData } = usePortfolio();
  const { education, publications } = publicData;

  const studyFields = publications.filter((p) => p.category === 'study_field' || p.category === 'research_interest');
  const writings = publications.filter((p) => p.category === 'publication' || p.category === 'article');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="border-b-2 border-brutal pb-8"
      >
        <span className="brutal-badge">03. Pendidikan &amp; Keilmuan</span>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold mt-3 text-balance">
          Riwayat Pendidikan, Kajian &amp; Karya Tulis
        </h1>
        <p className="mt-4 text-base text-muted max-w-3xl">
          Landasan akademik, fokus riset keislaman &amp; hukum keluarga, serta arsip tulisan ilmiah yang terus bertumbuh melalui manajemen konten admin.
        </p>
      </motion.header>

      {/* Formal Education */}
      <section aria-labelledby="formal-edu-heading">
        <h2 id="formal-edu-heading" className="font-display text-2xl sm:text-3xl font-extrabold mb-6">
          01. Riwayat Pendidikan Formal
        </h2>

        {education.length === 0 ? (
          <div className="brutal-card card-beige p-8 text-sm text-muted">
            Belum ada riwayat pendidikan yang dipublikasikan.
          </div>
        ) : (
          <div className="space-y-6">
            {education.map((edu, idx) => {
              const tone = getCardTone(idx, ['beige', 'green', 'blue']);
              return (
                <article
                  key={edu.id}
                  className={`brutal-card p-6 sm:p-8 ${tone.cardClass} ${
                    idx === 0 ? 'frame-shadow-bordo' : tone.frameClass
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono-num">
                    <span className="font-bold text-muted uppercase">
                      {edu.category} &middot; {edu.location}
                    </span>
                    <span className={idx === 0 ? 'brutal-badge-bordo' : tone.badgeClass}>
                      Kelulusan {edu.graduationYear}
                    </span>
                  </div>
                  <h3 className="font-display text-2xl sm:text-3xl font-extrabold mt-3">
                    {edu.institution}
                  </h3>
                  <p className="text-base sm:text-lg font-bold mt-1">
                    {edu.degree} &mdash; {edu.fieldOfStudy}
                  </p>
                  {edu.description && (
                    <p className="text-sm sm:text-base text-muted mt-4 leading-relaxed max-w-4xl">
                      {edu.description}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Academic Fields & Research Interests (Blue, Green, Beige, Bordo) */}
      <section aria-labelledby="research-fields-heading">
        <h2 id="research-fields-heading" className="font-display text-2xl sm:text-3xl font-extrabold mb-6">
          02. Bidang Akademik, Kajian &amp; Minat Penelitian
        </h2>
        {studyFields.length === 0 ? (
          <div className="brutal-card card-beige p-8 text-sm text-muted">
            Belum ada bidang kajian yang dipublikasikan. Tambahkan melalui Dashboard Admin.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {studyFields.map((item, idx) => {
              const tone = getCardTone(idx, ['blue', 'green', 'beige', 'bordo']);
              return (
                <article
                  key={item.id}
                  className={`brutal-card p-6 flex flex-col justify-between ${tone.cardClass} ${tone.frameClass}`}
                >
                  <div>
                    <span className={tone.badgeClass}>
                      {PUB_LABELS[item.category]} {item.year ? `· ${item.year}` : ''}
                    </span>
                    <h3 className="font-display text-xl font-extrabold mt-3">{item.title}</h3>
                    {item.venue && (
                      <p className="text-sm font-bold text-muted mt-1">
                        {item.venue}
                      </p>
                    )}
                    <p className="text-sm text-muted mt-3 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>
                  {item.url && (
                    <div className="mt-5 pt-4 border-t border-subtle">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-xs font-bold inline-flex items-center gap-1.5 hover:underline ${
                          tone.isDark ? 'text-[#8ACCD5]' : 'text-[#013A42]'
                        }`}
                      >
                        <span>Buka Referensi / Platform</span>
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      </a>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Publications & Articles (Bordo, Beige, Midnight, Blue) */}
      <section aria-labelledby="publications-heading">
        <h2 id="publications-heading" className="font-display text-2xl sm:text-3xl font-extrabold mb-6">
          03. Publikasi &amp; Karya Tulis
        </h2>
        {writings.length === 0 ? (
          <div className="brutal-card card-green frame-midnight p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="brutal-badge mb-2">Arsip Ilmiah</span>
              <p className="font-display font-bold text-lg text-[#F8F8E1]">Arsip Publikasi Siap Diisi</p>
              <p className="text-sm text-muted mt-1">
                Karya tulis, artikel jurnal, atau makalah ilmiah dapat ditambahkan satu per satu melalui menu Publikasi &amp; Kajian di Dashboard Admin.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {writings.map((pub, idx) => {
              const tone = getCardTone(idx, ['bordo', 'beige', 'midnight', 'blue']);
              return (
                <article
                  key={pub.id}
                  className={`brutal-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${tone.cardClass} ${tone.frameClass}`}
                >
                  <div>
                    <span className={tone.badgeClass}>
                      {PUB_LABELS[pub.category]} {pub.venue ? `· ${pub.venue}` : ''} {pub.year ? `· ${pub.year}` : ''}
                    </span>
                    <h3 className="font-display text-xl font-extrabold mt-2">{pub.title}</h3>
                    {pub.summary && (
                      <p className="text-sm text-muted mt-2 max-w-3xl">{pub.summary}</p>
                    )}
                  </div>
                  {pub.url && (
                    <a
                      href={pub.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${tone.buttonClass} px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0`}
                    >
                      <span>Baca Karya</span>
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
