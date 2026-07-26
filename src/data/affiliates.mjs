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
// FULLY VERIFIED 2026-07-20, in two parts:
//  - BASE + publisher id, from the API's own TrackingUrl on the joined merchants:
//    `https://t.cfjump.com/93386/t/14143` (Wilderness Wear), `.../t/91702` (Kakadu).
//  - DEEP-LINK QUERY (`?Url=<enc>&UniqueId=<subId>`), by Derek click-testing a live built
//    link: it lands on the specific product page, not the merchant homepage. That was the
//    last inferred piece of the whole affiliate stack, and it is now observed behaviour.
// So cfLink() may be pointed at deep product URLs with confidence, not just top-level ones.
export const CF_PUBLISHER_ID = '93386';

/** CF deep link: https://t.cfjump.com/<publisherId>/t/<merchantId>?Url=<enc>&UniqueId=<subId> */
function cfLink(merchantId) {
  return (productUrl, subId) => {
    if (!CF_PUBLISHER_ID) return null;
    const u = encodeURIComponent(productUrl);
    return `https://t.cfjump.com/${CF_PUBLISHER_ID}/t/${merchantId}?Url=${u}&UniqueId=${encodeURIComponent(subId)}`;
  };
}

// GetYourGuide direct partner program (no network in between). The partner id is the
// "Affiliate partner ID" on the Your Account page of partner.getyourguide.com.
// Unlike CF, GYG deep links are the plain product URL plus query params, so nothing is
// encoded and the destination stays human-readable.
export const GYG_PARTNER_ID = 'ZSYYGUT'; // Derek Whittingham, 8% commission, site https://www.rapjumping.com/

/**
 * GYG deep link: <productUrl>?partner_id=<id>&utm_medium=online_publisher&cmp=<subId>
 *
 * Shape verified 2026-07-20 against a link built in the portal (Tools > Links), NOT guessed:
 *   https://www.getyourguide.com/brisbane-l300/brisbane-abseiling-at-kangaroo-point-cliffs-t325368/
 *     ?partner_id=ZSYYGUT&utm_medium=online_publisher&cmp=QLD
 * `utm_medium=online_publisher` is emitted by GYG's own builder. Attribution rides on
 * partner_id, but we reproduce the builder's output exactly rather than trim what looks
 * redundant - param order included.
 */
// `cmp` is the AU state / NZ island the ACTIVITY sits in (Derek's scheme, 2026-07-20 -
// "State_Activity_Located"), NOT the post it was linked from. One post routinely links
// activities in several states, so per-region is the more useful reporting cut.
//
// Derived from the GetYourGuide location id - the `-l<id>` segment of the destination URL -
// because that is the only place the build can learn where an activity actually is. Slugs
// are localised and unreliable; the numeric ids are canonical.
const GYG_REGIONS = {
  1122: 'NSW', 1485: 'NSW', 200: 'NSW', 160800: 'NSW',            // Blue Mtns, Katoomba, Sydney
  7908: 'VIC', 202: 'VIC', 167: 'VIC', 158051: 'VIC',             // Grampians, Melbourne, Victoria, Halls Gap
  300: 'QLD', 567: 'QLD', 298: 'QLD', 158608: 'QLD',              // Brisbane, Queensland, Cairns, Kangaroo Pt
  203: 'SA', 163954: 'SA', 385: 'WA', 596: 'WA', 209: 'TAS',      // Adelaide, Onkaparinga, Perth, WA, Tasmania
  168949: 'AU',                                                   // Australia-wide category pages
  498: 'NZ_Sth_Island', 946: 'NZ_Sth_Island', 32635: 'NZ_Sth_Island',
  821: 'NZ_Nth_Island', 822: 'NZ_Nth_Island', 32442: 'NZ_Nth_Island',
  35827: 'NZ_Nth_Island', 32634: 'NZ_Nth_Island',
  32388: 'VU', 169192: 'VU', 143138: 'VU',                        // Port Vila, Luganville
  2472: 'FJ', 2471: 'FJ', 103962: 'FJ', 169098: 'FJ', 103953: 'FJ', // Nadi, Sigatoka/Coral Coast
};

