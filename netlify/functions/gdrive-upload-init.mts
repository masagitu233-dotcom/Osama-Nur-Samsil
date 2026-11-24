import { AuthError, requireVerifiedAdmin } from './_lib/firebaseAuth.mts';
import {
  DriveReconnectRequiredError,
  ensureFolderHierarchy,
  getMissingDriveEnvVars,
  getValidDriveAccessToken,
  initiateDriveResumableSession,
  jsonResponse,
  resolveDriveSubfolderName,
  validateUploadMetadata,
} from './_lib/gdriveApi.mts';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405);
  }

  try {
    await requireVerifiedAdmin(req);
  } catch (err) {
    const status = err instanceof AuthError ? err.status : 401;
    return jsonResponse({ error: err instanceof Error ? err.message : 'Unauthorized' }, status);
  }

  const missing = getMissingDriveEnvVars();
  if (missing.length > 0) {
    return jsonResponse(
      {
        error: `Integrasi Google Drive belum dikonfigurasi pada Netlify (${missing.join(', ')}).`,
        code: 'NOT_CONFIGURED',
      },
      503
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: 'Body permintaan JSON tidak valid.' }, 400);
  }

  const metaCheck = validateUploadMetadata({
    fileName: body.fileName,
    mimeType: body.mimeType,
    sizeBytes: body.sizeBytes,
  });

  if (!metaCheck.valid) {
    return jsonResponse({ error: metaCheck.error }, 400);
  }

  const category = typeof body.category === 'string' ? body.category.trim() : 'media';
  const targetFolderName = resolveDriveSubfolderName(category);

  // Extract browser origin strictly for Google Drive resumable CORS negotiation
  const rawOrigin = req.headers.get('origin') || req.headers.get('Origin') || '';
  let browserOrigin: string | null = null;
  if (rawOrigin) {
    try {
      const parsed = new URL(rawOrigin);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        browserOrigin = parsed.origin;
      }
    } catch {
      browserOrigin = null;
    }
  }

  try {
    const { accessToken } = await getValidDriveAccessToken(false);
    let folderMap = await ensureFolderHierarchy(accessToken, false);
    let targetFolderId = folderMap.subfolders[targetFolderName];

    if (!targetFolderId) {
      folderMap = await ensureFolderHierarchy(accessToken, true);
      targetFolderId = folderMap.subfolders[targetFolderName];
    }

    if (!targetFolderId) {
      throw new Error(`Folder tujuan "${targetFolderName}" tidak dapat ditemukan di Google Drive.`);
    }

    try {
      const { uploadUri } = await initiateDriveResumableSession({
        accessToken,
        fileName: metaCheck.fileName,
        mimeType: metaCheck.mimeType,
        sizeBytes: metaCheck.sizeBytes,
        parentFolderId: targetFolderId,
        browserOrigin,
      });

      return jsonResponse({
        uploadUri,
        folderId: targetFolderId,
        folderName: targetFolderName,
        rootFolderId: folderMap.rootFolderId,
        sanitizedFileName: metaCheck.fileName,
      });
    } catch (initErr) {
      // Self-heal once if cached folder was manually deleted (404) or access token just invalidated (401)
      const status = (initErr as { httpStatus?: number })?.httpStatus;
      if (status === 404 || status === 401) {
        const refreshed =
          status === 401 ? (await getValidDriveAccessToken(true)).accessToken : accessToken;
        const rebuiltMap = await ensureFolderHierarchy(refreshed, status === 404);
        const rebuiltFolderId = rebuiltMap.subfolders[targetFolderName];
        const { uploadUri } = await initiateDriveResumableSession({
          accessToken: refreshed,
          fileName: metaCheck.fileName,
          mimeType: metaCheck.mimeType,
          sizeBytes: metaCheck.sizeBytes,
          parentFolderId: rebuiltFolderId,
          browserOrigin,
        });

        return jsonResponse({
          uploadUri,
          folderId: rebuiltFolderId,
          folderName: targetFolderName,
          rootFolderId: rebuiltMap.rootFolderId,
          sanitizedFileName: metaCheck.fileName,
        });
      }
      throw initErr;
    }
  } catch (err) {
    if (err instanceof DriveReconnectRequiredError) {
      return jsonResponse({ error: err.message, code: 'RECONNECT_REQUIRED' }, 412);
    }
    return jsonResponse(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Gagal menginisiasi sesi unggahan Google Drive.',
      },
      502
    );
  }
}
