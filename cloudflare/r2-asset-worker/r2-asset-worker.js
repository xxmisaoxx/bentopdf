/**
 * R2 Asset CDN Worker
 *
 * Serves large WASM files from the vietpdf-assets R2 bucket
 * with proper CORS and caching headers for browser consumption.
 *
 * Deploy: cd cloudflare && npx wrangler deploy
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const key = url.pathname.slice(1); // remove leading /

    if (!key) {
      return new Response('Not found', { status: 404 });
    }

    const origin = request.headers.get('Origin') || '';
    const allowedOrigins = [
      'https://www.vietpdf.com',
      'https://vietpdf.com',
      'http://localhost:3000',
      'http://localhost:5173',
    ];
    const isAllowed = allowedOrigins.includes(origin) || !origin;

    const corsHeaders =
      isAllowed && origin
        ? {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Max-Age': '86400',
          }
        : {};

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const object = await env.vietpdf_assets.get(key);

      if (!object) {
        return new Response('Not found', { status: 404 });
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

      // Apply CORS headers
      for (const [k, v] of Object.entries(corsHeaders)) {
        headers.set(k, v);
      }

      return new Response(object.body, { headers });
    } catch (err) {
      console.error('R2 fetch error:', err);
      return new Response('Internal error', { status: 500 });
    }
  },
};
