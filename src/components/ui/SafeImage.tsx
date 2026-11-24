import React, { useEffect, useMemo, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { getImageCandidateUrls, isGoogleDriveUrl } from '../../utils/googleDriveMedia';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
  priority?: boolean;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackLabel,
  priority = false,
}) => {
  const candidates = useMemo(() => getImageCandidateUrls(src), [src]);
  const isDriveSource = useMemo(() => isGoogleDriveUrl(src), [src]);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [allFailed, setAllFailed] = useState(false);

  // Reset fallback state whenever the input URL changes (critical for live Admin previews)
  useEffect(() => {
    setCandidateIndex(0);
    setAllFailed(false);
  }, [src]);

  const activeSrc = candidates[candidateIndex];

  if (!activeSrc || allFailed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center surface-highlight p-5 text-center select-none ${className}`}
      >
        <div className="w-10 h-10 border-2 border-[#013A42] bg-[#F8F8E1] text-[#013A42] flex items-center justify-center mb-2.5 shrink-0">
          <ImageIcon className="w-5 h-5" aria-hidden="true" />
        </div>
        <span className="font-display font-bold text-xs sm:text-sm leading-snug max-w-[24ch] text-[#013A42]">
          {fallbackLabel || alt}
        </span>
        {allFailed && isDriveSource && (
          <span className="mt-1.5 text-[11px] leading-tight text-[#013A42]/85 max-w-[28ch]">
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

  return (
    <img
      key={activeSrc}
      src={activeSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onError={handleError}
      className={className}
    />
  );
};
