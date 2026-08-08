# Feature Alignment Review

Scope: `feat/brand-foundation` @ `8ba6f25`. Read against `.claude/references/product-requirements.md`,
`DESIGN.md`, and the 19 Stitch screens in `.claude/references/stitch/`. All line numbers refer to the
committed state (`git show feat/brand-foundation:<path>`), which at time of review is identical to the
working tree.

**Verdict**: This is a five-screen demo wearing the vocabulary of a photogrammetry-and-diffusion
product. Of the five phases the plan calls the app's spine, one (Consent & Trust) does not exist in
any form — there is not a single occurrence of the strings `consent`, `PDPL`, `privacy`, or
`biometric` anywhere under `src/`, despite the app requesting camera and microphone permissions in
`metadata.json:5-8` and despite two designed Stitch screens for it. A second (Virtual Studio) has no
component at all; the generative try-on it was supposed to house is reduced to one optional image URL
on a discovery card. What does exist is honest UI over dishonest data: sizing is
`88 × height/170` rounded (`src/data/brandGrading.ts:73-99`) presented to the user as a "Volumetric
Body Mesh" with "Mesh Confidence: 98%"; the "hard guardrails" the plan calls absolute constraints
reach exactly one substring test on the word "trouser" (`src/components/SwipeDiscovery.tsx:48`) and
otherwise become polite English in an LLM prompt with no validation of what comes back; checkout is a
1200 ms `setTimeout` labelled "Securing Inventory Lock…" with a hardcoded order number. The brand
foundation work in this commit is genuinely good and the four flow components are knowingly
pre-rebuild — but the gap being measured here is not styling. It is that the app currently tells the
user several specific, checkable things that are not true, and a prototype is allowed to be
incomplete but is not allowed to assert a 98% confidence figure it did not compute.

---

## A. Phase coverage

| Phase (PRD) | Component | Status | Evidence |
|---|---|---|---|
| 1 · Consent & Trust | **none** | **ABSENT** | `AppPhase` union has no consent member — `src/types.ts:57`. Zero matches for `consent\|pdpl\|privacy\|biometric\|revoc` across `src/`, `server.ts`, `index.html`, `metadata.json`. App boots straight into capture — `src/App.tsx:35`. Two Stitch screens designed for it (`phase-1-privacy-trust.html`, `onboarding-privacy-trust.html`) plus a third listed but not exported (`privacy-trust-modal`, `_manifest.json`). |
| 2 · Spatial Calibration | `HandsFreeCapture.tsx` | **PARTIAL** | Real `deviceorientation` listener reading `e.beta` — `src/components/HandsFreeCapture.tsx:38-55`; shutter genuinely gated on `isSensorVerified` — `:302`. But a manual pitch slider (`:196-205`), a "Lock 90°" link (`:206-212`) and an "Align to 90° Automatically" button (`:230-236`) all set pitch to 90 directly, so the lock is defeatable in one tap. No roll axis (design shows Pitch **and** Roll — `phase-2-camera-calibration.html`), no AR silhouette overlay, no `DeviceOrientationEvent.requestPermission()` so the sensor never fires on iOS 13+. |
| 3 · Style Like You | `StyleGuardrails.tsx` | **PARTIAL** — UI real, downstream effect near-nil | Five toggles, three presets, fabric chips, no dropdowns — `:110-239`, correctly matching the PRD's "toggles and sliders, explicitly no dropdowns". `noLoudPrints` is in state and counted in the menu badge (`HeaderNav.tsx:76`) but has **no toggle rendered**; `maxPriceAED` (`types.ts:26`) is never set or read anywhere. Enforcement: see §B3. |
| 4 · Virtual Studio | **none** | **ABSENT** | No component, no route, no `AppPhase` member. Nearest thing is `SwipeDiscovery`, which is Phase 5. `/api/generate-tryon` output is assigned to `foundLook.imageUrl` (`App.tsx:146,161`) and shown as a card photo. No conversational colour/size change, no mic affordance anywhere in the shell (`HeaderNav.tsx` imports no mic icon), no ~80%-avatar canvas. Four Stitch screens designed for it (`virtual-studio`, `virtual-studio-immersive`, `virtual-studio-quiet-intelligence`, `onboarding-virtual-studio-intro`). |
| 5 · Occasion Discovery | `SwipeDiscovery.tsx` | **PARTIAL** | Screen exists and is the visual centre of the app. But there is **no swipe gesture** — no pointer/touch/drag handler in the file, only two buttons. Two thumb-zone actions, not three (`:160-189`): Pass and Buy Look. The accept path `handleNext('like')` (`:56-59`) is **never called by any element** — dead code, and `Heart` is imported unused at `:2`. The occasion picker is dead too: `OCCASIONS` (`:17-24`) and `selectedOccasion` (`:37`) exist but no selector is rendered, so the filter at `:44` can never be anything but `All Occasions`. `useFaceOverlay` (`:39`) likewise has no control. |

