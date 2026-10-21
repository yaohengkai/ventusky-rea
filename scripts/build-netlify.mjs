#!/usr/bin/env node
/**
 * Build step for Netlify.
 *
 * The site itself is served by Netlify Functions (a live proxy of the public
 * Ventusky frontend plus the /__api data API). Only the truly static assets are
 * published:
 *
 *   dist/
 *   ├── lab.html         <- ventusky-local/public/lab.html   (served at /__lab/)
 *   ├── docs/            <- ventusky-local/docs               (served at /__docs/)
 *   └── robots.txt
 *
 * The server never needs these files at runtime, so no Node dependencies are
 * installed during the Netlify build.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = path.join(root, 'ventusky-local');
const dist = path.join(root, 'dist');

function copyDir(from, to) {
  if (!fs.existsSync(from)) return 0;
  fs.mkdirSync(to, { recursive: true });
  let count = 0;
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) count += copyDir(src, dest);
    else if (entry.isFile()) { fs.copyFileSync(src, dest); count++; }
  }
  return count;
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

const lab = copyDir(path.join(app, 'public'), dist);
const docs = copyDir(path.join(app, 'docs'), path.join(dist, 'docs'));

// This deployment mirrors a third-party site for personal study: keep it out of
// search indexes.
fs.writeFileSync(path.join(dist, 'robots.txt'), 'User-agent: *\nDisallow: /\n');

console.log(`[netlify] publish dir: ${path.relative(root, dist)}/`);
console.log(`[netlify] copied ${lab} public file(s), ${docs} doc file(s)`);
