# YGS — product requirements reference

Distilled from *AI Styling App Product Plan*, *YGS Design System* and *Design Philosophy*.
This is the **intent** the implementation is measured against. `DESIGN.md` covers the
visual system; this file covers what the product is supposed to *do*.

## Core user stories

1. **Fit confidence** — an affluent Riyadh customer buying a tailored gown needs to see
   exactly how it drapes on *their* body, so they can commit to a high-value purchase
   without return anxiety. Demands real photogrammetric accuracy, not a generic avatar.
2. **Frictionless multimodal** — a Dubai shopper on mobile wants to change garment colour,
   size and backdrop by voice while watching their digital reflection, without the
   immersion breaking for menu taps.
3. **Inventory truth** — a customer in a Ramadan capsule drop must be guaranteed the item
   they are trying on is actually available, so no post-purchase cancellation.

## The five phases (the app's spine)

| Phase | Purpose | Key mechanics promised |
|---|---|---|
| 1 · Consent & Trust | PDPL-compliant biometric consent | Explicit, unambiguous, revocable consent. Short bullets, not a wall of legal text. Toggle + prominent accept |
| 2 · Spatial Calibration | Hands-free full-body capture | WebXR accelerometer polling for 90° vertical alignment; AR silhouette overlay; pitch/roll gauges; shutter locked until upright; local voice trigger ("Snap!") |
| 3 · Style Like You | Wardrobe guardrails | Hard filters the algorithm strictly obeys. Modest wear as an absolute constraint, not a preference. Toggles + slider scales. **Explicitly no dropdowns** |
| 4 · Virtual Studio | Generative try-on | ~80% of the screen is the avatar, not menus. Conversational colour/size changes. Subtle pulsing mic affordance |
| 5 · Occasion Discovery | Intent-driven looks | Swipeable complete looks, not product grids. Reinforcement loop from swipes. Three thumb-zone actions: reject · accept · buy-the-look |

## Feature commitments worth checking

**Body / sizing**
- SMPL(-X) parameterisation — ~100 parameters, not chest/waist/hip approximation.
- Photogrammetry error target < 2 mm absolute, < 1% relative.
- Brand-specific size mapping (a size 38 differs per house).

**Kinematics**
- MediaPipe Pose (top-down, 33 landmarks) running in WebAssembly via Web Workers,
  so the main thread stays unblocked. Explicitly *not* OpenPose.

**Try-on generation**
- Diffusion-based (IDM-VTON / dual-UNet lineage), preserving garment texture and logos
  while warping to pose. Not 2D overlay or TPS warping.
- Virtual Try-Off — digitise garments the user already owns into a capsule wardrobe.

**Voice**
- On-device speech recognition (Whisper-class) via WASM/WebGPU in a Web Worker.
  Audio must never leave the device — this is both a latency and a PDPL requirement.

**Commerce**
- Available-to-Promise backed by atomic reservation with a TTL hold, so concurrent
  buyers cannot oversell the last unit.
- GraphQL for precise field selection rather than REST overfetching.

**Compliance (UAE PDPL / DIFC)**
- Raw imagery and audio processed on-device; only derived parameters leave the client.
- Consent explicit and revocable; retained data pseudonymised or encrypted.
- Data residency in UAE/KSA-approved regions.

## Alignment questions for review

1. Which of the five phases exist as real screens, which are stubs, which are absent?
2. Is sizing genuinely derived, or a linear function of height? (Check `brandGrading.ts`.)
3. Are the "hard guardrails" actually enforced anywhere downstream, or only stored in state?
4. Is any capture logic real (sensor/pose), or is it a simulated progress animation?
5. Does try-on call a real generation path, and what happens when it fails?
6. Is there any inventory/ATP concept at all, or is checkout purely cosmetic?
7. Is voice implemented, stubbed, or missing — and if present, is it on-device?
8. Is consent implemented as a real gate, or a screen that can be skipped?
9. What is invented data (hardcoded prices, fake match percentages) presented as if real?

Be blunt about the gap between the product plan's promises and what the code does. A
prototype is fine; a prototype that reads as if it ships SMPL and diffusion try-on is not.
