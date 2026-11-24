import { auth } from './firebase';
import {
  computeResumableChunks,
  createUploadProgressSnapshot,
  FALLBACK_CHUNK_SIZE_BYTES,
  parseDriveCommittedBytes,
  type UploadProgressSnapshot,
} from '../utils/uploadStateMachine';

export type DriveUploadCategory =
  | 'profile'
  | 'experiences'
  | 'organizations'
  | 'education'
  | 'certificates'
  | 'cv'
  | 'documents'
  | 'projects'
  | 'skills'
  | 'interests'
  | 'seo'
  | 'media'
  | 'other';

export type DriveFileVisibility = 'public' | 'private';

export interface DriveConnectionStatus {
  status: 'connected' | 'not_connected' | 'reconnect_required' | 'not_configured' | 'backend_unavailable';
  connectedEmail: string | null;
  expectedOwnerEmail: string;
  connectedAt: string | null;
  rootFolderId: string | null;
  rootFolderUrl: string | null;
  folders: Record<string, string>;
  redirectUri: string;
  missingConfig: string[];
  message: string;
}

export interface DriveFinalizedUpload {
  fileId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  webViewLink: string;
  downloadUrl: string;
  createdTime: string;
  visibility: DriveFileVisibility;
  folderId: string;
  folderName: string;
  transportMode: 'direct' | 'chunked_fallback';
}

export const DRIVE_FOLDER_LABELS: Record<DriveUploadCategory, string> = {
  profile: 'Foto Profil',
  experiences: 'Pengalaman',
  organizations: 'Pengalaman',
  education: 'Pendidikan',
  certificates: 'Sertifikat',
  cv: 'Dokumen',
  documents: 'Dokumen',
  projects: 'Proyek dan Karya',
  skills: 'File Lainnya',
  interests: 'File Lainnya',
  seo: 'File Lainnya',
  media: 'File Lainnya',
  other: 'File Lainnya',
};

async function getAdminIdToken(): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Sesi login admin tidak ditemukan. Silakan masuk kembali dengan akun Google admin.');
  }
  return currentUser.getIdToken();
}

async function parseJsonSafe(res: Response): Promise<Record<string, unknown>> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return {};
  }
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function fetchGoogleDriveStatus(): Promise<DriveConnectionStatus> {
  const token = await getAdminIdToken();
  const res = await fetch('/.netlify/functions/gdrive-status', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    if (res.status === 404 || Object.keys(data).length === 0) {
      return {
        status: 'backend_unavailable',
        connectedEmail: null,
        expectedOwnerEmail: 'osamanursamsil@gmail.com',
        connectedAt: null,
        rootFolderId: null,
        rootFolderUrl: null,
        folders: {},
        redirectUri: `${window.location.origin}/.netlify/functions/gdrive-oauth-callback`,
        missingConfig: [],
        message:
          'Endpoint Netlify Functions (/.netlify/functions/gdrive-status) belum aktif di lingkungan preview lokal ini. Koneksi Google Drive aktif setelah dideploy ke Netlify atau dijalankan via Netlify CLI.',
      };
    }
    throw new Error(typeof data.error === 'string' ? data.error : `Gagal memeriksa status Google Drive (HTTP ${res.status}).`);
  }

  return data as unknown as DriveConnectionStatus;
}

export async function startGoogleDriveOAuth(): Promise<{ authUrl: string; redirectUri: string }> {
  const token = await getAdminIdToken();
  const res = await fetch('/.netlify/functions/gdrive-oauth-start', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  const data = await parseJsonSafe(res);
  if (!res.ok || typeof data.authUrl !== 'string') {
    if (res.status === 404 || Object.keys(data).length === 0) {
      throw new Error(
        'Netlify Functions tidak tersedia pada server preview ini. Jalankan melalui deployment Netlify atau Netlify CLI.'
      );
    }
    throw new Error(
      typeof data.error === 'string' ? data.error : 'Gagal memulai koneksi Google Drive.'
    );
  }

  return {
    authUrl: data.authUrl,
    redirectUri: typeof data.redirectUri === 'string' ? data.redirectUri : '',
  };
}

export async function disconnectGoogleDrive(): Promise<void> {
  const token = await getAdminIdToken();
  const res = await fetch('/.netlify/functions/gdrive-oauth-disconnect', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  const data = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string' ? data.error : 'Gagal mencabut koneksi Google Drive.'
    );
  }
}

