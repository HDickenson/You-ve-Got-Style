#!/usr/bin/env node
// Builds capture-output/preview.html — a single self-contained page showing every
// screen at every supported viewport, the journey walk, and the capture studio
// states behind the consent gate.
//
// It reads whatever `npm run capture` produced; it never launches a browser or
// invents an image. If a capture is missing the page says so rather than
// quietly omitting the row, because a preview that silently drops a broken
// screen is worse than no preview.
//
// Self-contained on purpose: images and both variable fonts are inlined as data
// URIs, so the file can be attached to a PR, opened from a CI artifact, or sent
// to someone with no checkout, and still render in the product's own type.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const capDir = path.join(root, 'capture-output');
const outFile = path.join(capDir, 'preview.html');

const VIEWPORTS = [
  { key: '390x844', label: 'Phone', dim: '390 x 844' },
  { key: '820x1180', label: 'Tablet portrait', dim: '820 x 1180' },
  { key: '1180x820', label: 'Tablet landscape', dim: '1180 x 820' },
];

// Note reads as the screen's own promise, in the product's voice.
const SCREENS = [
  ['onboarding', 'Consent', 'The only screen that asks. Nothing is captured before it.'],
  ['sizing', 'Fit', 'Graded from height against standard proportions, and it says so.'],
  ['guardrails', 'Guardrails', 'Absolute rules sit on a raised card. Preferences sit on the open ground.'],
  ['discovery', 'Discovery', 'One look at a time, with the reasoning beside it.'],
  ['capsule', 'Capsule', 'What you already own, and what a look does with it.'],
];

const JOURNEY = ['01-onboarding', '02-sizing', '03-guardrails', '04-discovery', '05-capsule'];

// `?phase=onboarding` only ever reaches the consent gate — HandsFreeCapture
// returns early while `consented` is false. Everything behind it (YGS-31) is
// a state of that same component with no URL of its own, so capture.mjs
// drives each one directly (leveling the phone, triggering the voice
// recognition handler, refusing the camera permission) rather than seeding
// it, and writes the result here rather than the phase matrix above.
const CAPTURE_STUDIO = [
  ['not-level', 'Not level yet', 'The alignment state that gates the shutter — outside tolerance by default.'],
  ['front-frame', 'Front frame, level', 'The pose outline and the live camera preview once alignment settles.'],
  ['listening', 'Listening', '“Say “Snap” or tap” — the hands-free moment the product is named for.'],
  ['held-frame', 'Held frame', 'The frame held for review immediately after it is taken.'],
  ['side-frame', 'Side frame', 'The quarter-turn prompt after the first frame lands.'],
  ['camera-blocked', 'Camera blocked', 'The upload fallback when the camera is refused at the OS prompt.'],
];

