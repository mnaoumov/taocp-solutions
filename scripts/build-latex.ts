import { spawn } from 'node:child_process';
import {
  mkdtemp,
  readdir,
  rm
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import {
  dirname,
  join,
  resolve
} from 'node:path';

interface PdflatexResult {
  readonly exitCode: number;
  readonly output: string;
}

async function findTexFiles(directory: string): Promise<string[]> {
  const results: string[] = [];

  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'template.tex') {
      continue;
    }

    const fullPath = join(directory, entry.name);
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
  const rootDirectory = resolve('.');
  const texFiles = await findTexFiles(rootDirectory);

  let errorCount = 0;
  let warningCount = 0;
  const errorFiles: string[] = [];
  const warningFiles: string[] = [];

  for (const texFile of texFiles) {
    const fileDirectory = dirname(texFile);
    const fileName = texFile.slice(fileDirectory.length + 1);
    const relativePath = texFile.slice(rootDirectory.length + 1);

    const outDirectory = await mkdtemp(join(tmpdir(), 'taocp-build-'));

    try {
      const result = await runPdflatex(fileName, fileDirectory, outDirectory);
      const logLines = result.output.split('\n');

      if (result.exitCode !== 0) {
        errorCount++;
        errorFiles.push(relativePath);
        const lines = logLines.filter((line) => line.startsWith('!') || line.startsWith('l.'));
        console.error(`  ERROR: ${relativePath}`);
        for (const line of lines) {
          console.error(`    ${line}`);
        }
      }

      const boxWarnings = logLines.filter((line) => /^Overfull \\[hv]box/.test(line));
      if (boxWarnings.length > 0) {
        warningCount += boxWarnings.length;
        if (!warningFiles.includes(relativePath)) {
          warningFiles.push(relativePath);
        }
        for (const warning of boxWarnings) {
          console.error(`  WARN: ${relativePath}: ${warning}`);
        }
      }
    } finally {
      await rm(outDirectory, { force: true, recursive: true });
    }
  }

  if (errorCount > 0) {
    console.error(`\n${String(errorCount)} file(s) failed to compile:`);
    for (const f of errorFiles) {
      console.error(`  ${f}`);
    }
    process.exitCode = 1;
  } else if (warningCount > 0) {
    console.error(`\nAll ${String(texFiles.length)} .tex files compile, but ${String(warningCount)} warning(s) in ${String(warningFiles.length)} file(s).`);
    process.exitCode = 1;
  } else {
    console.log(`All ${String(texFiles.length)} .tex files compile successfully.`);
  }
}

function runPdflatex(fileName: string, cwd: string, outDirectory: string): Promise<PdflatexResult> {
  return new Promise((pdfResolve) => {
    const child = spawn(
      'pdflatex',
      ['-interaction=nonstopmode', '-halt-on-error', `-output-directory=${outDirectory}`, fileName],
      { cwd, stdio: 'pipe' }
    );

    let output = '';

    child.stdout.on('data', (data: Buffer) => {
      output += data.toString('utf-8');
    });

    child.stderr.on('data', (data: Buffer) => {
      output += data.toString('utf-8');
    });

    child.on('close', (exitCode) => {
      pdfResolve({ exitCode: exitCode ?? 1, output });
    });

    child.on('error', (error) => {
      output += error.message;
      pdfResolve({ exitCode: 1, output });
    });
  });
}

await main();
