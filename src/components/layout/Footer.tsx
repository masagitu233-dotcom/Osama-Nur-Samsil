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
    <footer className="mt-24 border-t-4 border-[#8ACCD5] bg-[#013A42] text-[#F8F8E1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand & Summary */}
          <div className="md:col-span-5 space-y-4">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#F8F8E1]">
              {profile.fullName.toUpperCase()}
            </h2>
            <p className="text-sm text-[#F8F8E1]/85 max-w-md leading-relaxed">
              {profile.headline}. Berdomisili di {profile.domicile}.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onShareProfile}
                className="brutal-btn-on-dark px-4 py-2 text-xs font-bold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Bagikan Tautan Profil</span>
              </button>
            </div>
          </div>

          {/* Sitemap */}
          <div className="md:col-span-4">
            <h3 className="font-display text-sm font-extrabold uppercase tracking-wider text-[#8ACCD5] mb-4">
              Navigasi Portofolio
            </h3>
            <ul className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-sm">
              {FOOTER_LINKS.map((item) => (
                <li key={item.route}>
                  <a
                    href={item.route}
                    onClick={(e) => handleNav(e, item.route)}
                    className="text-[#F8F8E1] hover:text-[#8ACCD5] font-medium transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* External Links & Admin */}
          <div className="md:col-span-3 space-y-4">
            <h3 className="font-display text-sm font-extrabold uppercase tracking-wider text-[#8ACCD5]">
              Tautan &amp; Akses
            </h3>
            <ul className="space-y-2.5 text-sm">
              {contacts.websiteUrl && (
                <li>
                  <a
                    href={contacts.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-semibold text-[#8ACCD5] hover:text-[#F8F8E1] transition-colors"
                  >
                    <span>Dars with Osama</span>
                    <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                  </a>
                </li>
              )}
              {contacts.linkedinUrl && (
                <li>
                  <a
                    href={contacts.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-[#8ACCD5] hover:text-[#F8F8E1] transition-colors"
                  >
                    <span>LinkedIn</span>
                    <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                  </a>
                </li>
              )}
              {contacts.githubUrl && (
                <li>
                  <a
                    href={contacts.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-[#8ACCD5] hover:text-[#F8F8E1] transition-colors"
                  >
                    <span>GitHub</span>
                    <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                  </a>
                </li>
              )}
              <li className="pt-2">
                <a
                  href="/admin"
                  onClick={(e) => handleNav(e, '/admin')}
                  className="inline-flex items-center gap-1.5 text-xs font-mono-num font-bold text-[#8ACCD5] hover:text-[#F8F8E1] transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Admin CMS</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#8ACCD5]/35 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#F8F8E1]/80">
          <p className="font-mono-num">
            &copy; {new Date().getFullYear()} {profile.fullName}. Hak cipta dilindungi.
          </p>
          <p>Makassar, Sulawesi Selatan &middot; Portofolio Profesional &amp; CMS</p>
        </div>
      </div>
    </footer>
  );
};
