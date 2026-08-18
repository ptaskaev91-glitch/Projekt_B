import crypto from 'node:crypto';

const TOKEN_SHA256 = '6891d5e6bce3f7bc0797a5b8326dd4fc61e665891490b03ae73b7e61f6cef4ea';
const CONTROL_ID = 20004;
const CONTROL_ACTION = 'update_agent';

function validToken(req) {
  const raw = req.headers['x-server-token'];
  const token = Array.isArray(raw) ? raw[0] : raw;
  if (!token) return false;
  const digest = crypto.createHash('sha256').update(String(token)).digest('hex');
  const a = Buffer.from(digest, 'hex');
  const b = Buffer.from(TOKEN_SHA256,'hex');
  return a.length === b.length && crypto.timingSafeEqual(a,b);
}
async function body(req){if(typeof req.body==='string')return req.body;if(Buffer.isBuffer(req.body))return req.body.toString('utf8');if(req.body&&typeof req.body==='object')return JSON.stringify(req.body);const chunks=[];for await(const c of req)chunks.push(Buffer.isBuffer(c)?c:Buffer.from(c));return Buffer.concat(chunks).toString('utf8');}
export default async function handler(req,res){res.setHeader('cache-control','no-store');if(!validToken(req))return res.status(404).send('Not found');const mode=new URL(req.url,'https://control.invalid').searchParams.get('mode');if(mode==='control'&&req.method==='GET')return res.status(200).json({id:CONTROL_ID,action:CONTROL_ACTION});if(mode==='output'&&req.method==='POST'){const text=await body(req);console.log(`SERVER_CONTROL_V2_OUTPUT ${text.slice(0,12000)}`);return res.status(204).end();}return res.status(404).send('Not found');}
