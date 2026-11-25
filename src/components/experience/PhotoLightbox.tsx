import React, { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star, X } from 'lucide-react';
import { SafeImage } from '../ui/SafeImage';
import { getLightboxStep } from '../../utils/experienceGallery';

interface PhotoLightboxProps {
  photos: string[];
  activeIndex: number | null;
  primaryPhotoUrl?: string;
  title: string;
  contextLabel?: string;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
}

const SWIPE_THRESHOLD_PX = 44;

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photos,
  activeIndex,
  primaryPhotoUrl,
  title,
  contextLabel = 'galeri',
  onClose,
  onNavigate,
}) => {
  const isOpen = activeIndex !== null && activeIndex >= 0 && activeIndex < photos.length;
  const total = photos.length;
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isOpen || activeIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if (e.key === 'ArrowLeft' && total > 1) {
        e.preventDefault();
        onNavigate(getLightboxStep(total, activeIndex, -1));
      } else if (e.key === 'ArrowRight' && total > 1) {
        e.preventDefault();
        onNavigate(getLightboxStep(total, activeIndex, 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeIndex, total, onClose, onNavigate]);

  // Lock page vertical scroll while Lightbox is active
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen || activeIndex === null) return null;

  const activeUrl = photos[activeIndex];
  const isPrimary = Boolean(primaryPhotoUrl && activeUrl === primaryPhotoUrl);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (total <= 1 || e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (total <= 1 || !touchStartRef.current || e.changedTouches.length === 0) {
      touchStartRef.current = null;
      return;
    }
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dx) >= SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy) * 1.2) {
      onNavigate(getLightboxStep(total, activeIndex, dx < 0 ? 1 : -1));
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Pratinjau foto dokumentasi ${title}`}
      className="fixed inset-0 z-[60] bg-[#1B2A3D]/95 flex flex-col justify-between p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top Lightbox Header */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between gap-3 pb-3 border-b-2 border-[#D9B44A]/50 text-[#F8F8E1]">
        <div className="min-w-0 flex flex-wrap items-center gap-2.5">
          <span className="font-mono-num text-xs sm:text-sm font-extrabold text-[#D9B44A] whitespace-nowrap">
            Foto {activeIndex + 1} / {total}
          </span>
          {isPrimary && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono-num font-bold bg-[#6C151E] text-[#F8F8E1] border border-[#F8F8E1]/60 whitespace-nowrap">
              <Star className="w-3 h-3 fill-current" aria-hidden="true" />
              <span>Foto Utama</span>
            </span>
          )}
          <span className="text-xs sm:text-sm font-bold truncate text-[#F8F8E1]/90">
            {title}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup lightbox foto"
          className="brutal-btn-on-dark px-3 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
        >
          <X className="w-4 h-4" aria-hidden="true" />
          <span>Tutup</span>
        </button>
      </div>

      {/* Main Uncropped Photo Stage (Preserves 100% Original Aspect Ratio + Touch Swipe) */}
      <div
        className="flex-1 min-h-0 flex items-center justify-center py-4 relative touch-pan-y select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {total > 1 && (
          <button
            type="button"
            onClick={() => onNavigate(getLightboxStep(total, activeIndex, -1))}
            aria-label="Foto sebelumnya"
            className="hidden sm:inline-flex items-center justify-center brutal-btn-on-dark p-3 cursor-pointer mr-4 shrink-0"
          >
            <ChevronLeft className="w-6 h-6" aria-hidden="true" />
          </button>
        )}

        <div className="max-w-full max-h-full flex items-center justify-center">
          <div className="border-[3px] border-[#D9B44A] bg-[#F8F8E1] shadow-[6px_6px_0_0_#6C151E] p-1.5 sm:p-2 max-w-full">
            <SafeImage
              src={activeUrl}
              alt={`Dokumentasi ${title} — Foto ${activeIndex + 1} dari ${total}`}
              fallbackLabel={title}
              priority
              preferredWidth={2000}
              className="block max-w-[88vw] sm:max-w-[76vw] max-h-[72vh] w-auto h-auto object-contain mx-auto"
            />
          </div>
        </div>

        {total > 1 && (
          <button
            type="button"
            onClick={() => onNavigate(getLightboxStep(total, activeIndex, 1))}
            aria-label="Foto berikutnya"
            className="hidden sm:inline-flex items-center justify-center brutal-btn-on-dark p-3 cursor-pointer ml-4 shrink-0"
          >
            <ChevronRight className="w-6 h-6" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Bottom Navigation Bar (Essential for Mobile Touch & Quick Switching) */}
      <div className="max-w-6xl w-full mx-auto pt-3 border-t-2 border-[#D9B44A]/40 flex items-center justify-between gap-3">
        {total > 1 ? (
          <>
            <button
              type="button"
              onClick={() => onNavigate(getLightboxStep(total, activeIndex, -1))}
              className="brutal-btn-on-dark px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              <span>Sebelumnya</span>
            </button>
            <span className="font-mono-num text-[11px] sm:text-xs text-[#F8F8E1]/80 hidden sm:inline">
              Geser layar, gunakan panah kiri/kanan, atau tekan ESC untuk kembali ke {contextLabel}
            </span>
            <button
              type="button"
              onClick={() => onNavigate(getLightboxStep(total, activeIndex, 1))}
              className="brutal-btn-on-dark px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <span>Berikutnya</span>
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </>
        ) : (
          <p className="font-mono-num text-xs text-[#F8F8E1]/80 mx-auto">
            Tekan Tutup atau ESC untuk kembali ke {contextLabel}
          </p>
        )}
      </div>
    </div>
  );
};
