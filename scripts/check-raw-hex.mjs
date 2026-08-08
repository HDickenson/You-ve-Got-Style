#!/usr/bin/env node
// Enforces DESIGN.md: "No hardcoded hex in components" — hex belongs in the
// token layer (src/index.css) only. Scans every .ts/.tsx file under src/ and
// fails if any raw hex color literal is found outside that layer.
//
// Two exclusions, both non-styling by construction:
//   - src/data/ — garment/product facts (e.g. FashionLook.colorPalette), not
//     UI color decisions. A hex here describes a dress, not a design choice.
//   - *.test.ts(x) / *.spec.ts(x) — test fixtures, never shipped UI.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'src');
const dataDir = path.join(srcDir, 'data');
const hexPattern = /#[0-9a-fA-F]{3,8}\b/g;
const sourceFilePattern = /\.tsx?$/;
const testFilePattern = /\.(test|spec)\.tsx?$/;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (full === dataDir) continue;
      walk(full, files);
    } else if (entry.isFile() && sourceFilePattern.test(entry.name) && !testFilePattern.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const files = walk(srcDir);
const violations = [];

for (const file of files) {
  const text = fs.readFileSync(file, 'utf-8');
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    const matches = line.match(hexPattern);
    if (matches) {
      for (const m of matches) violations.push({ file: path.relative(root, file), line: i + 1, match: m });
    }
  });
}

if (violations.length > 0) {
  console.error(`${violations.length} raw hex color literal(s) found (DESIGN.md: hex belongs in the token layer only):\n`);
  for (const v of violations) console.error(`  ${v.file}:${v.line}  ${v.match}`);
  process.exit(1);
}

console.log('No raw hex color literals found outside the token layer.');
