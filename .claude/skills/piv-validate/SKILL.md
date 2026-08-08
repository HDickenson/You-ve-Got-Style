---
name: piv-validate
description: Runs the YGS validation suite — typecheck, production build, and the Impeccable anti-pattern detector — then reports a single PASS/FAIL verdict. Use before committing, before opening a PR, or after finishing a chunk of work.
---

# Validate — You've Got Style

Run every check this project has and report one PASS/FAIL verdict.
All commands run from the repo root (`app/`). Dependencies are already installed —
do **not** run `npm install` as part of validation.

Keep going after a failure so the report covers everything; capture the output of anything that fails.

## 1. Type check

```bash
npx tsc --noEmit
```

**Expected:** no errors. (This is the `lint` script in package.json.)

## 2. Production build

```bash
npm run build
```

**Expected:** vite build + esbuild server bundle both succeed.

## 3. Design anti-pattern detector

```bash
npx impeccable detect src/
```

**Expected:** zero findings. Exit code `0` = clean, `2` = anti-patterns found.

Baseline at the start of the rebuild was **27 findings** across 7 files
(`gray-on-color` throughout, `bounce-easing` in CheckoutModal and HandsFreeCapture).
Any number above zero on changed files is a regression.

## 4. Brand contract check

These greps must all return **nothing** in `src/` (excluding `src/index.css`,
which is where tokens are legitimately defined):

```bash
# raw hex outside the token layer
rg -n '#[0-9A-Fa-f]{6}' src/ --glob '!src/index.css'
# off-brand Tailwind palettes
rg -n '\b(bg|text|border|ring)-(stone|zinc|slate|gray|neutral|amber|emerald)-[0-9]{2,3}' src/
# banned motion
rg -n 'animate-spin|animate-bounce|animate-ping' src/
# serif leaking onto controls
rg -n 'font-serif' src/
# technical theatre in UI copy
rg -ni 'gemini|AI Recommendation|Generating AI' src/ --glob '*.tsx'
```

## 4b. Unbacked compliance and security claims

These must return **nothing**. A regulatory or security guarantee rendered as a label,
with no implementation behind it, is the most damaging class of dishonest UI in this
product — it invites a customer to hand over biometric data on a promise the code does
not keep.

```bash
rg -ni 'PDPL|GDPR|on-device|end-to-end|encrypted|compliant|compliance|
        bank.?level|military.?grade|secure(ly)?|guaranteed|certified' src/ --glob '*.tsx'
```

**This is a regression guard, not a hypothetical.** `main` shipped
`<p>Security: UAE PDPL On-Device Compliance</p>` in `HeaderNav.tsx` while the app had —
and still has — **zero on-device inference of any kind**: no ONNX, no WASM runtime, no
WebGPU, no Whisper, no MediaPipe. Every model call goes to a third party. The foundation
rewrite removed the string, but nothing stops it returning.

If a hit is a genuine claim, it does not ship until the capability exists. If it is
describing something real, cite the implementing file in the same PR.

## 5. Summary report

One line per check with ✅ / ❌, then **Overall: PASS or FAIL**.
For every ❌ include the failing command and the relevant output.
Do not fix anything here — this skill reports; fixing is a separate step.

## Notes

- There is no test runner in this project yet. If one is added, add it as check 0.
- A checker that cannot fail is worthless: after changing these commands, break
  something on purpose and confirm this skill reports ❌.
