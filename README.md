# Rap Jumping — Astro

Static Astro rebuild of the Rap Jumping Ghost site. 146 posts + 2 pages, migrated from the Ghost export with all images, tags, dates and slugs preserved.

## Local development

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs to ./dist
npm run preview  # serve the production build locally
```

Requires Node 18.20+, 20.3+, or 22+.

## Structure

- `src/content/blog/` — one Markdown file per post (frontmatter: title, description, pubDate, heroImage, tags, featured, readingTime)
- `src/content/pages/` — standalone pages (about, terms)
- `src/pages/` — routes: homepage, `/blog/` archive, `/tag/[tag]/`, `/[slug]/` (posts + pages), `rss.xml`, 404
- `src/components/`, `src/layouts/`, `src/styles/global.css` — UI (brand accent `#a12e38`)
- `public/images/` — all 151 images, mirrored from Ghost's `/content/images/` paths
- `scripts/convert.py` — the Ghost-export → Markdown converter (re-runnable)

## Re-running the conversion

```bash
python3 scripts/convert.py "../<your-ghost-export>.json"
```
Regenerates Markdown in `src/content/`. Images are pulled separately (already downloaded into `public/images/`).

## Deploy — Cloudflare Workers (Static Assets)

Cloudflare Pages is in maintenance mode in 2026; new static Astro sites deploy on Workers. This site is fully pre-rendered, so no Astro adapter is needed.

1. Push this folder to a GitHub repo (see below).
2. Cloudflare dashboard → Workers & Pages → Create → connect the GitHub repo.
3. Build command: `npm run build` · output directory: `dist`.
4. Deploy, verify on the `*.workers.dev` URL, then bind your custom domain.

Before deploy, set the production domain in `astro.config.mjs` (`site:`) so canonical URLs, sitemap and RSS are correct.

## GitHub

```bash
git init && git add . && git commit -m "Initial Astro migration from Ghost"
git branch -M main
git remote add origin git@github.com:<you>/rapjumping-astro.git
git push -u origin main
```

`node_modules/` and `dist/` are git-ignored; Cloudflare rebuilds on each push.

## Notes

- The Subscribe / members portal from Ghost was intentionally dropped (static site).
- Four internal links in `outdoor-gear-what-to-wear-abseiling-in-australia` were already 404 on the live Ghost site; they were remapped to the matching existing articles during migration.
