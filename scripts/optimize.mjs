// One-off asset optimizer: PNG/JPG -> WebP (resized), hero GIF -> animated WebP,
// plus a small JPG for the OG social image. Run: node scripts/optimize.mjs
import sharp from 'sharp';
import { statSync } from 'node:fs';

sharp.cache(false);
const IMG = 'public/img';
const kb = (p) => (statSync(p).size / 1024).toFixed(0) + ' KB';

const stills = [
  { in: `${IMG}/thunderstix-packs.png`, out: `${IMG}/thunderstix-packs.webp`, w: 1200, q: 80 },
  { in: `${IMG}/doc-hudu.png`,          out: `${IMG}/doc-hudu.webp`,          w: 1200, q: 82 },
  { in: `${IMG}/thunder-scoops.png`,    out: `${IMG}/thunder-scoops.webp`,    w: 1100, q: 82 },
];

for (const j of stills) {
  await sharp(j.in).resize({ width: j.w, withoutEnlargement: true }).webp({ quality: j.q }).toFile(j.out);
  console.log(j.out, '->', kb(j.out));
}

// Hero background: animated GIF -> animated WebP (faint atmospheric layer, keep it small)
await sharp(`${IMG}/hero-doc.gif`, { animated: true })
  .resize({ width: 460, withoutEnlargement: true })
  .webp({ quality: 46, effort: 6 })
  .toFile(`${IMG}/hero-doc.webp`);
console.log(`${IMG}/hero-doc.webp`, '->', kb(`${IMG}/hero-doc.webp`));

// OG social image (scrapers prefer jpg/png over webp)
await sharp(`${IMG}/thunderstix-packs.png`).resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 78 }).toFile(`${IMG}/og-cover.jpg`);
console.log(`${IMG}/og-cover.jpg`, '->', kb(`${IMG}/og-cover.jpg`));

console.log('done.');
