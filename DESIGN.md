---
name: Rap Jumping
description: The definitive Australian knowledge base for abseiling, rappelling and rap jumping.
colors:
  rope-red: "#a12e38"
  rope-red-deep: "#7e2129"
  rope-red-tint: "#f6e9ea"
  daylight: "#ffffff"
  chalk: "#faf7f3"
  chalk-line: "#e7e1da"
  basalt: "#1a1715"
  timber: "#36302c"
  granite: "#6f675f"
  nightfall: "#14100e"
  night-surface: "#1e1815"
  night-line: "#322a25"
  moonlight: "#f5efe9"
  ash: "#d9d0c8"
  flare: "#e8727a"
  rope-red-lifted: "#b8343f"
typography:
  display:
    fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(30px, 4.6vw, 50px)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(22px, 3vw, 28px)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.04em"
rounded:
  sm: "7px"
  md: "10px"
  lg: "12px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "44px"
  xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.rope-red}"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "12px 22px"
  button-primary-hover:
    backgroundColor: "{colors.rope-red-deep}"
    textColor: "#ffffff"
  button-ghost:
    backgroundColor: "#ffffff14"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "12px 22px"
  card:
    backgroundColor: "{colors.daylight}"
    textColor: "{colors.timber}"
    rounded: "{rounded.lg}"
    padding: "16px 18px 20px"
  pill:
    backgroundColor: "{colors.rope-red}"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "5px 12px"
  tag:
    backgroundColor: "{colors.chalk}"
    textColor: "{colors.timber}"
    rounded: "{rounded.pill}"
    padding: "5px 13px"
  theme-toggle:
    backgroundColor: "{colors.daylight}"
    textColor: "{colors.timber}"
    rounded: "{rounded.pill}"
    height: "36px"
    width: "36px"
---

# Design System: Rap Jumping

## 1. Overview

**Creative North Star: "The Instructor's Field Guide"**

Rap Jumping should read like a seasoned instructor's own manual: authoritative, weathered, precise,
and completely free of fluff. Someone who has run a thousand descents wrote this down so you would get
it right. The system carries that voice through a warm, grounded palette (climbing chalk and basalt),
a sturdy grotesk display voice over a highly legible body face, and generous reading space. It is a
reference you trust with your safety, not a brochure that wants your booking.

Density is editorial-calm: one clear idea per section, generous vertical rhythm, wide reading measure.
The single accent, **Rope Red**, behaves like a safety line: it appears exactly where the reader
should act or follow (links, CTAs, section labels) and nowhere else. The system explicitly rejects the
**loud tour-booking aesthetic** (discount banners, urgency, "BOOK NOW" pressure) and the
**corporate/clinical** register (safe, neutral, forgettable); a brand with no point of view is a
failure here. It equally rejects the generic AI-landing look, purple gradients, glassy cards,
three-equal-feature grids, hero-metric templates.

**Key Characteristics:**
- Warm, grounded neutrals (climbing chalk + basalt), never cool corporate grey and never AI cream.
- One accent only, Rope Red, used sparingly, like a safety line.
- Sturdy grotesk display (Space Grotesk) over a workhorse reading face (Inter); emphasis by weight.
- Editorial-calm density: wide measure, generous rhythm, one idea per section.
- Dual-mode from the ground up (warm light, warm near-black dark); reduced-motion honoured.
- Legible to people and to machines, structured, scannable, quotable.

## 2. Colors

A warm, earthbound palette drawn from the climbing world, chalk, basalt, timber, anchored by a
single decisive Rope Red.

