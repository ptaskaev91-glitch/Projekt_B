export default function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  const names = Object.keys(process.env)
    .filter(k => /(SSH|VPS|TIMEWEB|TWC|CLOUD|SERVER|BYPASS|VERCEL|GITHUB|GIT)/i.test(k))
    .sort();
  return res.status(200).json({ ok: true, names });
}
