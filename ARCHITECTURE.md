# You've Got Style — system architecture

Derived from `origin/feat/brand-foundation` @ `328ef07` by reading the code, not the plan.
Where the two disagree, this records the code.

---

## 1. Shape

A single-page React application served by one Express process. There is no database, no
persistence layer, no authentication, no session store, and no state that outlives a tab
refresh.

```
Browser (React 19 SPA)
   |
   |  fetch  /api/photogrammetry
   |  fetch  /api/style-recommendations
   |  fetch  /api/generate-tryon
   v
Express (server.ts, 242 lines)
   |
   |  @google/genai
   v
Gemini  —  gemini-3.1-flash-image  (try-on)
        —  structured-output model  (styling)
```

Development serves the SPA through Vite middleware; production serves `dist/` from the same
process. `npm run build` produces both; `npm run start` currently **crashes on boot**
(YGS-23) because `server.ts` computes `__dirname` from `import.meta.url` and esbuild bundles
it to CJS, where `import.meta` is empty.

## 2. Client state — the whole model

All application state lives in `App.tsx` as eleven `useState` hooks. There is no store, no
context, no reducer, no router.

| State | Type | Notes |
|---|---|---|
| `currentPhase` | `AppPhase` | `onboarding \| sizing \| guardrails \| discovery \| capsule` |
| `heightCm` | number | **The only real user measurement in the system** |
| `capturedProfile` | `CapturedProfile` | front/side frames, base64, in memory only |
| `measurements` | `UserMeasurements` | derived server-side from height |
| `brandSizes` | `BrandSizeMapping[]` | derived server-side from height |
| `constraints` | `StyleConstraints` | seven guardrails |
| `looksList` / `savedLooks` / `checkoutLook` | `FashionLook[]` | seeded from `sampleLooks.ts` |
| `isFinding` | boolean | the one async flag |

**Consequences worth naming:**

- Phase is component state, so **no screen has a URL**. This is why the capture harness
  needed a `?phase=` seed, and why the six capture-studio states remain unreachable
  (YGS-31).
- Nothing persists. Consent, measurements and saved looks all vanish on refresh — which
  makes the consent screen's promise that "frames are held for this session only" true, but
  true by accident rather than by mechanism.
- `savedLooks` is initialised with `[INITIAL_LOOKS[0]]`, so a first-time customer opens
  their Capsule and finds a garment already in it that they never chose.

## 3. The three server endpoints

### `/api/photogrammetry` — the central finding

**The photographs are never used.** The endpoint accepts `{ heightCm }` and returns:

```ts
const heightRatio = heightCm / 170;
chestCm  = Math.round(88 * heightRatio);
waistCm  = Math.round(68 * heightRatio);
hipsCm   = Math.round(95 * heightRatio);
inseamCm = Math.round(heightCm * 0.46);
confidenceScore: 0.98
```

Four constants scaled by one number. `capturedProfile` is held in client state and never
posted here. So:

- The entire "3D Photogrammetry Sizing" capability is **height x fixed ratios**.
- `confidenceScore: 0.98` is a literal. This is the origin of `Mesh Confidence: 98%`,
  removed from the UI during this sprint — but the literal is still in the response body.
- Brand sizes are `Math.round(36 + (heightCm - 165) * 0.2)` and similar, per brand. So
  "Chanel FR 38" *is* computed — from height alone, by a linear formula, with no reference
  to chest, waist or hips. That resolves the open question from the visual QC: not
  fabricated, but far weaker than the label "your size" implies.
- Two people of identical height receive identical measurements and identical brand sizes.

The camera capture, the pose outline, the level check, the voice trigger and the two frames
are, architecturally, theatre. They produce data the system discards.

### `/api/style-recommendations`

Calls Gemini with structured output. Guardrails are passed as request fields and become
English inside the prompt. Notable: when no API key is present it returns a **hardcoded
look** — a plausible-looking recommendation with `compliance_check: true`, indistinguishable
to the client from a model result. A missing key produces confident output rather than a
visible degradation.

### `/api/generate-tryon`

Calls `gemini-3.1-flash-image` with the user's frame plus a prompt. Two prompt paths — one
preserving the customer's face and silhouette, one generating "a chic model on a neutral
beige background". The second path is how a stranger's photograph reached the UI. Fixed this
sprint (PR #7, YGS-27) to fail closed rather than return a substitute flagged
`success: true`.

## 4. Layer ownership

```
src/index.css        the token layer — the only file permitted raw hex
src/components/ui/   primitives (Radix-derived): button, card, dialog, sheet,
                     overlay, slider, switch, badge, separator, skeleton
src/components/layout/  AppContainer, Stack, ResponsiveGrid, ActionRow
src/components/brand/   YMark, Wordmark, Editorial (Display/OccasionTitle), Price
src/components/*.tsx    the five screens + HeaderNav
src/data/            sampleLooks, brandGrading — seed data, not a catalogue
src/lib/             cn, motion, props
```

Consistency is enforced by **subtraction**, not convention. `index.css` sets
`--color-*`, `--radius-*`, `--font-*`, `--ease-*`, `--animate-*` and two breakpoints to
`initial`, deleting Tailwind's stock scales. `rounded-lg` is not wrong; it emits nothing.
All six screens import only from `ui` / `layout` / `brand`. Raw hex in `.tsx`: zero.

**Spacing is the one scale left open** — `--spacing: 0.25rem` is declared but not
`initial`-ed, so 25 distinct spacing values coexist across six screens. Tracked as YGS-21.

## 5. Verification layer

CI (`.github/workflows/ci.yml`) runs on every PR: `type-gate`, `build`,
`impeccable-detector`, `raw-hex-boundary`, `responsive-captures`.

`scripts/capture.mjs` starts the server, seeds each phase by query parameter, screenshots at
390x844 / 820x1180 / 1180x820, then walks the journey by clicking. `scripts/build-preview.mjs`
renders those into a single self-contained page. `scripts/check-raw-hex.mjs` enforces the
token boundary — and currently over-fires on test fixtures (YGS-29).

## 6. What the architecture does not contain

Stated because absence is the most misreadable thing in a system diagram:

- No persistence of any kind. No user account, no order record, no inventory.
- No consent model beyond a boolean in one component. Voice is a capture path with no
  consent of its own.
- No validation of model output before render, except the try-on fix landed this sprint.
- No on-device processing, despite the plan describing it. Every model call is server-side.
- No Virtual Studio phase. It exists in the product plan and nowhere in the code.
- Checkout has no inventory concept behind it.

## 7. The one-sentence version

A five-phase React SPA holding all state in one component, talking to three Express
endpoints, of which one is arithmetic on a single number dressed as photogrammetry, one
falls back to a hardcoded answer when unconfigured, and one calls an image model — with a
strong, closed design-token layer and a real CI gate wrapped around all of it.
