// Resize + compress the raw PNGs from capture.mjs for the repo. See SKILL.md.
// Run from the same scratch directory (npm install --no-save sharp).

import sharp from 'sharp';
import { mkdirSync, readdirSync } from 'fs';

const SRC = new URL('./shots/', import.meta.url).pathname;
const OUT = new URL('./optimized/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const files = readdirSync(SRC).filter((f) => f.endsWith('.png'));

for (const f of files) {
  const name = f.replace(/\.png$/, '');
  const outPath = `${OUT}${name}.jpg`;
  const info = await sharp(`${SRC}${f}`)
    .resize({ width: 1280 })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(outPath);
  console.log(name, `${(info.size / 1024).toFixed(0)}KB`);
}
console.log('done — copy optimized/*.jpg into docs/screenshots/');
