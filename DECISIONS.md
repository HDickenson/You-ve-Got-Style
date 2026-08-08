# Decisions log — YGS

Rulings by the human owner, recorded when made. Each states what was decided, what was
declined, and what it changes. Later work does not get to reinterpret these.

---

## D1 — Sizing: drop the pretence (YGS-4)

**Decided.** The product stops presenting itself as photogrammetry and becomes an honest
height-and-measurements grading tool.

Chest, waist, hips and inseam become editable, pre-filled from height and marked as
estimates until the customer changes them. The existing brand-size matcher — which already
matches real per-brand size tables by nearest fit — starts receiving real numbers.

**Declined:** making the capture actually measure (too large, and the on-device pipeline the
plan describes does not exist); and keeping capture while merely softening the language.

**Changes:** all "photogrammetry / 3D / volumetric / body mesh / scan" out of copy and code,
including the function name `calculatePhotogrammetryMeasurements` and the fabricated Golden
Ratio citation at `brandGrading.ts:74`. `confidenceScore: 0.98` deleted with nothing
replacing it. The unreachable `/api/photogrammetry` route removed or wired.

**Capture survives** for one reason: `frontPhoto` is posted to `/api/generate-tryon` so a
look renders on the customer rather than a stranger. The camera is for seeing the look on
you. It was never for measuring you.

---

## D2 — Catalogue: hand-curated, not an API (YGS-28)

**Decided.** A small curated catalogue with real photography and every guardrail attribute
filled in by hand. An affiliate application (Net-a-Porter / Farfetch via Rakuten, and Ounass
if it offers a feed) starts in parallel for the path beyond the lab.

**Declined:** Temu. There is no official public product API — the Partner Platform API is a
seller/ISV integration, and everything else on offer is scraping, with no licence to display
the imagery. Separately, an ultra-low-cost marketplace contradicts a product that prices a
2,950 AED dress.

**The deciding factor was not imagery.** Affiliate feeds carry title, description, category,
colour, material, price and image. They do **not** carry hemline, sleeve length, neckline or
opacity — the fields guardrail enforcement actually needs. A feed would solve the blank card
and leave enforcement inferring from prose. The criterion is: *can the source answer "does
this cover the knee" without parsing English?*

---

## D3 — Menswear is a first-class path (YGS-33)

**Decided.** The catalogue covers both wardrobes with a decent cross-section.

**Consequence, and it is structural.** The product assumes a woman in seven places, four
non-cosmetic: every `GCC_LUXURY_BRANDS` size table is womenswear; the grading constants
88/68/95 are female proportions; `noTrousers` reads "Skirts and dresses only"; and
`server.ts:178` hardcodes the try-on prompt as "Full body studio portrait of an elegant
woman".

Menswear grades on chest, waist, neck, sleeve and inseam — hips barely feature — so
`UserMeasurements`, the measurement form and the brand tables all fork. Modest wear for a
GCC male customer is its own vocabulary (covered shoulders and knees, long sleeves, loose
rather than fitted, thobe and kandura as formalwear), not womenswear with the skirts
removed.

**Sequencing:** this lands before the Phase 1 measurement form, because which fields are
editable depends on which wardrobe.

**Explicitly not acceptable:** a `gender` boolean gating a few strings while the grading
stays female.

**Cross-section means:** both wardrobes roughly even; every existing occasion in both; a
real price range rather than everything at the luxury ceiling; looks that *violate* the
guardrails as well as satisfy them, so fail-closed enforcement can be tested; and size
coverage beyond the samples currently present.

---

## D4 — The ground follows the occasion, not the wardrobe (YGS-34)

**Decided.** Gender does not change the shell. Menswear and womenswear share one brand, one
palette, one shell, and the garments carry the difference.

**Declined:** a warm/cool split by wardrobe. It is a cliche one level above pink and blue —
more tasteful, same move. A luxury house does not tell you which department you are in by
changing the lighting temperature. Net-a-Porter and Mr Porter are separate *properties*,
not one property with a tinted shell.

**In its place:** the ground responds to the **occasion**, which is true for every customer
regardless of wardrobe, and uses the ground system for something the product actually knows
because the customer said it. Right now choosing an occasion changes which looks appear and
nothing else; the screen looks identical either way.