Implemented but **not** a PRD phase: `CapsuleWardrobe.tsx` (a saved-looks list) and `CheckoutModal.tsx`.
`DESIGN.md:53` already declares scope as "Core 5 flows: Capture, Sizing, Guardrails, Discovery,
Capsule" — i.e. the design contract silently substituted Capsule for Consent and dropped Virtual
Studio before a line of this code was written. That substitution is not flagged anywhere as a known
conflict (`DESIGN.md:210-216` lists four conflicts; this is not among them).

---

## B. Feature truth

### 1. Which of the five phases exist as real screens, which are stubs, which are absent?
See table above. Real-ish: 2, 3, 5. Absent outright: 1, 4. No phase is a pure stub — the ones that
exist are fully rendered screens; the failure is in what backs them, not in whether they draw.

### 2. Is sizing genuinely derived, or a linear function of height?

**It is a linear function of height, and nothing else.** `src/data/brandGrading.ts:73-99`:

```ts
const heightRatio = heightCm / 170;
const chestCm = Math.round(88 * heightRatio);
const waistCm = Math.round(68 * heightRatio);
const hipsCm  = Math.round(95 * heightRatio);
const inseamCm = Math.round(heightCm * 0.46);
```

Three constants scaled by one scalar. `confidenceScore: 0.98` is a literal (`:88`). The `meshPoints`
array (`:89-97`) is seven hand-authored coordinates with the same three numbers pasted into label
strings — it is not a mesh, and nothing consumes it: `grep meshPoints` returns only the type
declaration (`types.ts:8`) and this producer.

Against the plan's commitments: no SMPL/SMPL-X, no ~100 parameters, no photogrammetry, nothing
resembling a <2 mm error target. The captured photographs are never read — `SizingEngine.tsx:15`
calls `calculatePhotogrammetryMeasurements(capturedProfile.heightCm)`, discarding
`frontPhoto`/`sidePhoto` entirely; the front photo is used only as a 25%-opacity grayscale backdrop
(`SizingEngine.tsx:64-71`). No MediaPipe, no Web Worker, no WASM anywhere in the tree
(`package.json:13-24`).

The server duplicates the same formula at `server.ts:44-67` and adds a *second, different* and cruder
brand-size formula (`FR ${Math.round(36 + (heightCm-165)*0.2)}`, `:60-65`) that disagrees with the
client's lookup-table version. That endpoint is dead — nothing calls `/api/photogrammetry`.

Brand mapping (`brandGrading.ts:101-124`) is the one piece of real logic: six brands with genuine
grading tables, nearest-match on chest+waist L1 distance. It is honest work sitting on invented input.

### 3. Are the hard guardrails enforced downstream, or only stored in state?

**Effectively decorative.** One constraint of seven is enforced client-side, as a substring test:

```ts
// src/components/SwipeDiscovery.tsx:48
if (constraints.noTrousers && look.bottom_garment.toLowerCase().includes('trouser')) return false;
```

`modestWear`, `sleevesBelowElbow`, `hemlineBelowKnee`, `noNeonColors`, `noLoudPrints` and
`preferredFabrics` filter nothing. They are POSTed to `/api/style-recommendations`
(`App.tsx:126`) and interpolated into an English prompt (`server.ts:116`) with a system instruction
that says "you must NEVER recommend items that violate this" (`server.ts:111`). That is a request to
a model, not a constraint. Critically, **the response is never validated against the constraints
before being shown** — `App.tsx:152-165` accepts whatever comes back and pushes it into `looksList`.
The model's own self-graded `compliance_check` boolean is defaulted to `true` when absent
(`App.tsx:159`) and then **never read by any component** (`grep compliance_check` → only writes).

