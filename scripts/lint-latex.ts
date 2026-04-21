import { readdir } from 'node:fs/promises';
import {
  dirname,
  join,
  resolve
} from 'node:path';

import { exec } from './helpers/exec.ts';

async function findTexFiles(dir: string): Promise<string[]> {
  const results: string[] = [];

  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules') {
      continue;
    }

    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const subResults = await findTexFiles(fullPath);
      results.push(...subResults);
    } else if (entry.name.endsWith('.tex')) {
      results.push(fullPath);
    }
  }

  return results;
}

async function main(): Promise<void> {
  const rootDir = resolve('.');
  const rcFile = join(rootDir, '.chktexrc');
  const texFiles = await findTexFiles(rootDir);

  let totalWarnings = 0;
  const failedFiles: string[] = [];

  for (const texFile of texFiles) {
    const fileDir = dirname(texFile);
    const fileName = texFile.slice(fileDir.length + 1);

    const result = await exec(
      `chktex -l "${rcFile}" "${fileName}"`,
      { cwd: fileDir, isQuiet: true, shouldIgnoreExitCode: true, shouldIncludeDetails: true }
    );

    const output = result.stdout + result.stderr;
    const warnings = output.split('\n').filter((line) => line.startsWith('Warning '));

    if (warnings.length > 0) {
      totalWarnings += warnings.length;
      failedFiles.push(texFile);
      const relativePath = texFile.slice(rootDir.length + 1);
      for (const warning of warnings) {
        console.error(`  ${relativePath}: ${warning}`);
      }
    }
  }

  if (totalWarnings > 0) {
    console.error(`\n${String(totalWarnings)} warning(s) in ${String(failedFiles.length)} file(s).`);
    process.exitCode = 1;
  } else {
    console.log(`All ${String(texFiles.length)} .tex files pass chktex.`);
  }
}

await main();
