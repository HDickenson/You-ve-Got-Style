---
name: You've Got Style
tagline: Your style. Your way.
philosophy: Quiet Intelligence
colors:
  onyx: '#111111'      # cinematic / presentation surfaces
  forest: '#1E2C26'    # secondary dark surface — Style Intelligence ONLY
  gold: '#C8A86B'      # emphasis, selection, signature moments — RATIONED
  sand: '#E7DFD3'      # secondary neutral surface
  cream: '#FAF6F1'     # primary working surface
  white: '#FFFFFF'     # dark-mode typography, raised cards on cream
  ink: '#171717'       # light-mode typography (a TEXT colour, never a surface)
  # derived neutrals — warm, biased toward sand, never a pure grey
  muted-on-light: '#6E645A'
  rule-on-light: '#E4DCD1'
  muted-on-dark: '#9C948A'
  rule-on-dark: '#2C2825'
spacing:
  scale: [4, 8, 12, 16, 24, 32, 48, 64]   # px — NOTHING outside this scale
  page-margin-phone: 24
  page-margin-tablet: 32
  page-margin-tablet-landscape: 48
targets:
  phone: 360-430          # base, no media query
  tablet-portrait: 768    # md:
  tablet-landscape: 1024  # lg:
  desktop: not-a-target   # this is an app, not a website
radius:
  control: 12
  card: 20
  hero: 28
  icon-action: 9999
motion:
  reveal: [380, 450]    # Y aperture opens to disclose imagery
  place: [300, 380]     # garment settles onto the avatar
  shift: [250, 320]     # one look crossfades into another
  resolve: [300, 400]   # Style Intelligence finishes, controls appear
---

# YGS Design Contract

This file is the **single source of truth** for the rebuild. Every builder agent implements
against it; every critic agent reviews against it. Where this file and a Stitch screen
disagree, **this file wins** — Stitch supplies structure and composition, not the visual system.

## Decisions already made (do not reopen)

| Decision | Value |
|---|---|
| Canonical design source | YGS brand. Stitch = screen composition/flow only |
| Gold hex | `#C8A86B` (brand board), **not** `#C8A66B` |
| Component library | shadcn/ui (Radix + Tailwind v4), copied in and restyled |
| Scope | Core 5 flows: Capture, Sizing, Guardrails, Discovery, Capsule |
| Styling | Tailwind v4 `@theme` tokens in `src/index.css`. No hardcoded hex in components |

## Typefaces — LOCKED, do not substitute

| Role | Face | Licence | File |
|---|---|---|---|
| Editorial serif | **Bodoni Moda** | OFL | `src/assets/fonts/bodoni-moda-latin-var*.woff2` |
| Functional sans | **Schibsted Grotesk** | OFL | `src/assets/fonts/schibsted-grotesk-latin-var*.woff2` |

Both are self-hosted variable woff2. **Never link a font CDN.**

**Never reach for any of these.** They are the detector's `OVERUSED_FONTS` list, and it
is the authority — not taste:

> Older monoculture: `inter` `roboto` `open sans` `lato` `montserrat` `arial` `helvetica`
> Newer monoculture (the Anthropic-skill / Vercel / GitHub default wave): `fraunces`
> `instrument sans` `instrument serif` `geist` `mona sans` `plus jakarta sans`
> `space grotesk` `recoleta`

This project reached for **Inter** first, then **Instrument Sans** — both blocked, the
second one named explicitly as the AI-default wave. Check the list before proposing a
face; it lives at
`.claude/skills/impeccable/scripts/detector/shared/constants.mjs`.

Schibsted Grotesk was commissioned for a newspaper, so editorial hierarchy and
small-size legibility are its design brief. Bodoni Moda is a true didone; didone display
over a neutral grotesque is the fashion-masthead pairing, which is why these two sit
together rather than compete.

**Why not Satoshi**, which is the brand sans: it is free and downloadable from Fontshare,
but the Fontshare EULA forbids modifying or *"otherwise copying"* the font software (so no
subsetting) and forbids *"uploading them in a public server"*, pointing web delivery at
their own CDN instead. Self-hosting it is therefore not licensed. Instrument Sans is the
OFL stand-in: same tall x-height and open apertures, holds at 13px, and takes the
wide-tracked uppercase treatment the wordmark uses. If the brand ever buys a self-hosting
licence from Indian Type Foundry, swapping is a three-line change — everything references
`--font-sans`, never a family name.

## The two voices

- **Editorial serif** — occasion titles, reveal moments, Style Intelligence framing.
  Large, tight, sparing. **One per screen at most.**
- **Functional sans** — every control, label, price, setting, measurement, body paragraph.
  Wide-tracked uppercase for labels.

> The serif must **never** appear on a button, setting, price, or any dense information.
> The current codebase violates this (`font-serif` on 12px control labels) — fix on sight.

Type roles: editorial-display 40–64px/400/-0.02em · occasion-title 20–28px serif italic ·
screen-title 22px/500 · body 16–17px/400 · control-label 13px/500/0.14em ·
eyebrow 11px/500/0.20em · price 15px/400 **tabular-nums**.

## The gold scarcity rule

Gold means **selected, special or intelligent** — not "luxury". More than once or twice on a
screen and it has become wallpaper.

- **Permitted**: active selection state, completed Style Intelligence result, the signature
  moment on a reveal, the gold slash inside the mark itself.
- **Forbidden**: body text, icons, dividers, ordinary card borders, routine button fills,
  decorative rules, gradients.

## Ground pairing

| Ground | Type | Mode |
|---|---|---|
| Onyx `#111111` | `#FFFFFF` | Theatre — presenting |
| Forest `#1E2C26` | `#FFFFFF` | Style Intelligence only |
| Cream `#FAF6F1` | `#171717` | Conversation — working |
| Sand `#E7DFD3` | `#171717` | Conversation |
| Gold `#C8A86B` | `#111111` | Accent only — **never a page ground** |