Two further consequences: the substring filter is trivially bypassed by any garment described as
"pants", "jeans" or "slacks"; and with the API key absent the server's fallback (`server.ts:94-103`)
is the only path that actually honours a constraint — it branches on `constraints.noTrousers`. The
mock is more compliant than the real path.

### 4. Is capture real sensor/pose work, or a simulated animation?

Mixed, but the parts that matter are simulated. The accelerometer read is real
(`HandsFreeCapture.tsx:38-55`, `e.beta` → `pitchAngle`). The webcam is real
(`getUserMedia`, `:115-126`). **The capture is not**: `triggerCapture()` (`:104-112`) only advances a
step string and rewrites an instruction sentence. There is no canvas, no `drawImage`, no frame grab —
nothing reads a pixel from the video element. So `frontPhoto`/`sidePhoto` retain whatever they were
initialised to.

And what they are initialised to is the review's sharpest single finding:

```ts
// src/components/HandsFreeCapture.tsx:27-32
const [frontPhoto, setFrontPhoto] = useState<string | null>(
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?...'
);
```

Two Unsplash photographs of strangers, pre-loaded as the user's body scan. They then flow into
`capturedProfile.frontPhoto` (`:142`) → the "Captured silhouette" backdrop in the sizing screen
(`SizingEngine.tsx:66`) → the circle labelled `alt="Digital twin"` pasted over the look card
(`SwipeDiscovery.tsx:86-95`) → and, if a key is configured, are uploaded to Google as the face to
preserve in try-on generation (`App.tsx:141`, `server.ts:194-204`). `App.tsx:39-41` contains a comment
stating that exactly this "is not a placeholder, it is a lie with a face on it" — the shell was fixed;
the component it renders was not.

No pose estimation of any kind. No WebXR. Voice trigger falls back to `setTimeout(…, 2500)` firing
the shutter unprompted when SpeechRecognition is unavailable (`:96-101`).

### 5. Does try-on call a real generation path, and what happens when it fails?

The path is real but shallow, and its failure behaviour is the problem.
`POST /api/generate-tryon` (`server.ts:175-248`) calls `gemini-3.1-flash-image` with the user photo
plus a text instruction to "preserve the person's facial features". That is a single-shot image edit —
not IDM-VTON, not dual-UNet, no garment-texture or logo preservation, no pose warping, no
Virtual Try-Off. It is invoked only from `handleFindLook` (`App.tsx:136-147`), i.e. once per
"Find a look", and its result becomes a static card image. There is no studio to iterate in.

Failure behaviour, three layers, all silent:
- **Server catch** returns HTTP 200 with `success:false` and a `fallbackUrl` — a *different* Unsplash
  photo of a stranger (`server.ts:240-247`). The client checks `tryonData.imageUrl`, which is absent,
  so it silently keeps the placeholder.
- **No API key** returns 200 with a hardcoded Unsplash URL and `success:true` (`server.ts:184-190`).
  The client cannot distinguish this from a real render.
- **Client catch** is `console.warn` (`App.tsx:148-150`); the outer catch is `console.error`
  (`App.tsx:167-169`). **The user is never told anything failed.** `isFinding` simply goes false and
  either a placeholder-image look appears or nothing appears at all — there is no error state, no
  toast, no retry in the entire application.

Also: `handleFindLook` is only reachable from the header's "Find a look" button, which renders only
when `currentPhase === 'discovery'` (`HeaderNav.tsx:90`).

### 6. Does any inventory/ATP concept exist?

**None.** Checkout is entirely client-side theatre:

```ts
// src/components/CheckoutModal.tsx:22-29
const handleAtomicCheckout = () => {
  setIsProcessing(true);
  // Simulate Atomic Checkout Redis ATP lock
  setTimeout(() => { setIsProcessing(false); setIsOrdered(true); }, 1200);
};
```

No network call, no reservation, no TTL, no stock field on `FashionLook` (`types.ts:29-46`), no
`/api/checkout` route in `server.ts`. The button label reads "Securing Inventory Lock…"
(`:152`), the panel header reads "Atomic Checkout" (`:41`), and the confirmation says the look "has
been reserved" (`:62`) and reports "Total Paid" (`:75-77`) with no payment step. Order reference
`#YGS-88492` is a constant (`:68`) — every order in the app's history has the same number. The
"Inventory truth" user story (PRD line 15-16) has no implementation surface whatsoever. GraphQL: absent
(REST only).

