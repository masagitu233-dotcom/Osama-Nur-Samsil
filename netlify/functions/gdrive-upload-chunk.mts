import { AuthError, requireVerifiedAdmin } from './_lib/firebaseAuth.mts';
import {
  ALLOWED_UPLOAD_MIMES,
  jsonResponse,
  validateGoogleDriveUploadUri,
} from './_lib/gdriveApi.mts';

// Keep raw binary chunks strictly well below Netlify's 6 MB buffered payload limit
const MAX_CHUNK_BYTES = 3 * 1024 * 1024; // 3 MB ceiling (frontend sends 2 MB = 8 * 256 KiB chunks)
const CONTENT_RANGE_REGEX = /^bytes\s+(?:(\d+)-(\d+)\/(\d+|\*)|\*\/(\d+))$/;

/**
 * Fallback resumable chunk relay used ONLY if direct browser PUT to Google Drive
 * encounters a CORS or network restriction. Never buffers an entire 5-10 MB file in one request.
 */
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'PUT') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405);
  }

  try {
    await requireVerifiedAdmin(req);
  } catch (err) {
    const status = err instanceof AuthError ? err.status : 401;
    return jsonResponse({ error: err instanceof Error ? err.message : 'Unauthorized' }, status);
  }

  const rawSessionUri = req.headers.get('x-upload-session-uri') || '';
  const contentRange = (req.headers.get('x-upload-content-range') || '').trim();
  const mimeType = (req.headers.get('x-upload-mime-type') || '').trim().toLowerCase();

  let validatedUri: URL;
  try {
    validatedUri = validateGoogleDriveUploadUri(rawSessionUri);
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : 'URI sesi unggahan tidak valid.' },
      400
    );
  }

  if (!CONTENT_RANGE_REGEX.test(contentRange)) {
    return jsonResponse({ error: 'Header Content-Range tidak valid.' }, 400);
  }

  if (mimeType && !ALLOWED_UPLOAD_MIMES.has(mimeType)) {
    return jsonResponse({ error: 'MIME type chunk tidak diizinkan.' }, 400);
  }

  const chunkBuffer = await req.arrayBuffer();
  if (chunkBuffer.byteLength > MAX_CHUNK_BYTES) {
    return jsonResponse(
      { error: 'Ukuran potongan chunk melebihi batas aman Netlify Functions (maks. 3 MB per chunk).' },
      413
    );
  }

  try {
    const forwardHeaders: Record<string, string> = {
      'Content-Range': contentRange,
      'Content-Length': String(chunkBuffer.byteLength),
    };
    if (mimeType && chunkBuffer.byteLength > 0) {
      forwardHeaders['Content-Type'] = mimeType;
    }

    const driveRes = await fetch(validatedUri.toString(), {
      method: 'PUT',
      headers: forwardHeaders,
      body: chunkBuffer.byteLength > 0 ? chunkBuffer : undefined,
    });

    // 308 Resume Incomplete: parse committed byte offset
    if (driveRes.status === 308) {
      const rangeHeader = driveRes.headers.get('range') || driveRes.headers.get('Range') || '';
      const match = rangeHeader.match(/bytes=0-(\d+)/i);
      const committedBytes = match ? Number(match[1]) + 1 : 0;
      return jsonResponse({
        complete: false,
        status: 308,
        committedBytes,
      });
    }

    if (driveRes.status === 200 || driveRes.status === 201) {
      const fileData = (await driveRes.json().catch(() => null)) as Record<string, unknown> | null;
      if (!fileData || typeof fileData.id !== 'string') {
        return jsonResponse(
          { error: 'Google Drive tidak mengembalikan ID file setelah unggahan selesai.' },
          502
        );
      }
      return jsonResponse({
        complete: true,
        status: driveRes.status,
        file: {
          id: fileData.id,
          name: fileData.name,
          mimeType: fileData.mimeType,
          size: fileData.size,
          webViewLink: fileData.webViewLink,
          webContentLink: fileData.webContentLink,
          createdTime: fileData.createdTime,
        },
      });
    }

    const errText = await driveRes.text().catch(() => '');
    return jsonResponse(
      {
        error: `Google Drive menolak pengiriman chunk (HTTP ${driveRes.status}): ${errText.slice(0, 160)}`,
        driveStatus: driveRes.status,
      },
      driveRes.status >= 400 && driveRes.status < 500 ? driveRes.status : 502
    );
  } catch (err) {
    return jsonResponse(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Gagal meneruskan chunk unggahan ke Google Drive.',
      },
      502
    );
  }
}
