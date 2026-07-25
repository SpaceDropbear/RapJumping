/**
 * Content invariants for src/content/**\/*.md. Run as part of `npm run build`.
 *
 * These encode things that are true of the whole published corpus and must stay true.
 * They exist because a machine-converted batch silently violated all of them at once:
 * 9 posts shipped carrying 295 em dashes when the other 151 posts had exactly zero.
 *
 *   1. NO EM DASHES. The house voice does not use them; a converted HTML draft is full of
 *      them, and they are the loudest "this was machine-written" tell on the page. Fix them
 *      editorially (comma / full stop / colon / recast), never with a blind global replace.
 *   2. NO OPERATOR VOICE. The site has operated nothing since 31 Mar 2020 and is
 *      content/affiliate-only. First-person operator claims are a compliance defect.
 *   3. NO /contact BOOKING CTA. There are no bookings to take.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'src/content';

// ERRORS fail the build. Only unambiguous invariants belong here - a gate that cries wolf
// gets switched off, and then it protects nothing.
const ERRORS = [
  {
    // En dash (–) belongs here too: the corpus contains zero, and the only three that ever
    // appeared arrived inside a converted HTML table as date ranges ("Nov–Mar"). House style
    // writes those as "Nov to Mar".
    id: 'em-dash',
    label: 'EM/EN DASH (house style is zero; fix editorially, not with a global replace)',
    rx: /[—–]/g,
  },
  {
    id: 'contact-cta',
    label: 'BOOKING CTA to /contact (the site takes no bookings)',
    rx: /\]\(\/contact\/?\)/g,
  },
];

// WARNINGS are reported but do not fail. Operator voice cannot be detected without false
// positives, and the false positives are the APPROVED phrasing:
//   "with a qualified operator, equipment supplied"  <- correct, describes a third party
//   "our guided vs DIY decision guide"               <- an article title, not a session
// So this tier flags candidates for a human to read, rather than blocking a deploy.
const WARNINGS = [
  {
    id: 'operator-voice',
    label: 'POSSIBLE OPERATOR VOICE - read each one (site has operated nothing since 31 Mar 2020)',
    // NOTE the `(\]\([^)]*\))?` — in markdown the brand is usually a LINK, so the raw text
    // reads "Rap Jumping](/) teaches", and a pattern expecting the verb adjacent to the name
    // silently misses every linked instance. That blind spot shipped one live claim.
    // Past tense is deliberately NOT flagged: "At Rap Jumping, we relied on 11mm static rope"
    // is a true historical statement about an operation that ceased 31 Mar 2020, and the
    // house rule is to keep those in past tense rather than delete them.
    rx: /\bour (guided|supervised) (session|descent|abseil|experience|trip|tour)s?|\bwe (run|teach|operate)\b|book a Rap Jumping|Rap Jumping(\]\([^)]*\))?,? (offers|provides|runs|teaches|supplies|operates)\b|at \[?Rap Jumping\]?(\([^)]*\))?, our guides/gi,
  },
];

function walk(dir) {
  return readdirSync(dir).flatMap((e) => {
    const p = join(dir, e);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.md') ? [p] : [];
  });
}

// ---- internal link integrity -------------------------------------------------------
// Every root-relative link in content must resolve. This exists because renaming one post's
// slug silently 404'd two sibling posts that linked to the old one: the rename was checked
// against the hub but not against spokes being converted in the same batch.
const slugs = new Set();
for (const sub of ['blog', 'pages']) {
  const d = join(ROOT, sub);
  try {
    readdirSync(d).forEach((f) => f.endsWith('.md') && slugs.add(f.replace(/\.md$/, '')));
  } catch {}
}
// Routes that exist without a content file backing them.
const ROUTES = new Set(['', 'blog', 'about', 'privacy', 'terms-conditions', '404', 'rss.xml']);

function badLinks(text) {
  const out = [];
  const rx = /\]\((\/[^)#?\s]*)/g;
  let m;
  while ((m = rx.exec(text))) {
    const path = m[1].replace(/^\/|\/$/g, '');
    if (!path || ROUTES.has(path) || slugs.has(path)) continue;
    if (path.startsWith('tag/') || path.startsWith('blog/') || path.startsWith('images/')) continue;
    out.push(m[1]);
  }
  return out;
}

const ALL = [...ERRORS, ...WARNINGS];
const found = Object.fromEntries(ALL.map((c) => [c.id, []]));
found['dead-link'] = [];
let files = 0;

for (const file of walk(ROOT)) {
  files++;
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const dead of badLinks(line)) {
      found['dead-link'].push(
        `${file.replace(/\\/g, '/')}:${i + 1}  «${dead}»  ${line.trim().slice(0, 90)}`
      );
    }
    for (const c of ALL) {
      c.rx.lastIndex = 0;
      if (!c.rx.test(line)) continue;
      c.rx.lastIndex = 0;
      const hit = (line.match(c.rx) || [])[0];
      found[c.id].push(
        `${file.replace(/\\/g, '/')}:${i + 1}  «${String(hit).trim()}»  ${line.trim().slice(0, 110)}`
      );
    }
  });
}

function report(group, tag, sink) {
  let n = 0;
  for (const c of group) {
    const list = found[c.id];
    if (!list.length) continue;
    n += list.length;
    sink(`\n  ${tag} - ${c.label} (${list.length}):`);
    list.slice(0, 25).forEach((l) => sink(`    ${l}`));
    if (list.length > 25) sink(`    ... and ${list.length - 25} more`);
  }
  return n;
}

const warned = report(WARNINGS, 'WARN', (s) => console.warn(s));
let bad = report(ERRORS, 'FAIL', (s) => console.error(s));

if (found['dead-link'].length) {
  bad += found['dead-link'].length;
  console.error(`\n  FAIL - INTERNAL LINK 404 (target slug does not exist) (${found['dead-link'].length}):`);
  found['dead-link'].slice(0, 25).forEach((l) => console.error(`    ${l}`));
}

if (bad) {
  console.error(`\n${files} content files linted, ${bad} blocking violation(s).\n`);
  process.exit(1);
}
console.log(
  `OK - ${files} content files: no em dashes, no /contact CTA.` +
    (warned ? ` (${warned} operator-voice warning(s) above, non-blocking)` : '')
);
