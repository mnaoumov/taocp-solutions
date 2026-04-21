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
  exitCode: number;
  output: string;
}

async function findTexFiles(dir: string): Promise<string[]> {
  const results: string[] = [];

  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'template.tex') {
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
  const texFiles = await findTexFiles(rootDir);

  let failCount = 0;
  const failedFiles: string[] = [];

  for (const texFile of texFiles) {
    const fileDir = dirname(texFile);
    const fileName = texFile.slice(fileDir.length + 1);
    const relativePath = texFile.slice(rootDir.length + 1);

    const outDir = await mkdtemp(join(tmpdir(), 'taocp-build-'));

    try {
      const result = await runPdflatex(fileName, fileDir, outDir);

      if (result.exitCode !== 0) {
        failCount++;
        failedFiles.push(relativePath);
        const logLines = result.output.split('\n');
        const errorLines = logLines.filter((line) => line.startsWith('!') || line.startsWith('l.'));
        console.error(`  FAIL: ${relativePath}`);
        for (const line of errorLines) {
          console.error(`    ${line}`);
        }
      }
    } finally {
      await rm(outDir, { force: true, recursive: true });
    }
  }

  if (failCount > 0) {
    console.error(`\n${String(failCount)} file(s) failed to compile:`);
    for (const f of failedFiles) {
      console.error(`  ${f}`);
    }
    process.exitCode = 1;
  } else {
    console.log(`All ${String(texFiles.length)} .tex files compile successfully.`);
  }
}

function runPdflatex(fileName: string, cwd: string, outDir: string): Promise<PdflatexResult> {
  return new Promise((pdfResolve) => {
    const child = spawn(
      'pdflatex',
      ['-interaction=nonstopmode', '-halt-on-error', `-output-directory=${outDir}`, fileName],
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

    child.on('error', (err) => {
      output += err.message;
      pdfResolve({ exitCode: 1, output });
    });
  });
}

await main();
