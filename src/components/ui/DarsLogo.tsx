import React from 'react';

interface DarsLogoProps {
  className?: string;
}

/**
 * Official Dars with Osama project brand logo (Light Mode).
 * Strictly reserved for the "Dars with Osama" project card and its project detail view.
 */
export const DarsLogo: React.FC<DarsLogoProps> = ({ className = 'w-full h-full object-contain' }) => {
  return (
    <img
      src="/assets/dars-with-osama-logo.png"
      alt="Logo Dars with Osama"
      decoding="async"
      className={className}
    />
  );
};