export async function deleteGoogleDriveFileById(fileId: string): Promise<void> {
  const token = await getAdminIdToken();
  const res = await fetch('/.netlify/functions/gdrive-file-delete', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileId }),
  });

  const data = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string' ? data.error : 'Gagal menghapus file di Google Drive.'
    );
  }
}

interface DirectXhrError extends Error {
  isCorsOrNetworkBlock?: boolean;
  isAborted?: boolean;
  httpStatus?: number;
}

function sendXhrPut(params: {
  url: string;
  body: Blob | null;
  headers: Record<string, string>;
  signal?: AbortSignal;
  onUploadProgress?: (loaded: number, total: number) => void;
}): Promise<{ status: number; responseText: string; rangeHeader: string | null }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', params.url, true);

    for (const [k, v] of Object.entries(params.headers)) {
      xhr.setRequestHeader(k, v);
    }

    const onAbort = () => {
      xhr.abort();
    };
    if (params.signal) {
      if (params.signal.aborted) {
        const abortErr: DirectXhrError = new Error('Unggahan dibatalkan oleh pengguna.');
        abortErr.isAborted = true;
        reject(abortErr);
        return;
      }
      params.signal.addEventListener('abort', onAbort, { once: true });
    }

    const cleanup = () => {
      if (params.signal) {
        params.signal.removeEventListener('abort', onAbort);
      }
    };

    xhr.upload.onprogress = (evt) => {
      if (params.onUploadProgress && evt.lengthComputable) {
        params.onUploadProgress(evt.loaded, evt.total);
      }
    };

    xhr.onload = () => {
      cleanup();
      resolve({
        status: xhr.status,
        responseText: xhr.responseText || '',
        rangeHeader: xhr.getResponseHeader('Range'),
      });
    };

    xhr.onerror = () => {
      cleanup();
      const err: DirectXhrError = new Error('Koneksi terputus atau diblokir CORS saat mengirim ke Google Drive.');
      err.isCorsOrNetworkBlock = true;
      err.httpStatus = xhr.status;
      reject(err);
    };

    xhr.onabort = () => {
      cleanup();
      const err: DirectXhrError = new Error('Unggahan dibatalkan oleh pengguna.');
      err.isAborted = true;
      reject(err);
    };

    xhr.send(params.body);
  });
}

async function queryDirectResumeOffset(uploadUri: string, totalBytes: number, signal?: AbortSignal): Promise<number> {
  const probe = await sendXhrPut({
    url: uploadUri,
    body: null,
    headers: { 'Content-Range': `bytes */${totalBytes}` },
    signal,
  });
  if (probe.status === 308) {
    return parseDriveCommittedBytes(probe.rangeHeader);
  }
  return 0;
}

