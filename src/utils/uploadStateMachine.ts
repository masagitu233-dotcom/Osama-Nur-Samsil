export type UploadStage =
  | 'idle'
  | 'initiating'
  | 'uploading'
  | 'finalizing'
  | 'success'
  | 'error'
  | 'cancelled';

export interface UploadProgressSnapshot {
  stage: UploadStage;
  loadedBytes: number;
  totalBytes: number;
  percent: number; // Strictly 0..99 during transfer, 100 ONLY on confirmed 'success'
  transportMode?: 'direct' | 'chunked_fallback';
  message: string;
}

export const UPLOAD_STAGE_LABELS: Record<UploadStage, string> = {
  idle: 'Menunggu unggahan',
  initiating: 'Menginisiasi koneksi',
  uploading: 'Mengunggah file',
  finalizing: 'Menyelesaikan unggahan',
  success: 'Berhasil',
  error: 'Gagal',
  cancelled: 'Dibatalkan',
};

/**
 * 2 MiB raw binary chunk size (exact multiple of 256 KiB as required by Google Drive resumable API,
 * safely well under Netlify Functions' 6 MB buffered payload limit).
 */
export const FALLBACK_CHUNK_SIZE_BYTES = 2 * 1024 * 1024;

/**
 * Calculates real transfer percentage strictly from actual bytes transferred.
 * Caps at 99% while transferring/finalizing so 100% is reached ONLY once Google Drive
 * confirms final persistence.
 */
export function calculateTransferPercent(
  loadedBytes: number,
  totalBytes: number,
  stage: UploadStage
): number {
  if (stage === 'success') return 100;
  if (stage === 'idle' || stage === 'initiating' || stage === 'cancelled') return 0;
  if (stage === 'finalizing') return 99;
  if (!Number.isFinite(totalBytes) || totalBytes <= 0) return 0;

  const clampedLoaded = Math.max(0, Math.min(loadedBytes, totalBytes));
  const rawPct = Math.floor((clampedLoaded / totalBytes) * 100);
  return Math.min(99, Math.max(0, rawPct));
}

export function createUploadProgressSnapshot(
  stage: UploadStage,
  loadedBytes: number,
  totalBytes: number,
  options?: { transportMode?: 'direct' | 'chunked_fallback'; customMessage?: string }
): UploadProgressSnapshot {
  const safeTotal = Math.max(0, Math.round(totalBytes));
  const safeLoaded = stage === 'success' ? safeTotal : Math.max(0, Math.min(Math.round(loadedBytes), safeTotal));
  const percent = calculateTransferPercent(safeLoaded, safeTotal, stage);

  return {
    stage,
    loadedBytes: safeLoaded,
    totalBytes: safeTotal,
    percent,
    transportMode: options?.transportMode,
    message: options?.customMessage || UPLOAD_STAGE_LABELS[stage],
  };
}

export interface ChunkSlice {
  start: number;
  end: number; // inclusive
  size: number;
  contentRange: string;
}

/**
 * Computes Google Drive resumable chunk boundaries starting from `startOffset`.
 */
export function computeResumableChunks(
  totalBytes: number,
  startOffset = 0,
  chunkSizeBytes = FALLBACK_CHUNK_SIZE_BYTES
): ChunkSlice[] {
  if (totalBytes <= 0 || startOffset >= totalBytes) return [];
  const chunks: ChunkSlice[] = [];
  let offset = Math.max(0, startOffset);

  while (offset < totalBytes) {
    const end = Math.min(offset + chunkSizeBytes - 1, totalBytes - 1);
    chunks.push({
      start: offset,
      end,
      size: end - offset + 1,
      contentRange: `bytes ${offset}-${end}/${totalBytes}`,
    });
    offset = end + 1;
  }

  return chunks;
}

/**
 * Parses Google Drive's `Range: bytes=0-<lastByte>` header returned on HTTP 308 responses.
 * Returns the next byte offset to resume from (`lastByte + 1`), or 0 if no bytes were committed.
 */
export function parseDriveCommittedBytes(rangeHeader: string | null | undefined): number {
  if (!rangeHeader) return 0;
  const match = rangeHeader.match(/bytes=0-(\d+)/i);
  if (!match?.[1]) return 0;
  const lastByte = Number(match[1]);
  return Number.isFinite(lastByte) && lastByte >= 0 ? lastByte + 1 : 0;
}
