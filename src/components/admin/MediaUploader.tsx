import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  FileText,
  FolderOpen,
  Globe,
  Link2,
  Lock,
  RefreshCw,
  Trash2,
  UploadCloud,
  XCircle,
} from 'lucide-react';
import { uploadMediaFile } from '../../services/portfolioService';
import {
  DRIVE_FOLDER_LABELS,
  type DriveFileVisibility,
  type DriveUploadCategory,
} from '../../services/googleDriveUploadService';
import { validateUploadFile } from '../../utils/portfolioLogic';
import { formatBytes } from '../../utils/mediaCompression';
import {
  buildCanonicalGoogleDriveViewUrl,
  extractGoogleDriveInfo,
  getGoogleDriveImageCandidates,
} from '../../utils/googleDriveMedia';
import {
  createUploadProgressSnapshot,
  UPLOAD_STAGE_LABELS,
  type UploadProgressSnapshot,
} from '../../utils/uploadStateMachine';
import { SafeImage } from '../ui/SafeImage';

export interface MediaUploadResult {
  fileUrl: string;
  fileName: string;
  fileType: 'image' | 'pdf';
  driveFileId?: string;
  downloadUrl?: string;
  visibility?: DriveFileVisibility;
}

interface MediaUploaderProps {
  folder: DriveUploadCategory;
  acceptMode: 'image' | 'pdf' | 'both';
  multiple?: boolean;
  label: string;
  helperText?: string;
  currentUrls?: string[];
  defaultVisibility?: DriveFileVisibility;
  allowDriveLink?: boolean;
  hideAttachedList?: boolean;
  onUploaded: (result: MediaUploadResult) => void;
  onRemoveUrl?: (url: string) => void;
}

interface PendingPreview {
  file: File;
  previewUrl: string | null;
  fileType: 'image' | 'pdf';
}

function probeImageUrl(url: string, timeoutMs = 8000): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.referrerPolicy = 'no-referrer';
    let settled = false;

    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
      resolve(ok);
    };

    const timer = window.setTimeout(() => finish(false), timeoutMs);
    img.onload = () => finish(img.naturalWidth > 0);
    img.onerror = () => finish(false);
    img.src = url;
  });
}

