// Single source of truth for responsive image variants.
//
// Astro's own <Image> pipeline is unusable here: images referenced by public URL are a
// passthrough (no resize, no srcset), and switching to the Cloudflare adapter's
// imageService 'compile' crashes because Astro 6.4 reads originals from dist/_astro while
// the adapter writes them to dist/client/_astro. So we resize with sharp ourselves.
//
// Originals stay in public/images/** and keep their URLs, which matters: they are indexed
// by Google Images, baked into cached social cards, and used as og:image. Derivatives are
// generated into public/images/_v/** at build time and are git-ignored.
//
// scripts/gen-image-variants.mjs and src/components/SmartImage.astro both import this, so
// the widths a page requests can never drift from the widths that exist on disk.

/**
 * Widths generated for every image. A post hero renders at most 760px wide (wrap-narrow),
 * so 1140w covers it at ~1.5x DPR. Cards top out near 360px and rows at 140px.
 */
export const WIDTH_LADDER = [140, 280, 380, 560, 760, 1140];

/**
 * The home hero is the only full-bleed image on the site, so it is the only one that ever
 * needs a 1600w variant. Generating 1600w for all 164 images cost 13.3 MB, a third of the
 * entire derivative payload, for files no page ever requests.
 */
export const EXTRA_WIDTHS = {
  '/images/2025/07/rapjumping-extreme-urban-adventure.webp': [1600],
};

/** Every width that should exist on disk for a given source. */
export function widthsFor(publicPath) {
  const extra = EXTRA_WIDTHS[publicPath] ?? [];
  return [...new Set([...WIDTH_LADDER, ...extra])].sort((a, b) => a - b);
}

/** Where generated derivatives live, relative to public/. Git-ignored. */
export const VARIANT_DIR = '_v';

export const WEBP_QUALITY = 78;

/**
 * Public URL of a derivative.
 *   /images/2025/08/foo.webp + 380  ->  /images/_v/2025/08/foo-380w.webp
 * Returns null for anything that is not an image under /images/.
 */
export function variantUrl(src, width) {
  const rel = toRelative(src);
  if (!rel) return null;
  const dot = rel.lastIndexOf('.');
  const stem = dot === -1 ? rel : rel.slice(0, dot);
  return `/images/${VARIANT_DIR}/${stem}-${width}w.webp`;
}

/** "/images/2025/08/foo.webp" -> "2025/08/foo.webp"; null if it is not under /images/. */
export function toRelative(src) {
  if (typeof src !== 'string') return null;
  const prefix = '/images/';
  if (!src.startsWith(prefix)) return null;
  const rel = src.slice(prefix.length);
  // Never treat an already-generated derivative as a source.
  if (rel.startsWith(`${VARIANT_DIR}/`)) return null;
  return rel;
}
