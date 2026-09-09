import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderStats, replaceStats } from './update-stats.mjs';

test('stats distinguish originals, forks, archives and primary languages; preserve surrounding README', () => {
  const repos = [
    { fork: false, archived: false, language: 'Python', stargazers_count: 2 },
    { fork: false, archived: true, language: 'Python', stargazers_count: 1 },
    { fork: true, archived: false, language: 'Java', stargazers_count: 99 },
    { fork: false, archived: false, language: null, stargazers_count: 0 },
  ];
  const block = renderStats(repos, '2026-09-09');
  assert.ok(block.includes('| 4 | 3 | 2 | 3 |'));
  assert.ok(block.includes('| Python | 2 |'));
  assert.ok(!block.includes('| Java |'));
  assert.ok(block.includes('2026-09-09'));
  assert.ok(renderStats([], '2026-09-09').includes('| 0 | 0 | 0 | 0 |'));
  const readme = 'Intro\n<!-- STATS:START -->\nstale\n<!-- STATS:END -->\nProjects';
  const result = replaceStats(readme, block);
  assert.ok(result.startsWith('Intro\n<!-- STATS:START -->\n'));
  assert.ok(result.endsWith('\n<!-- STATS:END -->\nProjects'));
  assert.ok(!result.includes('stale'));
  assert.equal(replaceStats(result, block), result);
  assert.throws(() => replaceStats('missing markers', block));
  assert.throws(() => replaceStats(readme + readme, block));
});
