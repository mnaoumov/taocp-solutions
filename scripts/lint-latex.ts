import { readFileSync } from "node:fs";
import { globSync } from "glob";
import katex from "katex";

const files = globSync("**/*.md", { ignore: ["node_modules/**"] });
let errorCount = 0;

for (const file of files) {
  const content = readFileSync(file, "utf-8");
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const regex = /\$\{\}\s*(.*?)\s*\{\}\$/g;
    let match;

    while ((match = regex.exec(line)) !== null) {
      const latex = match[1];
      try {
        katex.renderToString(latex, { throwOnError: true });
      } catch (err) {
        errorCount++;
        const message = err instanceof Error ? err.message : String(err);
        console.error(`${file}:${i + 1}: ${message}`);
        console.error(`  ${latex}\n`);
      }
    }
  }
}

if (errorCount === 0) {
  console.log("No LaTeX errors found.");
} else {
  console.error(`\n${errorCount} error(s) found.`);
  process.exit(1);
}
