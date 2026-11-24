import { AuthError, requireVerifiedAdmin } from './_lib/firebaseAuth.mts';
import { deleteFolderMap } from './_lib/blobStore.mts';
import { disconnectDriveAccount, jsonResponse } from './_lib/gdriveApi.mts';

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

  try {
    await disconnectDriveAccount();
    await deleteFolderMap().catch(() => {
      // Non-fatal: folders in Google Drive remain intact and will be re-indexed on reconnect
    });

    return jsonResponse({
      disconnected: true,
      message: 'Koneksi Google Drive telah dicabut dan refresh token terenkripsi telah dihapus dari server.',
    });
  } catch (err) {
    return jsonResponse(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Gagal mencabut koneksi Google Drive.',
      },
      500
    );
  }
}