const FONTS = {
  display: 'src/assets/fonts/bodoni-moda-latin-var.woff2',
  text: 'src/assets/fonts/schibsted-grotesk-latin-var.woff2',
};

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function dataUri(file, mime) {
  return `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
}

function git(...args) {
  try {
    return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function figure(file, label, dim, alt) {
  const body = fs.existsSync(file)
    ? `<img loading="lazy" alt="${esc(alt)}" src="${dataUri(file, 'image/png')}">`
    : `<div class="missing">not captured</div>`;
  return `<figure><div class="frame">${body}</div>
    <figcaption><span>${esc(label)}</span><span class="dim">${esc(dim)}</span></figcaption></figure>`;
}

function main() {
  if (!fs.existsSync(capDir)) {
    throw new Error(`No capture-output/ — run \`npm run capture\` first.`);
  }

  const TOTAL = (SCREENS.length + CAPTURE_STUDIO.length) * VIEWPORTS.length + JOURNEY.length;
  const missing = [];
  const sections = SCREENS.map(([key, title, note]) => {
    const shots = VIEWPORTS.map((v) => {
      const f = path.join(capDir, `${key}--${v.key}.png`);
      if (!fs.existsSync(f)) missing.push(`${key}--${v.key}.png`);
      return figure(f, v.label, v.dim, `${title} at ${v.dim}`);
    }).join('');
    return `<section class="screen">
      <div class="head"><h2>${esc(title)}</h2><p>${esc(note)}</p></div>
      <div class="shots">${shots}</div></section>`;
  }).join('');

  const journey = JOURNEY.map((j) => {
    const f = path.join(capDir, 'journey', `${j}--390x844.png`);
    if (!fs.existsSync(f)) missing.push(`journey/${j}--390x844.png`);
    return figure(f, j.slice(3).replace(/-/g, ' '), '', j);
  }).join('');

  const captureStudio = CAPTURE_STUDIO.map(([key, title, note]) => {
    const shots = VIEWPORTS.map((v) => {
      const f = path.join(capDir, 'capture-studio', `${key}--${v.key}.png`);
      if (!fs.existsSync(f)) missing.push(`capture-studio/${key}--${v.key}.png`);
      return figure(f, v.label, v.dim, `${title} at ${v.dim}`);
    }).join('');
    return `<section class="screen">
      <div class="head"><h2>${esc(title)}</h2><p>${esc(note)}</p></div>
      <div class="shots">${shots}</div></section>`;
  }).join('');

  const warning = missing.length
    ? `<p class="warn"><strong>${missing.length} capture(s) missing:</strong> ${esc(missing.join(', '))}.
       This page is incomplete — re-run <code>npm run capture</code>.</p>`
    : '';

  const html = `<title>You&#39;ve Got Style — build preview</title>
<style>
@font-face { font-family:"YGS Display"; font-weight:400 900; font-display:swap;
  src:url(${dataUri(path.join(root, FONTS.display), 'font/woff2')}) format("woff2"); }
@font-face { font-family:"YGS Text"; font-weight:400 800; font-display:swap;
  src:url(${dataUri(path.join(root, FONTS.text), 'font/woff2')}) format("woff2"); }

:root{
  --onyx:#111; --cream:#faf6f1; --gold:#c8a86b; --rule:#262626; --muted:#8f867d;
  --ground:var(--cream); --raised:#fff; --fg:#141210; --fg-muted:#6b625a; --edge:#e2d9cd;
}
@media (prefers-color-scheme:dark){ :root:not([data-theme="light"]){
  --ground:var(--onyx); --raised:#171717; --fg:var(--cream); --fg-muted:var(--muted); --edge:var(--rule); } }
:root[data-theme="dark"]{
  --ground:var(--onyx); --raised:#171717; --fg:var(--cream); --fg-muted:var(--muted); --edge:var(--rule); }

*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--fg);
  font-family:"YGS Text",ui-sans-serif,system-ui,sans-serif;font-size:16px;line-height:1.55;
  -webkit-font-smoothing:antialiased}
.wrap{max-width:1240px;margin:0 auto;padding:clamp(28px,5vw,72px) clamp(20px,4vw,48px) 96px}
.eyebrow{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--fg-muted);margin:0}
h1{font-family:"YGS Display",Didot,"Bodoni MT",serif;font-weight:500;
  font-size:clamp(2.5rem,6vw,4.4rem);line-height:1.02;margin:18px 0 0;text-wrap:balance;letter-spacing:-.01em}
.lede{max-width:62ch;color:var(--fg-muted);font-size:1.05rem}
.masthead{padding-bottom:34px;border-bottom:1px solid var(--edge)}
.meta{display:flex;flex-wrap:wrap;gap:0 36px;font-size:13px;margin:6px 0 0}
.meta div{display:flex;flex-direction:column;gap:3px;padding:10px 0}
.meta dt{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--fg-muted)}
.meta dd{margin:0;font-variant-numeric:tabular-nums}
.warn{margin-top:20px;padding:12px 14px;border:1px solid var(--edge);border-radius:10px;color:var(--fg-muted)}
.screen{padding-top:clamp(44px,6vw,76px)}
.head{display:flex;flex-direction:column;gap:6px;margin-bottom:22px}
.head h2{font-family:"YGS Display",Didot,serif;font-weight:500;
  font-size:clamp(1.7rem,3.2vw,2.4rem);margin:0;letter-spacing:-.005em}
.head p{margin:0;color:var(--fg-muted);max-width:60ch}
.shots{display:grid;gap:20px;grid-template-columns:1fr;align-items:end}
@media (min-width:760px){.shots{grid-template-columns:.62fr 1fr 1.42fr}}
figure{margin:0;display:flex;flex-direction:column;gap:9px}
.frame{border:1px solid var(--edge);border-radius:14px;overflow:hidden;background:var(--raised);
  box-shadow:0 18px 44px rgba(0,0,0,.18)}
img{display:block;width:100%;height:auto}
.missing{aspect-ratio:3/5;display:grid;place-items:center;color:var(--fg-muted);
  font-size:11px;letter-spacing:.18em;text-transform:uppercase}
figcaption{display:flex;justify-content:space-between;gap:12px;font-size:10.5px;
  letter-spacing:.16em;text-transform:uppercase;color:var(--fg-muted)}
.dim{font-variant-numeric:tabular-nums;letter-spacing:.08em}
.journey{margin-top:clamp(56px,7vw,92px);padding-top:36px;border-top:1px solid var(--edge)}
.jstrip{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin-top:20px}
.jstrip figcaption{justify-content:flex-start}
.studio{margin-top:clamp(56px,7vw,92px);padding-top:36px;border-top:1px solid var(--edge)}
code{font-family:ui-monospace,Menlo,monospace;font-size:.86em;
  background:color-mix(in srgb,var(--fg) 8%,transparent);padding:.12em .4em;border-radius:4px}
</style>
<div class="wrap">
  <header class="masthead">
    <p class="eyebrow">You&#39;ve Got Style &middot; build preview</p>
    <h1>Five phases, three viewports, the walk between them — and the studio itself.</h1>
    <p class="lede">Captured from the running application by <code>npm run capture</code> &mdash;
      not mocked, not redrawn. <code>?phase=onboarding</code> only ever reaches the consent
      gate, so the states behind it &mdash; leveling the phone, the pose frame, the voice
      trigger, the held review, the camera refused at the OS prompt &mdash; are driven
      directly rather than seeded, and shown in their own section below.</p>
    <dl class="meta">
      <div><dt>Commit</dt><dd>${esc(git('rev-parse', '--short', 'HEAD'))}</dd></div>
      <div><dt>Branch</dt><dd>${esc(git('rev-parse', '--abbrev-ref', 'HEAD'))}</dd></div>
      <div><dt>Subject</dt><dd>${esc(git('log', '-1', '--format=%s'))}</dd></div>
      <div><dt>Captures</dt><dd>${TOTAL - missing.length} of ${TOTAL}</dd></div>
    </dl>
    ${warning}
  </header>
  ${sections}
  <section class="journey">
    <div class="head"><h2>The walk</h2>
      <p>The same screens reached by clicking rather than by seeding state. This is the pass
         that proves a customer can get there.</p></div>
    <div class="jstrip">${journey}</div>
  </section>
  <section class="studio">
    <div class="head"><h2>The capture studio</h2>
      <p>Six states of HandsFreeCapture behind the consent gate, each reached by driving the
         real component &mdash; leveling the tilt slider, clicking the shutter, resolving the
         same voice-recognition handler a customer's device would call, refusing the camera
         permission &mdash; rather than seeding a state a customer could not otherwise arrive
         at.</p></div>
    ${captureStudio}
  </section>
</div>
`;

  fs.writeFileSync(outFile, html);
  const mb = (fs.statSync(outFile).size / 1024 / 1024).toFixed(2);
  console.log(`preview written to capture-output/preview.html (${mb} MB)`);
  if (missing.length) console.warn(`WARNING: ${missing.length} capture(s) missing`);
}

main();
