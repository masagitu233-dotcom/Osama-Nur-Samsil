const VALID_ID = /^[a-zA-Z0-9_-]{10,120}$/;
const VALID_RESOURCE_KEY = /^[a-zA-Z0-9_-]{4,120}$/;
const ALLOWED_SIZES = new Set(['w400', 'w800', 'w1000', 'w1600', 'w2000']);
const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

/**
 * Hardened Netlify Function proxy for public Google Drive images.
 * - Accepts ONLY a validated Drive file ID (no arbitrary URLs -> prevents SSRF).
 * - Uses zero API keys or private credentials.
 * - Strictly validates that upstream returns a safe raster image/* MIME type (rejects HTML/SVG).
 */
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const url = new URL(req.url);
  const fileId = (url.searchParams.get('id') || '').trim();
  const rawSize = (url.searchParams.get('sz') || 'w1600').trim();
  const rawResourceKey = (url.searchParams.get('resourcekey') || '').trim();

  if (!VALID_ID.test(fileId)) {
    return new Response(JSON.stringify({ error: 'Invalid Google Drive file ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' },
    });
  }

  const size = ALLOWED_SIZES.has(rawSize) ? rawSize : 'w1600';
  const resourceKey = rawResourceKey && VALID_RESOURCE_KEY.test(rawResourceKey) ? rawResourceKey : '';
  const rkQuery = resourceKey ? `&resourcekey=${encodeURIComponent(resourceKey)}` : '';

  const upstreamTargets = [
    `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=${size}${rkQuery}`,
    `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}=${size}`,
    `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=view${rkQuery}`,
  ];

  for (const target of upstreamTargets) {
    try {
      const upstream = await fetch(target, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          Accept: 'image/avif,image/webp,image/png,image/jpeg,*/*;q=0.8',
        },
      });

      if (!upstream.ok) continue;

      const rawContentType = (upstream.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
      if (!ALLOWED_IMAGE_MIMES.has(rawContentType)) {
        continue;
      }

      const body = req.method === 'HEAD' ? null : await upstream.arrayBuffer();
      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type': rawContentType,
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
          'X-Content-Type-Options': 'nosniff',
          'Cross-Origin-Resource-Policy': 'cross-origin',
        },
      });
    } catch {
      // Try next upstream endpoint
    }
  }

  return new Response(
    JSON.stringify({ error: 'Google Drive image could not be fetched. Ensure public link sharing is enabled.' }),
    {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    }
  );
}
