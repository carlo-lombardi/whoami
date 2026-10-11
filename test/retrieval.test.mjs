import test from 'node:test';
import assert from 'node:assert/strict';
import { bm25, buildIndex, fuse, similarity } from '../site/js/search.js';
import { evaluate } from '../site/js/guardrail.js';

const docs = [
  { id: 'a', title: 'Certificates', label: 'Certificates', text: 'certificate renewal and PKI lifecycle' },
  { id: 'b', title: 'Python automation', label: 'Python', text: 'scripts in python and powershell' },
  { id: 'c', title: 'Identity', label: 'Identity', text: 'joiner mover leaver in Entra ID' }
];
const index = buildIndex(docs);

test('BM25 ranks the matching document first', () => {
  assert.equal(bm25(index, 'certificate')[0].doc.id, 'a');
  assert.equal(bm25(index, 'kubernetes').length, 0);
});

test('the similarity ranker survives a typo that BM25 misses', () => {
  assert.equal(bm25(index, 'pyhton').length, 0);
  assert.equal(similarity(index, 'pyhton')[0].doc.id, 'b');
});

test('reciprocal rank fusion rewards agreement between rankers', () => {
  const fused = fuse([bm25(index, 'identity'), similarity(index, 'identity')]);
  assert.equal(fused[0].doc.id, 'c');
  assert.deepEqual(fused[0].ranks, [1, 1]);
  assert.ok(Math.abs(fused[0].score - 2 / 61) < 1e-9);
});

test('the guardrail blocks destructive commands and allows safe ones', () => {
  const blocked = ['rm -rf ./data', 'Remove-Item C:\\x -Recurse -Force', 'DROP TABLE users', 'DELETE FROM tickets', 'git push --force', 'Remove-ADUser jdoe'];
  const allowed = ['Get-MgUser -Top 5', 'SELECT * FROM tickets', 'DELETE FROM tickets WHERE id = 4', 'git status', 'ls -la'];
  for (const command of blocked) assert.equal(evaluate(command).allowed, false, command);
  for (const command of allowed) assert.equal(evaluate(command).allowed, true, command);
});
