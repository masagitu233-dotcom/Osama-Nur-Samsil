import React, { useState } from 'react';
import { ExternalLink, Menu, Play, Share2, X } from 'lucide-react';
import type { PublicRoute } from '../../types/portfolio';
import { usePortfolio } from '../../context/PortfolioContext';
import { DarsLogo } from '../ui/DarsLogo';

interface NavbarProps {
  currentRoute: PublicRoute;
  onNavigate: (route: PublicRoute) => void;
  onShareProfile: () => void;
}

export const DARS_NAV_URL = 'https://darswithosama.netlify.app/';
export const YOUTUBE_NAV_URL = 'https://youtube.com/@osamanursamsil7944?si=VEI61UiF0i15evrb';

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
  { label: 'Education & Publications', route: '/education' },
  { label: 'Certificates & Training', route: '/certificates' },
  { label: 'Skills, Interests & Talents', route: '/skills' },
  { label: 'Projects & Works', route: '/projects' },
  { label: 'Contact', route: '/contact' },
];

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, onNavigate, onShareProfile }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { publicData } = usePortfolio();

  const handleLinkClick = (e: React.MouseEvent, route: PublicRoute) => {
    e.preventDefault();
    setMobileOpen(false);
    onNavigate(route);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#013A42] text-[#F8F8E1] border-b-2 border-[#8ACCD5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-6">
        {/* Zone 1: Single-line brand wordmark (Beige on Midnight Green) */}
        <a
          href="/"
          onClick={(e) => handleLinkClick(e, '/')}
          className="font-display font-extrabold text-sm sm:text-base lg:text-lg tracking-tight text-[#F8F8E1] hover:text-[#8ACCD5] transition-colors whitespace-nowrap shrink-0"
        >
          {(publicData.profile.fullName || 'OSAMA NUR SAMSIL').toUpperCase()}
        </a>

        {/* Zone 2: 5 concise single-line text nav links */}
        <nav aria-label="Navigasi utama" className="hidden lg:flex items-center gap-4 xl:gap-6">
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

        {/* Zone 3: Dedicated External Platform Buttons (Dars with Osama & YouTube) + Contact Me + Mobile Menu */}
        <div className="flex items-center gap-2 xl:gap-2.5 shrink-0">
          <a
            href={DARS_NAV_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-display font-extrabold bg-[#8ACCD5] text-[#013A42] border-2 border-[#F8F8E1] shadow-[3px_3px_0_0_#F8F8E1] hover:bg-[#F8F8E1] hover:text-[#013A42] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all whitespace-nowrap shrink-0"
          >
            <DarsLogo className="w-4 h-4 shrink-0" />
            <span>Dars with Osama</span>
          </a>

          <a
            href={YOUTUBE_NAV_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-display font-extrabold bg-[#6C151E] text-[#F8F8E1] border-2 border-[#F8F8E1] shadow-[3px_3px_0_0_#8ACCD5] hover:bg-[#F8F8E1] hover:text-[#6C151E] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true" />
            <span>YouTube</span>
          </a>

          <a
            href="/contact"
            onClick={(e) => handleLinkClick(e, '/contact')}
            className="hidden lg:inline-flex items-center justify-center brutal-btn-on-dark-outline font-display font-bold text-xs px-3 py-1.5 whitespace-nowrap shrink-0"
          >
            Contact Me
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            className="lg:hidden brutal-btn-on-dark p-2.5 cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t-2 border-[#8ACCD5] bg-[#013A42] text-[#F8F8E1]">
          <nav aria-label="Navigasi seluler" className="px-4 py-4 flex flex-col gap-1.5">
            {/* Dedicated External Channel Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pb-3 mb-2 border-b-2 border-[#8ACCD5]/40">
              <a
                href={DARS_NAV_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="w-full px-3.5 py-2.5 text-xs font-display font-extrabold bg-[#8ACCD5] text-[#013A42] border-2 border-[#F8F8E1] shadow-[3px_3px_0_0_#F8F8E1] flex items-center justify-between gap-2"
              >
                <span className="inline-flex items-center gap-2">
                  <DarsLogo className="w-4 h-4 shrink-0" />
                  <span>Dars with Osama</span>
                </span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              </a>

              <a
                href={YOUTUBE_NAV_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="w-full px-3.5 py-2.5 text-xs font-display font-extrabold bg-[#6C151E] text-[#F8F8E1] border-2 border-[#F8F8E1] shadow-[3px_3px_0_0_#8ACCD5] flex items-center justify-between gap-2"
              >
                <span className="inline-flex items-center gap-2">
                  <Play className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true" />
                  <span>YouTube</span>
                </span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              </a>
            </div>

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
            <div className="pt-3 mt-2 border-t-2 border-[#8ACCD5]/40">
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onShareProfile();
                }}
                className="w-full brutal-btn-on-dark px-3 py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
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
