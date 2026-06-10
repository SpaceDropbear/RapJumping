import { defineConfig, sessionDrivers } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

import cloudflare from '@astrojs/cloudflare';

// Update `site` to your final production domain before deploy.
export default defineConfig({
  site: 'https://www.rapjumping.com',
  integrations: [mdx(), sitemap()],

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