**Scope is deliberately small.** The per-phase ground map in `App.tsx:22-28` stays. This is
one additional mapping inside discovery. Hard constraints: no new colours beyond the seven
in `index.css`; gold stays rationed; forest stays reserved for Style Intelligence; and not
every occasion gets its own ground — five occasions mapping to five surfaces would be a
colour-coding system, which is a different and worse idea. Expect two or three registers,
daylight and evening, with occasions grouped into them.

**The bar:** a customer switching from Weekend Brunch to Galas & Events feels the screen
change temperature without being able to say what moved. If it reads as theming it has
failed; if it reads as the product paying attention it has worked.

---

## D5 — This is a lab build. English only, and it says so (YGS-39)

English-only is acceptable. Presenting it as UAE-ready is not.

## What proceeds

Kai's mechanical sweep, already dispatched and unaffected by this answer: `lang` and `dir`
declared explicitly, physical properties made logical, the slider gradient made
direction-aware. Zero visible change under LTR, and cheaper now than at sixteen screens.

**The catalogue is unblocked.** Curate in English. The second data-entry pass was the reason
this needed answering before YGS-28 started, and the answer removes it.

## What is deferred, by name

Arabic strings, an i18n layer, an Arabic display face beside Bodoni, RTL composition review,
and the swipe-direction judgement. These become a named future phase in ROADMAP rather than
an omission — the distinction being that a reader can see they were considered.

## The obligation this creates

A lab build may be English-only. It may not imply a readiness it does not have. So the
product must not claim UAE or KSA service, compliance or residency anywhere a customer can
read it.

Checked. No PDPL, compliance or data-residency claims survive in the UI — the earlier sweep
worked. Regional vocabulary that remains is either data (`GCC_LUXURY_BRANDS`, brand
countries) or flavour (`Dubai Networking Soirée`), and neither asserts a capability.

**One exception, and it is a real claim.** `CheckoutModal.tsx:18-20`:

```ts
{ city: 'Dubai',     when: 'Same day' },
{ city: 'Abu Dhabi', when: 'Next morning' },
{ city: 'Riyadh',    when: 'Within 24 hours' },
```

Three delivery promises with no logistics, no carrier, no inventory and no order behind
them. Same class as "Your size is held while you finish here" — a specific, checkable
service claim the code cannot back, sitting on the screen where a customer commits money.

Raised against YGS-2.

---

## D6 — Firebase provides authentication (YGS-40)

**Decided.** Firebase Auth is in scope. It also explains the dependency that appeared in the
API-hardening branch: that branch had picked up `main`'s lineage, where Firebase already
existed.

**What it overturns.** ROADMAP's lab constraint read *"No database, no accounts, no
payments, no server-side state."* **Accounts are now in.** Database, payments and
server-side state are **not**, unless separately ruled — this does not extend to them by
implication. Phase 4's "no accounts, no cross-device sync" is superseded.

**Scope.** `firebase/auth` only, imported modularly. Not the compat bundle, not Firestore,
not Analytics. It arrives through `package.json` as a reviewed dependency with a commit
message saying why, never through a regenerated lockfile. `recharts` appeared in the same
branch, is used by nothing, and is **not** covered by this ruling.

**The consequence that is not technical.** Today nothing persists, which makes the consent
screen's promise — *"The frames are held for this session only"* — true by absence rather
than by mechanism. With an account the question stops being *does this survive a refresh*
and becomes **what is attached to this person, and for how long.** Body measurements against
an identity is a materially different product, and in a UAE/KSA context that is PDPL
territory — the exact ground this project already cleared once by removing compliance claims
it could not back.

**Suri rules on what an account may hold before any auth code exists**, and may block alone:
what may be stored, whether frames may *ever* be persisted, what the consent screen must say
once an account exists, and what deleting an account must actually delete.

---

## D7 — The foundation becomes `main`. The six screens become proposals (YGS-20)

**Decided.** `feat/brand-foundation` replaced `main` rather than merging into it. Executed as
a merge commit with both parents whose tree is byte-identical to the foundation.

