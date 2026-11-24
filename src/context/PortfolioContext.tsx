import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import {
  subscribeAdminCollection,
  subscribePublicCollection,
  verifyAdminAccess,
} from '../services/portfolioService';
import { INITIAL_PORTFOLIO_DATA } from '../data/initialPortfolioData';
import type {
  ActivityLogItem,
  CertificateItem,
  ContactInfoData,
  ContactMessageItem,
  EducationItem,
  ExperienceItem,
  InterestItem,
  MediaAssetItem,
  OrganizationItem,
  PortfolioBundle,
  ProfileData,
  ProjectItem,
  PublicationItem,
  SiteSettingsData,
  SkillItem,
  TrainingItem,
} from '../types/portfolio';
import { filterPublicItems, sortByDisplayOrder } from '../utils/portfolioLogic';

interface PortfolioContextValue {
  // Public resolved data (Firestore live data, with graceful fallback before first seed)
  publicData: PortfolioBundle;
  // Full unfiltered admin collections (includes drafts & hidden records)
  adminData: PortfolioBundle;
  contactMessages: ContactMessageItem[];
  activityLogs: ActivityLogItem[];
  mediaAssets: MediaAssetItem[];
  loading: boolean;
  isFirestoreSeeded: boolean;
  firestoreError: string | null;

