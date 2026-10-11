// Copies site/ to dist/ and stamps build.json with the commit and workflow run that built it.
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';

const env = process.env;
const build = {
  sha: env.GITHUB_SHA || '',
  runNumber: env.GITHUB_RUN_NUMBER || '',
  runId: env.GITHUB_RUN_ID || '',
  repository: env.GITHUB_REPOSITORY || '',
  builtAt: new Date().toISOString()
};

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('site', 'dist', { recursive: true });
await writeFile('dist/build.json', `${JSON.stringify(build, null, 2)}\n`);

console.log(`built dist/ (${build.sha ? build.sha.slice(0, 7) : 'local'})`);
