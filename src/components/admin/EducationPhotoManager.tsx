import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  GripVertical,
  Image as ImageIcon,
  Images,
  Star,
  Trash2,
} from 'lucide-react';
import type { DriveFileVisibility, DriveUploadCategory } from '../../services/googleDriveUploadService';
import { MediaUploader, type MediaUploadResult } from './MediaUploader';
import { SafeImage, type SafeImageLoadInfo } from '../ui/SafeImage';
import {
  classifyPhotoOrientation,
  MAX_EDUCATION_PHOTOS,
  resolveEducationGallery,
  type PhotoOrientation,
} from '../../utils/educationGallery';

interface EducationPhotoManagerProps {
  folder: DriveUploadCategory;
  imageUrls: string[];
  primaryImageUrl?: string;
  defaultVisibility: DriveFileVisibility;
  onReplacePrimary: (result: MediaUploadResult) => void;
  onRemovePrimary: () => void;
  onAddAdditional: (result: MediaUploadResult) => void;
  onRemoveAdditional: (additionalIndex: number) => void;
  onReorderAdditional: (fromIndex: number, toIndex: number) => void;
  onPromoteAdditional: (additionalIndex: number) => void;
}

export const EducationPhotoManager: React.FC<EducationPhotoManagerProps> = ({
  folder,
  imageUrls,
  primaryImageUrl,
  defaultVisibility,
  onReplacePrimary,
  onRemovePrimary,
  onAddAdditional,
  onRemoveAdditional,
  onReorderAdditional,
  onPromoteAdditional,
}) => {
  const gallery = useMemo(
    () => resolveEducationGallery(imageUrls, primaryImageUrl),
    [imageUrls, primaryImageUrl]
  );

  const [primaryOrientation, setPrimaryOrientation] = useState<PhotoOrientation | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    setPrimaryOrientation(null);
  }, [gallery.primaryPhoto]);

  const totalCount = gallery.allPhotos.length;
  const remainingSlots = Math.max(0, MAX_EDUCATION_PHOTOS - totalCount);

  const handlePrimaryLoaded = (info: SafeImageLoadInfo) => {
    setPrimaryOrientation(classifyPhotoOrientation(info.naturalWidth, info.naturalHeight));
  };

  return (
    <div className="space-y-5">
      {/* SECTION 1: FOTO UTAMA (1 FOTO, AUTO LANDSCAPE / PORTRAIT) */}
      <div className="border-2 border-[#001F24] bg-[#F8F8E1] text-[#1B2A3D] p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b-2 border-[#1B2A3D]/25">
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-[#6C151E] fill-current" aria-hidden="true" />
            <span className="font-display font-extrabold text-xs sm:text-sm text-[#1B2A3D]">
              1. Foto Utama Pendidikan
            </span>
          </div>
          {gallery.primaryPhoto && primaryOrientation && (
            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono-num font-bold bg-[#1B2A3D] text-[#D9B44A] border border-[#001F24]">
              {primaryOrientation === 'portrait'
                ? 'Portrait · Kiri + Deskripsi Kanan'
                : 'Landscape · Tengah + Deskripsi Bawah'}
            </span>
          )}
        </div>

        {gallery.primaryPhoto ? (
          <div className="border-2 border-[#6C151E] bg-[#F8F8E1] shadow-[4px_4px_0_0_#6C151E] p-2.5 space-y-2.5">
            <div className="flex justify-center bg-[#F8F8E1]">
              <SafeImage
                src={gallery.primaryPhoto}
                alt="Pratinjau foto utama pendidikan"
                fallbackLabel="Foto Utama"
                onImageLoad={handlePrimaryLoaded}
                className="block w-auto h-auto max-w-full max-h-56 object-contain mx-auto border border-[#1B2A3D]/20"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1B2A3D]/20">
              <span className="text-[11px] font-mono-num font-semibold text-[#1B2A3D]">
                Rasio asli dipertahankan tanpa crop. Unggah ulang di bawah untuk mengganti foto utama.
              </span>
              <button
                type="button"
                onClick={onRemovePrimary}
                className="brutal-btn brutal-btn-bordo px-2.5 py-1.5 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" aria-hidden="true" />
                <span>Hapus Foto Utama</span>
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#1B2A3D]/85 py-1">
            Belum ada foto utama. Unggah 1 foto utama di bawah — tata letak landscape atau portrait akan menyesuaikan otomatis.
          </p>
        )}

        <MediaUploader
          folder={folder}
          acceptMode="image"
          multiple={false}
          hideAttachedList
          defaultVisibility={defaultVisibility}
          label={gallery.primaryPhoto ? 'Ganti Foto Utama' : 'Unggah Foto Utama'}
          helperText="Foto utama ditampilkan utuh sesuai rasio asli (landscape di tengah, portrait di kiri deskripsi)."
          currentUrls={gallery.primaryPhoto ? [gallery.primaryPhoto] : []}
          onUploaded={onReplacePrimary}
        />
      </div>

      {/* SECTION 2: GALERI FOTO TAMBAHAN (MULTI-FOTO, 1:1 ROUNDED STRIP) */}
      <div className="border-2 border-[#001F24] bg-[#F8F8E1] text-[#1B2A3D] p-3.5 sm:p-4 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b-2 border-[#1B2A3D]/25">
          <div className="flex items-center gap-1.5">
            <Images className="w-4 h-4 text-[#0F3D3A]" aria-hidden="true" />
            <span className="font-display font-extrabold text-xs sm:text-sm text-[#1B2A3D]">
              2. Galeri Foto Tambahan ({gallery.additionalPhotos.length} foto &middot; Total {totalCount}/{MAX_EDUCATION_PHOTOS})
            </span>
          </div>
          <span className="font-mono-num text-[10px] font-bold text-[#0F3D3A]">
            Thumbnail 1:1 Rounded &middot; Lightbox Rasio Asli
          </span>
        </div>

        <MediaUploader
          folder={folder}
          acceptMode="image"
          multiple
          hideAttachedList
          defaultVisibility={defaultVisibility}
          label="Tambah Foto Galeri Tambahan"
          helperText={`Unggah satu atau banyak foto dokumentasi sekaligus (sisa ${remainingSlots} slot dari maks. ${MAX_EDUCATION_PHOTOS} foto).`}
          currentUrls={gallery.additionalPhotos}
          onUploaded={onAddAdditional}
        />

        {gallery.additionalPhotos.length === 0 ? (
          <div className="border-2 border-dashed border-[#1B2A3D]/35 p-4 text-center text-xs text-[#1B2A3D]/80 flex flex-col items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-[#1B2A3D]/70" aria-hidden="true" />
            <span>Belum ada foto tambahan. Foto tambahan akan muncul sebagai strip horizontal di bawah deskripsi.</span>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] text-[#1B2A3D]">
              Seret kartu atau gunakan tombol panah untuk mengatur urutan foto tambahan. Klik <strong>Jadikan Utama</strong> untuk menukar dengan foto utama saat ini.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
              {gallery.additionalPhotos.map((url, idx) => {
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
                        onReorderAdditional(draggedIndex, idx);
                      }
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    onDragEnd={() => {
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    className={`border-2 bg-[#F8F8E1] overflow-hidden transition-all ${
                      isDropTarget
                        ? 'border-[#D9B44A] shadow-[4px_4px_0_0_#001F24] ring-2 ring-[#1B2A3D]'
                        : 'border-[#001F24] shadow-[3px_3px_0_0_#001F24]'
                    } ${isDragging ? 'opacity-50' : ''}`}
                  >
                    {/* Header bar */}
                    <div className="px-2.5 py-1.5 border-b-2 border-[#001F24] bg-[#D9B44A] text-[#001F24] flex items-center justify-between gap-2 text-[11px] font-mono-num font-bold">
                      <span className="inline-flex items-center gap-1 cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>Tambahan #{String(idx + 1).padStart(2, '0')}</span>
                      </span>
                      <span className="text-[10px] font-semibold">1:1</span>
                    </div>

                    {/* 1:1 Rounded Thumbnail Preview */}
                    <div className="p-2.5 flex justify-center bg-[#F8F8E1]">
                      <div className="w-24 h-24 aspect-square rounded-xl overflow-hidden border-2 border-[#001F24] bg-[#F8F8E1]">
                        <SafeImage
                          src={url}
                          alt={`Pratinjau foto tambahan ${idx + 1}`}
                          fallbackLabel={`Foto ${idx + 1}`}
                          className="w-full h-full object-cover block"
                        />
                      </div>
                    </div>

                    {/* Controls: Promote to Primary + Reorder + Delete */}
                    <div className="p-1.5 border-t-2 border-[#001F24] bg-[#F8F8E1] space-y-1.5">
                      <button
                        type="button"
                        onClick={() => onPromoteAdditional(idx)}
                        className="w-full brutal-btn brutal-btn-secondary py-1 px-2 text-[11px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Star className="w-3 h-3" aria-hidden="true" />
                        <span>Jadikan Foto Utama</span>
                      </button>

                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => onReorderAdditional(idx, idx - 1)}
                            aria-label={`Geser foto tambahan ${idx + 1} ke kiri`}
                            className="brutal-btn brutal-btn-outline p-1.5 cursor-pointer disabled:opacity-35"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === gallery.additionalPhotos.length - 1}
                            onClick={() => onReorderAdditional(idx, idx + 1)}
                            aria-label={`Geser foto tambahan ${idx + 1} ke kanan`}
                            className="brutal-btn brutal-btn-outline p-1.5 cursor-pointer disabled:opacity-35"
                          >
                            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveAdditional(idx)}
                          aria-label={`Hapus foto tambahan ${idx + 1}`}
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
          </div>
        )}
      </div>
    </div>
  );
};
