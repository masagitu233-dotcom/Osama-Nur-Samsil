import React, { useState } from 'react';
import { Database, RefreshCw } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { seedInitialPortfolioToFirestore } from '../../services/portfolioService';
import { getSectionCardTone, type PortfolioSectionKey } from '../../utils/cardVariants';
import { getAosStaggerDelay } from '../../utils/aos';
import { GoogleDriveConnectionPanel } from './GoogleDriveConnectionPanel';

interface AdminOverviewProps {
  onSelectTab: (tab: string) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ onSelectTab }) => {
  const { adminData, contactMessages, activityLogs, mediaAssets, isFirestoreSeeded, showToast } = usePortfolio();
  const [seeding, setSeeding] = useState(false);

  const unreadMessages = contactMessages.filter((m) => m.status === 'new').length;

  const stats: Array<{ label: string; count: number; tab: string; section: PortfolioSectionKey }> = [
    { label: 'Sertifikat', count: adminData.certificates.length, tab: 'certificates', section: 'certificates' },
    { label: 'Pengalaman', count: adminData.experiences.length, tab: 'experiences', section: 'experience' },
    { label: 'Organisasi', count: adminData.organizations.length, tab: 'organizations', section: 'experience' },
    { label: 'Proyek & Karya', count: adminData.projects.length, tab: 'projects', section: 'projects' },
    { label: 'Pelatihan', count: adminData.trainings.length, tab: 'trainings', section: 'certificates' },
    { label: 'Keahlian & Bahasa', count: adminData.skills.length, tab: 'skills', section: 'skills' },
    { label: 'Pesan Masuk Baru', count: unreadMessages, tab: 'messages', section: 'contact' },
    { label: 'Aset Media', count: mediaAssets.length, tab: 'media', section: 'projects' },
  ];

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const count = await seedInitialPortfolioToFirestore();
      showToast('success', `${count} data awal portofolio berhasil disimpan ke Cloud Firestore.`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal menyimpan data awal ke Firestore.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div data-aos="fade-up" className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3.5 border-b-2 border-brutal">
        <div>
          <span className="brutal-badge">Ringkasan CMS</span>
          <h1 className="font-display text-2xl font-extrabold mt-1.5">Dashboard Overview</h1>
        </div>
        <button
          type="button"
          onClick={handleSeed}
          disabled={seeding}
          className="brutal-btn brutal-btn-primary px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-60"
        >
          {seeding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
          <span>
            {seeding
              ? 'Menyinkronkan...'
              : isFirestoreSeeded
              ? 'Muat Ulang Data Awal ke Firestore'
              : 'Simpan Data Awal ke Firestore'}
          </span>
        </button>
      </div>

      {!isFirestoreSeeded && (
        <div data-aos="fade-up" className="brutal-card surface-highlight p-4 space-y-1.5">
          <p className="font-display font-extrabold text-sm sm:text-base">
            Database Firestore Belum Diisi Data Awal
          </p>
          <p className="text-xs sm:text-sm leading-relaxed">
            Saat ini halaman publik menampilkan data bawaan (fallback). Klik tombol{' '}
            <strong>&ldquo;Simpan Data Awal ke Firestore&rdquo;</strong> di atas agar seluruh profil, pengalaman, proyek Dars with Osama, keahlian, dan pelatihan tersimpan permanen di Cloud Firestore dan siap diedit secara langsung.
          </p>
        </div>
      )}

      {/* Google Drive Primary Storage Connection Status & Controls */}
      <GoogleDriveConnectionPanel />

      {/* Metrics Grid — Each Card Follows Its Origin Section Color */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {stats.map((s, idx) => {
          const tone = getSectionCardTone(s.section);
          const countColor = tone.isDark ? 'text-[#D9B44A]' : 'text-[#001F24]';
          const labelColor = tone.isDark ? 'text-[#F8F8E1]' : 'text-[#001F24]';
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => onSelectTab(s.tab)}
              data-aos="fade-up"
              data-aos-delay={getAosStaggerDelay(idx, 100, 4)}
              className={`text-left brutal-card brutal-card-interactive p-4 cursor-pointer ${tone.cardClass} ${tone.frameClass}`}
            >
              <p className={`font-mono-num text-2xl font-extrabold leading-none ${countColor}`}>
                {String(s.count).padStart(2, '0')}
              </p>
              <p className={`font-display font-bold text-xs sm:text-[13px] mt-1.5 ${labelColor}`}>
                {s.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Recent Activity Log */}
      <section data-aos="fade-up" className="brutal-card card-navy frame-navy p-4 sm:p-5">
        <h2 className="font-display text-lg font-extrabold mb-3 text-[#F8F8E1]">Aktivitas Pengelolaan Konten Terbaru</h2>
        {activityLogs.length === 0 ? (
          <p className="text-xs sm:text-sm text-muted">
            Belum ada log aktivitas tercatat di Firestore. Setiap perubahan konten (tambah, ubah, hapus, unggah media) akan muncul di sini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-[#D9B44A]/35 font-mono-num text-[11px] uppercase text-[#D9B44A]">
                  <th className="py-2 pr-3">Aksi</th>
                  <th className="py-2 pr-3">Modul</th>
                  <th className="py-2 pr-3">Item</th>
                  <th className="py-2">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border-subtle)]">
                {activityLogs.slice(0, 12).map((log) => (
                  <tr key={log.id}>
                    <td className="py-2 pr-3">
                      <span className="brutal-badge uppercase">{log.action}</span>
                    </td>
                    <td className="py-2 pr-3 font-semibold">{log.module}</td>
                    <td className="py-2 pr-3">{log.itemTitle}</td>
                    <td className="py-2 text-xs text-muted">{log.actorEmail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
