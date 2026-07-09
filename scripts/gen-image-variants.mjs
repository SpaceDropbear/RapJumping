// Generate responsive derivatives for every image in public/images/**.
//
// Runs before `astro build` (and before `astro dev`, so the dev server serves the same
// files production will). Output goes to public/images/_v/** and is git-ignored.
//
// It never upscales: a width is skipped when the source is not wider than it. It is also
// incremental, so a rebuild only touches images whose source is newer than its derivative,
// and it writes src/generated/image-manifest.json so SmartImage knows, at build time,
// exactly which widths exist for each source.

import { mkdirSync, readdirSync, statSync, existsSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import sharp from 'sharp';
import { widthsFor, VARIANT_DIR, WEBP_QUALITY, toRelative } from '../src/lib/image-variants.mjs';

const IMAGES = join(process.cwd(), 'public', 'images');
const VARIANTS = join(IMAGES, VARIANT_DIR);
const MANIFEST = join(process.cwd(), 'src', 'generated', 'image-manifest.json');
const SOURCE_EXT = /\.(webp|jpe?g|png)$/i;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (full === VARIANTS) continue; // never treat derivatives as sources
      walk(full, out);
    } else if (SOURCE_EXT.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const sources = existsSync(IMAGES) ? walk(IMAGES) : [];
const manifest = {};
const expected = new Set();
let generated = 0;
let reused = 0;

for (const source of sources) {
  const rel = relative(IMAGES, source).split(sep).join('/');
  const publicPath = `/images/${rel}`;
  if (!toRelative(publicPath)) continue;

  const meta = await sharp(source).metadata();
  const srcMtime = statSync(source).mtimeMs;
  // Never upscale: only offer widths the original can actually satisfy.
  const widths = widthsFor(publicPath).filter((w) => w < meta.width);
  manifest[publicPath] = { width: meta.width, height: meta.height, widths };
  if (!widths.length) continue;

  const dot = rel.lastIndexOf('.');
  const stem = dot === -1 ? rel : rel.slice(0, dot);

  for (const width of widths) {
    const out = join(VARIANTS, `${stem}-${width}w.webp`.split('/').join(sep));
    expected.add(out);
    if (existsSync(out) && statSync(out).mtimeMs >= srcMtime) {
      reused++;
      continue;
    }
    mkdirSync(dirname(out), { recursive: true });
    await sharp(source).resize({ width }).webp({ quality: WEBP_QUALITY }).toFile(out);
    generated++;
  }
}

// Prune derivatives whose source or width no longer exists, otherwise a renamed image or a
// narrowed ladder leaves orphans that still get copied into the deploy.
let pruned = 0;
if (existsSync(VARIANTS)) {
  for (const file of walk(VARIANTS)) {
    if (!expected.has(file)) {
      rmSync(file);
      pruned++;
    }
  }
}

mkdirSync(dirname(MANIFEST), { recursive: true });
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

console.log(
  `[images] ${sources.length} sources, ${generated} generated, ${reused} reused, ${pruned} pruned`,
);
