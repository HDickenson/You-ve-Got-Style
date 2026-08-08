#!/usr/bin/env node
// Fails the build if a credential is committed. This repository is public, so
// "we were careful" is not a control — a check that runs on every PR is.
//
// Two things are verified:
//   1. No file that should hold secrets is tracked by git (.env and friends).
//   2. No tracked file contains a string shaped like a real credential.
//
// Deliberately narrow patterns. A scanner that cries wolf gets disabled, and a
// disabled scanner is worse than none, so this matches provider-specific
// prefixes rather than anything resembling a long random string.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Files that must never be tracked, whatever they contain.
const FORBIDDEN_PATHS = [
  /(^|\/)\.env$/,
  /(^|\/)\.env\.(local|development|production|staging)$/,
  /(^|\/)serviceAccount.*\.json$/,
  /(^|\/)credentials\.json$/,
  /\.pem$/,
  /\.p12$/,
  /(^|\/)id_rsa$/,
];

// Provider-shaped credentials. Each one is specific enough that a match is a
// finding rather than a discussion.
const SECRET_PATTERNS = [
  [/AIza[0-9A-Za-z_-]{35}/, 'Google API key'],
  [/\bsk-[A-Za-z0-9]{32,}/, 'OpenAI-style secret key'],
  [/\bgh[pousr]_[A-Za-z0-9]{36,}/, 'GitHub token'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'AWS access key id'],
  [/-----BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/, 'private key'],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}/, 'Slack token'],
  [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, 'JWT'],
];

// Binary and generated files. package-lock is excluded because it carries
// integrity hashes that are not credentials and are enormous.
const SKIP = /\.(png|jpe?g|gif|webp|woff2?|ttf|eot|ico|pdf|zip)$|^package-lock\.json$/;

function tracked() {
  return execFileSync('git', ['-C', root, 'ls-files'], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
}

const files = tracked();
const findings = [];

for (const f of files) {
  if (FORBIDDEN_PATHS.some((re) => re.test(f))) {
    findings.push({ file: f, line: 0, what: 'file must never be committed' });
  }
}

for (const f of files) {
  if (SKIP.test(f) || SKIP.test(path.basename(f))) continue;
  let text;
  try {
    text = fs.readFileSync(path.join(root, f), 'utf8');
  } catch {
    continue; // unreadable or binary
  }
  if (text.includes('\0')) continue;
  text.split('\n').forEach((line, i) => {
    for (const [re, what] of SECRET_PATTERNS) {
      if (re.test(line)) findings.push({ file: f, line: i + 1, what });
    }
  });
}

if (findings.length) {
  // Report location and kind. Never the value — printing a leaked credential
  // into CI logs makes a private leak a public one.
  console.error(`${findings.length} potential credential(s) in tracked files:\n`);
  for (const f of findings) {
    console.error(`  ${f.file}${f.line ? `:${f.line}` : ''}  ${f.what}`);
  }
  console.error(
    '\nValues are withheld on purpose. If a real credential is here, it is already ' +
      'public — rotate it first, then remove it from history.',
  );
  process.exit(1);
}

console.log(`No credentials found in ${files.length} tracked files.`);
