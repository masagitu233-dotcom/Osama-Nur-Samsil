import React, { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, Maximize2, Star } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { SafeImage } from '../ui/SafeImage';
import { PhotoLightbox } from './PhotoLightbox';
import { resolveExperiencePrimaryPhoto } from '../../utils/experienceGallery';
import { getAosStaggerDelay, refreshAos } from '../../utils/aos';

export interface ExperienceDetailViewData {
  id: string;
  role: string;
  categoryLabel: string;
  institutionName: string;
  period: string;
  duration?: string;
  location?: string;
  description: string;
  responsibilities: string[];
  responsibilitiesHeading: string;
  imageUrls: string[];
  primaryImageUrl?: string;
}

interface ExperienceDetailModalProps {
  detail: ExperienceDetailViewData | null;
  onClose: () => void;
}

export const ExperienceDetailModal: React.FC<ExperienceDetailModalProps> = ({ detail, onClose }) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Reset lightbox and trigger AOS animation cleanly whenever detail opens or changes
  useEffect(() => {
    setLightboxIndex(null);
    if (detail) {
      refreshAos(true);
    }
  }, [detail?.id]);

  const photos = detail?.imageUrls ?? [];
  const primaryPhotoUrl = detail
    ? resolveExperiencePrimaryPhoto(detail.imageUrls, detail.primaryImageUrl)
    : '';

  const galleryColumnsClass =
    photos.length <= 1
      ? 'columns-1 max-w-2xl'
      : photos.length === 2
      ? 'columns-1 sm:columns-2'
      : 'columns-1 sm:columns-2 lg:columns-3';

  return (
    <>
      <Modal
        open={Boolean(detail)}
        onClose={onClose}
        disableEscapeClose={lightboxIndex !== null}
        title={detail?.role || ''}
        subtitle={detail ? `${detail.categoryLabel} · ${detail.institutionName}` : undefined}
        maxWidthClass="max-w-3xl"
        tone="bordo"
      >
        {detail && (
          <div className="space-y-5 text-[#F8F8E1]">
            {/* Metadata Strip: Category, Institution, Period, Duration & Location */}
            <div data-aos="fade-up" data-aos-offset="-2000" className="border-2 border-[#D9B44A] bg-[#1B2A3D] p-3.5 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="brutal-badge">{detail.categoryLabel}</span>
                <span className="font-display font-bold text-sm sm:text-base text-[#F8F8E1]">
                  {detail.institutionName}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono-num font-semibold text-[#F8F8E1]/90">
                {detail.period && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 shrink-0 text-[#D9B44A]" aria-hidden="true" />
                    <span>Periode: {detail.period}</span>
                  </span>
                )}
                {detail.duration && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 shrink-0 text-[#D9B44A]" aria-hidden="true" />
                    <span>Durasi: {detail.duration}</span>
                  </span>
                )}
                {detail.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-[#D9B44A]" aria-hidden="true" />
                    <span>{detail.location}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Full Description */}
            {detail.description && (
              <div>
                <h3 className="font-display font-bold text-sm sm:text-base mb-1.5 text-[#D9B44A]">
                  Deskripsi Lengkap
                </h3>
                <p className="text-sm font-normal leading-relaxed text-[#F8F8E1] whitespace-pre-line">
                  {detail.description}
                </p>
              </div>
            )}

            {/* Responsibilities & Programs */}
            {detail.responsibilities.length > 0 && (
              <div>
                <h3 className="font-display font-bold text-sm sm:text-base mb-2 text-[#D9B44A]">
                  {detail.responsibilitiesHeading}
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-sm font-normal text-[#F8F8E1]">
                  {detail.responsibilities.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Natural-Ratio Responsive Documentation Photo Gallery */}
            {photos.length > 0 && (
              <section aria-labelledby="exp-gallery-heading" className="pt-3.5 border-t-2 border-[#D9B44A]/60">
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                  <div>
                    <h3
                      id="exp-gallery-heading"
                      className="font-display font-bold text-sm sm:text-base text-[#D9B44A]"
                    >
                      Galeri Dokumentasi ({photos.length} Foto)
                    </h3>
                    <p className="text-xs font-semibold text-[#F8F8E1]/90 mt-0.5">
                      Klik foto untuk melihat ukuran penuh tanpa terpotong.
                    </p>
                  </div>
                </div>

                <div className={`${galleryColumnsClass} gap-3.5`}>
                  {photos.map((url, idx) => {
                    const isPrimary = Boolean(primaryPhotoUrl && url === primaryPhotoUrl);
                    return (
                      <button
                        key={`${detail.id}-photo-${idx}-${url}`}
                        type="button"
                        onClick={() => setLightboxIndex(idx)}
                        data-aos="fade-up"
                        data-aos-offset="-2000"
                        data-aos-delay={getAosStaggerDelay(idx, 100, 3)}
                        aria-label={`Perbesar dokumentasi ${detail.institutionName} foto ${idx + 1} dari ${photos.length}`}
                        className={`w-full block break-inside-avoid mb-3.5 border-2 bg-[#1B2A3D] shadow-[3px_3px_0_0_#001F24] hover:shadow-[4px_4px_0_0_#D9B44A] cursor-pointer overflow-hidden text-left group ${
                          isPrimary ? 'border-[#D9B44A]' : 'border-[#F8F8E1]'
                        }`}
                      >
                        <div className="w-full bg-[#F8F8E1]">
                          <SafeImage
                            src={url}
                            alt={`Dokumentasi ${detail.institutionName} ${idx + 1}`}
                            fallbackLabel={detail.institutionName}
                            className="w-full h-auto block object-contain"
                          />
                        </div>
                        <div className="px-2.5 py-1.5 border-t-2 border-[#D9B44A] bg-[#1B2A3D] flex items-center justify-between gap-2 text-[11px] font-mono-num font-semibold text-[#F8F8E1]">
                          <span className="inline-flex items-center gap-1.5 truncate">
                            <span>Foto {String(idx + 1).padStart(2, '0')}</span>
                            {isPrimary && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-[#D9B44A] text-[#001F24] font-bold">
                                <Star className="w-2.5 h-2.5 fill-current" aria-hidden="true" />
                                <span>Foto Utama</span>
                              </span>
                            )}
                          </span>
                          <Maximize2
                            className="w-3.5 h-3.5 shrink-0 text-[#D9B44A] transition-colors"
                            aria-hidden="true"
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </Modal>

      <PhotoLightbox
        photos={photos}
        activeIndex={lightboxIndex}
        primaryPhotoUrl={primaryPhotoUrl}
        title={detail ? `${detail.role} — ${detail.institutionName}` : ''}
        onClose={() => setLightboxIndex(null)}
        onNavigate={(nextIdx) => setLightboxIndex(nextIdx)}
      />
    </>
  );
};
