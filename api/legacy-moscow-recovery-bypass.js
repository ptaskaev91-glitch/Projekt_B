const TARGET = 'https://projekt-75bxxqdtq-pavels-projects-0b29bb12.vercel.app/__recover_e6d279bb3638ec55db13b5cde1646ca4018f758420725bc6504c927c7508bab6';

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'method' });
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET || '';
  if (!bypass) return res.status(503).json({ ok: false, error: 'automation-bypass-unavailable' });
  try {
    const r = await fetch(TARGET, {
      headers: {
        'x-vercel-protection-bypass': bypass,
        'x-vercel-set-bypass-cookie': 'true',
      },
      redirect: 'follow',
    });
    const text = await r.text();
    res.status(r.status);
    res.setHeader('content-type', r.headers.get('content-type') || 'text/plain; charset=utf-8');
    return res.send(text.slice(0, 40000));
  } catch (error) {
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
}
