import React from 'react';
import { motion } from 'motion/react';
import { usePortfolio } from '../context/PortfolioContext';
import { getCardTone } from '../utils/cardVariants';
import { SafeImage } from '../components/ui/SafeImage';
import { DarsPublicationsCatalog } from '../components/publications/DarsPublicationsCatalog';

export const EducationPage: React.FC = () => {
  const { publicData } = usePortfolio();
  const { education } = publicData;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="border-b-2 border-brutal pb-8"
      >
        <span className="brutal-badge">03. Pendidikan &amp; Publikasi</span>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold mt-3 text-balance">
          Riwayat Pendidikan &amp; Publikasi Karya Tulis
        </h1>
        <p className="mt-4 text-base text-muted max-w-3xl">
          Riwayat pendidikan formal serta katalog publikasi dan karya tulis yang tersinkronisasi langsung dari platform Dars with Osama.
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
                  {edu.imageUrls && edu.imageUrls.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-subtle grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {edu.imageUrls.map((imgUrl, imgIdx) => (
                        <div
                          key={`${edu.id}-img-${imgIdx}`}
                          className="aspect-[4/3] border-2 border-[#013A42] bg-[#F8F8E1] overflow-hidden"
                        >
                          <SafeImage
                            src={imgUrl}
                            alt={`Dokumentasi ${edu.institution} ${imgIdx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Live Publications & Writings Synced from Dars with Osama */}
      <section aria-labelledby="publications-heading">
        <h2 id="publications-heading" className="font-display text-2xl sm:text-3xl font-extrabold mb-4">
          02. Publikasi &amp; Karya Tulis
        </h2>
        <DarsPublicationsCatalog />
      </section>
    </div>
  );
};
