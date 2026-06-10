# Astro Production Prep Workflow

Comprehensive checklist for preparing an Astro static site from development to production deployment on Cloudflare. Use this when audits flag issues, content is missing, dependencies are outdated, or you're preparing to publish.

## Pre-flight Audit (5–10 min)

**Identify gaps before beginning deep work:**

- [ ] Run `npm audit` — check for security vulnerabilities
- [ ] Check Astro version: `npm list astro` — compare to `@latest` tag on npm
- [ ] Run `npm run build` — verify the build completes without errors
- [ ] Run Lighthouse audit (accessibility, SEO, best practices) — note performance warnings
- [ ] Verify images load correctly; check browser DevTools Network tab for lazy/eager loading
- [ ] Scan deployed version for visual differences (missing videos, broken embeds, layout shifts)
- [ ] Check git status: ensure tracked files match intent (`git status`, `git diff`)

**Outcome:** A ranked list of issues to address (dependencies, versions, performance, content, SEO).

---

## Phase 1: Dependency & Version Management (10–20 min)

**Clean install and upgrade core packages:**

1. **Delete and reinstall node_modules** (resolves corrupted installs):
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Check for Astro major version upgrades:**
   ```bash
   npm outdated astro
   npm update astro@latest
   ```

3. **Verify no breaking changes** — run build and dev server:
   ```bash
   npm run build
   npm run dev
   ```
   Navigate key pages in browser; confirm layout, styling, and routes work.

4. **Commit dependency changes:**
   ```bash
   git add package.json package-lock.json
   git commit -m "Upgrade Astro to vX.Y.Z and dependencies"
   ```

**Decision:** If major version breaks appear (type errors, missing APIs), investigate release notes for migration guide. Resolve before continuing.

**Outcome:** Clean, current dependency tree; build passes without errors.

---

## Phase 2: Image Performance Optimization (15–30 min)

**Fix Lighthouse "Unoptimized loading attribute" warnings:**

1. **Import Image from astro:assets in components/pages that use images:**
   ```astro
   import { Image } from 'astro:assets'
   ```

2. **Identify above-fold images** (visible without scrolling on page load):
   - Hero/banner image at top
   - First card/row in lists
   - Any image in viewport on mobile

3. **Replace img tags with Image component:**
   ```astro
   <!-- Before -->
   <img src={post.cover} alt="..." loading="lazy" />
   
   <!-- After (above-fold) -->
   <Image src={post.cover} alt="..." loading="eager" />
   
   <!-- After (below-fold) -->
   <Image src={post.cover} alt="..." loading="lazy" />
   ```

4. **For list components, pass index to first item** (mark first item as eager):
   ```astro
   posts.map((post, i: number) => 
     <PostRow post={post} eager={i === 0} />
   )
   ```
   
   In component:
   ```astro
   interface Props {
     post: typeof blog[number]
     eager?: boolean
   }
   const { post, eager = false } = Astro.props
   <Image src={post.cover} alt="..." loading={eager ? "eager" : "lazy"} />
   ```

5. **Test with Lighthouse** — re-audit and verify warnings clear.

**Outcome:** All above-fold images load eagerly; below-fold images lazy-load. Lighthouse passes Image optimization checks.

---

## Phase 3: Content Restoration (10–30 min, varies by scope)

**Restore missing videos, embeds, or media:**

1. **Identify missing content** — compare deployed version to source (old CMS, export file, backups).

2. **For embedded videos (YouTube, Vimeo):**
   - Extract video IDs from source (e.g., YouTube: `youtube.com/watch?v=VIDEO_ID` → `VIDEO_ID`)
   - Add responsive embed CSS to `src/styles/global.css`:
     ```css
     .yt-embed {
       position: relative;
       padding-bottom: 56.25%; /* 16:9 aspect ratio */
       height: 0;
       overflow: hidden;
       border-radius: var(--radius);
       margin: 1.5em 0;
     }
     .yt-embed iframe {
       position: absolute;
       top: 0;
       left: 0;
       width: 100%;
       height: 100%;
       border: 0;
     }
     ```
   - Insert into markdown at correct location:
     ```html
     <div class="yt-embed">
       <iframe src="https://www.youtube.com/embed/VIDEO_ID" title="..."></iframe>
     </div>
     ```

