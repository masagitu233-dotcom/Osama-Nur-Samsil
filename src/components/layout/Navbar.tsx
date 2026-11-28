import React, { useState } from 'react';
import { BookOpen, ExternalLink, Menu, Play, Share2, X } from 'lucide-react';
import type { PublicRoute } from '../../types/portfolio';
import { usePortfolio } from '../../context/PortfolioContext';

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
  const { publicData, designMode } = usePortfolio();
  const isMinimal = designMode === 'minimalis_elegan';

  const handleLinkClick = (e: React.MouseEvent, route: PublicRoute) => {
    e.preventDefault();
    setMobileOpen(false);
    onNavigate(route);
  };

  return (
    <header
      className={
        isMinimal
          ? 'sticky top-0 z-40 bg-[#F8F8E1]/95 backdrop-blur-md text-[#1B2A3D] border-b border-[#1B2A3D]/14 transition-colors'
          : 'sticky top-0 z-40 bg-[#F8F8E1] text-[#1B2A3D] border-b-2 border-[#001F24]'
      }
    >
      <div
        className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 ${
          isMinimal ? 'h-16' : 'h-14'
        }`}
      >
        {/* Zone 1: Single-line portfolio brand wordmark (Ink Navy on Beige) */}
        <a
          href="/"
          onClick={(e) => handleLinkClick(e, '/')}
          className={
            isMinimal
              ? 'font-display font-extrabold text-[15px] sm:text-base tracking-[-0.02em] text-[#1B2A3D] hover:text-[#6C151E] transition-colors whitespace-nowrap shrink-0'
              : 'font-display font-extrabold text-sm sm:text-[15px] lg:text-base tracking-tight text-[#1B2A3D] hover:text-[#6C151E] transition-colors whitespace-nowrap shrink-0'
          }
        >
          {(publicData.profile.fullName || 'OSAMA NUR SAMSIL').toUpperCase()}
        </a>

        {/* Zone 2: 5 concise single-line text nav links */}
        <nav aria-label="Navigasi utama" className="hidden lg:flex items-center gap-5 xl:gap-6">
          {PRIMARY_NAV.map((item) => {
            const active = currentRoute === item.route;
            return (
              <a
                key={item.route}
                href={item.route}
                onClick={(e) => handleLinkClick(e, item.route)}
                aria-current={active ? 'page' : undefined}
                className={
                  isMinimal
                    ? `text-[13px] font-semibold whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors ${
                        active
                          ? 'border-[#0F3D3A] text-[#0F3D3A] font-bold'
                          : 'border-transparent text-[#1B2A3D]/80 hover:border-[#D9B44A] hover:text-[#1B2A3D]'
                      }`
                    : `text-[13px] font-bold whitespace-nowrap shrink-0 py-1 border-b-[3px] transition-colors ${
                        active
                          ? 'border-[#D9B44A] text-[#1B2A3D]'
                          : 'border-transparent text-[#1B2A3D] hover:border-[#D9B44A] hover:text-[#6C151E]'
                      }`
                }
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Dedicated External Platform Buttons + Contact Me + Mobile Menu */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={DARS_NAV_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={
              isMinimal
                ? 'hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-display font-bold rounded-xl bg-[#D9B44A] text-[#001F24] border border-[#001F24]/15 hover:bg-[#0F3D3A] hover:text-[#F8F8E1] hover:-translate-y-0.5 transition-all whitespace-nowrap shrink-0'
                : 'hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-display font-extrabold bg-[#D9B44A] text-[#001F24] border-2 border-[#001F24] shadow-[2.5px_2.5px_0_0_#001F24] hover:bg-[#0F3D3A] hover:text-[#F8F8E1] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all whitespace-nowrap shrink-0'
            }
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Dars with Osama</span>
          </a>

          <a
            href={YOUTUBE_NAV_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={
              isMinimal
                ? 'hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-display font-bold rounded-xl bg-[#6C151E] text-[#F8F8E1] border border-[#6C151E] hover:bg-[#1B2A3D] hover:border-[#1B2A3D] hover:-translate-y-0.5 transition-all whitespace-nowrap shrink-0'
                : 'hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-display font-extrabold bg-[#6C151E] text-[#F8F8E1] border-2 border-[#001F24] shadow-[2.5px_2.5px_0_0_#001F24] hover:bg-[#1B2A3D] hover:text-[#F8F8E1] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all whitespace-nowrap shrink-0'
            }
          >
            <Play className="w-3 h-3 fill-current shrink-0" aria-hidden="true" />
            <span>YouTube</span>
          </a>

          <a
            href="/contact"
            onClick={(e) => handleLinkClick(e, '/contact')}
            className={`hidden lg:inline-flex items-center justify-center brutal-btn brutal-btn-primary font-display font-bold text-xs whitespace-nowrap shrink-0 ${
              isMinimal ? 'px-3.5 py-1.5' : 'px-2.5 py-1.5'
            }`}
          >
            Contact Me
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            className="lg:hidden brutal-btn brutal-btn-secondary p-2 cursor-pointer"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Navigation Drawer */}
      {mobileOpen && (
        <div
          className={
            isMinimal
              ? 'lg:hidden border-t border-[#1B2A3D]/14 bg-[#F8F8E1] text-[#1B2A3D]'
              : 'lg:hidden border-t-2 border-[#001F24] bg-[#F8F8E1] text-[#1B2A3D]'
          }
        >
          <nav aria-label="Navigasi seluler" className="px-4 py-3.5 flex flex-col gap-1">
            {/* Dedicated External Channel Buttons */}
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2.5 mb-1.5 ${
                isMinimal ? 'border-b border-[#1B2A3D]/14' : 'border-b-2 border-[#1B2A3D]/25'
              }`}
            >
              <a
                href={DARS_NAV_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className={
                  isMinimal
                    ? 'w-full px-3.5 py-2.5 text-xs font-display font-bold rounded-xl bg-[#D9B44A] text-[#001F24] border border-[#001F24]/15 flex items-center justify-between gap-2'
                    : 'w-full px-3 py-2 text-xs font-display font-extrabold bg-[#D9B44A] text-[#001F24] border-2 border-[#001F24] shadow-[2.5px_2.5px_0_0_#001F24] flex items-center justify-between gap-2'
                }
              >
                <span className="inline-flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Dars with Osama</span>
                </span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              </a>

              <a
                href={YOUTUBE_NAV_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className={
                  isMinimal
                    ? 'w-full px-3.5 py-2.5 text-xs font-display font-bold rounded-xl bg-[#6C151E] text-[#F8F8E1] flex items-center justify-between gap-2'
                    : 'w-full px-3 py-2 text-xs font-display font-extrabold bg-[#6C151E] text-[#F8F8E1] border-2 border-[#001F24] shadow-[2.5px_2.5px_0_0_#001F24] flex items-center justify-between gap-2'
                }
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
                  className={
                    isMinimal
                      ? `px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
                          active
                            ? 'bg-[#0F3D3A] text-[#F8F8E1] font-bold'
                            : 'text-[#1B2A3D] hover:bg-[#D9B44A]/35'
                        }`
                      : `px-3.5 py-2.5 text-sm font-bold border-2 transition-colors ${
                          active
                            ? 'bg-[#D9B44A] text-[#001F24] border-[#001F24]'
                            : 'border-transparent text-[#1B2A3D] hover:border-[#001F24] hover:bg-[#D9B44A]/35'
                        }`
                  }
                >
                  {item.label}
                </a>
              );
            })}
            <div
              className={`pt-2.5 mt-1.5 ${
                isMinimal ? 'border-t border-[#1B2A3D]/14' : 'border-t-2 border-[#1B2A3D]/25'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onShareProfile();
                }}
                className="w-full brutal-btn brutal-btn-primary px-3 py-2 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Bagikan Profil</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