### Primary
- **Rope Red** (#a12e38): The one accent. Links, primary CTAs, section kickers, the logo mark, the
  blockquote marker. It is the safety line, follow it. In dark mode it lifts to **Flare** (#e8727a)
  for text/links and **Rope Red Lifted** (#b8343f) for solid fills so contrast holds.
- **Rope Red Deep** (#7e2129): Pressed/hover state of the primary button and strong link hover only.
- **Rope Red Tint** (#f6e9ea): The faintest wash, hover fill on tags and topic tiles. Used almost
  never at full strength.

### Neutral
- **Daylight** (#ffffff): Page background in light mode; card surface.
- **Chalk** (#faf7f3): Warm off-white secondary surface, thumbnails, tag chips, footer, code. The
  warmth is climbing chalk, deliberate, not a default cream tint.
- **Chalk Line** (#e7e1da): Hairline borders and dividers.
- **Basalt** (#1a1715): Headings, a warm near-black, never pure `#000`.
- **Timber** (#36302c): Body text, warm dark brown, high-legibility on Daylight (≈10:1).
- **Granite** (#6f675f): Meta, captions, secondary text (dates, reading time). Passes AA on Daylight.

### Dark mode
- **Nightfall** (#14100e): Warm near-black page background. Never pure `#000`.
- **Night Surface** (#1e1815) / **Night Line** (#322a25): Dark surfaces and dividers.
- **Moonlight** (#f5efe9) / **Ash** (#d9d0c8): Heading and body text in dark mode.

### Named Rules
**The One Rope Rule.** Rope Red is the *only* accent on the site, and it is rationed. It marks where
the reader acts or follows, never decoration, never two accents on a screen, never a second hue
introduced for "variety". Its scarcity is what makes it read as a safety line.

**The Chalk-Not-Cream Rule.** The warm neutrals are climbing chalk and basalt, an earned, specific
warmth. They are forbidden from drifting into the generic AI cream/sand/parchment band; warmth is
carried by these exact values, not by tinting every surface warmer "because the brand feels that way".

## 3. Typography

**Display Font:** Space Grotesk (with ui-sans-serif, system-ui fallback)
**Body Font:** Inter (with system-ui fallback)

**Character:** A sturdy, slightly mechanical grotesk for headings, it has grit and confidence
without shouting, paired with Inter's quiet, unimpeachable legibility for long safety-critical
reading. The contrast is weight and shape, not two competing personalities.

### Hierarchy
- **Display** (700, `clamp(30px, 4.6vw, 50px)`, 1.05): Hero and article H1. Tight tracking (-0.01em).
- **Headline** (700, 24-28px, 1.2): Section headings (`Featured`, `Latest`) and in-prose H2.
- **Title** (700, 19-20px, 1.2): Card and post-row titles.
- **Body** (400, 17px / prose 18px, 1.7): Reading text. Measure capped at ~65-75ch (`.wrap-narrow` 760px).
- **Label** (600, 12px, +0.04em, UPPERCASE): The `Australia` pill and card kickers only, a rationed
  device, never a per-section eyebrow.

### Named Rules
**The Two-Weight Rule.** Two families, full stop: Space Grotesk for headings, Inter for everything
read at length. Emphasis is created with weight and size, never by introducing a third family or a
decorative face. Space Grotesk never sets body copy.

**The Kicker-Not-Eyebrow Rule.** The uppercase label is a rationed brand device (the hero pill, a card
kicker), not section grammar. It is forbidden above every section heading; the heading alone carries it.

## 4. Elevation

The system is flat by default and conveys depth through warm tonal layering (Daylight → Chalk →
Chalk Line), not shadow. Shadow appears only as a *response to state*: a card lifts on hover with a
soft, hue-tinted shadow. There is no ambient drop-shadow vocabulary and no glassmorphism.

### Shadow Vocabulary
- **Hover lift** (`box-shadow: 0 10px 30px rgba(26,23,21,0.10)`): Applied on `.card:hover` only, in
  light mode. Tinted toward the warm ink, never pure black. In dark mode a card hover instead shifts
  its border to the accent, because a near-black shadow is invisible on Nightfall.

### Named Rules
**The Flat-At-Rest Rule.** Surfaces are flat until the reader touches them. Elevation is feedback, not
decoration, if nothing changed state, nothing casts a shadow.

## 5. Components

### Buttons
- **Shape:** Full pill (`999px`), the site's interactive-radius language; containers use 12px.
- **Primary:** Rope Red fill, white label, `12px 22px` padding, uppercase-ish label weight. Pressed
  state deepens to Rope Red Deep (#7e2129); `:active` nudges `translateY(1px)` for a tactile push.
- **Ghost:** Used over the dark hero scrim only, translucent white fill with a `rgba(255,255,255,.55)`
  stroke and white label. Never used on a light surface (it would have no affordance).
- **Focus:** Shared `:focus-visible` ring, `2px solid` Rope Red Deep (light) / Flare (dark),
  `2px` offset, on every interactive control.

### Chips (tags & topics)
- **Style:** Chalk fill, Timber text, Chalk Line border, full pill.
- **State:** Hover shifts border and text to the accent with a Rope Red Tint fill.

### Cards / Containers
- **Corner Style:** 12px (`rounded.lg`).
- **Background:** Daylight in light mode, Nightfall-surface in dark.
- **Border:** 1px Chalk Line. **Shadow Strategy:** flat at rest; hover lift per Elevation.
- **Internal Padding:** `16px 18px 20px`.
- Cards are used only where a self-contained preview earns it (the featured grid). The Latest list and
  Popular guides deliberately use dividers/rows, not cards, to avoid card monotony.

### Navigation
- Sticky top bar, ≤72px tall. RJ mark + wordmark left; flat text nav + theme toggle right. Links are
  Timber, hover to Rope Red. On ≤640px the header wraps to two rows (brand, then full nav) rather than
  overflowing or hiding links.

### Signature, Immersive Hero
A full-width image block (`min-height: clamp(420px, 60vh, 560px)`) with a bottom-weighted dark scrim,
bottom-aligned content: kicker pill, display H1, ≤20-word subtext, one primary + one ghost CTA. It sets
the "field guide, not brochure" tone above the fold.

## 6. Do's and Don'ts

### Do:
- **Do** ration Rope Red to where the reader acts or follows (The One Rope Rule). One accent, one hue.
- **Do** keep warm neutrals at the exact chalk/basalt values; carry brand warmth in type and imagery.
- **Do** set headings in Space Grotesk and everything read at length in Inter (The Two-Weight Rule).
- **Do** keep body measure at 65-75ch and reading rhythm generous; one idea per section.
- **Do** maintain full light + dark parity and WCAG AA contrast on every change (YMYL safety content).
- **Do** honour `prefers-reduced-motion` and keep a visible `:focus-visible` ring on all controls.

### Don't:
- **Don't** make it a **loud tour-booking site**, no discount banners, urgency, "BOOK NOW" pressure,
  or adventure-tourism hype. Recommendations are earned expertise, never a sales funnel.
- **Don't** make it **corporate / clinical**, safe, neutral, forgettable is a failure; commit to the
  field-guide point of view.
- **Don't** use the generic AI-landing kit: purple/blue gradients, glassmorphism, three-equal-feature
  card grids, or the hero-metric template.
- **Don't** use a `border-left`/`border-right` greater than 1px as a colored accent stripe on cards,
  callouts, or blockquotes (the current `.prose blockquote` side-stripe is scheduled for restyle).
- **Don't** put an uppercase eyebrow above every section, or number sections `01 / 02 / 03` by reflex.
- **Don't** use gradient text (`background-clip: text`), a second accent hue, or a third font family.
- **Don't** let warm neutrals drift into cream/sand/parchment; that's the AI default, not this brand.
