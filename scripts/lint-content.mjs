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
import { argv } from 'node:process';
import { fileURLToPath } from 'node:url';

// Run the lint only as a CLI. Without this guard, importing `proseSentences` from another
// script executes the whole lint and its process.exit(1), killing the importer.
const IS_CLI = fileURLToPath(import.meta.url) === (argv[1] ? fileURLToPath(new URL(`file://${argv[1].replace(/\\/g, '/')}`)) : '');

const ROOT = 'src/content';

// Compounds that legitimately chain a function word. Without these, `dash-hyphen` below
// reports "before-and-after" as an artifact.
const KEEP_COMPOUND =
  /\b(?:either-or|give-and-take|before-and-after|trial-and-error|back-and-forth|wear-and-tear|out-and-back|cat-and-mouse|all-or-nothing)\b/gi;

// Blank out spans a prose rule must never inspect: link targets and bare URLs (slugs are full
// of "-and-"), inline code, image/alt frontmatter, and the KEEP_COMPOUND phrases. Rules opt in
// via `pre`, so the existing character rules keep scanning the raw line.
function stripInline(line) {
  return line
    .replace(/^\s*(?:heroImage|heroAlt|slug|image):.*$/, '')
    .replace(/\]\([^)]*\)/g, ']( _)')
    .replace(/https?:\/\/\S+/g, '_')
    .replace(/`[^`]*`/g, '_')
    .replace(KEEP_COMPOUND, '_');
}

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
    // Look-alike hyphens. These RENDER as an ordinary hyphen, so no amount of reading the
    // page finds them, and the em/en dash rule above does not match them. 54 non-breaking
    // hyphens (U+2011) were sitting in 7 posts, almost certainly from the Ghost migration.
    // They break copy-paste, in-page search and anything that string-matches the text.
    // U+2010 hyphen, U+2011 non-breaking hyphen, U+2012 figure dash, U+2015 horizontal bar,
    // U+2212 minus sign, U+00AD soft hyphen (invisible), U+FF0D fullwidth hyphen-minus.
    id: 'fake-hyphen',
    label: 'LOOK-ALIKE HYPHEN (renders as "-" but is not one; use a plain ASCII hyphen)',
    rx: /[‐‑‒―−­－]/g,
  },
  {
    id: 'contact-cta',
    label: 'BOOKING CTA to /contact (the site takes no bookings)',
    rx: /\]\(\/contact\/?\)/g,
  },
  {
    // A plain ASCII hyphen left standing where an em dash belonged. The July 2026 dash purges
    // resolved ~1,400 dashes to commas, colons and full stops, but in 308 places the dash was
    // swapped for a bare "-" with no spacing ("A built-in tarp is key-it keeps your rope dry").
    // Neither rule above catches it: U+002D is legal everywhere, so it renders as an ordinary
    // hyphen and no amount of reading the page flags it as anything but a typo.
    //
    // Detected by the RIGHT-hand word: a conjunction, pronoun or function word can never be
    // the second half of an English compound. Two guards keep it from crying wolf:
    //   - the LEFT word must not itself be a function word, or "before-and-after" trips on
    //     "and-after" (it did, and the fix pass broke that phrase before this guard existed);
    //   - KEEP_COMPOUND exempts the fixed phrases that legitimately chain function words.
    // `like` is deliberately NOT in the list: "ropes-like nylon" is an artifact but
    // "basket-like coil" is a real compound adjective, and nothing separates them by pattern.
    id: 'dash-hyphen',
    label: 'HYPHEN USED AS A DASH (e.g. "key-it keeps"; use a comma, colon or full stop)',
    rx: /\b(?!(?:and|or|but|nor|yet|the|for|any|all|one|two|its|his|her|our|not|who)-)[A-Za-z][a-z]{2,}-(?:and|but|or|yet|so|because|while|although|perhaps|this|that|these|those|it|its|they|their|there|then|you|your|we|our|who|which|now|the|an|without|whether|before|after|until|unless|rather|instead|though|even|also|most|some|each|every|both|plus|maybe|can|will|would|should|could|often|always|never|sometimes|usually|simply|just|really)(?![-\w])/g,
    pre: stripInline,
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

// ---- prose sentence extraction ------------------------------------------------------
// Register rules key on SENTENCES, so the extractor is load-bearing: a bug here either
// breaks the build on prose that is fine, or silently lets long prose through.
//
// Paragraph-aware on purpose. Splitting the whole document on /[.!?]\s+/ glues an
// unpunctuated structural line (e.g. the "**Book it:**" callout lead) onto the next
// paragraph and manufactures phantom 70+ word "sentences" that do not exist.
export function proseSentences(md) {
  const body = md.startsWith('---') ? md.split('---').slice(2).join('---') : md;
  const out = [];
  for (const para of body.split(/\n\s*\n/)) {
    const p = para.trim();
    if (!p) continue;
    // structural blocks are not prose: headings, lists, tables, quotes, code, raw HTML
    if (/^[#>|]/.test(p) || /^[-*+]\s/.test(p) || /^\d+[.)]\s/.test(p)) continue;
    if (p.startsWith('```') || /^<\w/.test(p) || /<\w+[^>]*>/.test(p)) continue;
    const clean = p
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')       // images
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')    // unwrap links to anchor text
      .replace(/\*\*|__|`/g, '');
    // Uppercase lookahead so "5.10 and up" / "1. Ask" do not false-split. The optional
    // closing quote/bracket in the lookbehind matters: without it a sentence ending
    // `...not for beginners." That's...` never splits, and the two sentences are reported
    // as one 61-word violation that does not exist.
    for (const s of clean.split(/(?<=[.!?]["'’”)\]]?)\s+(?=[A-Z"'“(])/)) {
      const t = s.trim();
      if (t.split(/\s+/).length > 4) out.push(t);
    }
  }
  return out;
}

const words = (s) => s.split(/\s+/).length;

// Safety-modal sentences carry an instruction. `always` is deliberately excluded: adding
// it breaks the zero-violation invariant against the hand-written corpus (2 legacy hits).
const MODAL = /\b(must|never|do not|don'?t|required|should not|shouldn'?t)\b/i;

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

// ---- markdown table integrity ---------------------------------------------------
// A table whose rows are separated by BLANK LINES is not a table - every row renders
// as a literal "| Age band | ... |" paragraph. It is valid markdown, it builds clean,
// and no other gate notices; it is only visible by looking at the page. 18 posts
// shipped 19 tables that way because the HTML converter appended each row as its own
// block. Structural damage from a converter needs a structural check.
function badTables(raw) {
  const L = raw.split(/\r?\n/);
  const out = [];
  L.forEach((line, i) => {
    if (!/^\s*\|\s*:?-{2,}/.test(line)) return; // the |---|---| separator row
    const above = i > 0 ? L[i - 1].trim() : '';
    const below = i + 1 < L.length ? L[i + 1].trim() : '';
    if (!above.startsWith('|')) out.push(`${i + 1}: separator has no header row directly above`);
    else if (below !== '' && !below.startsWith('|'))
      out.push(`${i + 1}: separator not followed by a row`);
    else if (below === '') out.push(`${i + 1}: blank line after separator (rows orphaned)`);
  });
  return out;
}

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

if (IS_CLI) {

const ALL = [...ERRORS, ...WARNINGS];
const found = Object.fromEntries(ALL.map((c) => [c.id, []]));
found['dead-link'] = [];
found['bad-table'] = [];
found['long-sentence'] = [];
found['modal-sentence'] = [];
found['tail-mass'] = [];
found['register-drift'] = [];
let files = 0;

for (const file of walk(ROOT)) {
  files++;
  const raw = readFileSync(file, 'utf8');
  const short = file.replace(/\\/g, '/');

  // ---- register gates ---------------------------------------------------------------
  // Thresholds are not aesthetic preferences: each is an invariant the 127 hand-written
  // posts already satisfy with ZERO violations. They cap the TAIL, deliberately. An
  // enforced average would be free to game - a long sentence can be hidden behind enough
  // short ones - so no mean is ever an ERROR.
  const S = proseSentences(raw);
  if (S.length) {
    for (const s of S) {
      const n = words(s);
      if (n >= 60) found['long-sentence'].push(`${short}  «${n}w»  ${s.slice(0, 100)}...`);
      else if (n > 40 && MODAL.test(s))
        found['modal-sentence'].push(`${short}  «${n}w»  ${s.slice(0, 100)}...`);
    }
    if (S.length >= 15) {
      const over = S.filter((s) => words(s) >= 40).length;
      const share = (100 * over) / S.length;
      // Tail MASS, not just the tail maximum: without this a post made entirely of
      // 59-word sentences passes both caps above. Hand-written worst case is 7.1%.
      if (share > 10) found['tail-mass'].push(`${short}  «${share.toFixed(1)}% of sentences >=40w»  (${over}/${S.length})`);
      const pub = (raw.match(/pubDate:\s*"?([0-9-]+)/) || [])[1] || '';
      const mean = S.reduce((a, s) => a + words(s), 0) / S.length;
      // Date-scoped: unscoped it would permanently flag hand-written short news posts.
      if (pub >= '2026-01-01' && (mean < 14 || mean > 26))
        found['register-drift'].push(`${short}  «mean ${mean.toFixed(1)}w/sentence»  outside [14,26]`);
    }
  }

  for (const t of badTables(raw)) found['bad-table'].push(`${short}:${t}`);

  const lines = raw.split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const dead of badLinks(line)) {
      found['dead-link'].push(
        `${file.replace(/\\/g, '/')}:${i + 1}  «${dead}»  ${line.trim().slice(0, 90)}`
      );
    }
    for (const c of ALL) {
      const subject = c.pre ? c.pre(line) : line;
      c.rx.lastIndex = 0;
      if (!c.rx.test(subject)) continue;
      c.rx.lastIndex = 0;
      const hit = (subject.match(c.rx) || [])[0];
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

function dump(id, tag, label, sink, cap = 25) {
  const list = found[id];
  if (!list.length) return 0;
  sink(`\n  ${tag} - ${label} (${list.length}):`);
  list.slice(0, cap).forEach((l) => sink(`    ${l}`));
  if (list.length > cap) sink(`    ... and ${list.length - cap} more`);
  return list.length;
}

let warned = report(WARNINGS, 'WARN', (s) => console.warn(s));
// Tail-mass and drift are WARNINGs for now, not ERRORs. Promoting tail-mass would require
// ~133 sentence splits across 27 posts in one batch; concentrating that much editing on
// safety prose at once risks inverting a rule, which is worse than the style defect. The
// 19 posts it flags are un-de-slopped LLM output and are the standing de-slop queue.
warned += dump('tail-mass', 'WARN', 'TAIL MASS >10% of sentences >=40w (hand-written worst case is 7.1%)', (s) => console.warn(s));
warned += dump('register-drift', 'WARN', 'REGISTER DRIFT: 2026+ post mean outside [14,26] words/sentence', (s) => console.warn(s));

let bad = report(ERRORS, 'FAIL', (s) => console.error(s));
bad += dump('dead-link', 'FAIL', 'INTERNAL LINK 404 (target slug does not exist)', (s) => console.error(s));
bad += dump('bad-table', 'FAIL', 'MALFORMED MARKDOWN TABLE (renders as literal | pipes |)', (s) => console.error(s));
bad += dump('long-sentence', 'FAIL', 'SENTENCE >=60 WORDS (split it; do not pad elsewhere)', (s) => console.error(s));
bad += dump('modal-sentence', 'FAIL', 'SAFETY-MODAL SENTENCE >40 WORDS (must/never/do not/required: split, preserving condition and scope)', (s) => console.error(s));

if (bad) {
  console.error(`\n${files} content files linted, ${bad} blocking violation(s).\n`);
  process.exit(1);
}
console.log(
  `OK - ${files} content files: no dashes, no hyphens used as dashes, no /contact CTA, ` +
    `no dead internal links, no sentence >=60w, no safety-modal sentence >40w, no malformed tables.` +
    (warned ? ` (${warned} non-blocking warning(s) above)` : '')
);

}
