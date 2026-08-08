# Features, journeys and outcomes

What this product offers, what a customer actually walks through, and what they get at the
end of each path. Read from `feat/brand-foundation` @ `328ef07`.

## How to read this

Every entry separates four things that are easy to blur:

- **Promise** — what the product plan or the interface says.
- **Built** — what the code does.
- **Expected outcome** — what the customer is entitled to believe will happen.
- **Actual outcome** — what happens.

Where Promise and Built agree, only the outcome is recorded. Where they diverge, both are,
with the card tracking it. Nothing here is inferred from a plan; every claim comes from the
code, and where NotebookLM's reading of the sources disagreed with a direct read of the
file, the direct read wins and the disagreement is noted.

---

# Part 1 — Feature inventory

| # | Feature | Built? | Where |
|---|---|---|---|
| 1 | Consent gate before capture | Yes, partially | `HandsFreeCapture.tsx:349-424` |
| 2 | Hands-free camera capture, two frames | Yes, as UI | `HandsFreeCapture.tsx:425-678` |
| 3 | Voice trigger — say "Snap" | Yes, browser SpeechRecognition | `:275` |
| 4 | Device-level alignment check | Yes, `deviceorientation` | `:193-203` |
| 5 | Manual alignment fallback | Yes | slider, `min=70 max=110` |
| 6 | Camera-refused fallback to upload | Yes | `:233` |
| 7 | Body measurement from photographs | **No** | see 2.3 |
| 8 | Height-based measurement grading | Yes | `server.ts:44-51` |
| 9 | Brand size mapping | Yes, from height only | `server.ts:59-66` |
| 10 | Fit confidence score | **No** — literal | `server.ts:58` |
| 11 | Hard guardrails (6 booleans) | Yes, substring-matched | `SwipeDiscovery.tsx:74-96` |
| 12 | Soft preferences (fabrics) | Yes, UI only | `StyleGuardrails.tsx` |
| 13 | Price ceiling | Partially — set, not enforced in discovery | `:163` |
| 14 | AI look recommendation | Yes, `gemini-3.6-flash` | `server.ts:121` |
| 15 | Fallback look when unconfigured | Yes — **indistinguishable from real** | `server.ts:94-103` |
| 16 | Virtual try-on image | Yes, `gemini-3.1-flash-image` | `server.ts:211` |
| 17 | Try-on fails closed | Yes, landed this sprint | PR #7 |
| 18 | Look reasoning — "Why this works" | Yes, model-supplied | `SwipeDiscovery.tsx` |
| 19 | Guardrail verdict on a look | Yes | `:74-96` |
| 20 | Save look to capsule | Yes, in memory | `App.tsx:115` |
| 21 | Capsule total and synergy note | Yes | `CapsuleWardrobe.tsx:32,58` |
| 22 | Checkout | **Cosmetic** | `CheckoutModal.tsx:99-101` |
| 23 | Inventory / size hold | **No** — but claimed in UI | `:118` |
| 24 | Virtual Studio phase | **No** | absent |
| 25 | Virtual Try-Off (digitise owned garments) | **No** | absent |
| 26 | On-device processing | **No** | all server-side |
| 27 | Persistence of anything | **No** | no store |
| 28 | Consent revocation / purge | **No** | absent |
| 29 | Voice consent | **No** | `:275` ungated |

Twenty-nine features. Nineteen built, four partial, ten absent.

---

# Part 2 — The journeys

## 2.1 Cold start → consent

**Built.** The first screen a customer sees.

- **Expected outcome** — they understand what will be captured, what leaves the device, and
  can say no.
- **Actual outcome** — they understand what will be captured. The copy is accurate and
  well-judged: *"Nothing leaves this device unless you ask"*, three plain bullets, and
  *"The camera cannot open until this is on."* `getUserMedia` is genuinely gated (`:226`
  behind `agreed` at `:147`).