/**
 * CLICK-VERIFIED GetYourGuide activity URLs.
 *
 * A withdrawn GYG activity does NOT 404. It 301s to a search page
 * (`/s?...&et=<dead id>&lc=<location>`), so it looks perfectly healthy to any status-code
 * check. Wanaka `t411173` sat on three pages that way until Derek clicked it.
 *
 * ⚠ DO NOT AUTOMATE THIS CHECK. It has been attempted twice and Cloudflare blocks the run
 * partway through. A block and a dead activity present as OPPOSITES (block = 0 redirects,
 * unchanged URL, a Ray ID; dead = 1 redirect to `/s?`), so in a half-blocked run the
 * PASSES are the lies. The only oracle is the partner portal, or a human clicking.
 *
 * Verified by Derek on the dates below. Re-verify only if a link starts underperforming
 * or a post is being substantially rewritten - not on a schedule.
 */
export const GYG_VERIFIED = {
  '2026-07-26': [
    'brisbane-l300/brisbane-abseiling-at-kangaroo-point-cliffs-t325368',
    'brisbane-l300/brisbane-outdoor-rock-climbing-session-t322583',
    'queensland-l567/noosa-sunset-abseiling-tour-t665161',
    'cairns-l298/behana-gorge-rainforest-adventure-tour-t353466',
    'cairns-l298/cairns-full-day-canyoning-adventure-tour-t352921',
    'katoomba-l1485/blue-mountains-spectacular-half-day-abseiling-adventure-t837958',
    'katoomba-l1485/blue-mountains-empress-falls-canyon-abseiling-adventure-t1249615',
    'katoomba-l1485/blue-mountains-abseiling-and-juggler-canyon-adventure-tour-t836975',
    'blue-mountains-l1122/blue-mountains-abseiling-and-canyoning-experience-t322948',
    'victoria-australia-l167/yarra-valley-seven-acre-rock-abseiling-adventure-t774545',
    'nadi-l2472/largest-fiji-zipline-in-the-south-pacific-cave-exploration-t162803',
    'sigatoka-l103953/largest-zipline-cave-exploration-from-sigatoka-coral-coast-t777352',
    'luganville-l143138/luganville-millennium-cave-tour-with-hotel-pickup-t1389634',
    'port-vila-l32388/mele-bay-port-vila-vanuatu-jungle-zipline-t297650',
    'waitomo-l32442/black-abyss-the-legendary-black-water-tour-t140742',
    'waitomo-l32442/black-labyrinth-the-legendary-black-water-rafting-co-t140739',
    'auckland-region-l821/auckland-canyoning-rainforest-adventure-t27030',
    'queenstown-l498/queenstown-gibbston-valley-half-day-canyoning-adventure-t172491',
  ],
};

/** Known dead. Kept so nobody re-adds it from an old draft. */
export const GYG_DEAD = {
  'wanaka-l946/wanaka-canyoning-t411173': 'Withdrawn; 301s to a GYG search page. Removed 2026-07-25.',
};

/**
 * Not an activity page. `tc` = GYG category listing, so it cannot go dead the way an
 * activity does, but it drops the reader on a list rather than a bookable product.
 * Vikunja #989: replace with a specific activity.
 */
export const GYG_CATEGORY_PAGES = ['australia-l168949/waterfall-rappelling-experiences-tc2387'];

function gygRegion(url) {
  const id = url.pathname.match(/-l(\d+)(?:\/|$)/)?.[1];
  const region = id && GYG_REGIONS[Number(id)];
  if (region) return region;
  // Warn rather than silently mislabel: an unmapped location means real revenue landing in
  // an "Other" bucket, which is the kind of thing nobody notices for a quarter.
  console.warn(`[affiliate] GYG location l${id ?? '?'} is not in GYG_REGIONS - cmp falls back to "Other": ${url.pathname}`);
  return 'Other';
}

