#!/usr/bin/env node
// CI smoke gate (YGS-23 follow-up). `npm run build` succeeding proves the
// artifact compiles, not that it runs — that gap is exactly how the
// import.meta/CJS crash reached main while every other check stayed green.
// This boots the *built* artifact (dist/server.cjs, NODE_ENV=production,
// never the tsx dev server) and fails loudly if it never answers, instead
// of a job that quietly has nothing to check.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifact = path.join(root, 'dist', 'server.cjs');
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;
const TIMEOUT_MS = 30_000;

if (!fs.existsSync(artifact)) {
  console.error(`Build artifact not found at ${path.relative(root, artifact)} — run "npm run build" first.`);
  process.exit(1);
}

function waitForHealth(url, timeoutMs) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = async () => {
      try {
        const res = await fetch(`${url}/api/health`);
        if (res.ok) return resolve(await res.json());
      } catch {
        // server not up yet
      }
      if (Date.now() - start > timeoutMs) {
        return reject(new Error(`${url}/api/health did not answer within ${timeoutMs}ms`));
      }
      setTimeout(attempt, 250);
    };
    attempt();
  });
}

async function main() {
  const server = spawn(process.execPath, [artifact], {
    cwd: root,
    env: { ...process.env, NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  server.stdout.on('data', (d) => (output += d.toString()));
  server.stderr.on('data', (d) => (output += d.toString()));

  let exited = false;
  server.on('exit', (code) => {
    exited = true;
    if (code !== 0 && code !== null) {
      console.error(`dist/server.cjs exited early with code ${code}:\n${output}`);
      process.exit(1);
    }
  });

  try {
    const health = await waitForHealth(BASE_URL, TIMEOUT_MS);
    if (exited) return; // already reported above
    console.log(`Built server booted and answered ${BASE_URL}/api/health:`, health);
  } catch (err) {
    console.error(output);
    console.error(err.message);
    process.exit(1);
  } finally {
    server.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
