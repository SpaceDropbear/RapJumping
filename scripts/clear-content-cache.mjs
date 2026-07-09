// Astro's content layer caches rendered markdown in .astro/data-store.json, keyed on the
// source files plus the *serialisable* parts of astro.config.mjs. It cannot hash a plugin
// FUNCTION, so editing the body of a markdown.rehypePlugins / remarkPlugins function does
// not invalidate the cache: the next build replays the previous render and the change
// silently does nothing.
//
// This shipped a real production bug. The TL;DR callout boundary fix built correctly on a
// cold cache locally, but the deploy served the pre-fix HTML because the build reused a
// warm store. Clearing the store costs a few seconds and guarantees the built output
// always matches the source.
import { rmSync } from 'node:fs';

for (const path of ['.astro/data-store.json', 'node_modules/.astro']) {
  rmSync(path, { force: true, recursive: true });
}

console.log('[build] cleared Astro content cache (rehype/remark plugin bodies are not hashed)');
