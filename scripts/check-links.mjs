// Fails the build if a local link, asset or in-page anchor in dist/ does not resolve.
// Absolute paths are rejected too: the site is served under /whoami/, so they would 404.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = 'dist';
const html = readFileSync(join(root, 'index.html'), 'utf8');
const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const refs = [...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
const errors = [];

for (const ref of refs) {
  if (/^(https?:|mailto:|data:)/.test(ref)) continue;
  if (ref.startsWith('/')) {
    errors.push(`absolute path breaks under a sub-path: ${ref}`);
  } else if (ref.startsWith('#')) {
    if (!ids.has(ref.slice(1))) errors.push(`missing anchor: ${ref}`);
  } else if (!existsSync(join(root, ref.split(/[?#]/)[0]))) {
    errors.push(`missing file: ${ref}`);
  }
}

// Follow ES module imports from the entry point.
const seen = new Set();
function walk(file) {
  if (seen.has(file)) return;
  seen.add(file);
  if (!existsSync(file)) {
    errors.push(`missing module: ${file}`);
    return;
  }
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/from\s+'(\.[^']+)'/g)) walk(join(dirname(file), match[1]));
}
walk(join(root, 'js', 'main.js'));

for (const file of ['build.json', 'og.png', 'favicon.svg']) {
  if (!existsSync(join(root, file))) errors.push(`missing ${file}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`ok: ${refs.length} references, ${seen.size} modules`);
