import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Images, ZoomIn } from 'lucide-react';
import type { EducationItem } from '../../types/portfolio';
import { getSectionCardTone } from '../../utils/cardVariants';
import { getAosStaggerDelay } from '../../utils/aos';
import {
  classifyPhotoOrientation,
  resolveEducationGallery,
  shouldTriggerGalleryHint,
  type PhotoOrientation,
} from '../../utils/educationGallery';
import { SafeImage, type SafeImageLoadInfo } from '../ui/SafeImage';

interface EducationCardProps {
  education: EducationItem;
  index: number;
  onOpenLightbox: (payload: {
    photos: string[];
    primaryPhotoUrl: string;
    title: string;
    activeIndex: number;
  }) => void;
}

const HINT_DURATION_MS = 950;
const DRAG_CLICK_THRESHOLD_PX = 6;

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

export const EducationCard: React.FC<EducationCardProps> = ({
  education,
  index,
  onOpenLightbox,
}) => {
  const tone = getSectionCardTone('education');
  const gallery = useMemo(
    () => resolveEducationGallery(education.imageUrls, education.primaryImageUrl),
    [education.imageUrls, education.primaryImageUrl]
  );

  const [orientation, setOrientation] = useState<PhotoOrientation>('landscape');
  const [hasOverflow, setHasOverflow] = useState(false);
  const [hintActive, setHintActive] = useState(false);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const isInViewportRef = useRef(false);
  const isUserInteractingRef = useRef(false);
  const isAnimatingRef = useRef(false);
  const lastHintAtRef = useRef(0);
  const lastInteractionAtRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const dragStateRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startScrollLeft: number;
    didDrag: boolean;
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    startScrollLeft: 0,
    didDrag: false,
  });

  // Reset orientation cleanly when primary photo changes
  useEffect(() => {
    setOrientation('landscape');
  }, [gallery.primaryPhoto]);

  const handlePrimaryImageLoad = useCallback((info: SafeImageLoadInfo) => {
    setOrientation(classifyPhotoOrientation(info.naturalWidth, info.naturalHeight));
  }, []);

  const stopHintAnimation = useCallback(() => {
    if (rafIdRef.current !== null) {
      window.cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    isAnimatingRef.current = false;
    setHintActive(false);
    if (trackRef.current) {
      trackRef.current.style.transform = '';
      trackRef.current.style.willChange = '';
    }
  }, []);

  const markUserInteraction = useCallback(() => {
    lastInteractionAtRef.current = Date.now();
    stopHintAnimation();
  }, [stopHintAnimation]);

  const measureOverflow = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) {
      setHasOverflow(false);
      return;
    }
    setHasOverflow(el.scrollWidth > el.clientWidth + 6);
  }, []);

  // Measure horizontal overflow for the additional gallery strip
  useEffect(() => {
    if (gallery.additionalPhotos.length === 0) {
      setHasOverflow(false);
      return;
    }
    measureOverflow();

    const el = scrollerRef.current;
    if (!el) return;

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => measureOverflow());
      observer.observe(el);
      if (trackRef.current) {
        observer.observe(trackRef.current);
      }
    }
    window.addEventListener('resize', measureOverflow, { passive: true });
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measureOverflow);
    };
  }, [gallery.additionalPhotos.length, measureOverflow]);

  // Observe gallery viewport visibility for scroll-triggered nudge hint
  useEffect(() => {
    if (gallery.additionalPhotos.length === 0) return;
    const el = scrollerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isInViewportRef.current = Boolean(entry?.isIntersecting);
        if (!isInViewportRef.current) {
          stopHintAnimation();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      stopHintAnimation();
    };
  }, [gallery.additionalPhotos.length, stopHintAnimation]);

  const triggerSubtleHorizontalHint = useCallback(() => {
    const scroller = scrollerRef.current;
    const track = trackRef.current;
    if (!scroller || !track) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const overflowPx = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    const nowMs = Date.now();

    const allowed = shouldTriggerGalleryHint({
      isInViewport: isInViewportRef.current,
      hasHorizontalOverflow: overflowPx > 6,
      prefersReducedMotion,
      isUserInteracting: isUserInteractingRef.current,
      isAnimating: isAnimatingRef.current,
      nowMs,
      lastHintAtMs: lastHintAtRef.current,
      lastInteractionAtMs: lastInteractionAtRef.current,
    });

    if (!allowed) return;

    isAnimatingRef.current = true;
    lastHintAtRef.current = nowMs;
    setHintActive(true);

    // Subtle sideways nudge proportional to available overflow (14px–24px max), returning smoothly to 0
    const maxNudgePx = Math.min(24, Math.max(14, Math.round(overflowPx * 0.22)));
    const startTime = performance.now();
    track.style.willChange = 'transform';

    const step = (now: number) => {
      if (!isAnimatingRef.current || !trackRef.current) return;
      const elapsed = now - startTime;
      const rawProgress = Math.min(1, elapsed / HINT_DURATION_MS);

      // Smooth bell curve: gentle ease out to the left, smooth ease back to origin
      const offset =
        rawProgress <= 0.45
          ? maxNudgePx * easeInOutSine(rawProgress / 0.45)
          : maxNudgePx * (1 - easeInOutSine((rawProgress - 0.45) / 0.55));

      trackRef.current.style.transform = `translate3d(-${offset.toFixed(2)}px, 0, 0)`;

      if (rawProgress < 1) {
        rafIdRef.current = window.requestAnimationFrame(step);
      } else {
        stopHintAnimation();
      }
    };

    rafIdRef.current = window.requestAnimationFrame(step);
  }, [stopHintAnimation]);

  // Trigger subtle nudge when user scrolls vertically while the gallery is visible
  useEffect(() => {
    if (gallery.additionalPhotos.length === 0) return;

    let scrollDebounceId: number | null = null;
    const handleWindowScroll = () => {
      if (!isInViewportRef.current || isUserInteractingRef.current) return;
      if (scrollDebounceId !== null) {
        window.clearTimeout(scrollDebounceId);
      }
      scrollDebounceId = window.setTimeout(() => {
        scrollDebounceId = null;
        triggerSubtleHorizontalHint();
      }, 160);
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleWindowScroll);
      if (scrollDebounceId !== null) {
        window.clearTimeout(scrollDebounceId);
      }
      stopHintAnimation();
    };
  }, [gallery.additionalPhotos.length, triggerSubtleHorizontalHint, stopHintAnimation]);

  // Smooth desktop mouse-drag scrolling for the horizontal thumbnail strip
  const handleScrollerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    markUserInteraction();
    isUserInteractingRef.current = true;
    if (e.pointerType !== 'mouse' || e.button !== 0 || !scrollerRef.current) return;

    dragStateRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startScrollLeft: scrollerRef.current.scrollLeft,
      didDrag: false,
    };
  };

  const handleScrollerPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    const scroller = scrollerRef.current;
    if (!drag.active || !scroller) return;

    const deltaX = e.clientX - drag.startX;
    if (!drag.didDrag && Math.abs(deltaX) > DRAG_CLICK_THRESHOLD_PX) {
      drag.didDrag = true;
      scroller.setPointerCapture?.(e.pointerId);
    }

    if (drag.didDrag) {
      scroller.scrollLeft = drag.startScrollLeft - deltaX;
    }
  };

  const handleScrollerPointerEnd = () => {
    const drag = dragStateRef.current;
    if (drag.active && drag.pointerId !== null) {
      try {
        scrollerRef.current?.releasePointerCapture?.(drag.pointerId);
      } catch {
        // Ignore if pointer capture was not active
      }
    }
    dragStateRef.current.active = false;
    dragStateRef.current.pointerId = null;
    isUserInteractingRef.current = false;
    lastInteractionAtRef.current = Date.now();
  };

  const openPhotoAt = (photoIndex: number) => {
    if (gallery.allPhotos.length === 0) return;
    onOpenLightbox({
      photos: gallery.allPhotos,
      primaryPhotoUrl: gallery.primaryPhoto,
      title: education.institution,
      activeIndex: photoIndex,
    });
  };

  const handleThumbnailClick = (additionalIdx: number) => {
    if (dragStateRef.current.didDrag) {
      dragStateRef.current.didDrag = false;
      return;
    }
    // Primary photo is always index 0, so additional photos start at index 1
    openPhotoAt(additionalIdx + 1);
  };

  const isPortrait = orientation === 'portrait';
  const hasDescription = Boolean(education.description?.trim());
  const periodLabel = education.period?.trim()
    ? `${education.period} · Lulus ${education.graduationYear}`
    : `Kelulusan ${education.graduationYear}`;

  return (
    <article
      data-aos="fade-up"
      data-aos-delay={getAosStaggerDelay(index, 100, 2)}
      data-education-card={education.id}
      data-primary-orientation={gallery.primaryPhoto ? orientation : 'none'}
      className={`brutal-card p-5 sm:p-6 ${tone.cardClass} ${tone.frameClass}`}
    >
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-num">
        <span className="font-semibold text-[#D9B44A] uppercase">
          {education.category}
          {education.location ? ` · ${education.location}` : ''}
        </span>
        <span className={tone.badgeClass}>{periodLabel}</span>
      </div>

      {/* 1. Nama Lembaga Pendidikan */}
      <h3 className="font-display text-xl sm:text-2xl font-extrabold mt-2.5 text-[#F8F8E1] leading-snug">
        {education.institution}
      </h3>

      {/* 2. Gelar atau Program Pendidikan */}
      <p className="text-sm sm:text-base font-semibold mt-1 text-[#D9B44A]">
        {education.degree} &mdash; {education.fieldOfStudy}
      </p>

      {/* 3. Foto Utama + 4. Deskripsi Riwayat Pendidikan (Auto Orientation Layout) */}
      {gallery.primaryPhoto ? (
        isPortrait && hasDescription ? (
          /* Portrait Layout with Description: Photo Left + Description Right (stacks cleanly on mobile) */
          <div className="mt-5 flex flex-col md:flex-row md:items-start gap-5 sm:gap-6">
            <div className="w-full max-w-[260px] sm:max-w-[280px] md:w-[240px] lg:w-[268px] shrink-0 mx-auto md:mx-0">
              <button
                type="button"
                onClick={() => openPhotoAt(0)}
                aria-label={`Lihat foto utama ${education.institution} dalam ukuran penuh`}
                className="edu-photo-frame group relative block w-full border-2 border-[#D9B44A] bg-[#F8F8E1] p-1.5 shadow-[4px_4px_0_0_#6C151E] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B44A] cursor-pointer"
              >
                <SafeImage
                  src={gallery.primaryPhoto}
                  alt={`Foto utama ${education.institution}`}
                  fallbackLabel={education.institution}
                  onImageLoad={handlePrimaryImageLoad}
                  className="block w-full h-auto max-h-[420px] object-contain mx-auto"
                />
                <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono-num font-bold bg-[#1B2A3D]/90 text-[#F8F8E1] border border-[#D9B44A] opacity-90 group-hover:bg-[#D9B44A] group-hover:text-[#001F24] transition-colors">
                  <ZoomIn className="w-3 h-3" aria-hidden="true" />
                  <span>Perbesar</span>
                </span>
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-[15px] text-[#F8F8E1]/90 leading-relaxed whitespace-pre-line">
                {education.description}
              </p>
            </div>
          </div>
        ) : (
          /* Landscape Layout (or Portrait without description): Centered Primary Photo + Description Below */
          <div className="mt-5 space-y-4">
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => openPhotoAt(0)}
                aria-label={`Lihat foto utama ${education.institution} dalam ukuran penuh`}
                className={`edu-photo-frame group relative inline-block border-2 border-[#D9B44A] bg-[#F8F8E1] p-1.5 shadow-[4px_4px_0_0_#6C151E] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B44A] cursor-pointer ${
                  isPortrait ? 'max-w-[260px] sm:max-w-[280px]' : 'max-w-full'
                }`}
              >
                <SafeImage
                  src={gallery.primaryPhoto}
                  alt={`Foto utama ${education.institution}`}
                  fallbackLabel={education.institution}
                  onImageLoad={handlePrimaryImageLoad}
                  className="block w-auto h-auto max-w-full max-h-[420px] object-contain mx-auto"
                />
                <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono-num font-bold bg-[#1B2A3D]/90 text-[#F8F8E1] border border-[#D9B44A] opacity-90 group-hover:bg-[#D9B44A] group-hover:text-[#001F24] transition-colors">
                  <ZoomIn className="w-3 h-3" aria-hidden="true" />
                  <span>Perbesar</span>
                </span>
              </button>
            </div>

            {hasDescription && (
              <p className="text-sm sm:text-[15px] text-[#F8F8E1]/90 leading-relaxed max-w-4xl whitespace-pre-line">
                {education.description}
              </p>
            )}
          </div>
        )
      ) : (
        /* Legacy / No-Photo Layout: Description directly below degree */
        hasDescription && (
          <p className="text-sm sm:text-[15px] text-[#F8F8E1]/90 mt-3.5 leading-relaxed max-w-4xl whitespace-pre-line">
            {education.description}
          </p>
        )
      )}

      {/* 5. Galeri Foto Tambahan (Horizontal Strip, 1:1 Rounded Square Thumbnails) */}
      {gallery.additionalPhotos.length > 0 && (
        <div className="mt-5 pt-4 border-t border-[#D9B44A]/35 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-num">
            <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wide text-[#D9B44A]">
              <Images className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Galeri Foto Tambahan ({gallery.additionalPhotos.length})</span>
            </span>
            {hasOverflow && (
              <span className="inline-flex items-center gap-0.5 text-[#F8F8E1]/80 font-semibold">
                <span>Geser ke samping</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#D9B44A]" aria-hidden="true" />
              </span>
            )}
          </div>

          <div
            ref={scrollerRef}
            data-education-gallery-scroller={education.id}
            data-hint-active={hintActive ? 'true' : 'false'}
            role="region"
            aria-label={`Galeri foto tambahan ${education.institution}`}
            onPointerDown={handleScrollerPointerDown}
            onPointerMove={handleScrollerPointerMove}
            onPointerUp={handleScrollerPointerEnd}
            onPointerCancel={handleScrollerPointerEnd}
            onTouchStart={() => {
              markUserInteraction();
              isUserInteractingRef.current = true;
            }}
            onTouchEnd={() => {
              isUserInteractingRef.current = false;
              lastInteractionAtRef.current = Date.now();
            }}
            onWheel={markUserInteraction}
            onScroll={() => {
              if (isUserInteractingRef.current) {
                lastInteractionAtRef.current = Date.now();
              }
            }}
            className="overflow-x-auto overscroll-x-contain touch-pan-x pb-2 pt-1 -mx-1 px-1 select-none cursor-grab active:cursor-grabbing"
          >
            <div ref={trackRef} className="flex items-center gap-3 w-max">
              {gallery.additionalPhotos.map((photoUrl, addIdx) => (
                <button
                  key={`${education.id}-add-${addIdx}-${photoUrl}`}
                  type="button"
                  onClick={() => handleThumbnailClick(addIdx)}
                  aria-label={`Buka foto dokumentasi tambahan ${addIdx + 1} dari ${education.institution}`}
                  className="edu-thumb-frame group relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 aspect-square shrink-0 rounded-xl overflow-hidden border-2 border-[#D9B44A] bg-[#F8F8E1] shadow-[3px_3px_0_0_#6C151E] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B44A] cursor-pointer"
                >
                  <SafeImage
                    src={photoUrl}
                    alt={`Dokumentasi tambahan ${education.institution} ${addIdx + 1}`}
                    fallbackLabel={`Foto ${addIdx + 2}`}
                    className="w-full h-full object-cover block transition-transform duration-300 group-hover:scale-105"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
};
