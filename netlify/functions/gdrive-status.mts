import { AuthError, getAdminOwnerEmail, requireVerifiedAdmin } from './_lib/firebaseAuth.mts';
import { loadEncryptedDriveCredentials, loadFolderMap } from './_lib/blobStore.mts';
import {
  DriveReconnectRequiredError,
  getMissingDriveEnvVars,
  getValidDriveAccessToken,
  jsonResponse,
  resolveOAuthRedirectUri,
} from './_lib/gdriveApi.mts';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405);
  }

  try {
    await requireVerifiedAdmin(req);
  } catch (err) {
    const status = err instanceof AuthError ? err.status : 401;
    return jsonResponse({ error: err instanceof Error ? err.message : 'Unauthorized' }, status);
  }

  const expectedOwnerEmail = getAdminOwnerEmail();
  const redirectUri = resolveOAuthRedirectUri(req);
  const missingConfig = getMissingDriveEnvVars();

  if (missingConfig.length > 0) {
    return jsonResponse({
      status: 'not_configured',
      connectedEmail: null,
      expectedOwnerEmail,
      connectedAt: null,
      rootFolderId: null,
      rootFolderUrl: null,
      folders: {},
      redirectUri,
      missingConfig,
      message: `Konfigurasi environment variable Netlify belum lengkap: ${missingConfig.join(', ')}.`,
    });
  }

  let storedCreds;
  try {
    storedCreds = await loadEncryptedDriveCredentials();
  } catch (err) {
    return jsonResponse({
      status: 'reconnect_required',
      connectedEmail: null,
      expectedOwnerEmail,
      connectedAt: null,
      rootFolderId: null,
      rootFolderUrl: null,
      folders: {},
      redirectUri,
      missingConfig: [],
      message:
        err instanceof Error
          ? err.message
          : 'Gagal membaca kredensial Google Drive terenkripsi. Silakan hubungkan ulang.',
    });
  }

  if (!storedCreds || !storedCreds.refreshToken) {
    return jsonResponse({
      status: 'not_connected',
      connectedEmail: null,
      expectedOwnerEmail,
      connectedAt: null,
      rootFolderId: null,
      rootFolderUrl: null,
      folders: {},
      redirectUri,
      missingConfig: [],
      message: 'Akun Google Drive belum terhubung. Klik "Hubungkan Google Drive" untuk mengaktifkan unggahan.',
    });
  }

  try {
    const { credentials } = await getValidDriveAccessToken(false);
    const folderMap = await loadFolderMap().catch(() => null);

    return jsonResponse({
      status: 'connected',
      connectedEmail: credentials.connectedEmail,
      expectedOwnerEmail,
      connectedAt: credentials.connectedAt,
      rootFolderId: folderMap?.rootFolderId ?? null,
      rootFolderUrl: folderMap?.rootFolderId
        ? `https://drive.google.com/drive/folders/${encodeURIComponent(folderMap.rootFolderId)}`
        : null,
      folders: folderMap?.subfolders ?? {},
      redirectUri,
      missingConfig: [],
      message: `Terhubung ke Google Drive (${credentials.connectedEmail}).`,
    });
  } catch (err) {
    const isReconnect = err instanceof DriveReconnectRequiredError;
    return jsonResponse({
      status: isReconnect ? 'reconnect_required' : 'reconnect_required',
      connectedEmail: storedCreds.connectedEmail,
      expectedOwnerEmail,
      connectedAt: storedCreds.connectedAt,
      rootFolderId: null,
      rootFolderUrl: null,
      folders: {},
      redirectUri,
      missingConfig: [],
      message:
        err instanceof Error
          ? err.message
          : 'Koneksi Google Drive perlu dihubungkan ulang.',
    });
  }
}
