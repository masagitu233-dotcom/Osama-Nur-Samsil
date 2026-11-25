import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { getImageCandidateUrls, isGoogleDriveUrl } from '../../utils/googleDriveMedia';

export interface SafeImageLoadInfo {
  naturalWidth: number;
  naturalHeight: number;
  src: string;
}

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
  priority?: boolean;
  preferredWidth?: 800 | 1000 | 1600 | 2000;
  onImageLoad?: (info: SafeImageLoadInfo) => void;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackLabel,
  priority = false,
  preferredWidth = 1600,
  onImageLoad,
}) => {
  const candidates = useMemo(
    () => getImageCandidateUrls(src, preferredWidth),
    [src, preferredWidth]
  );
  const isDriveSource = useMemo(() => isGoogleDriveUrl(src), [src]);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [allFailed, setAllFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const onImageLoadRef = useRef(onImageLoad);
  onImageLoadRef.current = onImageLoad;

  // Reset fallback state whenever the input URL or preferred width changes
  useEffect(() => {
    setCandidateIndex(0);
    setAllFailed(false);
  }, [src, preferredWidth]);

  const activeSrc = candidates[candidateIndex];

  // Report dimensions immediately if the image is already cached/complete
  useEffect(() => {
    const img = imgRef.current;
    if (!img || !activeSrc || !onImageLoadRef.current) return;
    if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
      onImageLoadRef.current({
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        src: activeSrc,
      });
    }
  }, [activeSrc]);

  if (!activeSrc || allFailed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center surface-highlight p-5 text-center select-none ${className}`}
      >
        <div className="w-10 h-10 border-2 border-[#001F24] bg-[#F8F8E1] text-[#001F24] flex items-center justify-center mb-2.5 shrink-0">
          <ImageIcon className="w-5 h-5" aria-hidden="true" />
        </div>
        <span className="font-display font-bold text-xs sm:text-sm leading-snug max-w-[24ch] text-[#001F24]">
          {fallbackLabel || alt}
        </span>
        {allFailed && isDriveSource && (
          <span className="mt-1.5 text-[11px] leading-tight text-[#001F24] max-w-[28ch]">
            Gambar Google Drive gagal dimuat. Pastikan akses file diatur ke &ldquo;Siapa saja yang memiliki link&rdquo;.
          </span>
        )}
      </div>
    );
  }

  const handleError = () => {
    if (candidateIndex + 1 < candidates.length) {
      setCandidateIndex((prev) => prev + 1);
    } else {
      setAllFailed(true);
    }
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    if (onImageLoadRef.current && target.naturalWidth > 0 && target.naturalHeight > 0) {
      onImageLoadRef.current({
        naturalWidth: target.naturalWidth,
        naturalHeight: target.naturalHeight,
        src: activeSrc,
      });
    }
  };

  return (
    <img
      ref={imgRef}
      key={activeSrc}
      src={activeSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={handleLoad}
      onError={handleError}
      className={className}
    />
  );
};
