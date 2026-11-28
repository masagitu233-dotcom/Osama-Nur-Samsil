/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useLayoutEffect, useMemo } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PortfolioProvider, usePortfolio } from './context/PortfolioContext';
import { useRouter } from './utils/router';
import { refreshAosAfterTransition, scrollToTopInstant, syncBodyAosAttributes } from './utils/aos';
import { applyDocumentDesignMode, resolveEffectiveRouteDesignMode } from './utils/designMode';
import { applyDocumentLayoutSizing } from './utils/layoutSizing';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { FloatingUtilityDock } from './components/layout/FloatingUtilityDock';
import { ToastBanner } from './components/ui/ToastBanner';
import { RouteSeoHead } from './components/seo/RouteSeoHead';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ExperiencePage } from './pages/ExperiencePage';
import { EducationPage } from './pages/EducationPage';
import { CertificatesPage } from './pages/CertificatesPage';
import { SkillsPage } from './pages/SkillsPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ContactPage } from './pages/ContactPage';
import { AdminPage } from './pages/AdminPage';

const AppShell: React.FC = () => {
  const { route, navigate } = useRouter();
  const {
    loading,
    publicData,
    designMode,
    activeSizing,
    isAdmin,
    draftSizingPreview,
    setDraftSizingPreview,
    showToast,
  } = usePortfolio();

  const dataFingerprint = useMemo(
    () =>
      [
        publicData.profile.fullName,
        publicData.experiences.length,
        publicData.organizations.length,
        publicData.education.length,
        publicData.certificates.length,
        publicData.trainings.length,
        publicData.skills.length,
        publicData.interests.length,
        publicData.projects.length,
      ].join('|'),
    [publicData]
  );

  // Commit active design mode & layout sizing CSS variables to <html> before paint
  useLayoutEffect(() => {
    const isAdminRoute = route === '/admin';
    const effectiveMode = resolveEffectiveRouteDesignMode(designMode, isAdminRoute);
    applyDocumentDesignMode(effectiveMode);
    applyDocumentLayoutSizing(activeSizing, isAdminRoute);
  }, [designMode, activeSizing, route]);

  // Ensure scroll is at y=0 and body AOS transition attributes are committed BEFORE paint
  useLayoutEffect(() => {
    scrollToTopInstant();
    syncBodyAosAttributes();
  }, [route]);

  // Single unified AOS lifecycle sync for initial load, SPA route switches, and live Firestore updates
  useEffect(() => {
    if (!loading || route === '/admin') {
      refreshAosAfterTransition();
    }
  }, [route, loading, dataFingerprint]);

  const handleShareProfile = async () => {
    const shareUrl = window.location.origin;
    const shareTitle = `${publicData.profile.fullName} — Personal Portfolio`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: publicData.profile.headline,
          url: shareUrl,
        });
        return;
      }
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        showToast('success', 'Tautan profil berhasil disalin ke clipboard.');
        return;
      }
      showToast('info', `Salin tautan profil: ${shareUrl}`);
    } catch {
      showToast('info', `Tautan profil: ${shareUrl}`);
    }
  };

  if (route === '/admin') {
    return (
      <>
        <RouteSeoHead route={route} bundle={publicData} />
        <AdminPage onNavigate={navigate} />
        <ToastBanner />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col surface-page">
      <RouteSeoHead route={route} bundle={publicData} />
      {isAdmin && draftSizingPreview && (
        <div
          role="status"
          className="bg-[#D9B44A] text-[#001F24] border-b border-[#001F24] px-4 py-1.5 text-xs font-mono-num flex flex-wrap items-center justify-between gap-2"
        >
          <span className="font-bold">
            Mode Pratinjau Draft Aktif (hanya terlihat oleh Admin — belum disimpan ke publik)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="underline font-bold cursor-pointer"
            >
              Kembali ke Pengaturan
            </button>
            <button
              type="button"
              onClick={() => {
                setDraftSizingPreview(null);
                showToast('info', 'Pratinjau draft ukuran dinonaktifkan.');
              }}
              className="px-2 py-0.5 bg-[#001F24] text-[#F8F8E1] font-bold cursor-pointer"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}
      <Navbar
        currentRoute={route}
        onNavigate={navigate}
        onShareProfile={handleShareProfile}
      />

      <main className="flex-1">
        {loading ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6" aria-busy="true">
            <div className="h-10 w-64 brutal-skeleton animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 h-80 brutal-skeleton animate-pulse" />
              <div className="lg:col-span-5 h-80 brutal-skeleton animate-pulse" />
            </div>
          </div>
        ) : (
          <div key={route}>
            {route === '/' && <HomePage onNavigate={navigate} onShareProfile={handleShareProfile} />}
            {route === '/about' && <AboutPage onNavigate={navigate} />}
            {route === '/experience' && <ExperiencePage />}
            {route === '/education' && <EducationPage />}
            {route === '/certificates' && <CertificatesPage />}
            {route === '/skills' && <SkillsPage />}
            {route === '/projects' && <ProjectsPage />}
            {route === '/contact' && <ContactPage />}
          </div>
        )}
      </main>

      {!loading && <Footer key={route} onNavigate={navigate} onShareProfile={handleShareProfile} />}
      <FloatingUtilityDock />
      <ToastBanner />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <PortfolioProvider>
        <AppShell />
      </PortfolioProvider>
    </ErrorBoundary>
  );
}
