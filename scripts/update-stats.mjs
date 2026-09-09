import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function renderStats(repos, date) {
  const originals = repos.filter(repo => !repo.fork);
  const active = originals.filter(repo => !repo.archived);
  const stars = originals.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const languages = new Map();
  for (const repo of originals) {
    if (repo.language) languages.set(repo.language, (languages.get(repo.language) || 0) + 1);
  }
  const rows = [...languages].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return [
    '| Public repositories | Original repositories | Unarchived originals | Stars on originals |',
    '| :---: | :---: | :---: | :---: |',
    `| ${repos.length} | ${originals.length} | ${active.length} | ${stars} |`,
    '',
    '<details>',
    '<summary>Languages across my original public repositories</summary>',
    '',
    '| Primary language | Repositories |',
    '| :--- | ---: |',
    ...rows.map(([language, count]) => `| ${language.replaceAll('|', '\\|')} | ${count} |`),
    '',
    'GitHub\'s primary language per repository, including archived originals. Forks and repositories without a detected language are excluded from this table. These are repository counts, not code percentages or proficiency scores.',
    '',
    '</details>',
    '',
    `<sub>Updated ${date} (UTC) from the public GitHub API. Refreshed daily by [GitHub Actions](https://github.com/mrzeappleGit/mrzeappleGit/actions/workflows/stats.yml). Private work is not included.</sub>`,
  ].join('\n');
}

export function replaceStats(readme, stats) {
  assert.equal(readme.split('<!-- STATS:START -->').length, 2, 'Expected one stats start marker');
  assert.equal(readme.split('<!-- STATS:END -->').length, 2, 'Expected one stats end marker');
  const section = /<!-- STATS:START -->[\s\S]*?<!-- STATS:END -->/;
  assert.ok(section.test(readme), 'Stats markers are out of order');
  return readme.replace(section, () => `<!-- STATS:START -->\n${stats}\n<!-- STATS:END -->`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pages = JSON.parse(execFileSync('gh', ['api', 'users/mrzeappleGit/repos?type=owner&per_page=100', '--paginate', '--slurp'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }));
  const stats = renderStats(pages.flat(), new Date().toISOString().slice(0, 10));
  const file = new URL('../README.md', import.meta.url);
  const readme = await readFile(file, 'utf8');
  const updated = replaceStats(readme, stats);
  if (updated !== readme) await writeFile(file, updated);
  console.log(stats);
}
