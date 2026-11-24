import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  GripVertical,
  Image as ImageIcon,
  Star,
  Trash2,
} from 'lucide-react';
import type { DriveFileVisibility, DriveUploadCategory } from '../../services/googleDriveUploadService';
import { MediaUploader, type MediaUploadResult } from './MediaUploader';
import { SafeImage } from '../ui/SafeImage';
import {
  MAX_EXPERIENCE_PHOTOS,
  resolveExperiencePrimaryPhoto,
} from '../../utils/experienceGallery';

interface ExperiencePhotoManagerProps {
  folder: DriveUploadCategory;
  label: string;
  imageUrls: string[];
  primaryImageUrl?: string;
  defaultVisibility: DriveFileVisibility;
  onAddPhoto: (result: MediaUploadResult) => void;
  onRemovePhoto: (index: number) => void;
  onReorderPhoto: (fromIndex: number, toIndex: number) => void;
  onSelectPrimary: (url: string) => void;
}

export const ExperiencePhotoManager: React.FC<ExperiencePhotoManagerProps> = ({
  folder,
  label,
  imageUrls,
  primaryImageUrl,
  defaultVisibility,
  onAddPhoto,
  onRemovePhoto,
  onReorderPhoto,
  onSelectPrimary,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const activePrimaryUrl = resolveExperiencePrimaryPhoto(imageUrls, primaryImageUrl);
  const remainingSlots = Math.max(0, MAX_EXPERIENCE_PHOTOS - imageUrls.length);

  return (
    <div className="space-y-4">
      <MediaUploader
        folder={folder}
        acceptMode="image"
        multiple
        hideAttachedList
        defaultVisibility={defaultVisibility}
        label={label}
        helperText={`Unggah beberapa foto sekaligus atau bertahap (maks. ${MAX_EXPERIENCE_PHOTOS} foto per pengalaman, sisa ${remainingSlots} slot). Foto disimpan ke sistem Google Drive global.`}
        currentUrls={imageUrls}
        onUploaded={onAddPhoto}
      />

      {/* Attached Documentation Gallery Manager */}
      <div className="border-2 border-brutal bg-[#F8F8E1] p-3.5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b-2 border-subtle">
          <div className="flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-[#013A42]" aria-hidden="true" />
            <span className="font-display font-extrabold text-xs sm:text-sm text-[#013A42]">
              Galeri Foto Pengalaman ({imageUrls.length} / {MAX_EXPERIENCE_PHOTOS})
            </span>
          </div>
          {imageUrls.length > 0 && (
            <span className="font-mono-num text-[10px] font-bold text-[#0F3D3A]">
              Foto Utama tampil di Card &middot; Semua foto tampil di Detail
            </span>
          )}
        </div>

        {imageUrls.length === 0 ? (
          <p className="text-xs text-muted py-2.5 text-center">
            Belum ada foto dokumentasi pada pengalaman ini. Unggah satu atau beberapa foto di atas, atau tempel tautan Google Drive.
          </p>
        ) : (
          <>
            <p className="text-[11px] text-muted">
              Seret kartu foto atau gunakan tombol panah untuk mengatur urutan galeri. Klik <strong>Jadikan Foto Utama</strong> kapan saja tanpa perlu mengunggah ulang.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
              {imageUrls.map((url, idx) => {
                const isPrimary = activePrimaryUrl === url;
                const isDragging = draggedIndex === idx;
                const isDropTarget = dragOverIndex === idx && draggedIndex !== null && draggedIndex !== idx;

                return (
                  <div
                    key={`${url}-${idx}`}
                    draggable
                    onDragStart={() => setDraggedIndex(idx)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragOverIndex !== idx) setDragOverIndex(idx);
                    }}
                    onDragLeave={() => {
                      if (dragOverIndex === idx) setDragOverIndex(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedIndex !== null && draggedIndex !== idx) {
                        onReorderPhoto(draggedIndex, idx);
                      }
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    onDragEnd={() => {
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    className={`border-2 bg-[#F8F8E1] overflow-hidden transition-all ${
                      isPrimary
                        ? 'border-[#6C151E] shadow-[4px_4px_0_0_#6C151E]'
                        : isDropTarget
                        ? 'border-[#8ACCD5] shadow-[4px_4px_0_0_#013A42] ring-2 ring-[#013A42]'
                        : 'border-[#013A42] shadow-[3px_3px_0_0_#013A42]'
                    } ${isDragging ? 'opacity-50' : ''}`}
                  >
                    {/* Header bar: Order + Drag Handle + Primary Badge */}
                    <div
                      className={`px-2.5 py-1.5 border-b-2 flex items-center justify-between gap-2 text-[11px] font-mono-num font-bold ${
                        isPrimary
                          ? 'bg-[#6C151E] text-[#F8F8E1] border-[#013A42]'
                          : 'bg-[#8ACCD5]/45 text-[#013A42] border-[#013A42]'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1 cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>#{String(idx + 1).padStart(2, '0')}</span>
                      </span>
                      {isPrimary ? (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap">
                          <Star className="w-3 h-3 fill-current" aria-hidden="true" />
                          <span>Foto Utama</span>
                        </span>
                      ) : (
                        <span className="text-[10px] opacity-80">Dokumentasi</span>
                      )}
                    </div>

                    {/* Natural-ratio uncropped preview */}
                    <div className="w-full bg-[#F8F8E1] p-1">
                      <SafeImage
                        src={url}
                        alt={`Pratinjau dokumentasi ${idx + 1}`}
                        fallbackLabel={`Foto ${idx + 1}`}
                        className="w-full h-auto max-h-40 block object-contain mx-auto"
                      />
                    </div>

                    {/* Action Controls: Set Primary + Reorder + Delete */}
                    <div className="p-1.5 border-t-2 border-[#013A42] bg-[#F8F8E1] space-y-1.5">
                      {!isPrimary && (
                        <button
                          type="button"
                          onClick={() => onSelectPrimary(url)}
                          className="w-full brutal-btn brutal-btn-secondary py-1 px-2 text-[11px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Star className="w-3 h-3" aria-hidden="true" />
                          <span>Jadikan Foto Utama</span>
                        </button>
                      )}

                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => onReorderPhoto(idx, idx - 1)}
                            aria-label={`Geser foto ${idx + 1} ke posisi sebelumnya`}
                            className="brutal-btn brutal-btn-outline p-1.5 cursor-pointer disabled:opacity-35"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === imageUrls.length - 1}
                            onClick={() => onReorderPhoto(idx, idx + 1)}
                            aria-label={`Geser foto ${idx + 1} ke posisi berikutnya`}
                            className="brutal-btn brutal-btn-outline p-1.5 cursor-pointer disabled:opacity-35"
                          >
                            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemovePhoto(idx)}
                          aria-label={`Hapus foto dokumentasi ${idx + 1}`}
                          className="brutal-btn brutal-btn-bordo px-2 py-1.5 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" aria-hidden="true" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
