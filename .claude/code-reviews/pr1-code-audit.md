# PR #1 — Code Audit

Scope: commit `8ba6f25` `feat(design-system): brand token foundation for phone and tablet` only.
The first commit (`48b4efe chore(ai-layer)`, 267 vendored skill markdown files) was excluded per instruction.
All findings were read from the **committed** tree (`git show feat/brand-foundation:<path>`), never the working tree.

**Stats**: 42 files changed · 36 added / 6 modified / 0 deleted · +6,669 / −244 lines
(of which `package-lock.json` is +4,295 and 4 `.woff2` binaries are ~162 KB)

**Verdict**: **BLOCK**

Two critical defects mean the app, as merged, renders visibly broken. Both were reproduced —
not inferred — by building the commit in an isolated worktree and probing the result in a
headless browser. Everything else in this PR is unusually careful work; the two criticals are
narrow and each has a small, verified fix.

**Verification performed**

| Check | Result |
|---|---|
| `npx vite build` at `8ba6f25` (isolated worktree) | succeeds, 4 hashed `.woff2` emitted |
| `npx tsc --noEmit` at `8ba6f25` | exit 0, clean |
| Headless Edge computed-style probe of the built CSS | reproduced Critical 1 |
| Headless Edge screenshot of the built app @390×844 | reproduced Criticals 1 and 2 |
| Type-checking probe (`__probe.tsx`, deleted after) | reproduced High 1 |
| Candidate fix for Critical 1 built and re-probed | fix confirmed working |

---

## Critical

### C1 — The ground-relative token aliases do not invert. Every `bg-surface` / `text-fg` / `border-rule` in the app renders cream-ground values on *every* ground.

**severity**: critical
**file**: `src/index.css:96-100` (declaration) and `src/index.css:275-334` (the `.ground-*` blocks)
**issue**: `@theme` declares the aliases as indirections —

```css
@theme {
  --color-surface: var(--ygs-surface);
  --color-fg:      var(--ygs-fg);
  --color-rule:    var(--ygs-rule);
}
```

— and the `.ground-*` / `[data-ground]` rules rebind only `--ygs-*`. Per CSS Custom Properties L1,
a custom property containing `var()` is substituted **at computed-value time on the element where it
is declared**. Tailwind emits these on `:root,:host`, so `--color-surface` is frozen to `#faf6f1`
there and inherits as that literal. Re-declaring `--ygs-surface` further down the tree cannot change it.

**detail / evidence**: built the commit and read computed styles in headless Edge. A div carrying
`bg-surface text-fg-muted border-rule` inside `<body data-ground="onyx">`:

```
b: bg=rgb(250, 246, 241)  color=rgb(110, 100, 90)  border=rgb(228, 220, 209)
   --color-surface=#faf6f1   --ygs-surface=#111
```

Cream background, light-ground muted text, light-ground rule — on the onyx theatre ground.
`--ygs-surface` is correct; the alias that the utilities actually read is not.

A screenshot of the built app at 390×844 confirms it in the product: during `onboarding` (an onyx
phase) `HeaderNav` (`src/components/HeaderNav.tsx:96`, `bg-surface/85 border-rule`) paints a **cream
bar across the top of an otherwise black app**, with `text-fg-muted` `#6E645A` for the context word.

This is not cosmetic — it is the mechanism the entire design system rests on. Every claim in the
commit message and in `card.tsx`, `button.tsx`, `badge.tsx`, `switch.tsx`, `slider.tsx`,
`separator.tsx`, `skeleton.tsx` and `Editorial.tsx` about "the component never needs to know whether
it sits on cream or onyx" is currently false. The latent failures are worse than the visible one:
`Button variant="primary"` is `bg-fg text-surface` → ink `#171717` on onyx `#111111` (contrast 1.05:1,
an invisible button) the moment a primary button is placed on a theatre ground.

The `:focus-visible` ring at `src/index.css:360-363` is the one place that gets this right — it reads
`var(--ygs-focus)` directly with no `@theme` alias in between, so it *does* resolve per-ground.
That is the proof the author understood the mechanism and the `@theme` block is the place it was lost.

