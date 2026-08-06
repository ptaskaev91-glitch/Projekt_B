const UPSTREAM_ORIGIN = 'https://ptaskaev91-glitch.github.io';
const FALLBACK_ORIGIN = 'https://projekt-fia1g7wi3-pavels-projects-0b29bb12.vercel.app';

function resolveUpstreamPath(pathname) {
  if (!pathname || pathname === '/') return '/Map-K/';
  if (pathname === '/Map-K') return '/Map-K/';
  if (pathname.startsWith('/Map-K/')) return pathname;
  return `/Map-K${pathname.startsWith('/') ? '' : '/'}${pathname}`;
}

function fallbackHtml(requestUrl) {
  const url = new URL(requestUrl, 'https://mirror.invalid');
  const destination = `${FALLBACK_ORIGIN}${url.pathname === '/' ? '/' : url.pathname}${url.search}${url.hash}`;
  const escaped = JSON.stringify(destination);
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta http-equiv="refresh" content="0;url=${destination}"><title>Map-K — зеркало</title><script>location.replace(${escaped})</script></head><body><p><a href="${destination}">Открыть рабочую версию</a></p></body></html>`;
}

export default async function handler(request, response) {
  const requestUrl = new URL(request.url, 'https://mirror.invalid');
  const upstreamUrl = new URL(resolveUpstreamPath(requestUrl.pathname), UPSTREAM_ORIGIN);
  upstreamUrl.search = requestUrl.search;

  try {
    const upstream = await fetch(upstreamUrl, {
      redirect: 'follow',
      headers: {
        accept: request.headers.accept || '*/*',
        'user-agent': 'Map-K-Vercel-Mirror/1.0',
      },
    });

    if (upstream.ok) {
      const body = Buffer.from(await upstream.arrayBuffer());
      for (const header of ['content-type', 'cache-control', 'etag', 'last-modified']) {
        const value = upstream.headers.get(header);
        if (value) response.setHeader(header, value);
      }
      response.setHeader('x-map-k-mirror', 'github-pages');
      response.setHeader('x-robots-tag', 'noindex, nofollow');
      response.setHeader('x-content-type-options', 'nosniff');
      response.setHeader('referrer-policy', 'strict-origin-when-cross-origin');
      return response.status(upstream.status).send(body);
    }
  } catch (error) {
    console.error('Map-K upstream unavailable:', error instanceof Error ? error.message : String(error));
  }

  const isDocument = requestUrl.pathname === '/' || requestUrl.pathname === '/Map-K' || requestUrl.pathname === '/Map-K/' || requestUrl.pathname.endsWith('.html');
  if (isDocument) {
    response.setHeader('content-type', 'text/html; charset=utf-8');
    response.setHeader('cache-control', 'no-store');
    response.setHeader('x-map-k-mirror', 'fallback');
    response.setHeader('x-robots-tag', 'noindex, nofollow');
    response.setHeader('x-content-type-options', 'nosniff');
    response.setHeader('referrer-policy', 'strict-origin-when-cross-origin');
    return response.status(200).send(fallbackHtml(request.url));
  }

  response.setHeader('cache-control', 'no-store');
  response.setHeader('x-map-k-mirror', 'upstream-unavailable');
  return response.status(404).send('Map-K mirror asset is not available yet.');
}
