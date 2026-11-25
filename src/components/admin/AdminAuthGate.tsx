import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { BOOTSTRAPPED_ADMIN_EMAIL, FIREBASE_PROJECT_ID, FIRESTORE_DATABASE_ID } from '../../services/firebase';
import type { PublicRoute } from '../../types/portfolio';

interface AdminAuthGateProps {
  onNavigate: (route: PublicRoute) => void;
}

export const AdminAuthGate: React.FC<AdminAuthGateProps> = ({ onNavigate }) => {
  const { user, authReady, adminCheckLoading, authError, loginWithGoogle, logoutAdmin } = usePortfolio();
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="min-h-screen surface-page flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg space-y-4">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-mono-num font-bold hover:bg-[#D9B44A] hover:text-[#001F24] px-2.5 py-1.5 border-2 border-transparent hover:border-[#001F24] cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Kembali ke Halaman Publik</span>
        </button>

        <div data-aos="fade-up" className="brutal-card card-navy frame-navy p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3 pb-4 border-b-2 border-[#D9B44A]/35">
            <div>
              <span className="brutal-badge">Akses Terbatas &middot; CMS Admin</span>
              <h1 className="font-display text-xl sm:text-2xl font-extrabold mt-2 text-[#F8F8E1]">
                Dashboard Admin Portofolio
              </h1>
            </div>
            <div className="w-10 h-10 bg-[#6C151E] text-[#F8F8E1] border-2 border-[#D9B44A] shadow-[2.5px_2.5px_0_0_#001F24] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>

          <p className="text-[13px] sm:text-sm text-muted leading-relaxed">
            Halaman ini dilindungi oleh Firebase Authentication dan verifikasi UID/role administrator di Cloud Firestore. Registrasi admin publik dinonaktifkan demi keamanan data.
          </p>

          {!authReady || adminCheckLoading ? (
            <div className="p-3.5 border-2 border-[#001F24] card-gold text-xs sm:text-sm font-bold text-[#001F24]">
              Memverifikasi sesi autentikasi &amp; hak akses administrator...
            </div>
          ) : (
            <>
              {authError && (
                <div
                  role="alert"
                  className="p-3.5 border-2 border-[#D9B44A] card-bordo text-xs sm:text-sm font-semibold space-y-2"
                >
                  <p>{authError}</p>
                  {user && (
                    <p className="font-mono-num text-xs bg-[#D9B44A] text-[#001F24] p-2 border border-[#001F24] break-all">
                      UID Akun Anda: {user.uid}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2.5">
                {!user ? (
                  <button
                    type="button"
                    onClick={loginWithGoogle}
                    className="brutal-btn-frame-navy font-display font-bold text-xs sm:text-sm px-4 py-2.5 inline-flex items-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" aria-hidden="true" />
                    <span>Masuk dengan Akun Google Admin</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={logoutAdmin}
                    className="brutal-btn-on-dark-outline font-display font-bold text-xs sm:text-sm px-4 py-2.5 inline-flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    <span>Keluar &amp; Ganti Akun ({user.email})</span>
                  </button>
                )}
              </div>
            </>
          )}

          {/* Secure Firebase Console Setup Guide */}
          <div className="pt-3.5 border-t-2 border-subtle">
            <button
              type="button"
              onClick={() => setShowGuide((prev) => !prev)}
              aria-expanded={showGuide}
              className="w-full flex items-center justify-between text-xs font-mono-num font-bold text-[#D9B44A] hover:text-[#F8F8E1] cursor-pointer transition-colors"
            >
              <span>Petunjuk Konfigurasi Admin Awal melalui Firebase Console</span>
              {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showGuide && (
              <ol className="mt-3 space-y-2 text-xs text-muted list-decimal pl-5 leading-relaxed">
                <li>
                  Buka Firebase Console untuk proyek{' '}
                  <code className="font-mono-num font-bold text-[#D9B44A]">{FIREBASE_PROJECT_ID}</code> (Database:{' '}
                  <code className="font-mono-num font-bold text-[#D9B44A]">{FIRESTORE_DATABASE_ID}</code>).
                </li>
                <li>
                  Akun pemilik utama (<code className="font-mono-num font-bold text-[#D9B44A]">{BOOTSTRAPPED_ADMIN_EMAIL}</code>) sudah diotorisasi secara otomatis pada Firestore Security Rules selama email terverifikasi oleh Google Auth.
                </li>
                <li>
                  Untuk menambahkan admin lain secara aman: masuk ke <strong>Authentication &rarr; Users</strong>, salin <strong>User UID</strong>, lalu buat dokumen pada koleksi Firestore{' '}
                  <code className="font-mono-num font-bold text-[#D9B44A]">admins/&lt;UID&gt;</code> dengan field:{' '}
                  <code className="font-mono-num">email</code>, <code className="font-mono-num">displayName</code>,{' '}
                  <code className="font-mono-num">role: &quot;admin&quot;</code>,{' '}
                  <code className="font-mono-num">createdAt</code>, dan <code className="font-mono-num">updatedAt</code>.
                </li>
                <li>
                  Seluruh unggahan foto, sertifikat, dan dokumen kini disimpan langsung ke{' '}
                  <strong>Google Drive</strong> akun pengelola melalui Netlify Functions (tidak memerlukan aktivasi Firebase Storage). Hubungkan akun Google Drive satu kali setelah masuk ke Dashboard Admin.
                </li>
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
