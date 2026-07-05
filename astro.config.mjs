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
for (const file of readdirSync(blogDir)) {
  if (!file.endsWith('.md') && !file.endsWith('.mdx')) continue;
  const block = readFileSync(new URL(file, blogDir), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
  if (!block) continue;
  const pub = block.match(/^pubDate:\s*["']?(\d{4}-\d{2}-\d{2})/m)?.[1];
  const upd = block.match(/^updatedDate:\s*["']?(\d{4}-\d{2}-\d{2})/m)?.[1];
  const date = upd || pub;
  if (date) lastmodBySlug.set(file.replace(/\.mdx?$/, ''), new Date(date).toISOString());
}

// Wrap the whole TL;DR block (the `## TL;DR` heading's following content, up to the
// next heading) in <div class="tldr-body"> so it can be styled as one callout,
// regardless of whether the post opens with an intro line, bullets, or both.
function rehypeTldrCallout() {
  return (tree) => {
    const kids = tree.children;
    for (let i = 0; i < kids.length; i++) {
      const n = kids[i];
      if (n.type !== 'element' || n.tagName !== 'h2') continue;
      const text = (n.children || []).map((c) => (c.type === 'text' ? c.value : '')).join('').trim();
      if (n.properties?.id !== 'tldr' && !/^tl;?dr$/i.test(text)) continue;
      // The TL;DR block ends at the author's `---` thematic break (the convention in
      // every post) or the next heading, whichever comes first. Bounding on the next
      // heading alone over-captures body prose on hub pages that place paragraphs
      // between the `---` and the first subheading.
      let end = i + 1;
      let terminatedByRule = false;
      while (end < kids.length) {
        const s = kids[end];
        if (s.type === 'element' && (s.tagName === 'h1' || s.tagName === 'h2')) break;
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

// Update `site` to your final production domain before deploy.
export default defineConfig({
  site: 'https://www.rapjumping.com',
  integrations: [
    mdx(),
    sitemap({
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
    rehypePlugins: [rehypeTldrCallout],
  },

  adapter: cloudflare(),
});