**suggestion**: move the five alias declarations out of the main `@theme` block into their own
`@theme inline { … }` block placed **after** the `--color-*: initial` reset. `inline` makes Tailwind
emit the resolved value into the utility (`background-color: var(--ygs-surface)`) rather than a
reference to `--color-surface`, so the lookup happens on the consuming element. Verified: with that
one change built, the same probe returns

```
b: bg=rgb(17, 17, 17)  color=rgb(156, 148, 138)  border=rgb(44, 40, 37)
```

— onyx surface, `muted-on-dark`, `rule-on-dark`. Placement matters: an `@theme inline` block placed
*before* the reset is wiped by `--color-*: initial` and the utilities stop generating entirely.

---

### C2 — `--color-*: initial` and `--radius-*: initial` silently delete 422 utility usages across the six screen components, which this PR does not touch or migrate.

**severity**: critical
**file**: `src/index.css:73` (`--color-*: initial`) and `src/index.css:121` (`--radius-*: initial`)
**issue**: the reset deletes Tailwind's stock palettes and radius scale from the theme. Tailwind v4
does not error on an unknown utility — it simply generates nothing. The classes stay in the DOM and
resolve to no declaration at all.

**detail / evidence**: counted against the committed tree, colour utilities naming a deleted palette:

| File | occurrences |
|---|---|
| `src/components/StyleGuardrails.tsx` | 95 |
| `src/components/HandsFreeCapture.tsx` | 73 |
| `src/components/SizingEngine.tsx` | 65 |
| `src/components/CheckoutModal.tsx` | 49 |
| `src/components/SwipeDiscovery.tsx` | 46 |
| `src/components/CapsuleWardrobe.tsx` | 43 |
| **total** | **371** |

plus 51 deleted-radius usages (`rounded-xl` ×31, `rounded-2xl` ×13, `rounded-lg` ×6, `rounded-md` ×1).
Grepping the built stylesheet confirms zero output for `stone`, `amber`, `emerald`, `rounded-xl`,
`rounded-2xl`, `rounded-lg`, `rounded-md`.

Those six files are exactly the DESIGN.md "Core 5 flows" (Capture, Sizing, Guardrails, Discovery,
Capsule). The 390×844 screenshot of the built onboarding screen shows the result: square-cornered
panels, lost surface colours, and content overflowing the viewport horizontally into
`body { overflow-x: hidden }` — the precise failure mode DESIGN.md §"The failure mode to avoid" and
`ActionRow.tsx:18-20` both warn about.

`SwipeDiscovery.tsx` is *in this diff* and still carries `text-emerald-400` (line 104) and
`text-amber-400` (line 153), which now render as nothing.

**Also**: the commit message asserts "`--color-*: initial` deletes Tailwind's stock palettes outright,
so `bg-stone-950` fails at build time instead of silently working." This is **not true** and the
opposite of what happens — `npx vite build` at this commit completes successfully with all 371
usages present. There is no build-time guard. The reset makes the failure *silent and invisible*,
which is strictly worse than the "silently working" state it was meant to prevent.

**suggestion**: either (a) hold the reset until the six screens are migrated — land the tokens
additively first; or (b) land the reset together with a lint/CI guard that actually fails
(e.g. an `ast-grep`/regex check for the deleted palette and radius names in `src/**/*.tsx`), so the
enforcement the commit message claims genuinely exists. Do not merge (a) and (b) as-is.

---

## High

### H1 — `React.FC`-typed components are entirely unchecked at their call sites, so `tsc --noEmit clean` is a much weaker signal than the commit message implies.

**severity**: high
**file**: `src/components/HeaderNav.tsx:58`, `src/components/SwipeDiscovery.tsx:31`
**issue**: `@types/react` is absent from `package.json`, `package-lock.json` and `node_modules`
(`src/lib/props.ts:1-4` states this correctly). With `allowJs: true`, TypeScript resolves `react` to
its JavaScript implementation, so `React.FC` is `any` — and a component annotated `React.FC<Props>`
gets **no** JSX prop checking at all.

**detail / evidence**: a probe file compiled against the committed tree:

```tsx
export const A = () => <HeaderNav totallyBogusProp={1} />;   // no error
export const B = () => <Button variant="not-a-variant">x</Button>;  // TS2322 ✓
export const C = () => <Stack gap={20} />;                    // TS2322 ✓
```

