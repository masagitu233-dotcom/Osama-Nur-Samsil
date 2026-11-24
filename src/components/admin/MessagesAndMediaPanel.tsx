import React, { useState } from 'react';
import { Copy, Download, ExternalLink, FileText, Trash2 } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import {
  deleteManagedItem,
  deleteMediaAsset,
  updateContactMessageStatus,
} from '../../services/portfolioService';
import type { DriveUploadCategory } from '../../services/googleDriveUploadService';
import type { ContactMessageItem, MediaAssetItem } from '../../types/portfolio';
import { formatBytes } from '../../utils/mediaCompression';
import { getGoogleDriveDownloadUrl } from '../../utils/googleDriveMedia';
import { SafeImage } from '../ui/SafeImage';
import { Modal } from '../ui/Modal';
import { MediaUploader } from './MediaUploader';
import { GoogleDriveConnectionPanel } from './GoogleDriveConnectionPanel';
import { getAosStaggerDelay } from '../../utils/aos';

export const MessagesPanel: React.FC = () => {
  const { contactMessages, showToast } = usePortfolio();
  const [deleteTarget, setDeleteTarget] = useState<ContactMessageItem | null>(null);

  const handleStatusChange = async (msg: ContactMessageItem, status: ContactMessageItem['status']) => {
    try {
      await updateContactMessageStatus(msg.id, status);
      showToast('success', 'Status pesan diperbarui.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal memperbarui status.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteManagedItem('contactMessages', deleteTarget.id, deleteTarget.subject);
      showToast('success', 'Pesan berhasil dihapus.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal menghapus pesan.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-5">
      <div data-aos="fade-up" className="pb-3.5 border-b-2 border-brutal">
        <span className="brutal-badge">Kotak Masuk Pengunjung</span>
        <h1 className="font-display text-2xl font-extrabold mt-1.5">Pesan Kontak ({contactMessages.length})</h1>
      </div>

      {contactMessages.length === 0 ? (
        <div data-aos="fade-up" className="brutal-card surface-card p-6 text-sm text-muted">
          Belum ada pesan masuk dari formulir kontak publik.
        </div>
      ) : (
        <div className="space-y-3.5">
          {contactMessages.map((msg, idx) => {
            const isNew = msg.status === 'new';
            return (
              <article
                key={msg.id}
                data-aos="fade-up"
                data-aos-delay={getAosStaggerDelay(idx, 60, 2)}
                className={`brutal-card p-4 sm:p-5 space-y-2.5 ${isNew ? 'surface-highlight' : 'surface-card'}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className={isNew ? 'brutal-badge-bordo' : 'brutal-badge-green'}>
                      Status: {msg.status === 'new' ? 'Baru' : msg.status === 'read' ? 'Dibaca' : 'Dibalas'}
                    </span>
                    <h2 className="font-display text-base sm:text-lg font-extrabold mt-1.5">{msg.subject}</h2>
                    <p className="text-xs sm:text-sm font-bold text-muted">
                      {msg.senderName} &middot;{' '}
                      <a href={`mailto:${msg.senderEmail}`} className="underline">
                        {msg.senderEmail}
                      </a>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <select
                      value={msg.status}
                      aria-label={`Ubah status pesan ${msg.subject}`}
                      onChange={(e) => handleStatusChange(msg, e.target.value as ContactMessageItem['status'])}
                      className="brutal-input px-2.5 py-1.5 text-xs font-bold"
                    >
                      <option value="new">Baru</option>
                      <option value="read">Dibaca</option>
                      <option value="replied">Dibalas</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(msg)}
                      aria-label={`Hapus pesan ${msg.subject}`}
                      className="brutal-btn brutal-btn-bordo p-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-[13px] sm:text-sm text-muted whitespace-pre-line leading-relaxed pt-2 border-t border-subtle">
                  {msg.message}
                </p>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Konfirmasi Hapus Pesan"
        maxWidthClass="max-w-md"
      >
        <p className="text-sm mb-6">
          Yakin ingin menghapus pesan dari <strong>{deleteTarget?.senderName}</strong> ({deleteTarget?.subject})? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="brutal-btn brutal-btn-outline px-4 py-2 text-xs font-bold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            className="brutal-btn brutal-btn-bordo px-4 py-2 text-xs font-bold cursor-pointer"
          >
            Hapus Permanen
          </button>
        </div>
      </Modal>
    </div>
  );
};

const MEDIA_LIBRARY_FOLDER_OPTIONS: Array<{ value: DriveUploadCategory; label: string }> = [
  { value: 'media', label: 'File Lainnya' },
  { value: 'profile', label: 'Foto Profil' },
  { value: 'experiences', label: 'Pengalaman' },
  { value: 'education', label: 'Pendidikan' },
  { value: 'certificates', label: 'Sertifikat' },
  { value: 'documents', label: 'Dokumen' },
  { value: 'projects', label: 'Proyek dan Karya' },
];

export const MediaLibraryPanel: React.FC = () => {
  const { mediaAssets, showToast } = usePortfolio();
  const [deleteTarget, setDeleteTarget] = useState<MediaAssetItem | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<DriveUploadCategory>('media');

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast('success', 'URL media disalin ke clipboard.');
    } catch {
      showToast('info', url);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMediaAsset(deleteTarget);
      showToast('success', 'File dihapus dari penyimpanan & pustaka media Firestore.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal menghapus aset media.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div data-aos="fade-up" className="pb-3.5 border-b-2 border-brutal">
        <span className="brutal-badge">Google Drive Storage</span>
        <h1 className="font-display text-2xl font-extrabold mt-1.5">Pustaka Media &amp; Dokumen</h1>
      </div>

      <GoogleDriveConnectionPanel compact />

      <div data-aos="fade-up" data-aos-delay={60} className="brutal-card surface-card p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-subtle">
          <label htmlFor="media-folder-select" className="text-xs font-bold uppercase tracking-wider">
            Folder Tujuan Google Drive (Portfolio Website)
          </label>
          <select
            id="media-folder-select"
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value as DriveUploadCategory)}
            className="brutal-input px-3 py-1.5 text-xs font-bold sm:w-60"
          >
            {MEDIA_LIBRARY_FOLDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Portfolio Website / {opt.label}
              </option>
            ))}
          </select>
        </div>

        <MediaUploader
          folder={selectedFolder}
          acceptMode="both"
          multiple
          label="Unggah Gambar atau PDF ke Google Drive"
          helperText="Tersimpan otomatis ke folder Google Drive terpilih & dicatat di Firestore"
          onUploaded={(res) => showToast('success', `${res.fileName} berhasil disimpan.`)}
        />
      </div>

      {mediaAssets.length === 0 ? (
        <div data-aos="fade-up" className="brutal-card surface-card p-6 text-sm text-muted">
          Belum ada file yang tercatat pada Pustaka Media. Hubungkan akun Google Drive Anda di atas, lalu gunakan area unggah manual atau drag-and-drop untuk menyimpan foto profil, sertifikat, dokumentasi kegiatan, atau CV PDF.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mediaAssets.map((asset, idx) => {
            const isPdf = asset.mimeType === 'application/pdf';
            const downloadHref = asset.downloadUrl || getGoogleDriveDownloadUrl(asset.fileUrl);
            return (
              <article
                key={asset.id}
                data-aos="fade-up"
                data-aos-delay={getAosStaggerDelay(idx, 60, 4)}
                className="brutal-card surface-card overflow-hidden flex flex-col"
              >
                <div className="aspect-[16/10] border-b-2 border-brutal overflow-hidden bg-[#8ACCD5]/25 relative">
                  {isPdf ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center surface-highlight">
                      <FileText className="w-8 h-8 mb-1.5" />
                      <span className="font-mono-num text-[11px] font-bold">PDF Document</span>
                    </div>
                  ) : (
                    <SafeImage src={asset.fileUrl} alt={asset.fileName} className="w-full h-full object-cover" />
                  )}
                  {asset.visibility && (
                    <span
                      className={`absolute top-2 left-2 px-1.5 py-0.5 font-mono-num text-[10px] font-extrabold uppercase border border-[#013A42] ${
                        asset.visibility === 'private'
                          ? 'bg-[#6C151E] text-[#F8F8E1]'
                          : 'bg-[#0F3D3A] text-[#F8F8E1]'
                      }`}
                    >
                      {asset.visibility === 'private' ? 'Privat' : 'Publik'}
                    </span>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between gap-2.5">
                  <div>
                    <p className="font-bold text-xs sm:text-[13px] truncate" title={asset.fileName}>
                      {asset.fileName}
                    </p>
                    <p className="font-mono-num text-[11px] text-muted mt-0.5">
                      Folder: {asset.driveFolderName || asset.folder} &middot; {formatBytes(asset.sizeBytes)}
                    </p>
                    {asset.driveFileId && (
                      <p className="font-mono-num text-[10px] text-muted truncate mt-0.5" title={asset.driveFileId}>
                        Drive ID: {asset.driveFileId}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopy(asset.fileUrl)}
                      className="flex-1 brutal-btn brutal-btn-secondary py-1.5 px-2 text-[11px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Salin URL</span>
                    </button>
                    {downloadHref && (
                      <a
                        href={downloadHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={asset.fileName}
                        aria-label={`Unduh ${asset.fileName}`}
                        className="brutal-btn brutal-btn-outline p-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <a
                      href={asset.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Buka ${asset.fileName}`}
                      className="brutal-btn brutal-btn-outline p-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(asset)}
                      aria-label={`Hapus ${asset.fileName}`}
                      className="brutal-btn brutal-btn-bordo p-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Aset Media"
        maxWidthClass="max-w-md"
      >
        <p className="text-sm mb-6">
          Hapus file <strong>{deleteTarget?.fileName}</strong> secara permanen dari{' '}
          {deleteTarget?.driveFileId ? 'Google Drive' : 'penyimpanan'} dan metadata Firestore?
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="brutal-btn brutal-btn-outline px-4 py-2 text-xs font-bold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            className="brutal-btn brutal-btn-bordo px-4 py-2 text-xs font-bold cursor-pointer"
          >
            Hapus File
          </button>
        </div>
      </Modal>
    </div>
  );
};
