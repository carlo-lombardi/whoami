// A pre-execution hook: every command is checked against the rules before it may run.
// A working model of the guardrails described in the CV; nothing is ever executed.

export const RULES = [
  { row: 0, test: /(^|[;&|]\s*)(sudo\s+)?(rm|del|erase|rmdir|rd|unlink|shred|wipe|purge|destroy)\b/i, reason: 'deletes files or data' },
  { row: 0, test: /^\s*delete\b(?!\s+from\b)/i, reason: 'deletes files or data' },
  { row: 1, test: /\b(drop\s+(table|database|schema)|truncate(\s+table)?)\b/i, reason: 'irreversible data loss' },
  { row: 1, test: /\bdelete\s+from\b(?!.*\bwhere\b)/i, reason: 'DELETE without WHERE removes every row' },
  { row: 2, test: /\b(remove|clear)-[a-z]+/i, reason: 'removal needs a change request' },
  { row: 3, test: /\bgit\s+push\b.*(--force|-f\b)/i, reason: 'force push rewrites shared history' },
  { row: 3, test: /\bgit\s+reset\s+--hard\b/i, reason: 'hard reset discards work' },
  { row: 4, test: /\b(shutdown|reboot|halt|restart-computer|stop-computer|mkfs|format|format-volume|diskpart)\b|\bdd\s+if=/i, reason: 'takes a system down or wipes a disk' }
];

const READ_ONLY = /^\s*(get-|select\b|ls\b|dir\b|cat\b|type\b|git\s+(status|log|diff)\b|whoami\b|ping\b|test-)/i;

export function evaluate(command) {
  const rule = RULES.find((r) => r.test.test(command));
  if (rule) return { allowed: false, reason: rule.reason, row: rule.row };
  return { allowed: true, reason: READ_ONLY.test(command) ? 'read-only' : 'no rule matched', row: -1 };
}

export function initGuardrail() {
  const form = document.getElementById('guard-form');
  const input = document.getElementById('guard-input');
  const log = document.getElementById('guard-log');
  const chips = document.getElementById('guard-chips');
  const rows = [...document.querySelectorAll('#guard-rules tr')];
  if (!form || !input || !log) return;

  function line(className, build) {
    const p = document.createElement('p');
    p.className = className;
    build(p);
    log.append(p);
    log.scrollTop = log.scrollHeight;
  }

  function submit(command) {
    const text = command.trim();
    if (!text) return;
    const verdict = evaluate(text);

    line('cmd', (p) => {
      const sign = document.createElement('span');
      sign.className = 'amber';
      sign.textContent = '$ ';
      const echo = document.createElement('span');
      echo.className = 'cmd-echo';
      echo.textContent = text;
      p.append(sign, echo);
    });
    line(`verdict ${verdict.allowed ? 'allowed' : 'blocked'}`, (p) => {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = verdict.allowed ? 'ALLOW' : 'BLOCK';
      p.append(tag, verdict.allowed ? `${verdict.reason} · passed to the shell` : `${verdict.reason} · never reached the shell`);
    });

    rows.forEach((row, i) => row.classList.toggle('hit', i === verdict.row));
  }

  line('verdict', (p) => {
    p.textContent = `pre-execution hook loaded · ${RULES.length} rules · nothing here is really executed`;
  });

  ['Get-MgUser -Top 5', 'rm -rf ./case-data', 'DELETE FROM tickets', 'SELECT TOP 10 * FROM tickets', 'git push --force', 'Remove-ADUser jdoe'].forEach((command) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = command;
    chip.addEventListener('click', () => submit(command));
    chips.append(chip);
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submit(input.value);
    input.value = '';
  });
}