`HeaderNav` accepted a bogus prop with **every required prop missing** and produced no diagnostic.
`Button` and `Stack` — plain function components — are checked correctly.

This matters directly for this commit: the `onGenerateAiLook`/`isGeneratingAi` →
`onFindLook`/`isFinding` rename crosses exactly these two `React.FC` boundaries. `tsc` could not have
verified it. (It happens to be correct — I checked `App.tsx:187-188` and `:227-228` against
`HeaderNav.tsx:23-24` and `SwipeDiscovery.tsx:13-14` by hand — but nothing in CI would have caught
a mismatch.)

**suggestion**: add `@types/react` and `@types/react-dom` as devDependencies (the honest fix, and it
retires `src/lib/props.ts` entirely), or in the interim drop the `React.FC` annotation and type the
parameter directly — `export function HeaderNav(props: HeaderNavProps)` restores checking with no
new dependency.

### H2 — A missing `compliance_check` from the API is defaulted to "compliant".

**severity**: high
**file**: `src/App.tsx:159`
**issue**: `compliance_check: data.compliance_check ?? true`.
**detail**: `data` is untyped `any` from `res.json()`. If the endpoint omits the field, errors
partially, or changes shape, the look is marked as satisfying the user's guardrails. DESIGN.md calls
guardrails "hard boundaries" and `StyleGuardrails.tsx:78` promises the app "will NEVER show cards
violating these rules". The safe default for an unmet assertion about a hard constraint is `false`,
not `true` — fail closed.
**suggestion**: `compliance_check: data.compliance_check === true`, and surface an "unverified" state
rather than an implied pass.

### H3 — `/api/style-recommendations` failures are invisible to the user.

**severity**: high
**file**: `src/App.tsx:120-171`
**issue**: `res.ok` is never checked (line 130 goes straight to `res.json()`), and the `catch` at
line 167 only calls `console.error`. On any non-2xx JSON error body, `data.look_title` is `undefined`,
the `if` at line 132 is skipped, `isFinding` flips back to `false` at line 170, and **nothing at all
happens** — no new look, no message, no retry affordance.
**detail**: the only feedback channel in the whole flow is the `role="status"` region at
`HeaderNav.tsx:118-120`, which announces "Finding your look" and then goes silent whether the call
succeeded or failed. There is no error state anywhere in the shell.
**suggestion**: check `res.ok`, thread an error state back through `HeaderNav`/`SwipeDiscovery`, and
announce both the success and the failure in the existing live region.

---

## Medium

### M1 — `cn()`'s documented contract is wrong: a caller's `className` cannot override a base utility.

**severity**: medium
**file**: `src/lib/cn.ts:3-6`
**issue**: the docstring says "the caller's own className is passed last so it lands last in the
attribute". Order within `class=""` has no effect on the CSS cascade; the winner is whichever rule
appears later in the generated stylesheet. `cn` is a plain `filter(Boolean).join(' ')` with no
conflict resolution (no `tailwind-merge`).
**detail / evidence**: `HeaderNav.tsx:102` renders
`class="block h-6 w-auto h-6 w-auto shrink-0 md:h-7"` — duplicated base classes, visible in the
rendered DOM. `HeaderNav.tsx:152` passes `className="h-7 w-auto"` to a `Wordmark` whose base is
`h-6 w-auto`; it happens to work only because Tailwind emits `.h-6` (line 744 of the built CSS)
before `.h-7` (746). The same pattern fails in the other direction: `.rounded-control` (1185)
precedes `.rounded-full` (1187), so a component whose base is `rounded-full` cannot be overridden to
`rounded-control` by a caller.
**suggestion**: either add `tailwind-merge` (small, and every primitive here already funnels through
`cn`), or correct the docstring to state the real contract — `className` **appends**, it does not
override, and callers must not pass a conflicting utility.

### M2 — The elevation scale is not reset, so "two shadows only" is unenforced while every neighbouring rule is.

