import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  CloudOff,
  ExternalLink,
  FolderOpen,
  Link2,
  RefreshCw,
  ShieldAlert,
  Unlink,
} from 'lucide-react';
import {
  disconnectGoogleDrive,
  fetchGoogleDriveStatus,
  startGoogleDriveOAuth,
  type DriveConnectionStatus,
} from '../../services/googleDriveUploadService';
import { usePortfolio } from '../../context/PortfolioContext';
import { Modal } from '../ui/Modal';

interface GoogleDriveConnectionPanelProps {
  compact?: boolean;
}

const EXPECTED_SUBFOLDERS = [
  'Foto Profil',
  'Pengalaman',
  'Pendidikan',
  'Sertifikat',
  'Dokumen',
  'Proyek dan Karya',
  'File Lainnya',
];

export const GoogleDriveConnectionPanel: React.FC<GoogleDriveConnectionPanelProps> = ({
  compact = false,
}) => {
  const { showToast } = usePortfolio();
  const [statusData, setStatusData] = useState<DriveConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [confirmDisconnectOpen, setConfirmDisconnectOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchGoogleDriveStatus();
      setStatusData(data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memeriksa status Google Drive.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Listen for OAuth completion message from the callback window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const payload = event.data as { type?: string; ok?: boolean; message?: string } | null;
      if (!payload || payload.type !== 'GDRIVE_OAUTH_RESULT') return;

      setConnecting(false);
      if (payload.ok) {
        showToast('success', payload.message || 'Akun Google Drive berhasil terhubung.');
        loadStatus();
      } else {
        const msg = payload.message || 'Koneksi Google Drive gagal atau dibatalkan.';
        setErrorMsg(msg);
        showToast('error', msg);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [loadStatus, showToast]);

  const handleConnect = async () => {
    setConnecting(true);
    setErrorMsg(null);
    try {
      const { authUrl } = await startGoogleDriveOAuth();
      const popup = window.open(
        authUrl,
        'gdrive_oauth_connect',
        'width=580,height=700,noopener=false'
      );
      if (!popup) {
        // Fallback to full-window redirect if popup is blocked by browser settings
        window.location.assign(authUrl);
        return;
      }

      // Reset connecting indicator if the user manually closes the popup without completing OAuth
      const pollTimer = window.setInterval(() => {
        if (popup.closed) {
          window.clearInterval(pollTimer);
          setConnecting(false);
          loadStatus();
        }
      }, 800);
    } catch (err) {
      setConnecting(false);
      const msg = err instanceof Error ? err.message : 'Gagal memulai koneksi Google Drive.';
      setErrorMsg(msg);
      showToast('error', msg);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setErrorMsg(null);
    try {
      await disconnectGoogleDrive();
      setConfirmDisconnectOpen(false);
      showToast('info', 'Koneksi Google Drive telah dicabut dan token terenkripsi dihapus.');
      await loadStatus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mencabut koneksi Google Drive.';
      setErrorMsg(msg);
      showToast('error', msg);
    } finally {
      setDisconnecting(false);
    }
  };

  const status = statusData?.status;
  const isConnected = status === 'connected';
  const needsReconnect = status === 'reconnect_required';
  const notConfigured = status === 'not_configured' || status === 'backend_unavailable';

  const isDarkCard = isConnected || needsReconnect;

  const accentTextClass = isDarkCard ? 'text-[#D9B44A]' : 'text-[#001F24]';

  const badgeClass = isConnected
    ? 'brutal-badge'
    : needsReconnect
    ? 'brutal-badge'
    : 'brutal-badge-navy';

  const statusLabel = loading
    ? 'Memeriksa koneksi...'
    : isConnected
    ? 'Terhubung'
    : needsReconnect
    ? 'Perlu Menghubungkan Ulang'
    : status === 'not_connected'
    ? 'Belum Terhubung'
    : status === 'not_configured'
    ? 'Perlu Konfigurasi Netlify'
    : 'Netlify Functions Tidak Aktif di Preview Lokal';

  return (
    <section
      aria-label="Koneksi Penyimpanan Google Drive"
      data-aos="fade-up"
      className={`brutal-card ${
        isConnected
          ? 'card-green frame-green'
          : needsReconnect
          ? 'card-bordo frame-bordo'
          : 'card-gold frame-gold'
      } ${compact ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5'} space-y-3`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={badgeClass}>{statusLabel}</span>
            <span className={`font-mono-num text-[11px] font-bold uppercase ${accentTextClass}`}>
              Google Drive API v3 &middot; Penyimpanan Utama
            </span>
          </div>
          <h2 className="font-display text-base sm:text-lg font-extrabold flex items-center gap-2">
            {isConnected ? (
              <CheckCircle2 className="w-4 h-4 text-[#D9B44A] shrink-0" aria-hidden="true" />
            ) : needsReconnect ? (
              <ShieldAlert className="w-4 h-4 text-[#D9B44A] shrink-0" aria-hidden="true" />
            ) : notConfigured ? (
              <AlertTriangle className="w-4 h-4 text-[#001F24] shrink-0" aria-hidden="true" />
            ) : (
              <CloudOff className="w-4 h-4 text-[#001F24] shrink-0" aria-hidden="true" />
            )}
            <span>Integrasi Google Drive Pengelola</span>
          </h2>
          <p className="text-xs sm:text-[13px] text-muted leading-relaxed">
            {loading
              ? 'Memeriksa status token offline terenkripsi di server Netlify...'
              : statusData?.message ||
                'Hubungkan satu kali akun Google Drive pemilik website agar seluruh unggahan foto, sertifikat, dan dokumen tersimpan otomatis ke Google Drive.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadStatus}
            disabled={loading}
            aria-label="Periksa ulang status koneksi Google Drive"
            className={`${
              isDarkCard ? 'brutal-btn-on-dark-outline' : 'brutal-btn brutal-btn-outline'
            } p-2 text-xs font-bold cursor-pointer disabled:opacity-50`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {!notConfigured && (
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting || loading}
              className={`${
                isConnected
                  ? 'brutal-btn-frame-green'
                  : needsReconnect
                  ? 'brutal-btn-frame-bordo'
                  : 'brutal-btn-frame-gold'
              } px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60`}
            >
              {connecting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Link2 className="w-3.5 h-3.5" />
              )}
              <span>
                {connecting
                  ? 'Menghubungkan...'
                  : isConnected || needsReconnect
                  ? 'Hubungkan Ulang'
                  : 'Hubungkan Google Drive'}
              </span>
            </button>
          )}

          {(isConnected || needsReconnect) && (
            <button
              type="button"
              onClick={() => setConfirmDisconnectOpen(true)}
              disabled={disconnecting}
              className={`${
                needsReconnect ? 'brutal-btn-on-dark-outline' : 'brutal-btn-frame-bordo'
              } px-3 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60`}
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>Cabut Koneksi</span>
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="p-3 border-2 border-[#D9B44A] bg-[#6C151E] text-[#F8F8E1] text-xs font-bold"
        >
          {errorMsg}
        </div>
      )}

      {!loading && statusData && (
        <div className="pt-2.5 border-t-2 border-subtle grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <p className={`font-mono-num uppercase font-bold ${accentTextClass}`}>
              Akun Pemilik yang Diizinkan
            </p>
            <p className="font-mono-num font-bold break-all">
              {statusData.connectedEmail || statusData.expectedOwnerEmail}
            </p>
            {statusData.connectedAt && (
              <p className="text-muted">
                Terhubung sejak:{' '}
                <span className="font-mono-num font-semibold">
                  {new Date(statusData.connectedAt).toLocaleString('id-ID')}
                </span>
              </p>
            )}
          </div>

          <div className="space-y-1">
            <p className={`font-mono-num uppercase font-bold ${accentTextClass}`}>
              Folder Utama &amp; Struktur Otomatis
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 font-bold">
                <FolderOpen className="w-3.5 h-3.5" aria-hidden="true" />
                Portfolio Website
              </span>
              {statusData.rootFolderUrl && (
                <a
                  href={statusData.rootFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 font-bold underline ${accentTextClass} hover:opacity-80`}
                >
                  <span>Buka di Drive</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            {!compact && (
              <div className="flex flex-wrap gap-1 pt-1">
                {EXPECTED_SUBFOLDERS.map((folderName) => {
                  const hasId = Boolean(statusData.folders?.[folderName]);
                  return (
                    <span
                      key={folderName}
                      className={`px-1.5 py-0.5 font-mono-num text-[10px] font-bold border border-[#001F24] ${
                        hasId ? 'bg-[#0F3D3A] text-[#F8F8E1]' : 'bg-[#F8F8E1] text-[#1B2A3D]'
                      }`}
                    >
                      {folderName}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && statusData && (statusData.missingConfig.length > 0 || status === 'backend_unavailable') && (
        <div className="p-3 border-2 border-[#001F24] bg-[#F8F8E1] text-[#1B2A3D] space-y-1 text-xs">
          <p className="font-bold flex items-center gap-1.5 text-[#1B2A3D]">
            <Cloud className="w-4 h-4 shrink-0" />
            <span>Catatan Konfigurasi Deployment Netlify:</span>
          </p>
          {statusData.missingConfig.length > 0 && (
            <p className="text-[#1B2A3D]">
              Environment variable belum diisi:{' '}
              <code className="font-mono-num font-bold">{statusData.missingConfig.join(', ')}</code>
            </p>
          )}
          <p className="break-all text-[#1B2A3D]">
            Redirect URI OAuth:{' '}
            <code className="font-mono-num font-bold">{statusData.redirectUri}</code>
          </p>
          <p className="text-[#1B2A3D]">
            Sementara itu, opsi <strong>&ldquo;Masukkan Tautan Google Drive&rdquo;</strong> tetap dapat digunakan langsung di seluruh kolom gambar.
          </p>
        </div>
      )}

      <Modal
        open={confirmDisconnectOpen}
        onClose={() => setConfirmDisconnectOpen(false)}
        title="Cabut Koneksi Google Drive"
        maxWidthClass="max-w-md"
      >
        <p className="text-sm mb-6 leading-relaxed">
          Mencabut koneksi akan menghapus refresh token terenkripsi dari server Netlify dan mencabut izin OAuth. File yang sudah ada di Google Drive maupun tautan di Firestore <strong>tidak akan dihapus</strong>, tetapi unggahan baru tidak dapat dilakukan sampai Anda menghubungkan ulang.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setConfirmDisconnectOpen(false)}
            className="brutal-btn-on-dark-outline px-4 py-2 text-xs font-bold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={disconnecting}
            onClick={handleDisconnect}
            className="brutal-btn-frame-bordo px-4 py-2 text-xs font-bold cursor-pointer disabled:opacity-60"
          >
            {disconnecting ? 'Mencabut...' : 'Ya, Cabut Koneksi'}
          </button>
        </div>
      </Modal>
    </section>
  );
};
