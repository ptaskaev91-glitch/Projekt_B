import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('dist', { recursive: true });
await writeFile(
  'dist/index.html',
  `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Map-K — зеркало</title>
  </head>
  <body>
    <p>Загрузка Map-K…</p>
  </body>
</html>\n`,
  'utf8',
);

console.log('Map-K mirror shell prepared');