**severity**: medium
**file**: `src/index.css:135-138`
**issue**: `--color-*`, `--radius-*`, `--font-*`, `--ease-*` and `--animate-*` are all reset to
`initial`; `--shadow-*` is not.
**detail / evidence**: the built stylesheet contains `.shadow-sm`, `.shadow-md`, `.shadow-lg`,
`.shadow-xl` and `.shadow-2xl` alongside `.shadow-sheet` and `.shadow-dialog`. `StyleGuardrails.tsx:110`
uses `shadow-xl` today and it still resolves. Given C2's cost, this is the inconsistency worth
noting in the opposite direction: the one reset that would have been *cheap* (5 usages, not 371) is
the one that was skipped.
**suggestion**: add `--shadow-*: initial;` beside the other resets, or drop the "two shadows only"
claim from the comment.

### M3 — The Unsplash removal is only half done, and `App.tsx`'s own comment contradicts what ships.

**severity**: medium
**file**: `src/data/sampleLooks.ts:49, 71, 92, 113, 133`
**issue**: the commit message says "Unsplash placeholders replaced with a locally served 4:5 plate".
Only `COMPOSED_LOOK_TEMPLATE` (line 31) uses `LOOK_PLACEHOLDER`. All five `INITIAL_LOOKS` — the
looks the Discovery screen actually shows on first run — still point at
`https://images.unsplash.com/...`.
**detail**: `App.tsx:39-41` comments that "a stock photograph of a stranger standing in for the
user's own body scan is not a placeholder, it is a lie with a face on it" — and the screenshot of
the shipped onboarding screen shows exactly that stock photograph. Beyond the inconsistency this is
a live third-party request on a page whose CSS was deliberately built to make none.
**suggestion**: point `INITIAL_LOOKS[*].imageUrl` at `LOOK_PLACEHOLDER` too, or amend the commit
message. Do not leave the two disagreeing.

### M4 — DESIGN.md's "Brand assets" section describes ~24 files that do not exist in the repo.

**severity**: medium
**file**: `DESIGN.md:202-206`
**issue**: it directs every builder agent to `../assets/`: `symbol/` (y-onyx, y-white, y-gold,
y-large), `logo/` (primary-horizontal, stacked, footer-white), `app-icon/` (4), `icons/ui/` (10),
`icons/pillars/` (5), and says "Import these".
**detail / evidence**: `git ls-tree -r feat/brand-foundation -- assets/` returns exactly one path,
`assets/.aistudio/.gitignore`. The real artwork is three SVGs in `src/assets/brand/`, consumed via
the generated `src/assets/brand/marks.ts`. DESIGN.md is described in the commit message as "the
contract every builder and critic agent works against" — a contract whose asset paths are fiction
will send every downstream agent looking for files that were never there.
**suggestion**: rewrite the section to describe what shipped: `src/assets/brand/*.svg` as generator
input, `marks.ts` as the consumed module, `YMark`/`Wordmark` as the only import surface. Note that
y-white/y-gold/y-large, the app icons and the two icon sets do not exist yet.

### M5 — The slider's touch target is 24 px tall, against a stated ≥44 px rule.

**severity**: medium
**file**: `src/components/ui/slider.tsx:40, 53, 61`
**issue**: the wrapper `div` is `h-11` (44), but the `<input type="range">` inside it — the element
that actually receives the pointer — is `h-6` (24), and the thumb is `size-6` (24).
**detail**: DESIGN.md §Rules requires "Touch targets ≥ 44×44 at every size", and every sibling
primitive honours it deliberately and says so (`button.tsx:28`, `switch.tsx:15-16`,
`overlay.tsx:267`). This one is the exception and does not note it.
**suggestion**: make the input `h-11` and re-centre the runnable track with padding, keeping the
visible track at 4 px.

### M6 — `Overlay` releases the scroll lock and `inert` before the exit animation finishes.

**severity**: medium
**file**: `src/components/ui/overlay.tsx:185, 34-52`
**issue**: `useBackgroundLock(open)` is keyed on `open`, but `AnimatePresence` keeps the panel mounted
and visible for the full `place` duration (340 ms) after `open` flips to `false`.
**detail**: for those 340 ms a still-visible `role="dialog" aria-modal="true"` panel sits over a
background that is scrollable and no longer `inert`, and `useModalFocus`'s cleanup
(`overlay.tsx:109`) has already returned focus to the opener. A click landing on the fading panel
hits a dialog the app considers closed.
**suggestion**: release the lock from `AnimatePresence`'s `onExitComplete` rather than from the
`open` effect.

### M7 — `Overlay` with neither `title` nor `description` has no close button and no accessible name.