async function uploadDirectWithRecovery(params: {
  file: File;
  uploadUri: string;
  signal?: AbortSignal;
  onProgress: (snapshot: UploadProgressSnapshot) => void;
}): Promise<{ fileId: string }> {
  const { file, uploadUri, signal, onProgress } = params;
  const totalBytes = file.size;
  let offset = 0;

  for (let attempt = 0; attempt < 2; attempt++) {
    const slice = offset > 0 ? file.slice(offset) : file;
    const headers: Record<string, string> = {
      'Content-Type': file.type,
    };
    if (offset > 0) {
      headers['Content-Range'] = `bytes ${offset}-${totalBytes - 1}/${totalBytes}`;
    }

    try {
      const res = await sendXhrPut({
        url: uploadUri,
        body: slice,
        headers,
        signal,
        onUploadProgress: (loaded) => {
          onProgress(
            createUploadProgressSnapshot('uploading', offset + loaded, totalBytes, {
              transportMode: 'direct',
            })
          );
        },
      });

      if (res.status === 200 || res.status === 201) {
        const parsed = JSON.parse(res.responseText || '{}') as { id?: string };
        if (!parsed.id) {
          throw new Error('Google Drive tidak mengembalikan ID file setelah transfer selesai.');
        }
        return { fileId: parsed.id };
      }

      if (res.status === 308 && attempt === 0) {
        offset = parseDriveCommittedBytes(res.rangeHeader);
        continue;
      }

      if (res.status >= 500 && attempt === 0) {
        offset = await queryDirectResumeOffset(uploadUri, totalBytes, signal).catch(() => 0);
        continue;
      }

      throw new Error(`Google Drive menolak unggahan langsung (HTTP ${res.status}).`);
    } catch (err) {
      const typed = err as DirectXhrError;
      if (typed.isAborted) throw err;

      // On first attempt, if some bytes were transferred and network dropped, try resumable recovery once.
      // If 0 bytes were committed and browser raised a CORS/network error, bubble up to trigger chunked fallback.
      if (attempt === 0 && typed.isCorsOrNetworkBlock) {
        try {
          const recovered = await queryDirectResumeOffset(uploadUri, totalBytes, signal);
          if (recovered > 0) {
            offset = recovered;
            continue;
          }
        } catch {
          // Probe also blocked by CORS -> let caller switch to safe 2 MB chunked fallback
        }
      }
      throw err;
    }
  }

  throw new Error('Unggahan langsung gagal setelah percobaan pemulihan sesi.');
}

async function uploadViaChunkedFallback(params: {
  file: File;
  uploadUri: string;
  adminToken: string;
  signal?: AbortSignal;
  onProgress: (snapshot: UploadProgressSnapshot) => void;
}): Promise<{ fileId: string }> {
  const { file, uploadUri, adminToken, signal, onProgress } = params;
  const totalBytes = file.size;
  const chunks = computeResumableChunks(totalBytes, 0, FALLBACK_CHUNK_SIZE_BYTES);

  let uploadedBase = 0;

  for (const chunk of chunks) {
    const slice = file.slice(chunk.start, chunk.end + 1);
    const res = await sendXhrPut({
      url: '/.netlify/functions/gdrive-upload-chunk',
      body: slice,
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/octet-stream',
        'X-Upload-Session-Uri': uploadUri,
        'X-Upload-Content-Range': chunk.contentRange,
        'X-Upload-Mime-Type': file.type,
      },
      signal,
      onUploadProgress: (loaded) => {
        onProgress(
          createUploadProgressSnapshot('uploading', uploadedBase + loaded, totalBytes, {
            transportMode: 'chunked_fallback',
            customMessage: 'Mengunggah file (mode bertahap aman)',
          })
        );
      },
    });

    const parsed = JSON.parse(res.responseText || '{}') as {
      complete?: boolean;
      committedBytes?: number;
      file?: { id?: string };
      error?: string;
    };

    if (res.status < 200 || res.status >= 300) {
      throw new Error(parsed.error || `Gagal mengirim potongan unggahan (HTTP ${res.status}).`);
    }

    if (parsed.complete && parsed.file?.id) {
      return { fileId: parsed.file.id };
    }

    uploadedBase = typeof parsed.committedBytes === 'number' && parsed.committedBytes > uploadedBase
      ? parsed.committedBytes
      : chunk.end + 1;
  }

  throw new Error('Unggahan bertahap selesai tanpa konfirmasi ID file dari Google Drive.');
}

/**
 * Full 3-Stage Resumable Upload to Google Drive:
 * 1. Backend initiates resumable upload session (returns ephemeral uploadUri, never stored).
 * 2. Browser uploads directly to Google Drive via XHR with real upload.onprogress (with resume recovery + 2 MB chunked fallback on CORS error).
 * 3. Backend verifies the uploaded file in Google Drive and configures public/private permission before confirming 100% success.
 */
