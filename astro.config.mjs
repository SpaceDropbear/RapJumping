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
  },

  adapter: cloudflare(),
});