### 7. Is voice implemented, stubbed, or missing — and is it on-device?

Implemented in exactly one place, cloud-backed, and contradicting the stated requirement. The only
speech code in the repo is `HandsFreeCapture.tsx:69-102`, using the Web Speech API
(`webkitSpeechRecognition`). In Chrome this **streams audio to Google's servers** — which directly
violates the plan's "Audio must never leave the device — this is both a latency and a PDPL
requirement" (product-requirements.md:45-46). There is no Whisper, no WASM, no WebGPU, no worker.
Recognition accepts `snap|cheese|shoot|take` (`:81`) and on failure to load falls back to a 2.5 s
timer that fires the shutter by itself (`:96-101`).

Everywhere else voice is missing: the four Stitch screens that show a persistent mic in the app bar
(`phase-3-style-guardrails`, `phase-5-discovery-cards`, `camera-calibration`, `discovery-cards`) and
the dedicated `onboarding-voice-interaction-intro` screen — which includes a microphone-permission
consent modal — have no counterpart in code. `metadata.json:5-8` requests microphone permission for a
capability the app uses for one wake word.

### 8. Is consent implemented as a real gate, or a screen that can be skipped?

**Neither — it does not exist.** `src/App.tsx:35` mounts `HandsFreeCapture` as the initial phase.
There is no gate to skip. `HandsFreeCapture` calls `getUserMedia` (`:117`) on button press with no
prior disclosure, and the app ships `requestFramePermissions: ["camera","microphone"]`
(`metadata.json:5-8`). Nothing is revocable because nothing was granted in-app. The Stitch design
(`phase-1-privacy-trust.png`) shows precisely what the PRD asks for — short bullets, a "Secure Local
Processing" toggle marked *Mandatory for biometric processing*, and a "Confirm & Continue" — and none
of it was built. Given that the app then uploads a face photo to a third-party API
(`server.ts:194-204`), this is the highest-severity gap in the review.

### 9. What is invented data presented as if real?

| Claim shown to the user | Where | What actually backs it |
|---|---|---|
| "Mesh Confidence: 98%" | `SizingEngine.tsx:108` | A hardcoded string. It does not even read `measurements.confidenceScore` — which is itself the literal `0.98` at `brandGrading.ts:88`. |
| "Volumetric Body Mesh" wireframe with your chest/waist/hip circumferences | `SizingEngine.tsx:74-103` | A static hand-drawn SVG. Two fixed bezier paths and three fixed ellipses; only the number in the text label varies. |
| "Exact Match" ✓ against every one of six brands | `SizingEngine.tsx:159` | Hardcoded per row. Rendered identically whether the nearest-size L1 distance was 0 cm or 40 cm. |
| "Cross-referenced against official brand grading charts" | `SizingEngine.tsx:138` | Six tables typed into a source file; no provenance, no citation, no version. |
| "Eliminates brand sizing guesswork" | `SizingEngine.tsx:167` | Derived from a body it inferred from one slider. |
| "Guardrail Verified" ✓ badge on every card | `SwipeDiscovery.tsx:103-106` | Unconditional JSX. Never reads `look.compliance_check`; that field is written and never read anywhere in the app. |
| "Digital twin" — your face composited onto the look | `SwipeDiscovery.tsx:86-95` | A circular crop of `frontPhoto` absolutely positioned at fixed `top-[8%] left-[38%]`, over a stock photo of a different person. Default `frontPhoto` is itself a stranger. |
| AED 6,790 / 7,710 / 8,990 / 7,270 / 13,200 on the five seeded looks | `sampleLooks.ts:46,68,89,110,130` | Invented. No catalogue, no SKU, no source. |
| AED 8,440 on **every** AI-composed look, brand "Atelier Édition" | `sampleLooks.ts:26-33` via `App.tsx:153` | A constant template. Every garment the model invents is priced identically at a house that does not exist, and that price is then summed into the Capsule Total (`CapsuleWardrobe.tsx:18`) and charged at checkout. |
| "Securing Inventory Lock…" / "reserved" / "Total Paid" / Order `#YGS-88492` | `CheckoutModal.tsx:152,62,75,68` | A 1200 ms timer and a string constant. |
| "Same Day Courier", "Express 24h" to six GCC cities | `CheckoutModal.tsx:135-140` | Hardcoded `<option>`s; no carrier, no rate lookup. |
| A capsule that already contains one saved look on first run | `App.tsx:72` | `savedLooks` is seeded with `INITIAL_LOOKS[0]` — the user is shown a look they never saved, and its price in their capsule total. |
| "brand_sizes" shown on seeded look cards | `sampleLooks.ts:51-56` etc. | Hand-authored per look and unrelated to the user's own computed sizes — a 195 cm user sees "FR 38 (US 6)" on look-1. |

