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

## D4 — Wrapper tone by wardrobe: raised, not yet decided (YGS-34)

**Requested:** a colour palette differentiated for male and female.

**Mechanism is free.** `index.css` holds seven raw colours and a set of `.ground-*` classes
that remap ground-relative aliases, with `@theme inline` resolving them at the element. A
wardrobe wrapper is a ground variant, not a second palette — one class, no new hex, nothing
downstream changes.

**Recommendation if it proceeds:** distribution rather than new colour. Womenswear keeps
cream working surfaces; menswear shifts to sand and leans harder on onyx. Gold stays
rationed identically in both. Forest stays reserved for Style Intelligence in both.

**Objection recorded:** warm-for-women and cool-for-men is a cliché one level above pink and
blue. Three alternatives were put forward — no wrapper differentiation at all (what
Net-a-Porter and Mr Porter actually do: separate properties, not a tinted shell);
differentiate by *occasion* instead, which is true for every customer; or differentiate by
typographic rhythm and image crop rather than colour.

Awaiting the owner's answer to the objection, not to the mechanism.

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
