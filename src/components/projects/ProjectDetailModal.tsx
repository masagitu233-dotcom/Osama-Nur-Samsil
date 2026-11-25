import React, { useEffect, useState } from 'react';
import { Calendar, ExternalLink, Maximize2 } from 'lucide-react';
import type { ProjectItem } from '../../types/portfolio';
import { Modal } from '../ui/Modal';
import { SafeImage } from '../ui/SafeImage';
import { DarsLogo } from '../ui/DarsLogo';
import { PhotoLightbox } from '../experience/PhotoLightbox';
import {
  ACTIVE_PROJECT_CATEGORY_LABELS,
  hasCustomUploadedDarsAsset,
  isDarsPlatformProject,
  normalizeProjectCategory,
} from '../../utils/projectsCatalog';
import { getAosStaggerDelay, refreshAos } from '../../utils/aos';

interface ProjectDetailModalProps {
  project: ProjectItem | null;
  onClose: () => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ project, onClose }) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    setLightboxIndex(null);
    if (project) {
      refreshAos(true);
    }
  }, [project?.id]);

  const isDars = project ? isDarsPlatformProject(project) : false;
  const useCustomAsset = project ? hasCustomUploadedDarsAsset(project) : false;
  const categoryLabel = project
    ? ACTIVE_PROJECT_CATEGORY_LABELS[normalizeProjectCategory(project.category)]
    : '';
  const photos = project ? project.imageUrls.filter((u) => Boolean(u && u.trim())) : [];

  return (
    <>
      <Modal
        open={Boolean(project)}
        onClose={onClose}
        disableEscapeClose={lightboxIndex !== null}
        title={project?.title || ''}
        subtitle={project ? `${categoryLabel}${project.period ? ` · ${project.period}` : ''}` : undefined}
        maxWidthClass="max-w-3xl"
        tone="green"
      >
        {project && (
          <div className="space-y-5 text-[#F8F8E1]">
            {/* Media Showcase: Official Dars Logo (object-contain) or Project Documentation Photos */}
            {isDars && !useCustomAsset ? (
              <div
                data-aos="fade-up"
                data-aos-offset="-2000"
                className="border-2 border-[#D9B44A] bg-[#F4F4F0] text-[#1B2A3D] p-5 flex flex-col sm:flex-row items-center gap-5 shadow-[3px_3px_0_0_#001F24]"
              >
                <div className="w-32 h-28 sm:w-36 sm:h-32 shrink-0 flex items-center justify-center p-1">
                  <DarsLogo className="w-full h-full object-contain" />
                </div>
                <div className="text-center sm:text-left min-w-0">
                  <p className="font-mono-num text-[11px] font-bold uppercase text-[#0F3D3A]">
                    Platform Website Resmi
                  </p>
                  <p className="font-display text-xl font-extrabold mt-0.5 text-[#1B2A3D]">{project.title}</p>
                  {project.liveUrl && (
                    <p className="text-xs font-mono-num text-[#1B2A3D]/80 mt-0.5 truncate">
                      {project.liveUrl}
                    </p>
                  )}
                </div>
              </div>
            ) : photos.length > 0 ? (
              <div
                className={`grid gap-3.5 ${
                  photos.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
                }`}
              >
                {photos.map((url, idx) => (
                  <button
                    key={`${project.id}-img-${idx}`}
                    type="button"
                    onClick={() => setLightboxIndex(idx)}
                    data-aos="fade-up"
                    data-aos-offset="-2000"
                    data-aos-delay={getAosStaggerDelay(idx, 100, 2)}
                    aria-label={`Perbesar gambar ${project.title} ${idx + 1}`}
                    className="border-2 border-[#D9B44A] overflow-hidden bg-[#1B2A3D] shadow-[3px_3px_0_0_#001F24] cursor-pointer text-left group"
                  >
                    <div
                      className={`aspect-[16/9] w-full flex items-center justify-center ${
                        isDars ? 'bg-[#F4F4F0] p-4' : 'bg-[#F8F8E1]'
                      }`}
                    >
                      <SafeImage
                        src={url}
                        alt={`${project.title} gambar ${idx + 1}`}
                        fallbackLabel={project.title}
                        className={
                          isDars
                            ? 'w-full h-full object-contain'
                            : 'w-full h-full object-cover'
                        }
                      />
                    </div>
                    <div className="px-2.5 py-1.5 border-t-2 border-[#D9B44A] bg-[#1B2A3D] flex items-center justify-between text-[11px] font-mono-num font-bold text-[#F8F8E1]">
                      <span>Dokumentasi {String(idx + 1).padStart(2, '0')}</span>
                      <Maximize2 className="w-3.5 h-3.5 text-[#D9B44A]" aria-hidden="true" />
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

            {/* Metadata Strip */}
            <div className="border-2 border-[#D9B44A] bg-[#1B2A3D] p-3.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="brutal-badge">{categoryLabel}</span>
                <span className="font-display font-extrabold text-sm sm:text-base text-[#F8F8E1]">
                  {project.title}
                </span>
              </div>
              {project.period && (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono-num font-bold text-[#F8F8E1]">
                  <Calendar className="w-3.5 h-3.5 text-[#D9B44A]" aria-hidden="true" />
                  <span>{project.period}</span>
                </span>
              )}
            </div>

            {/* Full Description */}
            {project.description && (
              <div>
                <h3 className="font-display font-extrabold text-sm sm:text-base mb-1.5 text-[#D9B44A]">
                  Deskripsi Proyek
                </h3>
                <p className="text-sm text-[#F8F8E1] leading-relaxed whitespace-pre-line">
                  {project.description}
                </p>
              </div>
            )}

            {/* Role, Responsibilities & Development Documentation */}
            {project.documentation && (
              <div>
                <h3 className="font-display font-extrabold text-sm sm:text-base mb-1.5 text-[#D9B44A]">
                  Peran, Tanggung Jawab &amp; Dokumentasi
                </h3>
                <p className="text-sm text-[#F8F8E1] leading-relaxed whitespace-pre-line">
                  {project.documentation}
                </p>
              </div>
            )}

            {/* External Links */}
            {(project.liveUrl || project.repoUrl) && (
              <div className="flex flex-wrap gap-2.5 pt-3 border-t-2 border-[#D9B44A]/50">
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="brutal-btn-frame-green px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <span>{isDars ? 'Kunjungi Website Dars with Osama' : 'Kunjungi Website'}</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                )}
                {project.repoUrl && (
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="brutal-btn-on-dark-outline px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <span>Lihat Repositori</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {project && photos.length > 0 && (
        <PhotoLightbox
          photos={photos}
          activeIndex={lightboxIndex}
          primaryPhotoUrl={photos[0]}
          title={project.title}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
};
