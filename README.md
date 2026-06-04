# RapJumping.com

Source for [rapjumping.com](https://rapjumping.com) — the home of Rap Jumping in Australia. Guides, gear reviews, stories, and everything you need to know about face-forward abseiling.

Built with [Astro](https://astro.build) and deployed as a static site on Cloudflare Workers.

## Local development

Requires Node 18.20+, 20.3+, or 22+.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # production build → ./dist
npm run preview  # serve the production build locally
```

## Project structure

```
src/
  content/
    blog/        # one Markdown file per post
    pages/       # standalone pages (about, terms & conditions)
  pages/         # routes: /, /blog/, /tag/[tag]/, /[slug]/, rss.xml, 404
  components/    # Header, Footer, PostCard, PostRow
  layouts/       # BaseLayout
  styles/        # global.css (brand accent #a12e38)
public/
  images/        # all post images
  _redirects     # Cloudflare redirect rules
```

## Deployment

The site is fully pre-rendered — no Astro adapter needed.

Hosted on **Cloudflare Workers (Static Assets)**:

1. Cloudflare dashboard → Workers & Pages → Create → connect this GitHub repo
2. Build command: `npm run build` · Output directory: `dist`
3. Set the production domain in `astro.config.mjs` (`site:`) before deploying so canonical URLs, sitemap, and RSS are correct

`node_modules/` and `dist/` are git-ignored; Cloudflare rebuilds automatically on each push to `main`.

## License

Content © RapJumping.com. All rights reserved.
