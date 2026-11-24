import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

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
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center surface-highlight p-6 text-center select-none ${className}`}
      >
        <div className="w-11 h-11 border-2 border-[#013A42] bg-[#F8F8E1] text-[#013A42] flex items-center justify-center mb-3">
          <ImageIcon className="w-5 h-5" aria-hidden="true" />
        </div>
        <span className="font-display font-bold text-sm leading-snug max-w-[20ch] text-[#013A42]">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
