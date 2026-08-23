const TARGET = 'https://projekt-8hc8i67a5-pavels-projects-0b29bb12.vercel.app/__recover_e6d279bb3638ec55db13b5cde1646ca4018f758420725bc6504c927c7508bab6';

function addCookies(jar, headers) {
  const all = typeof headers.getSetCookie === 'function' ? headers.getSetCookie() : [];
  const values = all.length ? all : (headers.get('set-cookie') ? [headers.get('set-cookie')] : []);
  for (const raw of values) {
    const first = String(raw).split(';', 1)[0];
    const p = first.indexOf('=');
    if (p > 0) jar.set(first.slice(0, p).trim(), first.slice(p + 1).trim());
  }
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'method' });
  const share = String(req.query?.share || '');
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(share)) return res.status(400).json({ ok: false, error: 'share' });

  const jar = new Map();
  let url = `${TARGET}?_vercel_share=${encodeURIComponent(share)}`;
  try {
    for (let i = 0; i < 8; i += 1) {
      const r = await fetch(url, {
        method: 'GET',
        redirect: 'manual',
        headers: jar.size ? { cookie: cookieHeader(jar) } : {},
      });
      addCookies(jar, r.headers);
      if (r.status >= 300 && r.status < 400) {
        const loc = r.headers.get('location');
        if (!loc) return res.status(502).json({ ok: false, error: 'redirect-without-location', step: i, status: r.status });
        url = new URL(loc, url).toString();
        continue;
      }
      const text = await r.text();
      res.status(r.status);
      res.setHeader('content-type', r.headers.get('content-type') || 'text/plain; charset=utf-8');
      return res.send(text.slice(0, 40000));
    }
    return res.status(508).json({ ok: false, error: 'too-many-redirects' });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
}
