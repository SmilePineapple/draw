// Rewrites the CORE list in sw.js with every file the app needs offline.
// Run after adding/removing files:  node scripts/precache.mjs
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const walk = (dir) => readdirSync(join(root, dir)).flatMap((f) => {
  const p = `${dir}/${f}`;
  return statSync(join(root, p)).isDirectory() ? walk(p) : [`/${p}`];
});
const files = ['/', '/index.html', '/manifest.webmanifest', ...walk('src'), ...walk('icons')].sort();
const sw = readFileSync(join(root, 'sw.js'), 'utf8');
const next = sw.replace(/\/\* PRECACHE:START \*\/[\s\S]*\/\* PRECACHE:END \*\//,
  `/* PRECACHE:START */\nconst CORE = ${JSON.stringify(files, null, 2)};\n/* PRECACHE:END */`);
writeFileSync(join(root, 'sw.js'), next);
console.log(`sw.js: ${files.length} files precached`);
