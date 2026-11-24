import React, { useRef, useState } from 'react';
import { FileText, Trash2, UploadCloud } from 'lucide-react';
import { uploadMediaFile } from '../../services/portfolioService';
import { validateUploadFile } from '../../utils/portfolioLogic';
import { formatBytes } from '../../utils/mediaCompression';
import { SafeImage } from '../ui/SafeImage';

interface MediaUploaderProps {
  folder: 'profile' | 'certificates' | 'experiences' | 'organizations' | 'projects' | 'cv' | 'media';
  acceptMode: 'image' | 'pdf' | 'both';
  multiple?: boolean;
  label: string;
  helperText?: string;
  currentUrls?: string[];
  onUploaded: (result: { fileUrl: string; fileName: string; fileType: 'image' | 'pdf' }) => void;
  onRemoveUrl?: (url: string) => void;
}

interface PendingPreview {
  file: File;
  previewUrl: string | null;
  fileType: 'image' | 'pdf';
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  folder,
  acceptMode,
  multiple = false,
  label,
  helperText,
  currentUrls = [],
  onUploaded,
  onRemoveUrl,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState<PendingPreview[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptAttr =
    acceptMode === 'image'
      ? 'image/jpeg,image/png,image/webp'
      : acceptMode === 'pdf'
      ? 'application/pdf'
      : 'image/jpeg,image/png,image/webp,application/pdf';

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
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
      prev.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
      return nextPending;
    });
  };

  const handleUploadConfirm = async () => {
    if (pending.length === 0) return;
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      for (let i = 0; i < pending.length; i++) {
        const item = pending[i];
        const uploaded = await uploadMediaFile(item.file, folder, (pct) => {
          const overall = Math.round(((i + pct / 100) / pending.length) * 100);
          setProgress(overall);
        });
        onUploaded({
          fileUrl: uploaded.fileUrl,
          fileName: uploaded.fileName,
          fileType: item.fileType,
        });
      }
      pending.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
      setPending([]);
      setProgress(0);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Gagal mengunggah file ke Firebase Storage. Pastikan Storage telah diaktifkan di Firebase Console.';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const clearPending = () => {
    pending.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
    setPending([]);
    setError(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold uppercase tracking-wider">{label}</label>
        {helperText && <span className="text-xs text-muted">{helperText}</span>}
      </div>

      {/* Drag-and-drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed p-5 text-center transition-colors ${
          dragging
            ? 'border-[#013A42] surface-highlight'
            : 'border-brutal surface-card'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptAttr}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <UploadCloud className="w-7 h-7 mx-auto mb-2" aria-hidden="true" />
        <p className="text-sm font-bold">
          Seret &amp; lepas file di sini, atau{' '}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="underline decoration-2 underline-offset-2 cursor-pointer"
          >
            pilih dari perangkat
          </button>
        </p>
        <p className="text-xs text-muted mt-1">
          {acceptMode === 'pdf'
            ? 'Format PDF (maks. 10 MB)'
            : acceptMode === 'image'
            ? 'Format JPG, PNG, WebP (maks. 5 MB — otomatis dikompresi)'
            : 'Format JPG, PNG, WebP (maks. 5 MB) atau PDF (maks. 10 MB)'}
        </p>
      </div>

      {error && (
        <p role="alert" className="inline-block px-2.5 py-1 text-xs font-bold bg-[#013A42] text-[#F8F8E1] dark:bg-[#8ACCD5] dark:text-[#013A42]">
          {error}
        </p>
      )}

      {/* Local Preview BEFORE Upload */}
      {pending.length > 0 && (
        <div className="border-2 border-brutal surface-card p-4 space-y-3">
          <span className="brutal-badge">
            Pratinjau Sebelum Unggah ({pending.length} file)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pending.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 border-2 border-subtle">
                {item.previewUrl ? (
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="w-14 h-14 object-cover border-2 border-brutal shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 bg-[#013A42] text-[#F8F8E1] border-2 border-brutal flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1 text-xs">
                  <p className="font-bold truncate">{item.file.name}</p>
                  <p className="font-mono-num text-muted">{formatBytes(item.file.size)}</p>
                </div>
              </div>
            ))}
          </div>

          {uploading && (
            <div className="space-y-1">
              <div className="h-3 border-2 border-brutal surface-page overflow-hidden">
                <div
                  className="h-full bg-[#8ACCD5] transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="font-mono-num text-xs font-bold">Mengunggah... {progress}%</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={handleUploadConfirm}
              className="brutal-btn brutal-btn-primary px-4 py-2 text-xs font-bold cursor-pointer disabled:opacity-60"
            >
              {uploading ? 'Mengunggah ke Firebase Storage...' : 'Unggah Sekarang'}
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={clearPending}
              className="brutal-btn brutal-btn-outline px-4 py-2 text-xs font-bold cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Currently Attached Files */}
      {currentUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
          {currentUrls.map((url, idx) => {
            const isPdf = url.toLowerCase().includes('.pdf') || acceptMode === 'pdf';
            return (
              <div
                key={`${url}-${idx}`}
                className="border-2 border-brutal surface-card overflow-hidden relative group"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  {isPdf ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center surface-highlight">
                      <FileText className="w-7 h-7 mb-1" />
                      <span className="font-mono-num text-[11px] font-bold">PDF Terlampir</span>
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
                    className="absolute top-1.5 right-1.5 bg-[#013A42] text-[#F8F8E1] border-2 border-[#8ACCD5] p-1.5 cursor-pointer hover:bg-[#8ACCD5] hover:text-[#013A42] transition-colors"
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
