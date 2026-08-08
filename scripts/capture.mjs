#!/usr/bin/env node
// Responsive capture harness (YGS-25). Produces capture-output/, the artifact
// the CI "responsive-captures" job blocks on. Two passes:
//
//   1. Matrix — every screen (?phase=<x>) at every required viewport,
//      independent of each other. Fast and deterministic; proves each screen
//      renders, not that a customer can reach it.
//   2. Journey — one real walk through the primary buttons (capture ->
//      sizing -> guardrails -> discovery -> capsule) at a single viewport,
//      captured at each stop. Slower, but the only pass that proves the
//      guided path actually works end to end.
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

  // Onboarding -> Sizing: align the sensor, then submit the capture.
  await page.click('#btn-calibrate-90');
  await page.click('#btn-proceed-sizing');
  await page.waitForSelector('#module-sizing-engine', { state: 'visible' });
  await shot('02-sizing');

  // Sizing -> Guardrails
  await page.click('#btn-proceed-guardrails');
  await page.waitForSelector('#module-style-guardrails', { state: 'visible' });
  await shot('03-guardrails');

  // Guardrails -> Discovery
  await page.click('#btn-save-guardrails');
  await page.waitForSelector('#module-swipe-discovery', { state: 'visible' });
  await shot('04-discovery');

  // Discovery -> Capsule, via the real nav menu (the only route to Capsule
  // that does not require buying or saving a specific look first). The sheet
  // exits on an animation (framer-motion AnimatePresence) rather than
  // unmounting the moment it closes, so the capsule screen is already
  // mounted underneath while the sheet is still visibly closing — wait for
  // its overlay to fully detach, not just for the content behind it to exist.
  await page.click('[aria-label="Open menu"]');
  await page.getByRole('navigation', { name: 'Sections' }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Capsule' }).click();
  await page.waitForSelector('[data-slot="overlay"]', { state: 'detached' });
  await page.waitForSelector('#module-capsule-wardrobe', { state: 'visible' });
  await shot('05-capsule');

  await page.close();

  if (errors.length > 0) {
    throw new Error(`journey walk: ${errors.length} console error(s):\n  ${errors.join('\n  ')}`);
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

  const server = startServer();
  let browser;
  try {
    await waitForServer(BASE_URL);
    browser = await chromium.launch();
    await captureMatrix(browser);
    await captureJourney(browser);
  } catch (err) {
    console.error(server.getOutput());
    throw err;
  } finally {
    if (browser) await browser.close();
    server.kill();
  }

  console.log(`\nAll captures written to ${path.relative(root, outDir)}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
