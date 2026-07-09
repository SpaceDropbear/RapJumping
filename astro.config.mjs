import { defineConfig, sessionDrivers } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

import cloudflare from '@astrojs/cloudflare';

import { readdirSync, readFileSync } from 'node:fs';

// Build a slug -> lastmod (ISO) map from blog frontmatter so the sitemap can emit
// <lastmod> per post (updatedDate, falling back to pubDate). @astrojs/sitemap can't
// read content frontmatter on its own, so we parse it here at config-eval time.
const blogDir = new URL('./src/content/blog/', import.meta.url);
const lastmodBySlug = new Map();
// Mirrors tagSlug() in src/utils.ts. Used to work out which tag pages tag/[tag].astro
// will mark noindex (fewer than 2 posts) so the sitemap can leave them out.
const toTagSlug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const tagCounts = new Map();
for (const file of readdirSync(blogDir)) {
  if (!file.endsWith('.md') && !file.endsWith('.mdx')) continue;
  const block = readFileSync(new URL(file, blogDir), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
  if (!block) continue;
  const pub = block.match(/^pubDate:\s*["']?(\d{4}-\d{2}-\d{2})/m)?.[1];
  const upd = block.match(/^updatedDate:\s*["']?(\d{4}-\d{2}-\d{2})/m)?.[1];
  const date = upd || pub;
  if (date) lastmodBySlug.set(file.replace(/\.mdx?$/, ''), new Date(date).toISOString());

  if (/^draft:\s*true/m.test(block)) continue;
  const tagsRaw = block.match(/^tags:\s*\[(.*?)\]/m)?.[1];
  for (const quoted of tagsRaw?.match(/"[^"]*"|'[^']*'/g) ?? []) {
    const slug = toTagSlug(quoted.slice(1, -1));
    tagCounts.set(slug, (tagCounts.get(slug) ?? 0) + 1);
  }
}
// tag/[tag].astro sets noindex when posts.length < 2. Advertising those URLs in the
// sitemap makes GSC report "Submitted URL marked noindex", so drop them from it.
const noindexTagSlugs = new Set([...tagCounts].filter(([, n]) => n < 2).map(([s]) => s));

// Wrap the whole TL;DR block (the `## TL;DR` heading's following content, up to the
// next heading) in <div class="tldr-body"> so it can be styled as one callout,
// regardless of whether the post opens with an intro line, bullets, or both.
// Collect ALL descendant text, not just direct text children. `## **TL;DR**` puts the text
// inside a <strong>, so a direct-children-only read returns '' and the post is silently
// skipped. (Checking properties.id is useless here: Astro assigns heading ids *after* user
// rehype plugins run, so the id is always undefined at this point.)
function headingText(node) {
  let out = '';
  const walk = (n) => {
    if (n.type === 'text') out += n.value;
    else if (n.children) n.children.forEach(walk);
  };
  (node.children ?? []).forEach(walk);
  return out.trim();
}

function rehypeTldrCallout() {
  return (tree) => {
    const kids = tree.children;
    for (let i = 0; i < kids.length; i++) {
      const n = kids[i];
      if (n.type !== 'element' || !/^h[23]$/.test(n.tagName)) continue;
      if (!/^tl;?dr$/i.test(headingText(n))) continue;
      // The TL;DR block ends at the author's `---` thematic break (the convention in
      // every post) or the next heading, whichever comes first. Bounding on the next
      // heading alone over-captures body prose on hub pages that place paragraphs
      // between the `---` and the first subheading.
      let end = i + 1;
      let terminatedByRule = false;
      while (end < kids.length) {
        const s = kids[end];
        if (s.type === 'element' && /^h[1-3]$/.test(s.tagName)) break;
        if (s.type === 'element' && s.tagName === 'hr') { terminatedByRule = true; break; }
        end++;
      }
      // Trim trailing blank text nodes so the box ends cleanly on its last item.
      let bodyEnd = end;
      while (bodyEnd - 1 > i) {
        const last = kids[bodyEnd - 1];
        if (last.type === 'text' && !last.value.trim()) bodyEnd--;
        else break;
      }
      const body = kids.slice(i + 1, bodyEnd);
      if (body.length) {
        // Remove the body region plus the terminating `---` (redundant once the box
        // provides separation); leave any following heading in place.
        const removeCount = (terminatedByRule ? end + 1 : end) - (i + 1);
        kids.splice(i + 1, removeCount, {
          type: 'element',
          tagName: 'div',
          properties: { className: ['tldr-body'] },
          children: body,
        });
      }
      return;
    }
  };
}

// Comparison tables are wider than a phone. Wrap each one so it scrolls inside its own
// container instead of scrolling the whole page. tabindex makes the scroll region reachable
// by keyboard, which a pointer-only scroll container would otherwise fail (WCAG 2.1.1).
function rehypeWrapTables() {
  return (tree) => {
    const kids = tree.children;
    for (let i = 0; i < kids.length; i++) {
      const n = kids[i];
      if (n.type !== 'element' || n.tagName !== 'table') continue;
      kids[i] = {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['table-wrap'],
          role: 'region',
          tabIndex: 0,
          ariaLabel: 'Table, scroll sideways to see more',
        },
        children: [n],
      };
    }
  };
}

// Update `site` to your final production domain before deploy.
export default defineConfig({
  site: 'https://www.rapjumping.com',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => {
        const tag = new URL(page).pathname.match(/^\/tag\/([^/]+)\/?$/)?.[1];
        return !(tag && noindexTagSlugs.has(tag));
      },
      serialize(item) {
        const slug = new URL(item.url).pathname.replace(/^\/|\/$/g, '');
        const lastmod = lastmodBySlug.get(slug);
        if (lastmod) item.lastmod = lastmod;
        return item;
      },
    }),
  ],

  // This site is fully static and never uses Astro sessions. Without this,
  // @astrojs/cloudflare auto-enables a KV-backed session driver and every
  // deploy tries to *create* the "rapjumping-session" KV namespace, which
  // fails once it exists (Cloudflare API error 10014). An in-memory driver
  // makes the adapter skip the SESSION KV binding entirely.
  session: { driver: sessionDrivers.memory() },

  markdown: {
    shikiConfig: { theme: 'github-dark', wrap: true },
    rehypePlugins: [rehypeTldrCallout, rehypeWrapTables],
  },

  adapter: cloudflare(),
});