import React from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { getCardTone } from '../utils/cardVariants';
import { getAosStaggerDelay } from '../utils/aos';
import { SafeImage } from '../components/ui/SafeImage';
import { DarsPublicationsCatalog } from '../components/publications/DarsPublicationsCatalog';

export const EducationPage: React.FC = () => {
  const { publicData } = usePortfolio();
  const { education } = publicData;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
      <header data-aos="fade-up" className="border-b-2 border-brutal pb-5 sm:pb-6">
        <span className="brutal-badge">03. Pendidikan &amp; Publikasi</span>
        <h1 className="font-display text-2xl sm:text-3xl lg:text-[34px] font-extrabold mt-2.5 text-balance leading-tight">
          Riwayat Pendidikan &amp; Publikasi Karya Tulis
        </h1>
        <p className="mt-2.5 text-sm sm:text-[15px] text-muted max-w-2xl leading-relaxed">
          Riwayat pendidikan formal serta katalog publikasi dan karya tulis yang tersinkronisasi langsung dari platform Dars with Osama.
        </p>
      </header>

      {/* Formal Education */}
      <section aria-labelledby="formal-edu-heading">
        <h2 id="formal-edu-heading" data-aos="fade-up" className="font-display text-xl sm:text-2xl font-extrabold mb-4">
          01. Riwayat Pendidikan Formal
        </h2>

        {education.length === 0 ? (
          <div data-aos="fade-up" className="brutal-card card-beige p-6 text-sm text-muted">
            Belum ada riwayat pendidikan yang dipublikasikan.
          </div>
        ) : (
          <div className="space-y-4">
            {education.map((edu, idx) => {
              const tone = getCardTone(idx, ['beige', 'green', 'blue']);
              return (
                <article
                  key={edu.id}
                  data-aos="fade-up"
                  data-aos-delay={getAosStaggerDelay(idx, 70, 2)}
                  className={`brutal-card p-5 sm:p-6 ${tone.cardClass} ${
                    idx === 0 ? 'frame-shadow-bordo' : tone.frameClass
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-num">
                    <span className="font-bold text-muted uppercase">
                      {edu.category} &middot; {edu.location}
                    </span>
                    <span className={idx === 0 ? 'brutal-badge-bordo' : tone.badgeClass}>
                      Kelulusan {edu.graduationYear}
                    </span>
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-extrabold mt-2">
                    {edu.institution}
                  </h3>
                  <p className="text-sm sm:text-base font-bold mt-1">
                    {edu.degree} &mdash; {edu.fieldOfStudy}
                  </p>
                  {edu.description && (
                    <p className="text-sm text-muted mt-3 leading-relaxed max-w-3xl">
                      {edu.description}
                    </p>
                  )}
                  {edu.imageUrls && edu.imageUrls.length > 0 && (
                    <div className="mt-4 pt-3.5 border-t border-subtle grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {edu.imageUrls.map((imgUrl, imgIdx) => (
                        <div
                          key={`${edu.id}-img-${imgIdx}`}
                          data-aos="fade-up"
                          data-aos-delay={getAosStaggerDelay(imgIdx, 60, 4)}
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
        <h2 id="publications-heading" data-aos="fade-up" className="font-display text-xl sm:text-2xl font-extrabold mb-3">
          02. Publikasi &amp; Karya Tulis
        </h2>
        <DarsPublicationsCatalog />
      </section>
    </div>
  );
};
