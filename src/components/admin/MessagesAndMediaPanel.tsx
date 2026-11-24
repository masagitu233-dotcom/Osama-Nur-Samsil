import React, { useState } from 'react';
import { Copy, ExternalLink, FileText, Trash2 } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import {
  deleteManagedItem,
  deleteMediaAsset,
  updateContactMessageStatus,
} from '../../services/portfolioService';
import type { ContactMessageItem, MediaAssetItem } from '../../types/portfolio';
import { formatBytes } from '../../utils/mediaCompression';
import { SafeImage } from '../ui/SafeImage';
import { Modal } from '../ui/Modal';
import { MediaUploader } from './MediaUploader';

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
    <div className="space-y-6">
      <div className="pb-4 border-b-2 border-brutal">
        <span className="brutal-badge">Kotak Masuk Pengunjung</span>
        <h1 className="font-display text-3xl font-extrabold mt-2">Pesan Kontak ({contactMessages.length})</h1>
      </div>

      {contactMessages.length === 0 ? (
        <div className="brutal-card surface-card p-8 text-sm text-muted">
          Belum ada pesan masuk dari formulir kontak publik.
        </div>
      ) : (
        <div className="space-y-4">
          {contactMessages.map((msg) => {
            const isNew = msg.status === 'new';
            return (
              <article
                key={msg.id}
                className={`brutal-card p-6 space-y-3 ${isNew ? 'surface-highlight' : 'surface-card'}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className={isNew ? 'brutal-badge-bordo' : 'brutal-badge-green'}>
                      Status: {msg.status === 'new' ? 'Baru' : msg.status === 'read' ? 'Dibaca' : 'Dibalas'}
                    </span>
                    <h2 className="font-display text-xl font-extrabold mt-2">{msg.subject}</h2>
                    <p className="text-sm font-bold text-muted">
                      {msg.senderName} &middot;{' '}
                      <a href={`mailto:${msg.senderEmail}`} className="underline">
                        {msg.senderEmail}
                      </a>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={msg.status}
                      aria-label={`Ubah status pesan ${msg.subject}`}
                      onChange={(e) => handleStatusChange(msg, e.target.value as ContactMessageItem['status'])}
                      className="brutal-input px-3 py-1.5 text-xs font-bold"
                    >
                      <option value="new">Baru</option>
                      <option value="read">Dibaca</option>
                      <option value="replied">Dibalas</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(msg)}
                      aria-label={`Hapus pesan ${msg.subject}`}
                      className="brutal-btn brutal-btn-bordo p-2 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-muted whitespace-pre-line leading-relaxed pt-2 border-t border-subtle">
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

export const MediaLibraryPanel: React.FC = () => {
  const { mediaAssets, showToast } = usePortfolio();
  const [deleteTarget, setDeleteTarget] = useState<MediaAssetItem | null>(null);

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
      showToast('success', 'File dihapus dari Firebase Storage & pustaka media.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal menghapus aset media.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b-2 border-brutal">
        <span className="brutal-badge">Firebase Storage</span>
        <h1 className="font-display text-3xl font-extrabold mt-2">Pustaka Media &amp; Dokumen</h1>
      </div>

      <div className="brutal-card surface-card p-6">
        <MediaUploader
          folder="media"
          acceptMode="both"
          multiple
          label="Unggah Gambar atau PDF ke Pustaka Media"
          helperText="Tersimpan otomatis di Firebase Storage & Firestore"
          onUploaded={(res) => showToast('success', `${res.fileName} berhasil diunggah.`)}
        />
      </div>

      {mediaAssets.length === 0 ? (
        <div className="brutal-card surface-card p-8 text-sm text-muted">
          Belum ada file yang diunggah ke Firebase Storage. Gunakan area drag-and-drop di atas untuk mengunggah foto profil, sertifikat, dokumentasi kegiatan, atau CV PDF.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {mediaAssets.map((asset) => {
            const isPdf = asset.mimeType === 'application/pdf';
            return (
              <article key={asset.id} className="brutal-card surface-card overflow-hidden flex flex-col">
                <div className="aspect-[4/3] border-b-2 border-brutal overflow-hidden bg-[#8ACCD5]/25">
                  {isPdf ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center surface-highlight">
                      <FileText className="w-9 h-9 mb-2" />
                      <span className="font-mono-num text-xs font-bold">PDF Document</span>
                    </div>
                  ) : (
                    <SafeImage src={asset.fileUrl} alt={asset.fileName} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <p className="font-bold text-sm truncate" title={asset.fileName}>
                      {asset.fileName}
                    </p>
                    <p className="font-mono-num text-xs text-muted mt-0.5">
                      Folder: {asset.folder} &middot; {formatBytes(asset.sizeBytes)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(asset.fileUrl)}
                      className="flex-1 brutal-btn brutal-btn-secondary py-1.5 px-2.5 text-xs font-bold inline-flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin URL</span>
                    </button>
                    <a
                      href={asset.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Buka ${asset.fileName}`}
                      className="brutal-btn brutal-btn-outline p-1.5"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(asset)}
                      aria-label={`Hapus ${asset.fileName}`}
                      className="brutal-btn brutal-btn-bordo p-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
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
          Hapus file <strong>{deleteTarget?.fileName}</strong> secara permanen dari Firebase Storage dan metadata Firestore?
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
