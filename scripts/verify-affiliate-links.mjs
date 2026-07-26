/**
 * Affiliate link audit over dist/client. Run AFTER `astro build`.
 *
 * Every affiliate anchor on this site must satisfy all four gates:
 *   1. tracked   - carries the network's tracking params (never a bare merchant URL)
 *   2. rel       - carries rel="sponsored" AND rel="nofollow" (Bing documents nofollow,
 *                  not sponsored, and this site has real Bing traffic)
 *   3. callout   - sits INSIDE a .gear-pick callout box, never loose in body prose
 *   4. disclosed - its page renders the <aside class="affiliate-note"> disclosure
 *
 * Exits non-zero on any violation so it can gate a deploy.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { GYG_VERIFIED, GYG_CATEGORY_PAGES } from '../src/data/affiliates.mjs';

// Every GYG activity URL a human has actually clicked through to a real product page.
// A withdrawn activity 301s to a search page rather than 404ing, so a status check cannot
// tell them apart - and the check CANNOT be automated (Cloudflare blocks it partway, and
// in a half-blocked run the passes are the lies). So this is a ledger, not a prober:
// it warns when content gains a GYG link nobody has verified yet.
const VERIFIED = new Set([...Object.values(GYG_VERIFIED).flat(), ...GYG_CATEGORY_PAGES]);
const unverified = new Map();

const DIST = 'dist/client';

// Merchant domains that are LIVE. A bare link to one of these is lost revenue.
const AFFILIATE_HOSTS = [/getyourguide\.com/i, /t\.cfjump\.com/i];
const TRACKING = [/partner_id=/i, /t\.cfjump\.com\/\d+\/t\//i];

function walk(dir) {
  return readdirSync(dir).flatMap((e) => {
    const p = join(dir, e);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
  });
}

// Extent of each callout box, matched by DIV DEPTH. Callouts do contain nested divs,
// so stopping at the first </div> would under-scope the box and wrongly report links
// inside it as "loose" (or, worse, over-scope and pass a loose link).
function calloutRanges(html) {
  const ranges = [];
  const open = /<div\b[^>]*>/gi;
  const rx = /<div class="gear-pick[^"]*">/g;
  let m;
  while ((m = rx.exec(html))) {
    const start = m.index;
    let depth = 0, i = start, end = html.length;
    // scan tag by tag from the box's opening <div>
    const tag = /<\/?div\b[^>]*>/gi;
    tag.lastIndex = start;
    let t;
    while ((t = tag.exec(html))) {
      depth += t[0].startsWith('</') ? -1 : 1;
      if (depth === 0) { end = t.index; break; }
    }
    void open; void i;
    ranges.push([start, end]);
  }
  return ranges;
}

const anchorRx = /<a\s[^>]*href="([^"]+)"[^>]*>/g;
let total = 0;
const fail = { untracked: [], rel: [], loose: [], undisclosed: [] };

for (const file of walk(DIST)) {
  const html = readFileSync(file, 'utf8');
  const boxes = calloutRanges(html);
  const disclosed = html.includes('<aside class="affiliate-note">');
  const page = file.replace(/\\/g, '/').replace(`${DIST}/`, '').replace(/\/index\.html$/, '');
  let onPage = 0;

  let m;
  anchorRx.lastIndex = 0;
  while ((m = anchorRx.exec(html))) {
    const [tag, href] = m;
    if (!AFFILIATE_HOSTS.some((h) => h.test(href))) continue;
    total++; onPage++;

    if (!TRACKING.some((t) => t.test(href))) fail.untracked.push(`${page} :: ${href.slice(0, 90)}`);
    const rel = (tag.match(/rel="([^"]*)"/) || [, ''])[1];
    if (!/sponsored/.test(rel) || !/nofollow/.test(rel))
      fail.rel.push(`${page} :: rel="${rel}"`);
    if (!boxes.some(([s, e]) => m.index > s && m.index < e))
      fail.loose.push(`${page} :: ${href.slice(0, 90)}`);

    const g = href.match(/getyourguide\.com\/([^?"]+?)\/?(?:\?|$)/);
    if (g && !VERIFIED.has(g[1])) {
      if (!unverified.has(g[1])) unverified.set(g[1], new Set());
      unverified.get(g[1]).add(page);
    }
  }
  if (onPage > 0 && !disclosed) fail.undisclosed.push(page);
}


if (unverified.size) {
  console.warn(`
  WARN - GetYourGuide URLs not in the click-verified ledger (${unverified.size}):`);
  for (const [slug, pages] of unverified)
    console.warn(`    ${slug}  (on ${[...pages].length} page(s))`);
  console.warn('    A dead GYG activity 301s to a search page, it does NOT 404, so only a');
  console.warn('    human click can confirm these. Add to GYG_VERIFIED in src/data/affiliates.mjs.');
}

const labels = {
  untracked: 'NOT TRACKED (unpaid clicks)',
  rel: 'MISSING rel sponsored/nofollow',
  loose: 'OUTSIDE a callout box',
  undisclosed: 'PAGE MISSING affiliate disclosure',
};
let bad = 0;
for (const [k, list] of Object.entries(fail)) {
  if (!list.length) continue;
  bad += list.length;
  console.error(`\n  FAIL - ${labels[k]} (${list.length}):`);
  list.forEach((l) => console.error(`    ${l}`));
}

if (bad) {
  console.error(`\n${total} affiliate links checked, ${bad} violation(s).\n`);
  process.exit(1);
}
console.log(`OK - ${total} affiliate links: all tracked, rel-correct, inside a callout, disclosed.`);