**severity**: medium
**file**: `src/components/ui/overlay.tsx:242-275, 228`
**issue**: the entire `<header>` — including the only close control — is conditional on
`title || description`. In that case `aria-labelledby` and `aria-describedby` are both `undefined`,
leaving an `aria-modal` dialog with no accessible name, dismissible only by Escape or a backdrop
click (neither discoverable).
**detail**: both call sites in this diff pass a `title` (`App.tsx:247`, `HeaderNav.tsx:152`), so
nothing is broken today. But `Overlay`, `Dialog`, `Sheet` and `ResponsiveSheet` are all exported as
the general primitive for "every flow that needs a product sheet, a checkout, or a settings panel"
(`responsive-sheet.tsx:14-15`), and `title` is optional in `OverlayProps:158`.
**suggestion**: make `title` required (or require an `aria-label` fallback), and render the close
button unconditionally.

### M8 — Primitives spread `{...props}` after their own event handlers, so a caller's handler silently replaces the component's behaviour.

**severity**: medium
**file**: `src/components/ui/slider.tsx:50 vs 69`, `src/components/ui/switch.tsx:32 vs 38`
**issue**: `onChange` (Slider) and `onClick` (Switch) are set before the `{...props}` spread and are
not destructured out of it. Because `SliderProps`/`SwitchProps` extend `Record<string, any>`, passing
either is well-typed — and it wins, disabling `onValueChange` / `onCheckedChange` with no warning.
**suggestion**: destructure `onChange` / `onClick` out and compose them, or place the internal
handler after the spread.

### M9 — `useModalFocus` re-runs on every `onOpenChange` identity change, and would re-steal focus each render.

**severity**: medium
**file**: `src/components/ui/overlay.tsx:111`
**issue**: `dismiss` is `useCallback(..., [onOpenChange])`, and `onDismiss` is an effect dependency.
Both current call sites pass a stable `setState` function, so this is latent — but a caller passing
`onOpenChange={(o) => setSomething(o)}` gets a new identity every render, re-running the whole effect:
re-pushing onto the module `stack`, re-scheduling the rAF that focuses the first focusable element,
and calling `restoreFocus()` on each cleanup. The visible symptom would be focus jumping out of a
form field on every keystroke.
**suggestion**: keep `onDismiss` in a ref and drop it from the dependency array, so the effect is
keyed on `active` alone.

### M10 — `SwipeDiscovery` receives `onFindLook`/`isFinding` and never uses them.

**severity**: medium
**file**: `src/components/SwipeDiscovery.tsx:13-14, 34-35`; wired at `src/App.tsx:227-228`
**issue**: both props are declared and destructured, and appear nowhere else in the file. `App.tsx`
passes `handleFindLook` and the loading flag into a component that discards them.
**detail**: this is **pre-existing** — `main` has the same dead wiring under the old names, and the
diff touches only the four declaration lines. It is worth reporting because the commit message frames
the rename as part of making the "find a look" path work, and because H1 explains why nothing flagged
it: `React.FC` means an unused required prop is invisible to both the compiler and the call site.
**suggestion**: either consume them (the Discovery screen is the natural home for the action) or drop
them from `SwipeDiscoveryProps` and from `App.tsx:227-228`.

---

## Low

- **L1** — `src/index.css:384-393`: `@utility page-gutter` is defined and never used anywhere; the
  built stylesheet contains zero `page-gutter` output. `AppContainer` uses `safe-inline` instead,
  which supersedes it. Dead code introduced by this commit.
- **L2** — `src/components/brand/Editorial.tsx:21-25`: `console.warn` ships to production. The
  one-editorial-voice-per-screen check is a development guard; wrap it in `import.meta.env.DEV`.
  (The counter itself is StrictMode-safe — effect/cleanup/effect nets to +1 — which I verified by
  reading `src/main.tsx:7`.)
- **L3** — `src/components/HeaderNav.tsx:86` and `:90`: `findLook()` calls `setPhase('discovery')`,
  but `showFindLook` requires `currentPhase === 'discovery'` for the button to render at all.
  The line can never do anything.
- **L4** — `src/App.tsx:154`: `id: \`look-${Date.now()}\`` collides for two looks composed within the
  same millisecond; `handleSwipeRight:103` dedupes on that id. `crypto.randomUUID()` is free here.
