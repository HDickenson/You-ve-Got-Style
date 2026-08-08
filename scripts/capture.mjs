#!/usr/bin/env node
// Responsive capture harness (YGS-25). Produces capture-output/, the artifact
// the CI "responsive-captures" job blocks on. Three passes:
//
//   1. Matrix — every screen (?phase=<x>) at every required viewport,
//      independent of each other. Fast and deterministic; proves each screen
//      renders, not that a customer can reach it.
//   2. Journey — one real walk through the primary buttons (capture ->
//      sizing -> guardrails -> discovery -> capsule) at a single viewport,
//      captured at each stop. Slower, but the only pass that proves the
//      guided path actually works end to end.
//   3. Capture studio (YGS-31) — ?phase=onboarding only ever reaches the
//      consent gate; everything behind it (the pose frame, the level check,
//      the voice trigger, the held review, the camera-refused fallback) is a
//      state of HandsFreeCapture with no URL of its own. This pass drives
//      those states directly at every required viewport instead of seeding
//      them, since a state rendered in isolation wouldn't prove a customer
//      can actually reach it.
//
// Uses Playwright (added as a devDependency by this change) rather than the
// agent-browser skill: agent-browser is a CDP-driving CLI for an agent to
// puppet an already-running Chrome interactively, installed globally and
// outside package.json. This harness needs to be a deterministic, versioned,
// `npm ci`-installable part of the build that a CI runner can launch and
// screenshot headlessly — that's what Playwright is built for.

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const tsxCli = require.resolve('tsx/cli');
const outDir = path.join(root, 'capture-output');
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

const VIEWPORTS = [
  { name: '390x844', width: 390, height: 844 },
  { name: '820x1180', width: 820, height: 1180 },
  { name: '1180x820', width: 1180, height: 820 },
];

const PHASES = ['onboarding', 'sizing', 'guardrails', 'discovery', 'capsule'];

function waitForServer(url, timeoutMs = 30_000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = async () => {
      try {
        const res = await fetch(`${url}/api/health`);
        if (res.ok) return resolve();
      } catch {
        // server not up yet
      }
      if (Date.now() - start > timeoutMs) {
        return reject(new Error(`Server did not become ready within ${timeoutMs}ms`));
      }
      setTimeout(attempt, 300);
    };
    attempt();
  });
}

