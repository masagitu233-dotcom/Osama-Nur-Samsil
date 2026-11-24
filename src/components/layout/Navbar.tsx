import React, { useState } from 'react';
import { Menu, Moon, Share2, Sun, X } from 'lucide-react';
import type { PublicRoute } from '../../types/portfolio';
import { usePortfolio } from '../../context/PortfolioContext';

interface NavbarProps {
  currentRoute: PublicRoute;
  onNavigate: (route: PublicRoute) => void;
  onShareProfile: () => void;
}

const PRIMARY_NAV: Array<{ label: string; route: PublicRoute }> = [
  { label: 'About', route: '/about' },
  { label: 'Experience', route: '/experience' },
  { label: 'Education', route: '/education' },
  { label: 'Certificates', route: '/certificates' },
  { label: 'Projects', route: '/projects' },
];

const MOBILE_ALL_NAV: Array<{ label: string; route: PublicRoute }> = [
  { label: 'Home', route: '/' },
  { label: 'About Me', route: '/about' },
  { label: 'Experience', route: '/experience' },
  { label: 'Education & Knowledge', route: '/education' },
  { label: 'Certificates & Training', route: '/certificates' },
  { label: 'Skills, Interests & Talents', route: '/skills' },
  { label: 'Projects & Works', route: '/projects' },
  { label: 'Contact', route: '/contact' },
];

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, onNavigate, onShareProfile }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { publicData, theme, toggleTheme } = usePortfolio();

  const handleLinkClick = (e: React.MouseEvent, route: PublicRoute) => {
    e.preventDefault();
    setMobileOpen(false);
    onNavigate(route);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#013A42] text-[#F8F8E1] border-b-2 border-[#8ACCD5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line brand wordmark (Beige on Midnight Green) */}
        <a
          href="/"
          onClick={(e) => handleLinkClick(e, '/')}
          className="font-display font-extrabold text-base sm:text-lg tracking-tight text-[#F8F8E1] hover:text-[#8ACCD5] transition-colors whitespace-nowrap shrink-0"
        >
          {(publicData.profile.fullName || 'OSAMA NUR SAMSIL').toUpperCase()}
        </a>

        {/* Zone 2: 5 concise single-line text nav links */}
        <nav aria-label="Navigasi utama" className="hidden md:flex items-center gap-6 lg:gap-7">
          {PRIMARY_NAV.map((item) => {
            const active = currentRoute === item.route;
            return (
              <a
                key={item.route}
                href={item.route}
                onClick={(e) => handleLinkClick(e, item.route)}
                aria-current={active ? 'page' : undefined}
                className={`text-sm font-semibold whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                  active
                    ? 'border-[#8ACCD5] text-[#8ACCD5]'
                    : 'border-transparent text-[#F8F8E1] hover:text-[#8ACCD5] hover:border-[#8ACCD5]'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action on desktop + mobile menu trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="/contact"
            onClick={(e) => handleLinkClick(e, '/contact')}
            className="hidden md:inline-flex items-center justify-center brutal-btn-on-dark font-display font-bold text-sm px-4 py-2 whitespace-nowrap shrink-0"
          >
            Contact Me
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            className="md:hidden brutal-btn-on-dark p-2.5 cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t-2 border-[#8ACCD5] bg-[#013A42] text-[#F8F8E1]">
          <nav aria-label="Navigasi seluler" className="px-4 py-4 flex flex-col gap-1.5">
            {MOBILE_ALL_NAV.map((item) => {
              const active = currentRoute === item.route;
              return (
                <a
                  key={item.route}
                  href={item.route}
                  onClick={(e) => handleLinkClick(e, item.route)}
                  aria-current={active ? 'page' : undefined}
                  className={`px-4 py-3 text-sm font-bold border-2 transition-colors ${
                    active
                      ? 'bg-[#8ACCD5] text-[#013A42] border-[#F8F8E1]'
                      : 'border-transparent text-[#F8F8E1] hover:border-[#8ACCD5] hover:text-[#8ACCD5]'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
            <div className="pt-3 mt-2 border-t-2 border-[#8ACCD5]/40 flex items-center gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex-1 brutal-btn-on-dark-outline px-3 py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                <span>{theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onShareProfile();
                }}
                className="flex-1 brutal-btn-on-dark px-3 py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Bagikan Profil</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
