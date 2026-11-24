/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useLayoutEffect, useMemo } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PortfolioProvider, usePortfolio } from './context/PortfolioContext';
import { useRouter } from './utils/router';
import { initAosOnce, refreshAos, refreshAosAfterTransition, scrollToTopInstant } from './utils/aos';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { FloatingUtilityDock } from './components/layout/FloatingUtilityDock';
import { ToastBanner } from './components/ui/ToastBanner';
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
  const { loading, publicData, showToast } = usePortfolio();

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

  // Ensure scroll is instantaneously at y=0 BEFORE paint on every route change (including popstate)
  useLayoutEffect(() => {
    scrollToTopInstant();
  }, [route]);

  // Initialize AOS once actual content is ready (never while public skeleton is collapsing Footer into view)
  useEffect(() => {
    if (!loading || route === '/admin') {
      initAosOnce();
    }
  }, [loading, route]);

  // Re-scan AOS cleanly after every SPA route transition once content is mounted
  useEffect(() => {
    if (!loading || route === '/admin') {
      refreshAosAfterTransition();
    }
  }, [route, loading]);

  // Re-scan AOS whenever async Firestore snapshots populate or alter collection lengths
  useEffect(() => {
    if (!loading) {
      refreshAos(true);
    }
  }, [dataFingerprint, loading]);

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
        <AdminPage onNavigate={navigate} />
        <ToastBanner />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col surface-page">
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
