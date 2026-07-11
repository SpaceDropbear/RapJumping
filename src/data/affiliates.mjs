// Affiliate merchant registry. Single source of truth for which outbound domains monetise,
// how their tracking links are built, and which paths are allowed to be rewritten.
//
// How it works: authors write PLAIN merchant URLs in markdown. At build time,
// rehypeAffiliateLinks (astro.config.mjs) rewrites anchors whose host matches a `live`
// merchant into that merchant's tracking link with rel="sponsored noopener". A `pending`
// merchant's links stay plain, so content can be written before an approval lands and it
// monetises on the first build after the status flips. Delisting a merchant reverts its
// links to plain URLs; nothing 404s.
//
// pathRules: editorial citations must never become sponsored links. `deny` prefixes are
// never rewritten (they also keep their followed, same-tab defaults). If `allow` is set,
// ONLY those prefixes are rewritten. Example: REI /learn/ articles are citations we quote
// for safety technique; only /product/ pages may ever monetise.

// Commission Factory publisher id. Comes from the first tracking link generated in the CF
// dashboard (the number after t.cfjump.com/). While null, no CF link is rewritten even if
// a merchant is marked live, so a half-configured registry can never emit broken links.
export const CF_PUBLISHER_ID = null; // TODO(Derek): likely 93386 (dashboard URL /Affiliate/93386/) - CONFIRM against one dashboard-built deep link before setting

/** CF deep link: https://t.cfjump.com/<publisherId>/t/<merchantId>?Url=<enc>&UniqueId=<subId> */
function cfLink(merchantId) {
  return (productUrl, subId) => {
    if (!CF_PUBLISHER_ID) return null;
    const u = encodeURIComponent(productUrl);
    return `https://t.cfjump.com/${CF_PUBLISHER_ID}/t/${merchantId}?Url=${u}&UniqueId=${encodeURIComponent(subId)}`;
  };
}

export const MERCHANTS = [
  // ---- Commission Factory (scanned live 2026-07-11; rates from the API) ----
  {
    name: 'Cover-More', network: 'commission-factory', merchantId: 11003,
    domains: ['covermore.com.au'], status: 'pending', // flip live when the CF join approves
    buildUrl: cfLink(11003),
    notes: '10%/30d. Travel insurance: the July anchor. Join applied via dashboard.',
  },
  {
    name: 'Wild Earth', network: 'commission-factory', merchantId: 12917,
    domains: ['wildearth.com.au'], status: 'pending',
    buildUrl: cfLink(12917),
    notes: '3.2%/30d. The only CF retailer with real climbing hardware. Gear pages.',
  },
  {
    name: 'Hema Maps', network: 'commission-factory', merchantId: 61641,
    domains: ['hemamaps.com'], status: 'pending',
    buildUrl: cfLink(61641),
    notes: '10%/30d. Maps/guides for remote AU travel. Kimberley + planning posts.',
  },
  {
    name: 'Wilderness Wear', network: 'commission-factory', merchantId: 14143,
    domains: ['wildernesswear.com.au'], status: 'pending',
    buildUrl: cfLink(14143),
    notes: '8%/30d. AU-made outdoor layers. what-to-wear post.',
  },
  {
    name: 'Kakadu Traders', network: 'commission-factory', merchantId: 91702,
    domains: ['kakaduaustralia.com'], status: 'pending',
    buildUrl: cfLink(91702),
    notes: '10%/30d. Outdoor clothing.',
  },
  {
    name: 'Anaconda', network: 'commission-factory', merchantId: 76675,
    domains: ['anacondastores.com'], status: 'pending',
    buildUrl: cfLink(76675),
    notes: '2%/7d cookie. Fallback only where Wild Earth has no stock.',
  },
  {
    name: 'Outbax', network: 'commission-factory', merchantId: 70692,
    domains: ['outbax.com.au'], status: 'pending',
    buildUrl: cfLink(70692),
    notes: '7%/30d. Camping.',
  },
  {
    name: 'Snowys', network: 'commission-factory', merchantId: 64164,
    domains: ['snowys.com.au'], status: 'pending',
    buildUrl: cfLink(64164),
    notes: '2%/30d. Camping backup.',
  },

  // ---- External networks (applications submitted; each buildUrl lands with its approval) ----
  {
    name: 'REI', network: 'impact',
    domains: ['rei.com'], status: 'pending',
    // The corpus cites rei.com/learn/ expert articles for safety technique. Those are
    // citations, not commerce, and must stay followed + unmonetised forever.
    pathRules: { allow: ['/product/'], deny: ['/learn/'] },
    buildUrl: () => null,
    notes: 'US shipping + 15d cookie: LOW priority. pathRules protect the /learn/ citations.',
  },
  {
    name: 'Black Diamond', network: 'avantlink',
    domains: ['blackdiamondequipment.com'], status: 'pending',
    buildUrl: () => null,
    notes: '7%/30d. Rope/hardware picks pre-written against it monetise on approval.',
  },
  {
    name: 'World Nomads', network: 'cj',
    domains: ['worldnomads.com'], status: 'pending',
    buildUrl: () => null,
    notes: '10%/60d. Best insurance economics; August.',
  },
  {
    name: 'GetYourGuide', network: 'awin',
    domains: ['getyourguide.com', 'getyourguide.com.au'], status: 'pending',
    buildUrl: () => null,
    notes: '7-8%/30d. Tours; August.',
  },
  {
    name: 'Adrenaline', network: 'impact',
    domains: ['adrenaline.com.au'], status: 'pending',
    buildUrl: () => null,
    notes: 'Up to 10%. NOT on Commission Factory (scanned 2026-07-11). Tours; August.',
  },
];

/** host (lowercase, no www.) -> merchant */
export function merchantForHost(host) {
  const h = host.toLowerCase().replace(/^www\./, '');
  return MERCHANTS.find((m) => m.domains.some((d) => h === d || h.endsWith('.' + d))) ?? null;
}

/** Should this URL be rewritten? Only live merchants, allowed paths, working builders. */
export function affiliateUrlFor(rawUrl, subId) {
  let url;
  try { url = new URL(rawUrl); } catch { return null; }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const m = merchantForHost(url.hostname);
  if (!m || m.status !== 'live') return null;
  const rules = m.pathRules;
  if (rules?.deny?.some((p) => url.pathname.startsWith(p))) return null;
  if (rules?.allow && !rules.allow.some((p) => url.pathname.startsWith(p))) return null;
  return m.buildUrl(rawUrl, subId);
}

/** For the raw-HTML tripwire: every live merchant domain. */
export function liveDomains() {
  return MERCHANTS.filter((m) => m.status === 'live').flatMap((m) => m.domains);
}
