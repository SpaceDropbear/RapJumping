#!/usr/bin/env python3
"""Convert a Ghost JSON export into Astro Markdown content + collect image URLs."""
import json, re, sys, pathlib
from markdownify import markdownify as md

HERE = pathlib.Path(__file__).resolve().parent
PROJ = HERE.parent
EXPORT = sys.argv[1]

def yaml_str(s):
    if s is None:
        s = ""
    s = str(s).replace('\\', '\\\\').replace('"', '\\"')
    return f'"{s}"'

def reading_time(plaintext):
    return max(1, round(len((plaintext or "").split()) / 200))

def rewrite(text):
    if not text:
        return text, set()
    found = set()
    def repl(m):
        path = m.group('path')
        found.add(path)
        return '/images' + path[len('/content/images'):]
    pat = re.compile(r'(?:__GHOST_URL__|https?://(?:www\.)?rapjumping\.com)(?P<path>/content/images/[^\s"\')]+)')
    out = pat.sub(repl, text)
    out = re.sub(r'__GHOST_URL__/([A-Za-z0-9\-]+)/?(?![\w/.])', r'/\1/', out)
    out = out.replace('__GHOST_URL__', '')
    return out, found

def main():
    data = json.load(open(EXPORT))['db'][0]['data']
    posts = data['posts']
    tags = {t['id']: t for t in data['tags']}
    ptags = {}
    for row in data.get('posts_tags', []):
        ptags.setdefault(row['post_id'], []).append((row.get('sort_order', 0), row['tag_id']))

    all_images = set()
    counts = {'post': 0, 'page': 0}
    blog_dir = PROJ / 'src' / 'content' / 'blog'
    page_dir = PROJ / 'src' / 'content' / 'pages'

    for p in posts:
        body_md, imgs = rewrite(p.get('html') or '')
        all_images |= imgs
        hero_local = ''
        if p.get('feature_image'):
            h2, himgs = rewrite(p['feature_image'])
            all_images |= himgs
            hero_local = h2

        tag_names = []
        for _, tid in sorted(ptags.get(p['id'], [])):
            t = tags.get(tid)
            if t and not (t.get('name') or '').startswith('#'):
                tag_names.append(t['name'])

        is_page = p.get('type') == 'page'
        fm = [f'title: {yaml_str(p.get("title"))}',
              f'description: {yaml_str(p.get("custom_excerpt") or "")}']
        if not is_page:
            fm.append(f'pubDate: {yaml_str((p.get("published_at") or "")[:10])}')
            if p.get('updated_at'):
                fm.append(f'updatedDate: {yaml_str(p["updated_at"][:10])}')
        if hero_local:
            fm.append(f'heroImage: {yaml_str(hero_local)}')
        if not is_page:
            fm.append('tags: [' + ', '.join(yaml_str(t) for t in tag_names) + ']')
            fm.append(f'featured: {"true" if p.get("featured") else "false"}')
            fm.append(f'readingTime: {reading_time(p.get("plaintext"))}')

        content = "---\n" + "\n".join(fm) + "\n---\n\n" + md(body_md, heading_style="ATX", bullets="-").strip() + "\n"
        out = (page_dir if is_page else blog_dir) / f"{p['slug']}.md"
        out.write_text(content, encoding='utf-8')
        counts['page' if is_page else 'post'] += 1

    (HERE / 'images.txt').write_text("\n".join(sorted(all_images)), encoding='utf-8')
    print(f"posts={counts['post']} pages={counts['page']} images={len(all_images)}")

if __name__ == '__main__':
    main()
