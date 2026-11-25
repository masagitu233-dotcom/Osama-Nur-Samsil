import React from 'react';
import { ArrowUpRight, Lock, Share2 } from 'lucide-react';
import type { PublicRoute } from '../../types/portfolio';
import { usePortfolio } from '../../context/PortfolioContext';

interface FooterProps {
  onNavigate: (route: PublicRoute) => void;
  onShareProfile: () => void;
}

const FOOTER_LINKS: Array<{ label: string; route: PublicRoute }> = [
  { label: 'Beranda', route: '/' },
  { label: 'About Me', route: '/about' },
  { label: 'Experience', route: '/experience' },
  { label: 'Education & Publications', route: '/education' },
  { label: 'Certificates & Training', route: '/certificates' },
  { label: 'Skills & Talents', route: '/skills' },
  { label: 'Projects & Works', route: '/projects' },
  { label: 'Contact', route: '/contact' },
];

export const Footer: React.FC<FooterProps> = ({ onNavigate, onShareProfile }) => {
  const { publicData } = usePortfolio();
  const { profile, contacts } = publicData;

  const handleNav = (e: React.MouseEvent, route: PublicRoute) => {
    e.preventDefault();
    onNavigate(route);
  };

  return (
    <footer className="mt-14 sm:mt-16 border-t-[3px] border-[#001F24] bg-[#F8F8E1] text-[#1B2A3D]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-9 sm:py-10">
        <div data-aos="fade-up" data-aos-offset="60" className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Brand & Summary */}
          <div className="md:col-span-5 space-y-3">
            <h2 className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-[#1B2A3D]">
              {profile.fullName.toUpperCase()}
            </h2>
            <p className="text-xs sm:text-sm text-[#1B2A3D]/85 max-w-md leading-relaxed">
              {profile.headline}. Berdomisili di {profile.domicile}.
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={onShareProfile}
                className="brutal-btn brutal-btn-secondary px-3.5 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Bagikan Tautan Profil</span>
              </button>
            </div>
          </div>

          {/* Sitemap */}
          <div className="md:col-span-4">
            <h3 className="font-display text-xs font-extrabold uppercase tracking-wider text-[#6C151E] mb-3">
              Navigasi Portofolio
            </h3>
            <ul className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs sm:text-[13px]">
              {FOOTER_LINKS.map((item) => (
                <li key={item.route}>
                  <a
                    href={item.route}
                    onClick={(e) => handleNav(e, item.route)}
                    className="text-[#1B2A3D] hover:text-[#6C151E] hover:underline decoration-2 underline-offset-2 font-semibold transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* External Links & Admin */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="font-display text-xs font-extrabold uppercase tracking-wider text-[#0F3D3A]">
              Tautan &amp; Akses
            </h3>
            <ul className="space-y-2 text-xs sm:text-[13px]">
              {contacts.websiteUrl && (
                <li>
                  <a
                    href={contacts.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-bold text-[#1B2A3D] hover:text-[#6C151E] transition-colors"
                  >
                    <span>Dars with Osama</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#6C151E]" aria-hidden="true" />
                  </a>
                </li>
              )}
              {contacts.linkedinUrl && (
                <li>
                  <a
                    href={contacts.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-semibold text-[#1B2A3D] hover:text-[#6C151E] transition-colors"
                  >
                    <span>LinkedIn</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#0F3D3A]" aria-hidden="true" />
                  </a>
                </li>
              )}
              {contacts.githubUrl && (
                <li>
                  <a
                    href={contacts.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-semibold text-[#1B2A3D] hover:text-[#6C151E] transition-colors"
                  >
                    <span>GitHub</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#0F3D3A]" aria-hidden="true" />
                  </a>
                </li>
              )}
              <li className="pt-1">
                <a
                  href="/admin"
                  rel="nofollow"
                  onClick={(e) => handleNav(e, '/admin')}
                  className="inline-flex items-center gap-1.5 text-xs font-mono-num font-bold text-[#6C151E] hover:text-[#1B2A3D] transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Admin CMS</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t-2 border-[#1B2A3D]/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[#1B2A3D]/85">
          <p className="font-mono-num font-semibold">
            &copy; {new Date().getFullYear()} {profile.fullName}. Hak cipta dilindungi.
          </p>
          <p>Makassar, Sulawesi Selatan &middot; Portofolio Profesional &amp; CMS</p>
        </div>
      </div>
    </footer>
  );
};
