import { AuthError, requireVerifiedAdmin } from './_lib/firebaseAuth.mts';
import {
  DriveReconnectRequiredError,
  finalizeDriveFile,
  getValidDriveAccessToken,
  jsonResponse,
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

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: 'Body permintaan JSON tidak valid.' }, 400);
  }

  const fileId = typeof body.fileId === 'string' ? body.fileId.trim() : '';
  const visibility: 'public' | 'private' = body.visibility === 'private' ? 'private' : 'public';

  if (!fileId) {
    return jsonResponse({ error: 'fileId wajib disertakan untuk konfirmasi unggahan.' }, 400);
  }

  try {
    const { accessToken } = await getValidDriveAccessToken(false);
    const finalized = await finalizeDriveFile({
      accessToken,
      fileId,
      visibility,
    });

    return jsonResponse({ file: finalized });
  } catch (err) {
    if (err instanceof DriveReconnectRequiredError) {
      return jsonResponse({ error: err.message, code: 'RECONNECT_REQUIRED' }, 412);
    }
    return jsonResponse(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Gagal mengonfirmasi file hasil unggahan di Google Drive.',
      },
      502
    );
  }
}