**Why.** Measured against the foundation's own gates, `main` had no `DESIGN.md`, zero
`--*: initial` declarations so no token layer existed, 28 raw hex values in components, and
a failing detector. Merging conflicted in eight files including every core screen. Its six
newer screens were built without the token layer, the design contract, or any of the honesty
work — merging them would have reintroduced precisely what this sprint removed.

**Nothing was discarded.** `main`'s three commits and all six screens are preserved on
`archive/main-features-2026-08-08`, verified reachable by object.

**Carried forward:** the Firebase work. `firestore.rules` and `security_spec.md` are the
starting point for D6 rather than a blank page — evidence written before the question was
asked, not an answer to it.

**Package manager:** `main` used bun, the foundation uses npm, and CI is built on `npm ci`.
The foundation's choice stands by default; adopting bun would be a separate deliberate
change, not something inherited through a merge.

---

## D8 — The opening is wrong: splash, then a voice-guided introduction, then consent (YGS-48)

**Decided by the owner, on seeing the running app.** The wardrobe question — *"What are you
shopping for?"* — opened the app. A form's opening, not an app's: it asked the customer to
answer before they knew what the thing was. One screen later, "Open the studio" asked for
consent the product had not yet earned — the screen explained carefully what it would *not*
do with the customer's data, having never once said what they get.

**Replaces it:** a splash (this is an app, and it carries the tap gesture a browser requires
before it will play audio) → a voice-guided introduction, narrated and always readable as
text, the wardrobe question now living inside it rather than standing at the front door →
consent and capture (`HandsFreeCapture`, unchanged), reached only once the reason for asking
is already understood.

**Voice-guided is not voice-controlled.** The app *speaking* needs no consent — only the app
*listening* does, and that gate is still `HandsFreeCapture`'s, one screen further on. So the
introduction asks for nothing; narration is opt-in, triggered only by an explicit "Listen
instead" tap, never autoplayed and never assumed. Silence is a first-class path, not a
degraded one: the text is the whole introduction whether or not anyone ever taps it.

**Live TTS**, ruled over scripted audio, via `gemini-2.5-flash-preview-tts` (`/api/tts`,
server-owned fixed script — nothing client-supplied reaches the model, so there is nothing
to sanitise the way `sanitiseUserPrompt` has to). The response is headerless L16 PCM; the
server wraps it in a WAV header before the client ever sees it, and caches it per process
since the narration never changes. No key, or a failed call, degrades to text-only — the
same fallback shape as the styling and try-on routes already use.

**Scope held to what the ruling actually asks for.** The wardrobe question itself is
unchanged (`ChooseWardrobe`, reused as-is) — only where it sits moved. The consent gate
inside `HandsFreeCapture` is unchanged — only what precedes it moved. `'wardrobe'` stays a
valid `AppPhase` for the capture harness's `?phase=` matrix even though no customer path
reaches it directly anymore.

**Copy is a first draft, not a ruling.** The introduction's narration states only what this
codebase can back — guardrails checked in code, fit estimated from height, a capsule to save
to — nothing about the sizing engine or the try-on renderer this product cannot. Mira owns
the final wording.

---

## Standing rules established during the sprint

- **Delivered means pushed.** Work not reachable on the remote is not delivered. Two agents
  filed detailed reports for work that existed in no commit.
- **Every report states the branch and commit it measured.** One reviewer measured the wrong
  tree and reported findings from files that exist only on `main`.
- **A grep for an explicit attribute cannot see a default.** Counting `variant="..."` missed
  every primary button and produced a confident, wrong conclusion.
- **A claim does not have to sound like a claim.** The compliance-vocabulary sweep missed
  "Your size is held while you finish here", which is a factual assertion about system state
  with no inventory behind it.
- **Prefer absence to fabrication.** If a value cannot be computed, show nothing.
- **A decision that lives only in a comment thread does not exist.** D6 and D7 were ruled,
  acted on, and left out of this file for hours. An agent assessing the archived screens
  read `main:DECISIONS.md`, found only D1-D5, and said so rather than guessing — which is
  correct behaviour, and it still cost that assessment its most relevant context.
- **A lab build may be incomplete; it may not imply readiness it does not have.** English-only
  is fine. "Same day" delivery to Dubai, with no logistics behind it, is not.
