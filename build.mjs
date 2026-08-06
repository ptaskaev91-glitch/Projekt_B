import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('dist', { recursive: true });
await writeFile(
  'dist/_mirror-status.txt',
  'Map-K Vercel mirror is configured through external rewrites.\n',
  'utf8',
);

console.log('Map-K mirror output prepared');