**Dark is theatre; cream is conversation.** Onyx/Forest when the app is *presenting*
(onboarding, capture, reveals, Style Intelligence). Cream/Sand when the user is *working*
(guardrails, wardrobe, preferences, comparing).

## Responsive — phone and tablet

**Both are first-class targets.** This is an app, not a website: there is no desktop
breakpoint and no desktop layout. Design phone-first, then let the tablet earn its extra
space — never stretch a phone layout to fill a tablet.

| Target | Width | Tailwind | Page margin |
|---|---|---|---|
| Phone | 360–430 | base (no prefix) | 24 |
| Tablet portrait | 768+ | `md:` | 32 |
| Tablet landscape | 1024+ | `lg:` | 48 |

Both tablet orientations must work. Test at 390×844 (phone), 820×1180 and 1180×820 (tablet).

### The failure mode to avoid

A phone layout scaled up: full-width buttons spanning 1024px, a single column of body
text at 90 characters, cards ballooning to fill the viewport, one look card floating in
an ocean of dead space. **Extra space is composition, not stretch.**

### How each surface adapts

- **Hero Canvas / Virtual Studio** — 60–80% of viewport height on phone. On tablet the
  avatar does not simply grow: cap it and use the freed space for the look stack beside
  it (landscape) or beneath it (portrait).
- **Editorial Look Card** — one card, centred, `max-w` capped on tablet so the 4:5 image
  keeps its editorial proportion. Never let a single card span the full tablet width.
- **Capsule / Look Stack** — 1 column phone → 2 columns `md:` → 3 columns `lg:`.
- **Style Guardrails** — single column of toggles on phone → two columns `md:`, grouped
  by category. The hard guardrails stay visually separated from soft preferences.
- **Bottom sheet (Product Sheet, Checkout)** — edge-to-edge sheet on phone → centred
  dialog, `max-w-[560px]`, on tablet. Use the shadcn `sheet` on phone and `dialog` on
  tablet, or one component that switches at `md:`.
- **Drawer / Menu** — full-screen on phone → side drawer `max-w-[420px]` on tablet.
- **Action row** — primary actions stay thumb-reachable. Cap action rows with `max-w`
  and keep them bottom-anchored; do not spread three buttons across a full tablet width.

### Rules

- Touch targets ≥ 44×44 at every size. Hover is an enhancement only, never the sole
  affordance — tablets have no reliable hover.
- Body text stays 16–17px at both sizes. **Never scale body text down to fit.** Only the
  editorial display and occasion titles step up on tablet.
- Line length stays ≤ 70 characters — cap with `max-w`, don't let prose run tablet-wide.
- Image ratios (4:5, 3:4, 1:1) hold at both sizes. Crop, never letterbox or distort.
- Respect safe areas: `env(safe-area-inset-*)` for notches and home indicators.
- Layout with flex/grid and `gap`. No fixed pixel heights that break in landscape.
- Any horizontally wide content scrolls inside its own container — the page body must
  never scroll sideways at any width.

## Navigation model

`Y / Context · Primary Action · Menu`

- **No five-tab navigation bar.** Menu opens the wider product.
- A screen exposes **no more than three actions**. Three is a ceiling, not a target.
- No persistent search bar. No notification bell unless notifications need attention.

## Motion

Only four named transitions: **Reveal · Place · Shift · Resolve** (timings in frontmatter).

Forbidden: bounce, overshoot, elastic easing, confetti, spinning AI stars, shimmer that
outlasts the load. Motion is *fabric being placed*, not buttons celebrating themselves.
Every animation must respect `prefers-reduced-motion`.

The current codebase violates this (`Sparkles` with `animate-spin`) — remove.

## Voice

Intelligence manifests as **outcomes**, never as technical theatre.

| Never | Always |
|---|---|
| "Generating AI recommendations…" | "Finding your look…" |
| "AI Recommendation: 92%" | "Why this works" + "92% Style Match" |
| "Gemini 2.5" / model names in UI | (nothing — the machinery is invisible) |
| "Trending" | "Works with your navy trousers" |

## Deliberately absent components

Dropdowns as a general-purpose control · nested accordions · giant filter panels ·
floating toolbars · carousels of tiny product tiles · persistent search ·
discount and urgency badges.

Each would drag YGS toward conventional e-commerce. If one becomes genuinely unavoidable,
that is a product conversation — not a component request.

## Brand assets

Import from `src/components/brand/` (`YMark`, `Wordmark`) — the SVG sources are vendored
into `src/assets/brand/` so the app is self-contained. **Do not reference `../assets/`**:
that path only resolves from the primary checkout, not from the flow worktrees, and it is
outside the repo. The original extraction set, for reference only, is:
`symbol/` (y-onyx, y-white, y-gold, y-large) · `logo/` (primary-horizontal, stacked,
footer-white) · `app-icon/` (onyx, cream, forest, sand) · `icons/ui/` (10) ·
`icons/pillars/` (5). Import these — never redraw the mark, never use an emoji or a
lucide substitute for the Y.

## Known conflicts (flag, do not silently resolve)

1. Stitch mockups show a five-icon bottom tab bar; the model forbids it. **Model wins.**
2. The four-point sparkle is slated for retirement — prefer the Y for intelligence.
3. Onyx `#111111` and Ink `#171717` differ by six units. Onyx = surface, Ink = type.
4. ~~Satoshi is the brand sans but is not embeddable.~~ **Resolved** — see Typefaces
   above. Self-hosting Satoshi is not licensed under the Fontshare EULA; Instrument Sans
   is the locked OFL stand-in. Revisit only if ITF grants a self-hosting licence.