- **L5** — Font loading: four self-hosted `woff2` faces with `font-display: swap`, no
  `<link rel="preload">`, and discovery gated behind the stylesheet. The serif fallback stack
  (`src/index.css:152-153`: Didot → Bodoni MT → Georgia) is metrically nothing like Bodoni Moda at
  the 40–64 px display sizes, so expect a visible reflow. `size-adjust` / `ascent-override` on a
  fallback `@font-face`, plus preloading the two upright faces from `index.html`, would remove it.
  The subsetting and `unicode-range` work itself is correct.
- **L6** — `src/components/HeaderNav.tsx:137`: `aria-expanded` on a control that opens a modal dialog;
  `aria-haspopup="dialog"` is the accurate attribute. Moot in practice since the trigger is inside the
  `inert` subtree once the drawer opens.
- **L7** — `src/components/ui/overlay.tsx:146`: `PANEL.bottom` gets `md:rounded-hero` on all four
  corners while `VIEWPORT.bottom` (`:134`) adds no padding at any breakpoint, so a tablet bottom sheet
  has rounded bottom corners flush against the viewport edge.
- **L8** — `src/lib/props.ts:14`: `ElementProps = Record<string, any>` means every DOM prop on every
  primitive is unchecked — `<Card onCLick={…}>` compiles. This is an honest, well-documented
  workaround for the missing `@types/react`, and H1's fix removes the need for it.
- **L9** — `src/components/ui/overlay.tsx:12-19`: `FOCUSABLE` does not exclude `[hidden]`,
  `display:none`, or elements inside a nested `inert` subtree, so a hidden focusable at either end of
  a panel breaks the Tab wrap. Not reachable with the two current panels.
- **L10** — Pre-existing, not introduced, flagged because the file is in the diff:
  `src/components/SwipeDiscovery.tsx:2` imports `Sparkles` and never uses it (`main` has the same
  unused import). `src/App.tsx:108-110` `handleSwipeLeft` is an empty function with a comment. Both
  predate this commit; per the repo's own rule on not deleting pre-existing dead code, they are
  reported rather than actioned.

---

## What is genuinely well done

- **Focus management in `overlay.tsx` is better than most shadcn/Radix ports.** It captures the
  opener before the panel takes focus and restores it on close (`:65-66, :109`); focuses into the
  panel on the next frame with a `tabIndex={-1}` fallback when nothing is focusable (`:70-75`);
  wraps Tab in both directions (`:89-100`); and — the part almost nobody does — arbitrates Escape
  between stacked overlays through a module-level stack so a pair of open dialogs doesn't both close
  on one keypress (`:54, :83`). `inert` on `#app-root-container` closes the screen-reader
  virtual-cursor escape route that a Tab trap alone leaves open (`:34-52`). The module-scope capture
  of `overflow` is correct for the nested case and the comment explains exactly why per-overlay
  capture would deadlock the page.
- **Reduced motion is honoured at three independent layers**, and correctly: the substrate rule at
  `index.css:365-378`, `useReducedMotion()` threaded into every `motion` transition via
  `transition(name, reduced)` (`lib/motion.ts:38-46`, `overlay.tsx:178, 219, 234`), and
  `motion-safe:` / `motion-reduce:` on the one looping animation (`skeleton.tsx:19`). The
  `hidden`/`shown` variants collapse to pure opacity when reduced (`overlay.tsx:195-203`) rather than
  just running the same slide faster.
- **The focus ring is the one token that genuinely inverts per ground**, and for a stated contrast
  reason (gold is 2.01:1 on cream, so cream/sand rebind to ink) — `index.css:296, 360-363`. The
  reasoning behind the gold-scarcity decisions in `button.tsx:12-16`, `switch.tsx:10-13` and
  `HeaderNav.tsx:184-186` is specific, numeric and correct.
- **Self-hosting works end to end.** The build emits all four `.woff2` hashed through Vite's asset
  pipeline; the relative `url("./assets/fonts/…")` from `src/index.css` resolves correctly. Zero
  external requests, and the Fontshare/Satoshi licence analysis is recorded rather than quietly
  worked around.