function startServer() {
  const server = spawn(process.execPath, [tsxCli, 'server.ts'], {
    cwd: root,
    env: { ...process.env, DISABLE_HMR: 'true' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  server.stdout.on('data', (d) => (output += d.toString()));
  server.stderr.on('data', (d) => (output += d.toString()));
  server.getOutput = () => output;
  return server;
}

// A page that renders nothing useful still "succeeds" as a screenshot, so the
// gate also fails on JS errors surfaced during load — the same class of
// failure a customer would hit as a blank or broken screen.
function trackPageErrors(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

async function captureMatrix(browser) {
  for (const viewport of VIEWPORTS) {
    for (const phase of PHASES) {
      const page = await browser.newPage({ viewport });
      const errors = trackPageErrors(page);
      await page.goto(`${BASE_URL}/?phase=${phase}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('#app-root-container', { state: 'visible' });
      if (errors.length > 0) {
        throw new Error(`${phase} @ ${viewport.name}: ${errors.length} console error(s):\n  ${errors.join('\n  ')}`);
      }
      await page.screenshot({ path: path.join(outDir, `${phase}--${viewport.name}.png`) });
      await page.close();
      console.log(`captured ${phase} @ ${viewport.name}`);
    }
  }
}

// A minimal valid 1x1 PNG, handed to the file input directly as a buffer —
// the upload path (not the camera) is the only route through onboarding a
// headless runner can take without a real webcam and mic grant.
const FIXTURE_FRAME = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);

async function uploadFrame(page) {
  await page.getByRole('button', { name: 'Upload this frame' }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'frame.png',
    mimeType: 'image/png',
    buffer: FIXTURE_FRAME,
  });
}

async function captureJourney(browser) {
  const viewport = VIEWPORTS[0];
  const page = await browser.newPage({ viewport });
  const errors = trackPageErrors(page);
  const shot = async (name) => {
    await page.screenshot({ path: path.join(outDir, 'journey', `${name}--${viewport.name}.png`) });
    console.log(`journey: captured ${name}`);
  };

  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#app-root-container', { state: 'visible' });
  await shot('01-onboarding');

  // Onboarding -> Sizing: locators are by accessible role/name, not id — the
  // ids this journey used to hardcode never existed on any component (only
  // in this script), and role/name survives a copy-refactor an id would not.
  // Consent gate, then two uploaded frames (upload, not the camera/mic
  // shutter, since a headless runner has no webcam to grant), then submit.
  await page.getByRole('switch', { name: 'Use my camera to take my two frames' }).click();
  await page.getByRole('button', { name: 'Open the studio' }).click();
  await uploadFrame(page); // front
  await uploadFrame(page); // side
  await page.getByRole('button', { name: 'Read my fit' }).click();
  await page.waitForSelector('#module-sizing-engine', { state: 'visible' });
  await shot('02-sizing');

  // Sizing -> Guardrails. StyleGuardrails has no #module-* id (unlike its
  // sibling screens) — its root carries aria-label="Style guardrails"
  // instead, so wait on that landmark rather than adding a coupling this
  // script would own on a flow-owned component.
  await page.getByRole('button', { name: 'Set your guardrails' }).click();
  await page.getByRole('region', { name: 'Style guardrails' }).waitFor({ state: 'visible' });
  await shot('03-guardrails');

  // Guardrails -> Discovery. This is the main-flow mount of StyleGuardrails
  // (App.tsx wires its onSaveAndProceed to advance the phase); a second
  // mount inside the header's guardrails sheet reuses the same "Show me
  // looks" label but only closes the sheet, so the journey must not detour
  // through the header menu here.
  await page.getByRole('button', { name: 'Show me looks' }).click();
  await page.waitForSelector('#module-swipe-discovery', { state: 'visible' });
  await shot('04-discovery');

  // Discovery -> Capsule, via the real nav menu (the only route to Capsule
  // that does not require buying or saving a specific look first). The sheet
  // exits on an animation (framer-motion AnimatePresence) rather than
  // unmounting the moment it closes, so the capsule screen is already
  // mounted underneath while the sheet is still visibly closing — wait for
  // its overlay to fully detach, not just for the content behind it to exist.
  await page.click('[aria-label="Open menu"]');
  const nav = page.getByRole('navigation', { name: 'Sections' });
  await nav.waitFor({ state: 'visible' });
  // Scoped to the nav and matched by prefix: the seeded look means the item's
  // accessible name is "Capsule 1 saved", not "Capsule" — a bare, unscoped
  // name match also collides with the discovery card's "Save to capsule"
  // button, which contains the same substring.
  await nav.getByRole('button', { name: /^Capsule/ }).click();
  await page.waitForSelector('[data-slot="overlay"]', { state: 'detached' });
  await page.waitForSelector('#module-capsule-wardrobe', { state: 'visible' });
  await shot('05-capsule');

  await page.close();

  if (errors.length > 0) {
    throw new Error(`journey walk: ${errors.length} console error(s):\n  ${errors.join('\n  ')}`);
  }
}

const studioOutDir = path.join(outDir, 'capture-studio');

// Chromium — headless or not — does not implement SpeechRecognition at all,
// so a real page here takes the "no speech engine" branch in `listen()`
// immediately, collapsing "listening" into the same tick as "held". A
// customer's device (Chrome or Safari on phone/tablet, both of which do
// implement it) actually dwells in "listening" for as long as it takes them
// to speak. This stands in for that dwell without touching app code: the
// real `listen()` still runs, still calls `new Recognition()` and `start()`,
// and only resolves when this script decides to, via `window.__fakeRecognition`.
async function installFakeSpeechRecognition(context) {
  await context.addInitScript(() => {
    class FakeSpeechRecognition {
      constructor() {
        window.__fakeRecognition = this;
      }
      start() {}
    }
    window.SpeechRecognition = FakeSpeechRecognition;
    window.webkitSpeechRecognition = FakeSpeechRecognition;
  });
}

async function openStudio(page) {
  await page.goto(`${BASE_URL}/?phase=onboarding`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#app-root-container', { state: 'visible' });
  await page.getByRole('switch', { name: 'Use my camera to take my two frames' }).click();
  await page.getByRole('button', { name: 'Open the studio' }).click();
}

// Keyboard focus on the tilt slider scrolls it into view, and the shutter's
// own instruction text wraps to a different height per state — both move the
// viewfinder out of frame between shots. Reset before every screenshot so the
// pose outline, the level pill and the camera preview all stay in it.
async function resetScroll(page) {
  await page.evaluate(() => {
    document.activeElement?.blur?.();
    window.scrollTo(0, 0);
  });
}

// Default pitch is 82°, the level target is 90° ± 3°, the slider's step is
// 0.5° — sixteen ArrowRight presses from the default lands exactly on 90 in
// one direction. A dragged or full-range sweep was tried first and never
// cleared "NOT LEVEL YET": every intermediate value the drag passes through
// re-triggers the settle timer (`SETTLE_MS` in HandsFreeCapture), and a drag
// has no guarantee of where it releases. Fixed keystrokes land on a known
// value once and let the timer actually settle.
async function levelPhone(page) {
  const slider = page.locator('#capture-tilt');
  await slider.waitFor({ state: 'visible' });
  await slider.focus();
  for (let i = 0; i < 16; i++) {
    await page.keyboard.press('ArrowRight');
  }
  await page.waitForTimeout(600); // > SETTLE_MS (360ms)
}

async function captureCameraStudioStates(cameraBrowser) {
  for (const viewport of VIEWPORTS) {
    const context = await cameraBrowser.newContext({ viewport, permissions: ['camera'] });
    await installFakeSpeechRecognition(context);
    const page = await context.newPage();
    const errors = trackPageErrors(page);
    const shot = async (state) => {
      await resetScroll(page);
      await page.screenshot({ path: path.join(studioOutDir, `${state}--${viewport.name}.png`) });
      console.log(`capture studio: captured ${state} @ ${viewport.name}`);
    };

    await openStudio(page);
    await page.waitForTimeout(500); // fake camera stream attaching
    await shot('not-level');

    await levelPhone(page);
    await shot('front-frame');

    await page.getByRole('button', { name: /Capture your front frame/ }).click();
    await page.waitForTimeout(200);
    await shot('listening');

    // The word a customer actually says, fed back through the same handler
    // real speech recognition would call.
    await page.evaluate(() => {
      window.__fakeRecognition.onresult({ results: [[{ transcript: 'snap' }]] });
    });
    await page.waitForTimeout(150);
    await shot('held-frame');

    await page.waitForTimeout(900); // > HOLD_MS (840ms) — the reveal clears
    await shot('side-frame');

    await page.close();
    await context.close();

    if (errors.length > 0) {
      throw new Error(`capture studio @ ${viewport.name}: ${errors.length} console error(s):\n  ${errors.join('\n  ')}`);
    }
  }
}

// The one state a click can't reach: it needs the OS camera prompt refused,
// which is a browser-context condition, not an interaction. The default
// browser this harness already launches for the matrix and journey passes
// has no fake camera device and is granted no permission, so `getUserMedia`
// rejects on its own — the same as a customer declining the prompt.
async function captureCameraBlockedState(defaultBrowser) {
  for (const viewport of VIEWPORTS) {
    const page = await defaultBrowser.newPage({ viewport });
    const errors = trackPageErrors(page);

    await openStudio(page);
    await page.waitForTimeout(500);
    await resetScroll(page);
    await page.screenshot({ path: path.join(studioOutDir, `camera-blocked--${viewport.name}.png`) });
    console.log(`capture studio: captured camera-blocked @ ${viewport.name}`);

    await page.close();

    if (errors.length > 0) {
      throw new Error(`capture studio (camera-blocked) @ ${viewport.name}: ${errors.length} console error(s):\n  ${errors.join('\n  ')}`);
    }
  }
}

async function assertPortFree() {
  try {
    await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(500) });
  } catch {
    return; // nothing answered — port is free, as expected
  }
  throw new Error(
    `Something is already listening on ${BASE_URL} (port ${PORT}). ` +
      `Stop it before running capture — otherwise this harness silently captures ` +
      `whatever that process is serving instead of a server it controls.`
  );
}

async function main() {
  await assertPortFree();
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(outDir, 'journey'), { recursive: true });
  fs.mkdirSync(studioOutDir, { recursive: true });

  const server = startServer();
  let browser;
  let cameraBrowser;
  try {
    await waitForServer(BASE_URL);
    browser = await chromium.launch();
    await captureMatrix(browser);
    await captureJourney(browser);
    await captureCameraBlockedState(browser);

    // A separate browser, launched only for the camera-on studio states:
    // these flags hand getUserMedia a synthetic video device instead of
    // rejecting it, which would defeat the matrix/journey/camera-blocked
    // passes above (they rely on there being no camera).
    cameraBrowser = await chromium.launch({
      args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
    });
    await captureCameraStudioStates(cameraBrowser);
  } catch (err) {
    console.error(server.getOutput());
    throw err;
  } finally {
    if (browser) await browser.close();
    if (cameraBrowser) await cameraBrowser.close();
    server.kill();
  }

  console.log(`\nAll captures written to ${path.relative(root, outDir)}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