---

## C. Design-to-code gaps

**Designed, not implemented (11 of 19 exported screens):**

| Stitch screen | Status in code |
|---|---|
| `phase-1-privacy-trust`, `onboarding-privacy-trust` | No component. Phase absent. |
| `onboarding-voice-interaction-intro` (incl. mic-permission modal) | No component. |
| `onboarding-virtual-studio-intro` | No component. |
| `virtual-studio`, `virtual-studio-immersive`, `virtual-studio-quiet-intelligence` | No component. Phase 4 absent. |
| `home-personal-studio` ("Good evening, Sara" / For Tonight) | No home screen — app boots into capture. |
| `home-impact-reveal` ("STYLE THAT UNDERSTANDS YOU") | No component. |
| `checkout-order-summary` (per-item lines, shipping address, payment method, subtotal + shipping + total) | `CheckoutModal` shows one lump price, a city `<select>`, no line items, no address, no payment. |
| `checkout-success` (order ref, **Track Delivery**, Return to Studio / View Wardrobe) | Inline success panel with one "Done" button; no tracking, no wardrobe link. |

Listed in `_manifest.json` but never exported: `privacy-trust-modal`, `onboarding-splash-screen`,
`phase-4-virtual-studio` (the last failed export — `phase-4-virtual-studio.json` contains only
`"Request contains an invalid argument."`). So Phase 4 has *no* reference HTML at all, only three
adjacent Virtual Studio explorations.

**Implemented with no design:** `CapsuleWardrobe.tsx` — no Stitch screen corresponds to it. The nearest
designed concept is the "Closet" tab in `virtual-studio-quiet-intelligence`.

**IA divergence:**
- Stitch shows a **five-icon bottom tab bar** (Home · Studio · Intelligence · Closet · Profile) on four
  screens. The code correctly rejects it for `Y / Context · Action · Menu` (`HeaderNav.tsx:92-144`).
  This is the one divergence that is *deliberate and documented* (`DESIGN.md:212`) and it is the right
  call — noted here only so it is not mistaken for a gap.
- Stitch has a **home/entry surface**; the app has none. Capture is the landing screen, which means the
  camera request is the first thing a first-run user meets, with no preceding disclosure.
- Stitch discovery shows **three actions** — ✕ / Buy The Look / ♥ — matching the PRD's
  "reject · accept · buy-the-look". Code ships two, and the accept handler is orphaned
  (`SwipeDiscovery.tsx:56-59`).
- Stitch guardrails uses a **graded slider** (SUBTLE → CONSERVATIVE) and a **segmented sleeve-length
  control** (Sleeveless / Short / 3/4 / Long); code ships booleans only. The PRD explicitly asks for
  "toggles **and slider scales**"; there is a `Slider` primitive at `src/components/ui/slider.tsx` and
  no flow uses it.
- Stitch calibration shows **Pitch and Roll**; code has pitch only.
- Stitch checkout uses an address card with a "Change" affordance; the code uses a `<select>`
  (`CheckoutModal.tsx:129-141`) — a dropdown, which `DESIGN.md:195` lists under "deliberately absent
  components".
- Two Stitch screens still carry the placeholder brand "ATELIER AI" (`phase-2`, `phase-3`,
  `phase-5`) while others say YGS — the design set itself is not internally consistent on branding.

---

## Claims the UI makes that the code does not support

Ranked by how badly a user would be misled. This is the category that should block a release, not a PR.

1. **"Mesh Confidence: 98%"** — `SizingEngine.tsx:108`. A fabricated precision figure attached to a
   number derived from a height slider. A user reads this as "the scan worked". Nothing was scanned.