  // Auth & RBAC
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  adminCheckLoading: boolean;
  authError: string | null;
  loginWithGoogle: () => Promise<void>;
  logoutAdmin: () => Promise<void>;

  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Toast notifications
  toast: { type: 'success' | 'error' | 'info'; message: string } | null;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
  clearToast: () => void;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Raw Firestore live state (null means not yet loaded or empty)
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [education, setEducation] = useState<EducationItem[]>([]);
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [trainings, setTrainings] = useState<TrainingItem[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [interests, setInterests] = useState<InterestItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [publications, setPublications] = useState<PublicationItem[]>([]);
  const [contactsList, setContactsList] = useState<ContactInfoData[]>([]);
  const [siteSettingsList, setSiteSettingsList] = useState<SiteSettingsData[]>([]);

  // Admin-only collections
  const [contactMessages, setContactMessages] = useState<ContactMessageItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAssetItem[]>([]);

  // Theme
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = window.localStorage.getItem('osama-portfolio-theme');
    return stored === 'dark' ? 'dark' : 'light';
  });

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('osama-portfolio-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  // Auth listener + Admin UID/Email RBAC verification
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthError(null);
      if (!nextUser) {
        setIsAdmin(false);
        setAdminCheckLoading(false);
        setAuthReady(true);
        return;
      }

      setAdminCheckLoading(true);
      try {
        const verified = await verifyAdminAccess(nextUser.uid, nextUser.email, nextUser.emailVerified);
        setIsAdmin(verified);
        if (!verified) {
          setAuthError(
            `Akun ${nextUser.email || nextUser.uid} tidak terdaftar sebagai administrator terverifikasi. Tambahkan UID Anda ke koleksi 'admins' di Firebase Console.`
          );
        }
      } catch {
        setIsAdmin(false);
        setAuthError('Gagal memverifikasi hak akses administrator. Periksa konfigurasi Firestore & UID admin.');
      } finally {
        setAdminCheckLoading(false);
        setAuthReady(true);
      }
    });
    return () => unsub();
  }, []);

  // Realtime Firestore Listeners (switches cleanly between Public Published vs Full Admin view)
  useEffect(() => {
    if (!authReady) return;
    setFirestoreError(null);
    let settled = false;
    const markLoaded = () => {
      if (!settled) {
        settled = true;
        setLoading(false);
      }
    };

    const onErr = (err: Error) => {
      setFirestoreError(err.message);
      markLoaded();
    };

    const sub = isAdmin ? subscribeAdminCollection : subscribePublicCollection;
    const unsubs = [
      sub<ProfileData>('profile', (data) => { setProfiles(data); markLoaded(); }, onErr),
      sub<ExperienceItem>('experiences', setExperiences, onErr),
      sub<OrganizationItem>('organizations', setOrganizations, onErr),
      sub<EducationItem>('education', setEducation, onErr),
      sub<CertificateItem>('certificates', setCertificates, onErr),
      sub<TrainingItem>('trainings', setTrainings, onErr),
      sub<SkillItem>('skills', setSkills, onErr),
      sub<InterestItem>('interests', setInterests, onErr),
      sub<ProjectItem>('projects', setProjects, onErr),
      sub<PublicationItem>('publications', setPublications, onErr),
      sub<ContactInfoData>('contacts', setContactsList, onErr),
      sub<SiteSettingsData>('siteSettings', setSiteSettingsList, onErr),
    ];

    if (isAdmin) {
      unsubs.push(
        subscribeAdminCollection<ContactMessageItem>('contactMessages', setContactMessages, onErr, 'createdAt'),
        subscribeAdminCollection<ActivityLogItem>('activityLogs', setActivityLogs, onErr, 'createdAt'),
        subscribeAdminCollection<MediaAssetItem>('mediaAssets', setMediaAssets, onErr, 'createdAt')
      );
    } else {
      setContactMessages([]);
      setActivityLogs([]);
      setMediaAssets([]);
    }

    // Ensure loading resolves cleanly even on slow initial handshake
    const timeout = window.setTimeout(markLoaded, 2500);

    return () => {
      window.clearTimeout(timeout);
      unsubs.forEach((u) => u());
    };
  }, [authReady, isAdmin]);

  const isFirestoreSeeded =
    profiles.length > 0 ||
    experiences.length > 0 ||
    projects.length > 0 ||
    skills.length > 0 ||
    education.length > 0;

  const adminData: PortfolioBundle = useMemo(() => {
    const activeProfile = profiles.find((p) => p.id === 'main') || profiles[0] || INITIAL_PORTFOLIO_DATA.profile;
    const activeContact = contactsList.find((c) => c.id === 'main') || contactsList[0] || INITIAL_PORTFOLIO_DATA.contacts;
    const activeSettings =
      siteSettingsList.find((s) => s.id === 'main') || siteSettingsList[0] || INITIAL_PORTFOLIO_DATA.siteSettings;

    if (!isFirestoreSeeded) {
      return INITIAL_PORTFOLIO_DATA;
    }

    return {
      profile: activeProfile,
      experiences: sortByDisplayOrder(experiences),
      organizations: sortByDisplayOrder(organizations),
      education: sortByDisplayOrder(education),
      certificates: sortByDisplayOrder(certificates),
      trainings: sortByDisplayOrder(trainings),
      skills: sortByDisplayOrder(skills),
      interests: sortByDisplayOrder(interests),
      projects: sortByDisplayOrder(projects),
      publications: sortByDisplayOrder(publications),
      contacts: activeContact,
      siteSettings: activeSettings,
    };
  }, [
    isFirestoreSeeded,
    profiles,
    experiences,
    organizations,
    education,
    certificates,
    trainings,
    skills,
    interests,
    projects,
    publications,
    contactsList,
    siteSettingsList,
  ]);

  const publicData: PortfolioBundle = useMemo(() => {
    if (!isFirestoreSeeded) {
      return INITIAL_PORTFOLIO_DATA;
    }
    const pubProfile =
      profiles.find((p) => p.id === 'main' && p.status === 'published' && p.isVisible) ||
      profiles.find((p) => p.status === 'published' && p.isVisible) ||
      INITIAL_PORTFOLIO_DATA.profile;
    const pubContacts =
      contactsList.find((c) => c.id === 'main' && c.status === 'published' && c.isVisible) ||
      contactsList.find((c) => c.status === 'published' && c.isVisible) ||
      INITIAL_PORTFOLIO_DATA.contacts;
    const pubSettings =
      siteSettingsList.find((s) => s.id === 'main' && s.status === 'published' && s.isVisible) ||
      siteSettingsList.find((s) => s.status === 'published' && s.isVisible) ||
      INITIAL_PORTFOLIO_DATA.siteSettings;

    return {
      profile: pubProfile,
      experiences: filterPublicItems(experiences),
      organizations: filterPublicItems(organizations),
      education: filterPublicItems(education),
      certificates: filterPublicItems(certificates),
      trainings: filterPublicItems(trainings),
      skills: filterPublicItems(skills),
      interests: filterPublicItems(interests),
      projects: filterPublicItems(projects),
      publications: filterPublicItems(publications),
      contacts: pubContacts,
      siteSettings: pubSettings,
    };
  }, [
    isFirestoreSeeded,
    profiles,
    experiences,
    organizations,
    education,
    certificates,
    trainings,
    skills,
    interests,
    projects,
    publications,
    contactsList,
    siteSettingsList,
  ]);

  // Sync SEO meta tags dynamically from Firestore siteSettings
  useEffect(() => {
    const s = publicData.siteSettings;
    if (!s) return;
    document.title = s.siteTitle || 'Osama Nur Samsil — Personal Portfolio';
    const setMeta = (selector: string, content: string) => {
      const el = document.querySelector(selector);
      if (el && content) el.setAttribute('content', content);
    };
    setMeta('meta[name="description"]', s.metaDescription);
    setMeta('meta[property="og:title"]', s.ogTitle || s.siteTitle);
    setMeta('meta[property="og:description"]', s.ogDescription || s.metaDescription);
    setMeta('meta[name="twitter:title"]', s.ogTitle || s.siteTitle);
    setMeta('meta[name="twitter:description"]', s.ogDescription || s.metaDescription);
  }, [publicData.siteSettings]);

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Gagal masuk dengan Google.';
      setAuthError(msg);
      showToast('error', 'Login dibatalkan atau gagal. Silakan coba lagi.');
    }
  };

  const logoutAdmin = async () => {
    await signOut(auth);
    setIsAdmin(false);
    showToast('info', 'Anda telah keluar dari Dashboard Admin.');
  };

  return (
    <PortfolioContext.Provider
      value={{
        publicData,
        adminData,
        contactMessages,
        activityLogs,
        mediaAssets,
        loading,
        isFirestoreSeeded,
        firestoreError,
        user,
        authReady,
        isAdmin,
        adminCheckLoading,
        authError,
        loginWithGoogle,
        logoutAdmin,
        theme,
        toggleTheme,
        toast,
        showToast,
        clearToast: () => setToast(null),
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export function usePortfolio(): PortfolioContextValue {
  const ctx = useContext(PortfolioContext);
  if (!ctx) {
    throw new Error('usePortfolio must be used inside PortfolioProvider');
  }
  return ctx;
}
