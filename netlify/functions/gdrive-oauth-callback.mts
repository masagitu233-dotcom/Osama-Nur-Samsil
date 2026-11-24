import { parseEncryptionKey, verifyOAuthState } from './_lib/cryptoVault.mts';
import { getAdminOwnerEmail } from './_lib/firebaseAuth.mts';
import {
  consumeOAuthStateNonce,
  loadEncryptedDriveCredentials,
  saveEncryptedDriveCredentials,
} from './_lib/blobStore.mts';
import {
  ensureFolderHierarchy,
  escapeHtml,
  exchangeAuthCodeForTokens,
  fetchGoogleAccountEmail,
  resolveOAuthRedirectUri,
  revokeGoogleToken,
} from './_lib/gdriveApi.mts';

function renderCallbackHtml(params: {
  ok: boolean;
  title: string;
  message: string;
  targetOrigin: string;
  connectedEmail?: string;
}): Response {
  const safeTitle = escapeHtml(params.title);
  const safeMessage = escapeHtml(params.message);
  const payloadJson = JSON.stringify({
    type: 'GDRIVE_OAUTH_RESULT',
    ok: params.ok,
    message: params.message,
    email: params.connectedEmail || null,
  }).replace(/</g, '\\u003c');
  const originJson = JSON.stringify(params.targetOrigin).replace(/</g, '\\u003c');
  const adminUrl = `${params.targetOrigin.replace(/\/+$/, '')}/admin`;
  const safeAdminUrl = escapeHtml(adminUrl);

  const html = `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${safeTitle}</title>
  <style>
    body { margin:0; padding:24px; background:#F8F8E1; color:#013A42; font-family:system-ui,-apple-system,sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; box-sizing:border-box; }
    .card { max-width:480px; width:100%; background:#F8F8E1; border:3px solid #013A42; box-shadow:6px 6px 0 0 ${params.ok ? '#0F3D3A' : '#6C151E'}; padding:24px; }
    .badge { display:inline-block; padding:4px 10px; font-size:12px; font-weight:800; text-transform:uppercase; background:${params.ok ? '#8ACCD5' : '#6C151E'}; color:${params.ok ? '#013A42' : '#F8F8E1'}; border:2px solid #013A42; }
    h1 { margin:14px 0 10px; font-size:22px; line-height:1.2; }
    p { margin:0 0 18px; font-size:14px; line-height:1.5; }
    a.btn { display:inline-block; padding:10px 16px; background:#013A42; color:#F8F8E1; text-decoration:none; font-weight:700; font-size:13px; border:2px solid #013A42; }
  </style>
</head>
<body>
  <main class="card">
    <span class="badge">${params.ok ? 'Google Drive Terhubung' : 'Koneksi Dibatalkan / Gagal'}</span>
    <h1>${safeTitle}</h1>
    <p>${safeMessage}</p>
    <a class="btn" href="${safeAdminUrl}">Kembali ke Dashboard Admin</a>
  </main>
  <script>
    (function () {
      var payload = ${payloadJson};
      var targetOrigin = ${originJson};
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(payload, targetOrigin);
          setTimeout(function () { window.close(); }, ${params.ok ? 900 : 2500});
        }
      } catch (e) {}
    })();
  </script>
</body>
</html>`;

  return new Response(html, {
    status: params.ok ? 200 : 400,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const reqUrl = new URL(req.url);
  const fallbackOrigin = (process.env.URL || process.env.DEPLOY_PRIME_URL || reqUrl.origin).replace(/\/+$/, '');
  const oauthError = reqUrl.searchParams.get('error');
  const code = (reqUrl.searchParams.get('code') || '').trim();
  const stateParam = (reqUrl.searchParams.get('state') || '').trim();

  if (oauthError) {
    return renderCallbackHtml({
      ok: false,
      title: 'Otorisasi Google Drive Dibatalkan',
      message: `Google mengembalikan status: ${oauthError}. Anda dapat menutup jendela ini dan mencoba lagi dari Dashboard Admin.`,
      targetOrigin: fallbackOrigin,
    });
  }

  if (!code || !stateParam) {
    return renderCallbackHtml({
      ok: false,
      title: 'Parameter OAuth Tidak Lengkap',
      message: 'Kode otorisasi atau parameter keamanan state tidak ditemukan.',
      targetOrigin: fallbackOrigin,
    });
  }

  let verifiedState;
  try {
    const key = parseEncryptionKey(process.env.GDRIVE_TOKEN_ENCRYPTION_KEY);
    verifiedState = verifyOAuthState(stateParam, key);
  } catch (err) {
    return renderCallbackHtml({
      ok: false,
      title: 'Validasi Keamanan OAuth Gagal',
      message: err instanceof Error ? err.message : 'Parameter state OAuth tidak valid atau telah kedaluwarsa.',
      targetOrigin: fallbackOrigin,
    });
  }

  const targetOrigin = verifiedState.returnOrigin || fallbackOrigin;

  try {
    // Enforce single-use anti-CSRF / anti-replay nonce check
    const nonceRecord = await consumeOAuthStateNonce(verifiedState.nonce);
    if (!nonceRecord || nonceRecord.uid !== verifiedState.uid || nonceRecord.exp < Date.now()) {
      return renderCallbackHtml({
        ok: false,
        title: 'Sesi OAuth Tidak Valid atau Sudah Digunakan',
        message: 'Token sesi keamanan OAuth sudah digunakan atau kedaluwarsa. Silakan mulai ulang dari Dashboard Admin.',
        targetOrigin,
      });
    }

    const redirectUri = resolveOAuthRedirectUri(req);
    const tokens = await exchangeAuthCodeForTokens(code, redirectUri);
    const account = await fetchGoogleAccountEmail(tokens.accessToken);
    const expectedOwner = getAdminOwnerEmail();

    // Enforce single-owner Google Drive binding
    if (!account.emailVerified || account.email !== expectedOwner) {
      await revokeGoogleToken(tokens.refreshToken || tokens.accessToken);
      return renderCallbackHtml({
        ok: false,
        title: 'Akun Google Tidak Sesuai Pemilik Website',
        message: `Akun yang dipilih (${account.email}) tidak sama dengan akun pengelola yang diizinkan (${expectedOwner}). Token telah dibatalkan otomatis demi keamanan.`,
        targetOrigin,
      });
    }

    let finalRefreshToken = tokens.refreshToken;
    if (!finalRefreshToken) {
      const existing = await loadEncryptedDriveCredentials().catch(() => null);
      if (existing?.refreshToken && existing.connectedEmail.toLowerCase() === expectedOwner) {
        finalRefreshToken = existing.refreshToken;
      }
    }

    if (!finalRefreshToken) {
      await revokeGoogleToken(tokens.accessToken);
      return renderCallbackHtml({
        ok: false,
        title: 'Refresh Token Tidak Diterima',
        message:
          'Google tidak mengembalikan refresh token offline. Cabut akses aplikasi ini di myaccount.google.com/permissions lalu hubungkan ulang.',
        targetOrigin,
      });
    }

    await saveEncryptedDriveCredentials({
      refreshToken: finalRefreshToken,
      connectedEmail: account.email,
      connectedAt: new Date().toISOString(),
      scope: tokens.scope,
      cachedAccessToken: tokens.accessToken,
      cachedAccessTokenExpiresAt: Date.now() + tokens.expiresIn * 1000,
    });

    // Provision & cache the Portfolio Website folder hierarchy immediately on connect
    await ensureFolderHierarchy(tokens.accessToken, false);

    return renderCallbackHtml({
      ok: true,
      title: 'Akun Google Drive Berhasil Terhubung',
      message: `Akun ${account.email} terhubung dengan akses offline terenkripsi. Folder "Portfolio Website" beserta 7 subfolder telah disiapkan. Jendela ini akan tertutup otomatis.`,
      targetOrigin,
      connectedEmail: account.email,
    });
  } catch (err) {
    return renderCallbackHtml({
      ok: false,
      title: 'Gagal Menyelesaikan Koneksi Google Drive',
      message:
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat menukar token atau menyiapkan folder Google Drive.',
      targetOrigin,
    });
  }
}
