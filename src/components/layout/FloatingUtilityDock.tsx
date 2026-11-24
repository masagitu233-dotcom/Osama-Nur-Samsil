import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export const FloatingUtilityDock: React.FC = () => {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowTop(window.scrollY > 360);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!showTop) return null;

  return (
    <div className="fixed bottom-5 right-5 z-30 hidden sm:flex flex-col gap-2">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Kembali ke atas"
        title="Kembali ke atas"
        className="brutal-btn brutal-btn-bordo w-11 h-11 flex items-center justify-center cursor-pointer"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
};