2. **A stranger's photograph presented as the user's own capture** — `HandsFreeCapture.tsx:27-32`,
   surfaced as "Captured silhouette" (`SizingEngine.tsx:66`) and `alt="Digital twin"`
   (`SwipeDiscovery.tsx:89`). If a key is configured this photo is also uploaded to a third party
   (`App.tsx:141` → `server.ts:194-204`).
3. **"Guardrail Verified" on every card, unconditionally** — `SwipeDiscovery.tsx:103-106`. The badge is
   a compliance verdict; six of seven constraints are unenforced and the one boolean that could back it
   is never read.
4. **Camera and microphone acquired with no consent surface at all** — `metadata.json:5-8`,
   `HandsFreeCapture.tsx:117`. Not a false claim so much as a missing one, but it is the legal exposure.
5. **"Securing Inventory Lock…" / "has been reserved" / "Total Paid"** — `CheckoutModal.tsx:152,62,75`.
   Three separate assertions about a transaction that consists of a `setTimeout`.
6. **"Exact Match" against six named luxury houses** — `SizingEngine.tsx:159`, plus "Eliminates brand
   sizing guesswork" (`:167`). Nearest-neighbour on an invented body, labelled as exact.
7. **Every AI-composed look priced AED 8,440 from "Atelier Édition"** — `sampleLooks.ts:26-33`. A price
   and a house attached to a garment description a language model wrote thirty seconds earlier, then
   totalled and charged.
8. **"Volumetric Body Mesh" / "3D Photogrammetry Sizing" / "3D Photogrammetry Size Reservation"** —
   `SizingEngine.tsx:27,29`, `CheckoutModal.tsx:112`. Naming a technique the code does not contain.
9. **Silent failure across the whole generation path** — `App.tsx:148-150,167-169`,
   `server.ts:184-190,240-247`. Three fallbacks return stock photos with `success:true` or with the
   error swallowed. The user cannot tell a successful render from a total outage.
10. **"Preference Noted" on reject** — `SwipeDiscovery.tsx:62`, calling `handleSwipeLeft`, whose body is
    a comment (`App.tsx:108-110`). Nothing is noted. There is no reinforcement loop.
11. **"Swipe right (\"This is me\")"** — `CapsuleWardrobe.tsx:53`, instructing the user to use a
    gesture and a control that do not exist.

---

## Highest-value next work (ranked)

1. **Build Phase 1 as a real gate.** A `consent` phase ahead of `onboarding` in `AppPhase`, blocking
   `getUserMedia` until accepted, persisted, and revocable from the menu. The design already exists
   (`phase-1-privacy-trust.png`). This is the only item with legal weight and it is currently a
   zero-line implementation.
2. **Delete every unearned claim.** Remove or condition: the 98% badge, "Exact Match", "Guardrail
   Verified", "Volumetric Body Mesh", "Securing Inventory Lock", "Total Paid", the hardcoded order ref.
   Replace with what is true ("Estimated from your height"). This is a day of work and it is the
   difference between a prototype and a misrepresentation.
3. **Remove the default Unsplash photos from `HandsFreeCapture` and make capture actually capture** —
   a canvas `drawImage` off the video element. Until then `frontPhoto` should be `null` and every
   downstream surface should render its empty state, exactly as `App.tsx:39-41` already argues.
4. **Enforce the guardrails, or stop calling them hard.** Validate the model's returned look against
   every constraint server-side before it reaches the client, and reject/regenerate on violation.
   Surface `compliance_check` instead of a decorative badge. Add the missing `noLoudPrints` toggle.
5. **Give the generation path a visible failure state.** No silent fallbacks, no `success:true` on a
   stock photo, no `console.warn` as the sole user-facing signal. One error surface, one retry.
6. **Restore Discovery's third action and its gesture.** Wire `handleNext('like')` to a real accept
   control, render the occasion picker that already exists in state, and make `handleSwipeLeft` record
   something — or remove the "Preference Noted" toast.
7. **Decide Phase 4 explicitly.** Either build a Virtual Studio or amend the PRD and `DESIGN.md:53`.
   Right now the product plan's centrepiece is absent and nothing in the repo acknowledges the cut.
8. **Make checkout call the server.** Even a stub `POST /api/checkout` returning a generated reference
   and a stock check is better than a timer, and it creates the seam ATP would later occupy.
9. **Reconcile the two sizing formulas.** `server.ts:44-67` is dead code that disagrees with
   `brandGrading.ts`. Delete it or make the client use it.
