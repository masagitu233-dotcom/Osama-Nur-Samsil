import {
  generateRandomNonce,
  parseEncryptionKey,
  signOAuthState,
} from './_lib/cryptoVault.mts';
import { AuthError, getAdminOwnerEmail, requireVerifiedAdmin } from './_lib/firebaseAuth.mts';
import { saveOAuthStateNonce } from './_lib/blobStore.mts';
import {
  getMissingDriveEnvVars,
  GOOGLE_DRIVE_SCOPES,
  jsonResponse,
  resolveOAuthRedirectUri,
} from './_lib/gdriveApi.mts';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405);
  }

  let admin;
  try {
    admin = await requireVerifiedAdmin(req);
  } catch (err) {
    const status = err instanceof AuthError ? err.status : 401;
    return jsonResponse({ error: err instanceof Error ? err.message : 'Unauthorized' }, status);
  }

  const missing = getMissingDriveEnvVars();
  if (missing.length > 0) {
    return jsonResponse(
      {
        error: `Konfigurasi environment variable Netlify belum lengkap: ${missing.join(', ')}.`,
        missingConfig: missing,
      },
      503
    );
  }

  try {
    const reqUrl = new URL(req.url);
    const originHeader = req.headers.get('origin') || req.headers.get('Origin');
    let returnOrigin = reqUrl.origin;
    if (originHeader) {
      try {
        const parsedOrigin = new URL(originHeader);
        if (parsedOrigin.protocol === 'https:' || parsedOrigin.protocol === 'http:') {
          returnOrigin = parsedOrigin.origin;
        }
      } catch {
        // Fallback to request origin
      }
    }

    const nonce = generateRandomNonce(24);
    const exp = Date.now() + 10 * 60 * 1000; // 10 minutes
    const key = parseEncryptionKey(process.env.GDRIVE_TOKEN_ENCRYPTION_KEY);

    await saveOAuthStateNonce(nonce, {
      uid: admin.uid,
      email: admin.email,
      exp,
    });

    const state = signOAuthState(
      {
        nonce,
        uid: admin.uid,
        email: admin.email,
        returnOrigin,
        exp,
      },
      key
    );

    const redirectUri = resolveOAuthRedirectUri(req);
    const expectedOwner = getAdminOwnerEmail();

    const params = new URLSearchParams({
      client_id: (process.env.GOOGLE_DRIVE_CLIENT_ID || '').trim(),
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: GOOGLE_DRIVE_SCOPES,
      access_type: 'offline',
      prompt: 'consent select_account',
      include_granted_scopes: 'true',
      login_hint: expectedOwner,
      state,
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return jsonResponse({ authUrl, redirectUri });
  } catch (err) {
    return jsonResponse(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Gagal memulai alur otorisasi Google Drive OAuth.',
      },
      500
    );
  }
}