- **Gap** — there is no way to say no. The only action is *Open the studio*. Voice is a
  separate capture path with no consent of its own. Nothing revokes, nothing purges.
  → **YGS-1**

## 2.2 Capture — two frames

**Built as an interface.** Pose outline, front then side, level check, voice trigger,
held-frame review, retake.

- **Expected outcome** — the photographs are used to measure the customer's body.
- **Actual outcome** — the frames are held in client state and **never sent anywhere for
  measurement**. `capturedProfile` is posted only to `/api/generate-tryon`, and only to
  render an image. The capture experience produces no measurement data.
- **Consequence** — the level check, the pose outline, the voice trigger and both frames
  are, for sizing purposes, ceremony. They are good ceremony — the screen is honest about
  what it can sense (*"This device cannot feel how it is standing"*) — but the data is
  discarded.
- **Also** — the journey cannot be completed from a desktop browser. Sweeping the manual
  alignment slider across its full declared range never clears "NOT LEVEL YET".
  → **YGS-6**, **YGS-31**

## 2.3 Sizing — the central divergence

**Promise** — "3D Photogrammetry Sizing", a volumetric body mesh cross-referenced against
luxury brand grading charts.

**Built** — `server.ts:42-71`, arithmetic on one number:

```ts
const heightRatio = heightCm / 170;
chestCm  = Math.round(88 * heightRatio);
waistCm  = Math.round(68 * heightRatio);
hipsCm   = Math.round(95 * heightRatio);
inseamCm = Math.round(heightCm * 0.46);
confidenceScore: 0.98
```

Brand sizes are a linear function of height alone, one expression per brand, e.g.
`Math.round(36 + (heightCm - 165) * 0.2)` for Chanel.

- **Expected outcome** — measurements reflecting this customer's body.
- **Actual outcome** — measurements reflecting this customer's **height**. A 155 cm
  customer receives every constant scaled by `0.912` and Chanel FR 34; a 185 cm customer
  receives `1.088` and FR 40. **Two customers of the same height and entirely different
  bodies receive identical measurements and identical brand sizes in all six brands.**
- **On the confidence score** — `0.98` is a literal. `Mesh Confidence: 98%` was removed
  from the interface this sprint, and the current screen is honest: *"Graded from your
  height against standard proportions — a starting point, not a tape measure."* The literal
  remains in the response body.
- **On "YOUR SIZE — Chanel FR 38"** — computed, not fabricated. But computed from height,
  with no reference to chest, waist or hips, and labelled in a way that implies otherwise.
  → **YGS-4**

*Note on sourcing: NotebookLM reported these constants "not present in the provided source
passages" — its retrieval truncated the endpoint after `heightRatio`. The constants above
are from a direct read of `server.ts`. Recorded because a retrieval gap that returns a
confident partial answer is exactly the failure this project keeps finding.*

## 2.4 Guardrails

**Built.** Six hard rules as booleans, fabric preferences, a price ceiling. The screen
draws the distinction well — absolutes on a raised card under *"Obeyed without exception"*,
preferences on the open ground under *"They never rule a look out."*

- **Expected outcome** — a look breaking a hard rule is never shown.
- **Actual outcome** — enforcement is **substring matching on the garment description**
  (`SwipeDiscovery.tsx:74-96`): `text.includes('sleeve')`, `!text.includes('trouser')`,
  `!text.includes('mini')`, `!text.includes('neon')`, `!text.includes('print')`. Modest
  coverage defers entirely to `look.compliance_check` — **a boolean the model supplies about
  its own output**. The price ceiling is set in the UI and never consulted in the check.
- **Consequence** — "Sleeveless" contains "sleeve" and passes the sleeve rule. A look
  described without the word "mini" passes the hemline rule regardless of hemline.
- **In flight** — PR #8 (+1770/−165, 12 passing tests) replaces this with real enforcement
  and fail-closed behaviour. Blocked on a checker false positive, not on its own merit.
  → **YGS-7**, **YGS-29**

