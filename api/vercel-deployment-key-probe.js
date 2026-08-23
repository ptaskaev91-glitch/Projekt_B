export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ok:false,error:'method'});
  const key = process.env.VERCEL_DEPLOYMENT_KEY || '';
  const project = process.env.VERCEL_PROJECT_ID || '';
  if (!key || !project) return res.status(503).json({ok:false,error:'missing-system-key'});
  try {
    const r = await fetch(`https://api.vercel.com/v9/projects/${encodeURIComponent(project)}?teamId=team_Al8T25YVhuqdCqlFmP8MTwZb`, {
      headers: { authorization: `Bearer ${key}` }
    });
    let shape = [];
    let errorCode = null;
    try {
      const j = await r.json();
      shape = j && typeof j === 'object' ? Object.keys(j).slice(0,30) : [];
      errorCode = j?.error?.code || null;
    } catch {}
    return res.status(200).json({ok:true,status:r.status,shape,errorCode});
  } catch (e) {
    return res.status(500).json({ok:false,error:e instanceof Error?e.message:String(e)});
  }
}
