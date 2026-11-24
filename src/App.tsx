/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PortfolioProvider, usePortfolio } from './context/PortfolioContext';
import { useRouter } from './utils/router';
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
          <>
            {route === '/' && <HomePage onNavigate={navigate} onShareProfile={handleShareProfile} />}
            {route === '/about' && <AboutPage onNavigate={navigate} />}
            {route === '/experience' && <ExperiencePage />}
            {route === '/education' && <EducationPage />}
            {route === '/certificates' && <CertificatesPage />}
            {route === '/skills' && <SkillsPage />}
            {route === '/projects' && <ProjectsPage />}
            {route === '/contact' && <ContactPage />}
          </>
        )}
      </main>

      <Footer onNavigate={navigate} onShareProfile={handleShareProfile} />
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
