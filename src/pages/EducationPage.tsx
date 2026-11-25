import React, { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { EducationCard } from '../components/education/EducationCard';
import { PhotoLightbox } from '../components/experience/PhotoLightbox';
import { DarsPublicationsCatalog } from '../components/publications/DarsPublicationsCatalog';

interface EducationLightboxState {
  photos: string[];
  primaryPhotoUrl: string;
  title: string;
  activeIndex: number;
}

export const EducationPage: React.FC = () => {
  const { publicData } = usePortfolio();
  const { education } = publicData;
  const [lightbox, setLightbox] = useState<EducationLightboxState | null>(null);

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
          <div data-aos="fade-up" className="brutal-card card-navy frame-navy p-6 text-sm text-[#F8F8E1]">
            Belum ada riwayat pendidikan yang dipublikasikan.
          </div>
        ) : (
          <div className="space-y-5">
            {education.map((edu, idx) => (
              <EducationCard
                key={edu.id}
                education={edu}
                index={idx}
                onOpenLightbox={(payload) => setLightbox(payload)}
              />
            ))}
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

      {/* Interactive Full-Resolution Photo Lightbox */}
      <PhotoLightbox
        photos={lightbox?.photos ?? []}
        activeIndex={lightbox ? lightbox.activeIndex : null}
        primaryPhotoUrl={lightbox?.primaryPhotoUrl}
        title={lightbox?.title ?? ''}
        contextLabel="riwayat pendidikan"
        onClose={() => setLightbox(null)}
        onNavigate={(nextIndex) =>
          setLightbox((prev) => (prev ? { ...prev, activeIndex: nextIndex } : null))
        }
      />
    </div>
  );
};
