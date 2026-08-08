# Delivery phases

Scoped for a lab build, not a production commerce platform. Every phase ships something a
customer could use, and every phase is honest on its own — none of them depends on a later
phase to stop being misleading.

## The constraint that shapes all of this

**No database, no accounts, no payments, no server-side state.** One Express process, a
React SPA, browser storage where continuity is genuinely needed. Everything below is
achievable inside that constraint, and the things that are not are named at the bottom
rather than left on a wishlist.

This is deliberate. The plan's Available-to-Promise inventory, atomic reservations, GraphQL
layer and regional data residency are all real engineering problems, and none of them is
the thing that makes this product worth using.

---

## Phase 0 — Nothing it says is untrue

**In flight.** The current sprint.

Not a feature phase. The product currently asserts things the code cannot compute, and every
later phase built on top of that inherits it.

| Work | Card | State |
|---|---|---|
| Try-on fails closed rather than returning a stranger's photograph | YGS-27 | **merged** |
| Guardrails enforced in code, fail closed | YGS-7 | PR #8 |
| Failure and slow paths visible | YGS-6 | PR #9, #10 merged |
| Consent granular, revocable, declinable | YGS-1 | open |
| Remove every claim the code cannot compute | YGS-2 | open |

**Exit criteria** — zero rendered facts trace to a literal, an unconditional branch or a
default. Specifically: *"Your size is held while you finish here"* is gone or true, and
`isOrdered` no longer asserts an order that was never placed.

**Deliberately not fixed here** — the sizing story. That is Phase 1, because it is a
product decision rather than a defect.

---

## Phase 1 — An honest sizing tool

**Next. Ruled: drop the pretence.**

Chest, waist, hips and inseam become editable, pre-filled from height and marked as
estimates until the customer changes them. The existing brand-size matcher — which already
matches real per-brand size tables by nearest fit — starts receiving real numbers.

All "photogrammetry", "3D", "volumetric", "body mesh" and "scan" leaves copy and code,
including the fabricated Golden Ratio citation at `brandGrading.ts:74`. The
`confidenceScore: 0.98` literal goes with nothing replacing it. The unreachable
`/api/photogrammetry` route is deleted or wired.

**Why this is first among feature work** — it is small, it is the one lie left in the chain
after Phase 0, and it converts the weakest part of the product into a genuinely useful one.
A customer with a tape measure gets an accurate size across six luxury brands. Nothing else
in the app currently delivers that.

**Exit criteria**
- `rg -i 'photogrammetry|volumetric|body.?mesh|3d scan' src/` returns nothing.
- A customer who edits chest and waist receives different brand sizes than one who does
  not. Shown by capture at three viewports, not asserted.
- No confidence score anywhere.

**Cards** — YGS-4 (Rune, in progress), with Mira on language and Dex on `brandGrading.ts`.

---

## Phase 2 — A look you can actually see

**The largest gap in the product.**

The discovery card renders a blank gradient where the garment should be. Everything around
it is finished — occasion, serif title, TOP / BOTTOM / CLOTH, the reasoning, the guardrail
verdict — and the product is missing.

For a lab build the honest options are a small curated catalogue with real photography, or
generated imagery clearly presented as illustration rather than as the garment. **That is a
decision, not a task**, and it is the one thing on this roadmap that cannot be resolved by
reading the code.

**Exit criteria** — every look shown carries an image, and the image is either the garment
or is plainly labelled as not being the garment.

**Cards** — YGS-28 (owner ruling needed).

---

## Phase 3 — The camera earns its place

Capture survives Phase 1 for one reason: `frontPhoto` is posted to `/api/generate-tryon` so
a look renders on the customer rather than on a stranger. That is the compelling reason to
take a photograph, and after Phase 1 it is the *only* reason.

So this phase trims the capture flow to what serves try-on and improves what remains. The
level check, the alignment gate and the pose outline exist to make measurement look
scientific; a photograph for a render does not need the phone at 90 degrees.

Voice keeps its place if it earns it — hands-free shutter at arm's length is a real
convenience — but it needs consent of its own (Phase 0, YGS-1) before it survives.

**Exit criteria** — no step in the capture flow exists only to support a measurement that
no longer happens. Try-on renders, fails visibly, and is never substituted.

**Cards** — YGS-30, YGS-31, and the remainder of YGS-6.

---

## Phase 4 — It survives a refresh

Today nothing persists. Consent, measurements and saved looks vanish on reload.

The consent screen promises *"The frames are held for this session only. Retake replaces
them, and closing the app ends them."* That is currently true **by accident** — there is no
mechanism, just an absence. The moment anything persists, that sentence needs a mechanism
behind it.

For a lab build: `localStorage` for measurements, guardrails and the capsule; frames never
persisted, which keeps the consent promise literally true and is also the correct privacy
posture. Consent revocation clears the stored keys, so revocation becomes a real operation
rather than a UI gesture.

Also here: `savedLooks` stops initialising with a garment the customer never chose, so the
well-written empty state is finally reachable.

**Exit criteria** — measurements and capsule survive a reload; frames do not; revoking
consent demonstrably clears stored data.

**Deliberately not** — accounts, server-side sessions, cross-device sync.

---

## Phase 5 — Discovery worth the name

Only once a look has an image and a trustworthy size is it worth asking whether one-at-a-time
swiping is the right way to choose a 2,950 AED dress. YGS-3 raises that challenge and it is
correctly parked until the card being swiped is worth looking at.

---

## Running alongside — platform

Not a phase; continuous, and mostly landed.

| Work | Card | State |
|---|---|---|
| CI: type gate, build, detector, raw-hex, captures | YGS-22 | **merged** |
| Capture harness and preview page | YGS-25 | **merged** |
| Raw-hex checker over-fires on fixtures | YGS-29 | PR #11 |
| `npm run start` crashes on boot | YGS-23 | open |
| Reconcile foundation with `main` | YGS-20 | open |
| Close the spacing scale | YGS-21 | open |

**YGS-23 and YGS-20 are the two that block anyone else seeing this run.** Neither is large.

---

## Out of scope, and why

Named so their absence is a decision rather than an oversight. Each is in the product plan.

| Absent | Why not in a lab build |
|---|---|
| ATP inventory, atomic reservation, TTL holds | Needs a database and a real catalogue. Phase 0 removes the claim instead. |
| GraphQL layer | The plan commits to it; three REST endpoints do not need it. |
| On-device MediaPipe and Whisper | Only justified if capture drives measurement. After Phase 1 it does not. |
| Data residency enforcement | Needs infrastructure that does not exist. Do not claim it. |
| Virtual Studio | A whole phase of the plan, absent from the code. Reconsider after Phase 2. |
| Virtual Try-Off | Depends on a real catalogue and garment segmentation. |
| Accounts, payment, order records | Checkout becomes honest about being a demonstration instead. |

---

## Sequencing in one line

**Stop lying → make sizing true → make the product visible → make the camera worth using →
make it survive a refresh → then question the interaction model.**

Each phase is shippable and honest on its own. If work stops after any of them, what exists
still tells the truth.