## 2.5 Discovery

**Built.** One look at a time, with reasoning beside it, a guardrail verdict, and a size.

- **Expected outcome** — a real garment, shown on the customer, that satisfies their rules.
- **Actual outcome** — the reasoning and the look are real model output. **The garment image
  is absent** — the card renders a blank gradient where the product should be. In a shopping
  application the product image is the product.
- **Try-on** — now fails closed rather than returning a stranger's photograph flagged
  `success: true`. That was the sprint's sharpest fabrication and it is fixed.
- **Unconfigured behaviour** — with no API key, `/api/style-recommendations` returns a
  **pre-authored look with `compliance_check: true`**, indistinguishable to the client from
  a model result. A missing key produces confident output rather than visible failure.
  → **YGS-28**, and the fallback needs its own card.

## 2.6 Capsule

**Built.** Saved looks, a total in AED, a synergy note per look, remove.

- **Expected outcome** — what the customer chose.
- **Actual outcome** — plus one they did not. `savedLooks` initialises to
  `[INITIAL_LOOKS[0]]` (`App.tsx:85`), so a first-time customer opens an empty wardrobe and
  finds a garment already in it. The empty state exists and is well written; almost nobody
  will see it.

## 2.7 Checkout

**Built as an interface.** `CheckoutModal.tsx`.

- **Expected outcome** — an order is placed.
- **Actual outcome** — `setTimeout` at `:99`, then `setIsOrdered(true)` at `:101`. **No
  network call, no order record, no payment, no inventory.** Nothing leaves the browser.
- **And a live false claim** — the modal states *"Your size is held while you finish here."*
  Nothing is held. There is no inventory concept in the system to hold anything. This
  survived the YGS-2 sweep and is the clearest remaining instance of the interface asserting
  a fact the code cannot compute.
  → raise against **YGS-2**

---

# Part 3 — Outcomes, plainly

**What a customer reliably gets today**

- A consent screen that tells the truth about what is captured.
- Measurements graded from their height, presented honestly as such.
- Brand sizes across six labels, from height.
- Model-generated looks with readable reasoning, filtered by keyword against their rules.
- A saved capsule with a running total, for as long as the tab stays open.

**What they are led to expect and do not get**

- Measurement from their photographs. The frames are discarded.
- A body-specific size. Same height, same answer.
- A guarantee that a hard rule is obeyed. Substring matching is not enforcement.
- An image of the garment. The card is blank where the product goes.
- An order. Checkout confirms nothing to anyone.
- A held size. Nothing is held.
- Anything at all after a refresh.

**What is promised in the plan and absent entirely**

Virtual Studio, Virtual Try-Off, on-device MediaPipe and Whisper processing, GraphQL, ATP
inventory with atomic reservation, data residency enforcement, consent revocation.

---

# Part 4 — Register

| Gap | Card | State |
|---|---|---|
| Consent not granular, no revocation, no decline | YGS-1 | open |
| "Your size is held" with no inventory | YGS-2 | open, raise |
| Fit confidence not derived from the body | YGS-4 | open |
| Journey blocked at capture on desktop | YGS-6 | in flight |
| Guardrails are substring matches | YGS-7 | PR #8, blocked |
| Raw-hex checker over-fires on fixtures | YGS-29 | in flight |
| No garment imagery | YGS-28 | open |
| Capture studio never captured | YGS-31 | open |
| `npm run start` crashes | YGS-23 | open |
| Spacing scale open | YGS-21 | open |

---

*Sources: direct reads of `server.ts`, `App.tsx`, `types.ts`, `SwipeDiscovery.tsx`,
`CheckoutModal.tsx`, `CapsuleWardrobe.tsx`, `HandsFreeCapture.tsx`, `StyleGuardrails.tsx`
at `328ef07`; plan-versus-code divergences cross-checked against a NotebookLM analysis of
the same files plus the product requirements.*