async function validateGoogleDriveImageReadable(rawUrl: string): Promise<boolean> {
  const candidates = getGoogleDriveImageCandidates(rawUrl, 800);
  // Test the direct Drive image endpoints (skip Netlify proxy during client-only probe if direct succeeds)
  for (const candidate of candidates.slice(0, 3)) {
    const ok = await probeImageUrl(candidate);
    if (ok) return true;
  }
  return false;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  folder,
  acceptMode,
  multiple = false,
  label,
  helperText,
  currentUrls = [],
  defaultVisibility = 'public',
  allowDriveLink,
  hideAttachedList = false,
  onUploaded,
  onRemoveUrl,
}) => {
  const showDriveLinkOption = allowDriveLink ?? (acceptMode === 'image' || acceptMode === 'both');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [inputMode, setInputMode] = useState<'upload' | 'drive_link'>('upload');
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState<PendingPreview[]>([]);
  const [visibility, setVisibility] = useState<DriveFileVisibility>(defaultVisibility);
  const [uploadState, setUploadState] = useState<UploadProgressSnapshot>(() =>
    createUploadProgressSnapshot('idle', 0, 0)
  );
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  // Google Drive manual link state
  const [driveLinkInput, setDriveLinkInput] = useState('');
  const [driveLinkFileType, setDriveLinkFileType] = useState<'image' | 'pdf'>(
    acceptMode === 'pdf' ? 'pdf' : 'image'
  );
  const [validatingLink, setValidatingLink] = useState(false);

  useEffect(() => {
    setVisibility(defaultVisibility);
  }, [defaultVisibility]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const isBusy =
    uploadState.stage === 'initiating' ||
    uploadState.stage === 'uploading' ||
    uploadState.stage === 'finalizing';

  const acceptAttr =
    acceptMode === 'image'
      ? 'image/jpeg,image/png,image/webp'
      : acceptMode === 'pdf'
      ? 'application/pdf'
      : 'image/jpeg,image/png,image/webp,application/pdf';

  const targetFolderLabel = DRIVE_FOLDER_LABELS[folder] || 'File Lainnya';

  const handleFiles = (files: FileList | null) => {
    if (isBusy || !files || files.length === 0) return;
    setError(null);
    setSuccessNote(null);
    setUploadState(createUploadProgressSnapshot('idle', 0, 0));

    const list = multiple ? Array.from(files) : [files[0]];
    const nextPending: PendingPreview[] = [];

    for (const file of list) {
      const check = validateUploadFile(file, acceptMode);
      if (!check.valid) {
        setError(check.error || 'File tidak valid.');
        return;
      }
      const fileType = check.fileType || 'image';
      const previewUrl = fileType === 'image' ? URL.createObjectURL(file) : null;
      nextPending.push({ file, previewUrl, fileType });
    }

    setPending((prev) => {
      if (multiple) {
        return [...prev, ...nextPending];
      }
      prev.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
      return nextPending;
    });

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const removePendingAt = (indexToRemove: number) => {
    if (isBusy) return;
    setPending((prev) => {
      const target = prev[indexToRemove];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  const handleUploadConfirm = async () => {
    if (isBusy || pending.length === 0) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setError(null);
    setSuccessNote(null);
    setActiveFileIndex(0);

    try {
      const totalAllBytes = pending.reduce((sum, item) => sum + item.file.size, 0);
      let completedBytes = 0;

      for (let i = 0; i < pending.length; i++) {
        setActiveFileIndex(i);
        const item = pending[i];

        const uploaded = await uploadMediaFile(item.file, folder, {
          visibility,
          signal: controller.signal,
          onProgress: (snap) => {
            if (pending.length === 1) {
              setUploadState(snap);
            } else {
              const aggregateLoaded =
                snap.stage === 'success'
                  ? completedBytes + item.file.size
                  : completedBytes + snap.loadedBytes;
              const isLastFile = i === pending.length - 1;
              const stage = snap.stage === 'success' && !isLastFile ? 'uploading' : snap.stage;
              setUploadState(
                createUploadProgressSnapshot(stage, aggregateLoaded, totalAllBytes, {
                  transportMode: snap.transportMode,
                  customMessage: `${UPLOAD_STAGE_LABELS[stage]} (${i + 1}/${pending.length})`,
                })
              );
            }
          },
        });

        completedBytes += item.file.size;
        onUploaded({
          fileUrl: uploaded.fileUrl,
          fileName: uploaded.fileName,
          fileType: item.fileType,
          driveFileId: uploaded.driveFileId,
          downloadUrl: uploaded.downloadUrl,
          visibility,
        });
      }

      setUploadState(createUploadProgressSnapshot('success', totalAllBytes, totalAllBytes));
      setSuccessNote(
        `${pending.length} file berhasil disimpan ke Google Drive (Portfolio Website / ${targetFolderLabel}).`
      );
      pending.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
      setPending([]);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Gagal mengunggah file ke Google Drive.';

      if (controller.signal.aborted || msg.toLowerCase().includes('dibatalkan')) {
        setUploadState(createUploadProgressSnapshot('cancelled', 0, 0));
        setError('Unggahan dibatalkan. Anda dapat mencoba lagi kapan saja.');
      } else {
        setUploadState(createUploadProgressSnapshot('error', 0, 0, { customMessage: 'Gagal' }));
        setError(msg);
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCancelUpload = () => {
    abortControllerRef.current?.abort();
  };

  const clearPending = () => {
    if (isBusy) return;
    pending.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
    setPending([]);
    setError(null);
    setSuccessNote(null);
    setUploadState(createUploadProgressSnapshot('idle', 0, 0));
  };

  const handleAttachDriveLink = async () => {
    const raw = driveLinkInput.trim();
    if (!raw) {
      setError('Masukkan tautan Google Drive terlebih dahulu.');
      return;
    }

    setError(null);
    setSuccessNote(null);

    const info = extractGoogleDriveInfo(raw);
    if (!info) {
      setError(
        'Tautan tidak dikenali sebagai tautan Google Drive. Gunakan format /file/d/ID/view, /open?id=ID, atau /uc?id=ID.'
      );
      return;
    }

    const effectiveType: 'image' | 'pdf' =
      acceptMode === 'image' ? 'image' : acceptMode === 'pdf' ? 'pdf' : driveLinkFileType;

    if (effectiveType === 'image') {
      setValidatingLink(true);
      const readable = await validateGoogleDriveImageReadable(raw);
      setValidatingLink(false);

      if (!readable) {
        setError(
          'Tautan Google Drive tidak dapat dimuat sebagai gambar. Pastikan file berupa gambar (JPG/PNG/WebP) dan izin berbagi diatur ke "Siapa saja yang memiliki link".'
        );
        return;
      }
    }

    const canonicalUrl = buildCanonicalGoogleDriveViewUrl(info.fileId, info.resourceKey);
    onUploaded({
      fileUrl: canonicalUrl,
      fileName: `gdrive_${info.fileId.slice(0, 12)}${effectiveType === 'pdf' ? '.pdf' : '.jpg'}`,
      fileType: effectiveType,
      driveFileId: info.fileId,
    });

    setDriveLinkInput('');
    setSuccessNote(
      `Tautan Google Drive tervalidasi (ID: ${info.fileId.slice(0, 12)}…) dan berhasil ditambahkan.`
    );
  };

  const detectedPreviewInfo = extractGoogleDriveInfo(driveLinkInput);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-bold uppercase tracking-wider">{label}</label>
        <span className="inline-flex items-center gap-1 font-mono-num text-[11px] font-bold text-muted">
          <FolderOpen className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Drive: Portfolio Website / {targetFolderLabel}</span>
        </span>
      </div>
      {helperText && <p className="text-xs text-muted -mt-1.5">{helperText}</p>}

      {/* Mode Switcher: Upload to Google Drive vs Google Drive Link */}
      {showDriveLinkOption && (
        <div role="tablist" aria-label={`Metode input ${label}`} className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === 'upload'}
            disabled={isBusy}
            onClick={() => {
              setInputMode('upload');
              setError(null);
            }}
            className={`px-3 py-1.5 text-xs font-bold border-2 border-[#013A42] inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              inputMode === 'upload'
                ? 'bg-[#013A42] text-[#F8F8E1]'
                : 'bg-[#F8F8E1] text-[#013A42] hover:bg-[#8ACCD5]'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Unggah / Drag &amp; Drop</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === 'drive_link'}
            disabled={isBusy}
            onClick={() => {
              setInputMode('drive_link');
              setError(null);
            }}
            className={`px-3 py-1.5 text-xs font-bold border-2 border-[#013A42] inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              inputMode === 'drive_link'
                ? 'bg-[#013A42] text-[#F8F8E1]'
                : 'bg-[#F8F8E1] text-[#013A42] hover:bg-[#8ACCD5]'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Tautan Google Drive</span>
          </button>
        </div>
      )}

      {/* TAB 1: MANUAL UPLOAD & DRAG-AND-DROP TO GOOGLE DRIVE */}
      {inputMode === 'upload' && (
        <div className="space-y-3">
          {/* Drag-and-drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (!isBusy) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (!isBusy) handleFiles(e.dataTransfer.files);
            }}
            className={`border-2 border-dashed p-3.5 text-center transition-colors ${
              dragging
                ? 'border-[#013A42] surface-highlight'
                : 'border-brutal surface-card'
            } ${isBusy ? 'opacity-60 pointer-events-none' : ''}`}
          >
            <input
              ref={inputRef}
              type="file"
              accept={acceptAttr}
              multiple={multiple}
              disabled={isBusy}
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            <UploadCloud className="w-6 h-6 mx-auto mb-1.5" aria-hidden="true" />
            <p className="text-xs sm:text-[13px] font-bold">
              Seret &amp; lepas file di sini, atau{' '}
              <button
                type="button"
                disabled={isBusy}
                onClick={() => inputRef.current?.click()}
                className="underline decoration-2 underline-offset-2 cursor-pointer"
              >
                pilih dari perangkat
              </button>
            </p>
            <p className="text-[11px] text-muted mt-1">
              {acceptMode === 'pdf'
                ? 'Format PDF (maks. 10 MB) — tersimpan langsung ke Google Drive'
                : acceptMode === 'image'
                ? 'Format JPG, PNG, WebP (maks. 5 MB) — tersimpan langsung ke Google Drive'
                : 'Format JPG, PNG, WebP (maks. 5 MB) atau PDF (maks. 10 MB) — ke Google Drive'}
            </p>
          </div>

          {/* Visibility Access Selector (Public vs Private) */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-2 border-subtle bg-[#F8F8E1] text-xs">
            <span className="font-bold flex items-center gap-1.5">
              {visibility === 'public' ? (
                <Globe className="w-3.5 h-3.5 text-[#0F3D3A]" aria-hidden="true" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-[#6C151E]" aria-hidden="true" />
              )}
              <span>Akses File di Google Drive:</span>
            </span>
            <select
              value={visibility}
              disabled={isBusy}
              aria-label={`Akses file Google Drive untuk ${label}`}
              onChange={(e) => setVisibility(e.target.value as DriveFileVisibility)}
              className="brutal-input px-2.5 py-1 text-xs font-bold"
            >
              <option value="public">Publik (Baca saja — Tampil di Website)</option>
              <option value="private">Privat (Hanya Pemilik Google Drive)</option>
            </select>
          </div>

          {/* Local Preview + Real Progress Panel BEFORE / DURING Upload */}
          {pending.length > 0 && (
            <div className="border-2 border-brutal surface-card p-3 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="brutal-badge">
                  Siap Unggah ({pending.length} file) &middot; {UPLOAD_STAGE_LABELS[uploadState.stage]}
                </span>
                {uploadState.transportMode === 'chunked_fallback' && isBusy && (
                  <span className="font-mono-num text-[11px] font-bold text-[#0F3D3A]">
                    Mode Chunk Aman Aktif
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {pending.map((item, idx) => (
                  <div
                    key={`${item.file.name}-${idx}`}
                    className={`flex items-center gap-2.5 p-1.5 border-2 ${
                      isBusy && idx === activeFileIndex
                        ? 'border-[#013A42] bg-[#8ACCD5]/25'
                        : 'border-subtle'
                    }`}
                  >
                    {item.previewUrl ? (
                      <img
                        src={item.previewUrl}
                        alt={item.file.name}
                        className="w-12 h-12 object-contain bg-[#F8F8E1] border-2 border-brutal shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-[#013A42] text-[#F8F8E1] border-2 border-brutal flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 text-xs">
                      <p className="font-bold truncate">{item.file.name}</p>
                      <p className="font-mono-num text-muted">{formatBytes(item.file.size)}</p>
                    </div>
                    {!isBusy && (
                      <button
                        type="button"
                        onClick={() => removePendingAt(idx)}
                        aria-label={`Hapus ${item.file.name} dari antrean unggah`}
                        className="p-1 text-[#6C151E] hover:bg-[#8ACCD5]/40 border border-transparent hover:border-[#013A42] cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Real Transfer Progress Bar */}
              {(isBusy || uploadState.stage === 'error' || uploadState.stage === 'cancelled') && (
                <div className="space-y-1.5" aria-live="polite">
                  <div className="h-3.5 border-2 border-[#013A42] bg-[#F8F8E1] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-150 ${
                        uploadState.stage === 'error'
                          ? 'bg-[#6C151E]'
                          : uploadState.stage === 'initiating'
                          ? 'bg-[#8ACCD5]/60 animate-pulse w-1/4'
                          : 'bg-[#0F3D3A]'
                      }`}
                      style={
                        uploadState.stage === 'initiating'
                          ? undefined
                          : { width: `${uploadState.percent}%` }
                      }
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono-num text-xs font-bold">
                    <span>{uploadState.message}</span>
                    {uploadState.stage === 'uploading' && uploadState.totalBytes > 0 ? (
                      <span>
                        {formatBytes(uploadState.loadedBytes)} / {formatBytes(uploadState.totalBytes)} ({uploadState.percent}%)
                      </span>
                    ) : uploadState.stage === 'finalizing' ? (
                      <span>99% &middot; Konfirmasi Google Drive</span>
                    ) : uploadState.stage === 'initiating' ? (
                      <span>Menyiapkan sesi...</span>
                    ) : null}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={handleUploadConfirm}
                  className="brutal-btn brutal-btn-primary px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isBusy ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UploadCloud className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isBusy
                      ? uploadState.message
                      : uploadState.stage === 'error' || uploadState.stage === 'cancelled'
                      ? 'Coba Lagi Unggah ke Google Drive'
                      : 'Unggah ke Google Drive'}
                  </span>
                </button>

                {isBusy ? (
                  <button
                    type="button"
                    onClick={handleCancelUpload}
                    className="brutal-btn brutal-btn-bordo px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Batalkan Unggahan</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={clearPending}
                    className="brutal-btn brutal-btn-outline px-4 py-2 text-xs font-bold cursor-pointer"
                  >
                    Hapus Pilihan
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PASTE & VALIDATE GOOGLE DRIVE LINK */}
      {inputMode === 'drive_link' && showDriveLinkOption && (
        <div className="border-2 border-brutal surface-card p-4 space-y-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase">
              Tempel Tautan Google Drive
            </label>
            <input
              type="url"
              value={driveLinkInput}
              onChange={(e) => {
                setDriveLinkInput(e.target.value);
                setError(null);
              }}
              placeholder="https://drive.google.com/file/d/.../view?usp=drive_link"
              className="w-full brutal-input px-3 py-2 text-xs"
            />
            <p className="text-[11px] text-muted">
              Mendukung format <code className="font-mono-num">/file/d/ID/view</code>,{' '}
              <code className="font-mono-num">/open?id=ID</code>,{' '}
              <code className="font-mono-num">/uc?id=ID</code>, dan parameter{' '}
              <code className="font-mono-num">resourcekey</code>.
            </p>
          </div>

          {acceptMode === 'both' && (
            <div className="flex items-center gap-3 text-xs">
              <span className="font-bold">Jenis File Tautan:</span>
              <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold">
                <input
                  type="radio"
                  name={`drive-link-type-${label}`}
                  checked={driveLinkFileType === 'image'}
                  onChange={() => setDriveLinkFileType('image')}
                  className="accent-[#013A42]"
                />
                <span>Gambar</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold">
                <input
                  type="radio"
                  name={`drive-link-type-${label}`}
                  checked={driveLinkFileType === 'pdf'}
                  onChange={() => setDriveLinkFileType('pdf')}
                  className="accent-[#013A42]"
                />
                <span>Dokumen PDF</span>
              </label>
            </div>
          )}

          {detectedPreviewInfo && (
            <p className="text-[11px] font-mono-num font-bold text-[#0F3D3A]">
              ID Google Drive terdeteksi: {detectedPreviewInfo.fileId}
              {detectedPreviewInfo.resourceKey ? ` · resourcekey terdeteksi` : ''}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={validatingLink || !driveLinkInput.trim()}
              onClick={handleAttachDriveLink}
              className="brutal-btn brutal-btn-primary px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {validatingLink ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Link2 className="w-3.5 h-3.5" />
              )}
              <span>
                {validatingLink ? 'Memvalidasi Gambar...' : 'Validasi & Gunakan Tautan'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Error & Success Feedback */}
      {error && (
        <p
          role="alert"
          className="block px-3 py-2 text-xs font-bold bg-[#6C151E] text-[#F8F8E1] border-2 border-[#013A42]"
        >
          {error}
        </p>
      )}

      {successNote && (
        <p
          role="status"
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-[#0F3D3A] text-[#F8F8E1] border-2 border-[#013A42]"
        >
          <CheckCircle2 className="w-4 h-4 text-[#8ACCD5] shrink-0" aria-hidden="true" />
          <span>{successNote}</span>
        </p>
      )}

      {/* Currently Attached Files */}
      {!hideAttachedList && currentUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
          {currentUrls.map((url, idx) => {
            const isPdf = url.toLowerCase().includes('.pdf') || acceptMode === 'pdf';
            return (
              <div
                key={`${url}-${idx}`}
                className="border-2 border-brutal surface-card overflow-hidden relative group"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  {isPdf ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2.5 text-center surface-highlight">
                      <FileText className="w-6 h-6 mb-1" />
                      <span className="font-mono-num text-[10px] font-bold">PDF Terlampir</span>
                    </div>
                  ) : (
                    <SafeImage src={url} alt={`Lampiran ${idx + 1}`} className="w-full h-full object-cover" />
                  )}
                </div>
                {onRemoveUrl && (
                  <button
                    type="button"
                    onClick={() => onRemoveUrl(url)}
                    aria-label={`Hapus lampiran ${idx + 1}`}
                    className="absolute top-1.5 right-1.5 bg-[#6C151E] text-[#F8F8E1] border-2 border-[#013A42] p-1.5 cursor-pointer hover:bg-[#8ACCD5] hover:text-[#013A42] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