export async function uploadFileToGoogleDrive(params: {
  file: File;
  category: DriveUploadCategory;
  visibility: DriveFileVisibility;
  signal?: AbortSignal;
  onProgress: (snapshot: UploadProgressSnapshot) => void;
}): Promise<DriveFinalizedUpload> {
  const { file, category, visibility, signal, onProgress } = params;

  onProgress(createUploadProgressSnapshot('initiating', 0, file.size));
  const adminToken = await getAdminIdToken();

  // Stage 1: Initiate resumable upload session via Netlify Function
  const initRes = await fetch('/.netlify/functions/gdrive-upload-init', {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      category,
    }),
  });

  const initData = await parseJsonSafe(initRes);
  if (!initRes.ok || typeof initData.uploadUri !== 'string') {
    if (initRes.status === 404 || Object.keys(initData).length === 0) {
      throw new Error(
        'Endpoint unggahan Netlify Functions tidak tersedia di lingkungan lokal ini. Lakukan unggahan melalui deployment Netlify yang aktif.'
      );
    }
    throw new Error(
      typeof initData.error === 'string'
        ? initData.error
        : `Gagal menginisiasi sesi unggahan Google Drive (HTTP ${initRes.status}).`
    );
  }

  // Ephemeral upload session URI — NEVER logged, NEVER saved to storage/Firestore
  const ephemeralUploadUri = initData.uploadUri;
  const folderId = typeof initData.folderId === 'string' ? initData.folderId : '';
  const folderName = typeof initData.folderName === 'string' ? initData.folderName : DRIVE_FOLDER_LABELS[category];

  // Stage 2: Direct browser upload to Google Drive (with automatic 2 MB chunked fallback if CORS blocks direct PUT)
  onProgress(createUploadProgressSnapshot('uploading', 0, file.size, { transportMode: 'direct' }));

  let uploadedFileId: string;
  let transportMode: 'direct' | 'chunked_fallback' = 'direct';

  try {
    const directResult = await uploadDirectWithRecovery({
      file,
      uploadUri: ephemeralUploadUri,
      signal,
      onProgress,
    });
    uploadedFileId = directResult.fileId;
  } catch (err) {
    const typed = err as DirectXhrError;
    if (typed.isAborted || signal?.aborted) {
      throw new Error('Unggahan dibatalkan oleh pengguna.');
    }

    if (typed.isCorsOrNetworkBlock) {
      transportMode = 'chunked_fallback';
      const fallbackResult = await uploadViaChunkedFallback({
        file,
        uploadUri: ephemeralUploadUri,
        adminToken,
        signal,
        onProgress,
      });
      uploadedFileId = fallbackResult.fileId;
    } else {
      throw err;
    }
  }

  // Stage 3: Confirm file persistence in Google Drive & apply public/private visibility
  onProgress(
    createUploadProgressSnapshot('finalizing', file.size, file.size, {
      transportMode,
    })
  );

  const finalizeRes = await fetch('/.netlify/functions/gdrive-upload-finalize', {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileId: uploadedFileId,
      visibility,
      category,
    }),
  });

  const finalizeData = await parseJsonSafe(finalizeRes);
  const finalized = finalizeData.file as Record<string, unknown> | undefined;
  if (!finalizeRes.ok || !finalized || typeof finalized.fileId !== 'string') {
    throw new Error(
      typeof finalizeData.error === 'string'
        ? finalizeData.error
        : 'Gagal mengonfirmasi penyimpanan file di Google Drive.'
    );
  }

  const result: DriveFinalizedUpload = {
    fileId: finalized.fileId,
    fileName: typeof finalized.fileName === 'string' ? finalized.fileName : file.name,
    mimeType: typeof finalized.mimeType === 'string' ? finalized.mimeType : file.type,
    sizeBytes: typeof finalized.sizeBytes === 'number' && finalized.sizeBytes > 0 ? finalized.sizeBytes : file.size,
    webViewLink:
      typeof finalized.webViewLink === 'string'
        ? finalized.webViewLink
        : `https://drive.google.com/file/d/${encodeURIComponent(finalized.fileId)}/view`,
    downloadUrl:
      typeof finalized.downloadUrl === 'string'
        ? finalized.downloadUrl
        : `https://drive.google.com/uc?export=download&id=${encodeURIComponent(finalized.fileId)}`,
    createdTime: typeof finalized.createdTime === 'string' ? finalized.createdTime : new Date().toISOString(),
    visibility,
    folderId,
    folderName,
    transportMode,
  };

  onProgress(createUploadProgressSnapshot('success', result.sizeBytes, result.sizeBytes, { transportMode }));
  return result;
}
