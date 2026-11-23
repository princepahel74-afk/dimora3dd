import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';

const frontend = new URL('../frontend/', import.meta.url);
const output = new URL('../dist/', import.meta.url);
await mkdir(output, { recursive: true });
await cp(frontend, output, { recursive: true });
const index = new URL('index.html', output);
const html = await readFile(index, 'utf8');
await writeFile(index, html
  .replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="dimora-hosting" content="private">')
  .replace('DIMORA turns any floor plan into a furnished, priced 3D home you can walk through — with Aria, an AI tour guide powered by Cloudflare Workers AI.', 'Explore the DIMORA duplex, its furnished rooms and the surrounding neighbourhood in an interactive 3D studio.')
  .replace('DIMORA — AI Floor Plan to 3D Home Designer', 'DIMORA — 3D Home Studio'));