- **The Tailwind v4 syntax is correct where it is exercised.** `@utility` with nested `@media`
  compiles to the three-breakpoint cascade intended (`safe-inline` verified in the output);
  `@custom-variant hoverable` compiles to
  `@media (hover:hover) and (pointer:fine) { @media (hover:hover) { … } }`; `@keyframes` nested inside
  `@theme` emit only when their `--animate-*` is used; `--font-*: initial` correctly does *not*
  clobber the separate `--font-weight-*` namespace (`.font-medium` still generates).
- **The type-level guards that were promised do work.** `Stack gap={20}` and
  `Button variant="not-a-variant"` are both compile errors, verified. The comment at
  `index.css:104-110` admitting that the eight-step spacing scale is *not* mechanically enforced —
  only the `GAP` map is — is exactly the kind of honesty that makes a design contract trustworthy.
- **Small things done right**: merging the caller's `style` before `--slider-fill` instead of after
  (`slider.tsx:33-35`) with the reason recorded; the `role="status"` region kept separate from the
  disabled button so the announcement survives (`HeaderNav.tsx:113-120`); a native `<input
  type="range">` under the slider so keyboard and SR value announcement come for free; `Icon` sizing
  from CSS only, with no `width`/`height` attributes to fight; `marks.ts` tracing the Y exactly once
  and expressing tone as fill rather than three separate traces at three aspect ratios.

## Explicitly checked and found clean

- **Secrets / client bundle** — no `GoogleGenAI`, no `generativelanguage`, no `API_KEY`, no
  `import.meta.env` anywhere in `src/`; grep of the built client JS returns zero hits. The Gemini
  dependency stays server-side.
- **XSS** — no `dangerouslySetInnerHTML` anywhere in `src/`. All API-supplied strings
  (`look_title`, `top_garment`, `capsule_synergy`) render as React text nodes. The one API-supplied
  URL reaches an `<img src>`, which is not a script sink.
- **`tsc --noEmit`** — exit 0 at `8ba6f25`, no diagnostics. (Its coverage is the problem, not its
  result — see H1.)
- **`vite build`** — succeeds; 2,110 modules; CSS 79.08 kB / 13.52 kB gzip; JS 486 kB / 162 kB gzip.
- **Re-render / memoisation** — every variant map, size map, gap map, placement map and destination
  list is a module-level constant (`button.tsx:18,29`, `badge.tsx:6`, `overlay.tsx:132,143`,
  `Stack.tsx:8,21`, `ActionRow.tsx:8`, `HeaderNav.tsx:28,36,47`, `App.tsx:22`). No large object or
  array literals are constructed inside JSX. No context is created, so there is no unmemoised context
  value. The inline `onBuyLook={(look) => …}` arrows at `App.tsx:226, 236` are recreated per render
  but feed unmemoised children, so they cost nothing.
- **Ref forwarding through `motion.div`** — `panelRef` reaches the DOM node; the focus trap is
  functional (confirmed by the built app's DOM, not by inspection alone).
- **`useBackgroundLock` / `useModalFocus` under StrictMode** — `lockCount`, `overflowBeforeLock` and
  `stack` all balance across the double-invoked effect/cleanup/effect cycle. No leak.
- **Stale closures / missing deps / keys** — none found. `useMediaQuery` correctly re-subscribes on
  `query` change and cleans up. The two `.map()` calls over SVG paths key on index, which is correct
  for a frozen generated array. `HeaderNav`'s `DESTINATIONS.map` keys on `phase`, a stable unique id.
  No state is derived in render.
- **`data-ground` sync** — `index.html:13` seeds `onyx`, `App.tsx:83-85` keeps `document.body` in
  step with the phase. No flash of the wrong ground, no missing dependency.
- **Breakpoint deletion** — `--breakpoint-sm/xl/2xl: initial` at `index.css:126-128` is real and no
  code in `src/` uses `sm:`, `xl:` or `2xl:`, so nothing was orphaned by it.
- **Wordmark colour roles** — the `accent`→`fill-gold` mapping in `marks.ts` faithfully reproduces the
  source artwork: every `accent` path corresponds to a `fill="#C8A86B"` path in
  `logo-primary-horizontal.svg` / `logo-stacked.svg`, and every `mark` path to `fill="#111111"`.
  No hex reaches a component.
