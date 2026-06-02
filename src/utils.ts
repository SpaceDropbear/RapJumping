export function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

export function tagSlug(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function sortByDate(a: { data: { pubDate: Date } }, b: { data: { pubDate: Date } }) {
  return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
}
