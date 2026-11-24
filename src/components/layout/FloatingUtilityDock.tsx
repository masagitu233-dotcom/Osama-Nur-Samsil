import React, { useEffect, useState } from 'react';
import { ArrowUp, Moon, Sun } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';

export const FloatingUtilityDock: React.FC = () => {
  const [showTop, setShowTop] = useState(false);
  const { theme, toggleTheme } = usePortfolio();

  useEffect(() => {
    const onScroll = () => {
      setShowTop(window.scrollY > 360);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-30 hidden sm:flex flex-col gap-2">
      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Kembali ke atas"
          title="Kembali ke atas"
          className="brutal-btn brutal-btn-secondary w-11 h-11 flex items-center justify-center cursor-pointer"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'light' ? 'Aktifkan mode gelap' : 'Aktifkan mode terang'}
        title={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
        className="brutal-btn brutal-btn-primary w-11 h-11 flex items-center justify-center cursor-pointer"
      >
        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>
    </div>
  );
};
