// Shows the real build that produced this page. build.json is written by scripts/build.mjs.

export async function initStamp() {
  const commit = document.getElementById('stamp-commit');
  const run = document.getElementById('stamp-run');
  const date = document.getElementById('stamp-date');
  if (!commit || !run || !date) return;

  let build;
  try {
    const response = await fetch('build.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    build = await response.json();
  } catch {
    commit.textContent = 'unavailable';
    return;
  }

  function link(target, text, href) {
    target.textContent = '';
    if (!href) {
      target.textContent = text;
      return;
    }
    const a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    target.append(a);
  }

  const repo = build.repository ? `https://github.com/${build.repository}` : '';
  link(commit, build.sha ? build.sha.slice(0, 7) : 'local build', build.sha && repo ? `${repo}/commit/${build.sha}` : '');
  link(run, build.runNumber ? `#${build.runNumber}` : 'local', build.runId && repo ? `${repo}/actions/runs/${build.runId}` : '');

  const built = new Date(build.builtAt);
  date.textContent = Number.isNaN(built.getTime())
    ? '-'
    : `${built.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}