3. **For images:**
   - Place in `public/images/` or `src/assets/`
   - Update markdown/component references if paths changed

4. **Verify in dev server** — check all embeds render and are responsive (resize browser to test).

**Outcome:** All content visible; embeds responsive; no broken links.

---

## Phase 4: SEO & Crawler Configuration (10–15 min)

**Create metadata files for search engines and AI systems:**

1. **Create `public/robots.txt`** (RFC 9309 spec):
   ```txt
   User-agent: *
   Allow: /
   Sitemap: https://www.yourdomain.com/sitemap.xml
   
   # AI training crawlers — blocked
   User-agent: GPTBot
   Disallow: /
   
   User-agent: anthropic-ai
   Disallow: /
   
   User-agent: Claude-Web
   Disallow: /
   
   User-agent: Google-Extended
   Disallow: /
   
   User-agent: Bytespider
   Disallow: /
   
   User-agent: CCBot
   Disallow: /
   
   User-agent: Applebot-Extended
   Disallow: /
   
   # AI search crawlers — allowed
   User-agent: OAI-SearchBot
   Allow: /
   
   User-agent: Amazonbot
   Allow: /
   
   # Content usage preferences
   Content-Signal: ai-train=no, search=yes, ai-input=yes
   ```
   
   **Customize:** Update `Sitemap:` URL to match your domain; adjust crawler allowlist based on policy.

2. **Create `public/.well-known/security.txt`** (RFC 9116 spec):
   ```txt
   Contact: mailto:security@yourdomain.com
   Expires: 2027-06-09T00:00:00.000Z
   Preferred-Languages: en
   Canonical: https://www.yourdomain.com/.well-known/security.txt
   ```
   
   **Customize:** Update contact email and expiration date.

3. **Create `public/llms.txt`** (AI discovery/usage terms):
   ```markdown
   # YourSite.com
   
   > One-line description of your site.
   
   Longer description of what the site covers.
   
   ## Key pages
   - [Page](https://yourdomain.com/page): Description
   
   ## Content topics
   - [Topic](https://yourdomain.com/tag/topic): Description
   
   ## Usage
   
   Content on this site is © YourSite.com. Reproduction or use for AI training is not permitted. See robots.txt for crawler policy.
   ```
   
   **Customize:** Update site name, description, page links, topics, and copyright holder.

4. **Update `public/_redirects`** (if using Cloudflare):
   - If Astro generates multi-file sitemap (sitemap-0.xml, sitemap-1.xml, etc.), redirect root sitemap:
     ```
     /sitemap.xml /sitemap-0.xml 301
     ```

5. **Verify URLs in all files match your production domain** — canonical, sitemap, security contact.

**Decision:** Review Content-Signal values:
- `ai-train=no` — AI training forbidden
- `search=yes` — Allow search engine indexing
- `ai-input=yes` — Allow use as AI search context

Adjust based on policy.

**Outcome:** Crawlers get clear policy; site discoverable by search engines and AI; security contact defined.

---

## Phase 5: Repository Preparation (10–15 min)

**Clean up and document for public/GitHub release:**

1. **Update `.gitignore`** — ensure no sensitive files tracked:
   ```
   node_modules/
   dist/
   .env
   .env.local
   .claude/
   .wrangler/
   .dev.vars*
   ```

2. **Update `README.md`** — write for public audience:
   - One-liner: what the site is
   - Tech stack (Astro, Cloudflare)
   - Local development steps
   - Project structure
   - Deployment instructions
   - License

3. **Delete development files** not needed in production:
   - Local scripts (`scripts/convert.py`, etc.)
   - Temporary notes (`START-HERE.cmd`)
   - Internal IDE config (`.claude/settings.local.json`)

4. **Verify essential files present:**
   - `package.json` and `package-lock.json`
   - `astro.config.mjs` (with production domain in `site:`)
   - `tsconfig.json`
   - `README.md`
   - `LICENSE` (if applicable)

5. **Run final build** — confirm no errors:
   ```bash
   npm run build
   ```

**Outcome:** Clean repo ready for GitHub; no secrets; clear documentation.

---

## Phase 6: GitHub Publication (5–10 min)