function gygLink(productUrl, _subId) {
  if (!GYG_PARTNER_ID) return null;
  let u;
  try { u = new URL(productUrl); } catch { return null; }
  u.searchParams.set('partner_id', GYG_PARTNER_ID);
  u.searchParams.set('utm_medium', 'online_publisher');
  u.searchParams.set('cmp', gygRegion(u));
  return u.toString();
}

export const MERCHANTS = [
  // ---- Commission Factory (scanned live 2026-07-11; rates from the API) ----
  {
    name: 'Cover-More', network: 'commission-factory', merchantId: 11003,
    // 2026-07-25: application DECLINED by Cover-More (Vikunja #959). Kept in the registry rather
    // than deleted so nobody re-applies assuming it was never tried, and so the pathRules below
    // survive if a different travel-insurance merchant ever reuses this shape.
    domains: ['covermore.com.au'], status: 'declined',
    // /pds is the Product Disclosure Statement - a compliance document we cite so readers can
    // check exclusions for adventure activities. Monetising it would turn "read the PDS" into
    // a paid referral, which is the exact opposite of why that link exists.
    pathRules: { deny: ['/pds'] },
    buildUrl: cfLink(11003),
    notes: '10%/30d. DECLINED 2026-07-25 - do not re-apply without a new angle. Travel insurance '
      + 'remains an open slot: World Nomads (#945) and SCTI (#960) are the untried alternatives.',
  },
  {
    name: 'Wild Earth', network: 'commission-factory', merchantId: 12917,
    domains: ['wildearth.com.au'], status: 'pending',
    buildUrl: cfLink(12917),
    // 2026-07-20: ALL 13 Wild Earth links were REMOVED from the corpus (Derek's call - "remove
    // all wild earth until it's live"). They sat across 5 life-safety gear pages and would have
    // monetised the instant the join approved, with nobody looking. Their "**Our picks:**"
    // blocks became plain "**What to look for:**" spec lists, so no box claims "Affiliate links"
    // while containing none. Product names and prices were kept - only the anchors went.
    // To restore: git show the pre-removal revision of the 5 gear posts, re-add the links, and
    // flip status to live IN THE SAME COMMIT so the two never drift apart.
    notes: '3.2%/30d. The only CF retailer with real climbing hardware. Join PENDING and the '
      + 'corpus now has ZERO wildearth links - flipping live alone earns nothing until they '
      + 'are re-added. That is deliberate.',
  },
  {
    name: 'Hema Maps', network: 'commission-factory', merchantId: 61641,
    domains: ['hemamaps.com'], status: 'pending',
    buildUrl: cfLink(61641),
    notes: '10%/30d. Maps/guides for remote AU travel. Kimberley + planning posts.',
  },
  {
    name: 'Wilderness Wear', network: 'commission-factory', merchantId: 14143,
    domains: ['wildernesswear.com.au'], status: 'live', // JOINED - API 2026-07-20
    buildUrl: cfLink(14143),
    notes: '8%/30d cookie, 30d validation. AU-made outdoor layers. Join APPROVED (API '
      + 'Status=Joined, TrackingUrl present). what-to-wear post.',
  },
  {
    name: 'Kakadu Traders', network: 'commission-factory', merchantId: 91702,
    domains: ['kakaduaustralia.com'], status: 'live', // JOINED - API 2026-07-20
    buildUrl: cfLink(91702),
    notes: '10%/30d cookie, 30d validation. Outdoor clothing. Join APPROVED (API '
      + 'Status=Joined, TrackingUrl present). Live site is au.kakaduaustralia.com - the '
      + 'bare domain here matches it via the subdomain rule in merchantForHost().',
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
    name: 'GetYourGuide', network: 'getyourguide', // DIRECT partner program, not Awin (dashboard confirmed 2026-07-20)
    domains: ['getyourguide.com', 'getyourguide.com.au'], status: 'live',
    buildUrl: gygLink,
    notes: '8%. Partner id ZSYYGUT, site rapjumping.com. LIVE 2026-07-20 - link shape verified '
      + 'byte-for-byte against a portal-built link (Tools > Links), so authors write plain '
      + 'getyourguide.com product URLs and the build monetises them.',
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
