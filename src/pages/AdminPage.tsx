import React, { useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  Briefcase,
  ExternalLink,
  FolderKanban,
  GraduationCap,
  Heart,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Settings,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import type { PublicRoute } from '../types/portfolio';
import type { ManagedCollectionName } from '../services/portfolioService';
import { AdminAuthGate } from '../components/admin/AdminAuthGate';
import { AdminOverview } from '../components/admin/AdminOverview';
import { ContactAndSeoEditor, ProfileEditor } from '../components/admin/ProfileSettingsEditor';
import { CollectionCrudManager } from '../components/admin/CollectionCrudManager';
import { MediaLibraryPanel, MessagesPanel } from '../components/admin/MessagesAndMediaPanel';
import { Modal } from '../components/ui/Modal';

interface AdminPageProps {
  onNavigate: (route: PublicRoute) => void;
}

type AdminTab =
  | 'overview'
  | 'profile'
  | ManagedCollectionName
  | 'contacts_seo'
  | 'messages'
  | 'media';

const SIDEBAR_ITEMS: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'profile', label: 'Profil, Bio & CV', icon: User },
  { id: 'experiences', label: 'Pengalaman', icon: Briefcase },
  { id: 'organizations', label: 'Organisasi', icon: Users },
  { id: 'education', label: 'Pendidikan', icon: GraduationCap },
  { id: 'certificates', label: 'Sertifikat', icon: Award },
  { id: 'trainings', label: 'Pelatihan', icon: BookOpen },
  { id: 'skills', label: 'Keahlian & Bahasa', icon: Sparkles },
  { id: 'interests', label: 'Minat & Bakat', icon: Heart },
  { id: 'projects', label: 'Proyek & Karya', icon: FolderKanban },
  { id: 'publications', label: 'Publikasi & Kajian', icon: BookOpen },
  { id: 'contacts_seo', label: 'Kontak & SEO', icon: Settings },
  { id: 'messages', label: 'Pesan Masuk', icon: Mail },
  { id: 'media', label: 'Pustaka Media', icon: ImageIcon },
];

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const { isAdmin, user, logoutAdmin, contactMessages } = usePortfolio();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingTab, setPendingTab] = useState<AdminTab | null>(null);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (!isAdmin) {
    return <AdminAuthGate onNavigate={onNavigate} />;
  }

  const requestTabChange = (next: AdminTab) => {
    if (next === activeTab) {
      setSidebarOpen(false);
      return;
    }
    if (hasUnsavedChanges) {
      setPendingTab(next);
      return;
    }
    setActiveTab(next);
    setSidebarOpen(false);
  };

  const unreadCount = contactMessages.filter((m) => m.status === 'new').length;

  const isCollectionTab = (tab: AdminTab): tab is ManagedCollectionName =>
    [
      'experiences',
      'organizations',
      'education',
      'certificates',
      'trainings',
      'skills',
      'interests',
      'projects',
      'publications',
    ].includes(tab);

  return (
    <div className="min-h-screen surface-page flex flex-col lg:flex-row">
      {/* Mobile Admin Top Bar */}
      <div className="lg:hidden sticky top-0 z-30 h-14 px-4 bg-[#013A42] text-[#F8F8E1] border-b-2 border-[#8ACCD5] flex items-center justify-between">
        <span className="font-display font-extrabold text-sm tracking-tight">ADMIN CMS &middot; OSAMA</span>
        <button
          type="button"
          onClick={() => setSidebarOpen((p) => !p)}
          aria-label="Toggle menu admin"
          className="brutal-btn-on-dark p-2 cursor-pointer"
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Sidebar Navigation: Midnight Green Identity Surface */}
      <aside
        className={`${
          sidebarOpen ? 'block' : 'hidden'
        } lg:block w-full lg:w-64 shrink-0 bg-[#013A42] text-[#F8F8E1] border-b-2 lg:border-b-0 lg:border-r-2 border-[#8ACCD5] flex flex-col justify-between`}
      >
        <div className="p-4 space-y-5">
          <div className="hidden lg:block pb-4 border-b-2 border-[#8ACCD5]/40">
            <p className="font-mono-num text-[11px] font-bold text-[#8ACCD5] uppercase tracking-wider">Portfolio CMS</p>
            <p className="font-display font-extrabold text-lg leading-tight mt-0.5 text-[#F8F8E1]">OSAMA NUR SAMSIL</p>
            <p className="text-xs text-[#F8F8E1]/75 truncate mt-1">{user?.email}</p>
          </div>

          <nav aria-label="Menu CMS Admin" className="space-y-1">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => requestTabChange(item.id)}
                  className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 text-xs font-bold border-2 transition-colors cursor-pointer text-left ${
                    active
                      ? 'bg-[#8ACCD5] text-[#013A42] border-[#F8F8E1] shadow-[3px_3px_0_0_#F8F8E1]'
                      : 'text-[#F8F8E1] border-transparent hover:bg-[#8ACCD5]/15 hover:border-[#8ACCD5]'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.id === 'messages' && unreadCount > 0 && (
                    <span
                      className={`font-mono-num text-[11px] font-extrabold px-1.5 py-0.5 ${
                        active ? 'bg-[#6C151E] text-[#F8F8E1]' : 'bg-[#6C151E] text-[#F8F8E1]'
                      }`}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t-2 border-[#8ACCD5]/40 space-y-2.5">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="w-full brutal-btn-on-dark px-3 py-2 text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Lihat Website Publik</span>
          </button>
          <button
            type="button"
            onClick={logoutAdmin}
            className="w-full brutal-btn-on-dark-outline px-3 py-2 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10 max-w-6xl">
        {activeTab === 'overview' && (
          <AdminOverview onSelectTab={(tab) => requestTabChange(tab as AdminTab)} />
        )}
        {activeTab === 'profile' && <ProfileEditor onDirtyChange={setHasUnsavedChanges} />}
        {isCollectionTab(activeTab) && (
          <CollectionCrudManager
            key={activeTab}
            collectionName={activeTab}
            onDirtyChange={setHasUnsavedChanges}
          />
        )}
        {activeTab === 'contacts_seo' && <ContactAndSeoEditor onDirtyChange={setHasUnsavedChanges} />}
        {activeTab === 'messages' && <MessagesPanel />}
        {activeTab === 'media' && <MediaLibraryPanel />}
      </main>

      {/* Unsaved Changes Warning Modal */}
      <Modal
        open={Boolean(pendingTab)}
        onClose={() => setPendingTab(null)}
        title="Perubahan Belum Disimpan"
        maxWidthClass="max-w-md"
      >
        <p className="text-sm mb-6">
          Anda memiliki perubahan yang belum disimpan. Jika berpindah halaman sekarang, perubahan tersebut akan hilang. Lanjutkan berpindah?
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setPendingTab(null)}
            className="brutal-btn brutal-btn-primary px-4 py-2 text-xs font-bold cursor-pointer"
          >
            Tetap di Halaman Ini
          </button>
          <button
            type="button"
            onClick={() => {
              if (pendingTab) {
                setHasUnsavedChanges(false);
                setActiveTab(pendingTab);
                setPendingTab(null);
                setSidebarOpen(false);
              }
            }}
            className="brutal-btn brutal-btn-outline px-4 py-2 text-xs font-bold cursor-pointer"
          >
            Abaikan &amp; Pindah
          </button>
        </div>
      </Modal>
    </div>
  );
};