**Initialize git and push to GitHub:**

1. **Initialize repo** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: production-ready Astro static site"
   ```

2. **Add remote and push:**
   ```bash
   git remote add origin https://github.com/USERNAME/REPO.git
   git branch -M main
   git push -u origin main
   ```

3. **Add repository metadata:**
   - Set GitHub repo description to one-liner from README
   - Set topics (e.g., `astro`, `static-site`, `cloudflare`)
   - Enable GitHub Pages or disable if not used

4. **Verify pushed state:**
   ```bash
   git status  # should show "working tree clean"
   ```

**Outcome:** Code published; history clean; GitHub repo ready for sharing.

---

## Phase 7: Cloudflare Deployment (5–10 min)

**Deploy static build to Cloudflare Workers/Pages:**

1. **Verify build output:**
   ```bash
   npm run build
   ls dist/  # check files exist
   ```

2. **In Cloudflare dashboard:**
   - Workers & Pages → Create Application → Connect GitHub
   - Select repo and branch (`main`)
   - Build command: `npm run build`
   - Output directory: `dist`
   - Set production domain in `astro.config.mjs` (`site:`) before deploy

3. **Verify deployment:**
   - Check Cloudflare deployment logs for errors
   - Visit production URL; verify pages load and images render
   - Re-run Lighthouse audit on production URL

**Decision:** If build fails on Cloudflare, check:
- Node version matches `astro.config.mjs` requirements (18.20+, 20.3+, or 22+)
- Environment variables set in Cloudflare (if any)
- Build command uses exact output directory name

**Outcome:** Site live and accessible; Lighthouse passes; Cloudflare cache warming up.

---

## Completion Checklist

**Before marking "done":**

- [ ] Build passes: `npm run build` completes without errors
- [ ] Dev server works: `npm run dev` launches and routes are accessible
- [ ] Lighthouse audit passes (all categories ≥90 or target threshold)
- [ ] All images load (no 404s in DevTools Network)
- [ ] Embeds/videos render correctly
- [ ] `robots.txt`, `security.txt`, `llms.txt` deployed
- [ ] `_redirects` rule working (test `/sitemap.xml` if applicable)
- [ ] Production domain set in config; canonical URLs correct
- [ ] README updated for public audience
- [ ] `.gitignore` excludes sensitive/build files
- [ ] GitHub repo clean; history readable
- [ ] Cloudflare deployment live; logs clear
- [ ] Production URL accessible and renders correctly

**If any step fails:** Revert to last passing state (`git status`), investigate error, fix, rebuild.

---

## Troubleshooting Quick Reference

| Issue | Cause | Fix |
|-------|-------|-----|
| Build fails with missing module | Corrupted `node_modules` | `rm -rf node_modules package-lock.json && npm install` |
| TypeScript "implicitly any type" errors | Type generation lag | Run `npm run dev`, wait for types to generate, then rebuild |
| Images above fold flagged by Lighthouse | Using lazy-loading on hero | Set `loading="eager"` for above-fold images |
| Sitemap not found at `/sitemap.xml` | Redirect points to wrong file | Update `_redirects` to point to actual generated sitemap file (e.g., `sitemap-0.xml`) |
| Security crawlers still indexing | `robots.txt` not deployed | Verify `public/robots.txt` exists in `dist/` after build |
| Video embeds overflow on mobile | Missing responsive wrapper CSS | Add `.yt-embed` CSS with padding-bottom trick (56.25% for 16:9) |

---

## Example Prompts to Use This Skill

- "Help me prepare my Astro site for production deployment."
- "My Lighthouse audit flagged image performance issues — fix them."
- "I need to publish an Astro site to GitHub and Cloudflare."
- "Set up robots.txt, security.txt, and SEO config for my Astro site."
- "Restore missing videos in my Astro blog posts."
- "Update my Astro project to the latest version and verify no breaking changes."

---

## Related Skills to Create Next

- **Astro Content Migration** — extract content from Ghost/legacy CMS, map to markdown, restore images/videos
- **Astro Performance Tuning** — advanced image optimization, lazy hydration, build-time optimizations
- **Astro Component Library** — standardize component patterns (layout, cards, embeds) across projects
