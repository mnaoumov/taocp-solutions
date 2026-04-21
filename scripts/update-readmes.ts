import { globSync } from 'glob';
import {
  readdirSync,
  readFileSync,
  writeFileSync
} from 'node:fs';
import {
  basename,
  dirname
} from 'node:path';

function main(): void {
  const readmes = globSync('**/README.md', {
    ignore: ['node_modules/**', 'README.md', '.obsidian/**']
  });

  for (const readme of readmes) {
    const dir = dirname(readme);
    const texFiles = readdirSync(dir)
      .filter((f) => f.endsWith('.tex'))
      .sort(naturalCompare);

    if (texFiles.length === 0) {
      continue;
    }

    const content = readFileSync(readme, 'utf-8');
    const lines = content.split('\n');

    const exercisesHeaderIdx = lines.findIndex((l) => l.trim() === '## Exercises');
    let before: string[];
    if (exercisesHeaderIdx === -1) {
      before = lines.filter((l) => l.trim() !== '' || lines.indexOf(l) < lines.length - 1);
      while (before.length > 0 && before[before.length - 1]?.trim() === '') {
        before.pop();
      }
    } else {
      before = lines.slice(0, exercisesHeaderIdx);
    }

    const exerciseLinks = texFiles.map((f) => {
      const name = basename(f, '.tex');
      return `- [${name}](${encodeURIComponent(f)})`;
    });

    const newContent = [...before, '', '## Exercises', '', ...exerciseLinks, ''].join('\n');
    writeFileSync(readme, newContent);
    console.log(`${readme}: ${String(texFiles.length)} exercises`);
  }
}

function naturalCompare(a: string, b: string): number {
  const re = /(?<digits>\d+)|(?<nonDigits>\D+)/g;
  const aParts = a.match(re) ?? [];
  const bParts = b.match(re) ?? [];

  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const ap = aParts[i] ?? '';
    const bp = bParts[i] ?? '';
    const an = parseInt(ap, 10);
    const bn = parseInt(bp, 10);

    if (!isNaN(an) && !isNaN(bn)) {
      if (an !== bn) {
        return an - bn;
      }
    } else {
      const cmp = ap.localeCompare(bp);
      if (cmp !== 0) {
        return cmp;
      }
    }
  }
  return 0;
}

main();
