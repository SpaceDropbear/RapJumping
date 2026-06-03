import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

import cloudflare from '@astrojs/cloudflare';

// Update `site` to your final production domain before deploy.
export default defineConfig({
  site: 'https://www.rapjumping.com',
  integrations: [mdx(), sitemap()],

  markdown: {
    shikiConfig: { theme: 'github-dark', wrap: true },
  },

  adapter: cloudflare(),
});