import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { globSync } from "glob";

const files = globSync("**/*.md", {
  ignore: ["node_modules/**", "README.md", "**/README.md", ".obsidian/**", "Tags/**"],
});

for (const file of files) {
  const content = readFileSync(file, "utf-8");
  const tex = convertToTex(content);
  const texFile = file.replace(/\.md$/, ".tex");
  writeFileSync(texFile, tex);
  unlinkSync(file);
  console.log(`${file} -> ${texFile}`);
}

console.log(`\nConverted ${files.length} files.`);

function convertToTex(md: string): string {
  let lines = md.replace(/\r\n/g, "\n").split("\n");

  // Remove YAML frontmatter
  if (lines[0].trim() === "---") {
    const endIdx = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
    if (endIdx !== -1) {
      lines = lines.slice(endIdx + 1);
    }
  }

  // Remove leading empty lines
  while (lines.length > 0 && lines[0].trim() === "") {
    lines.shift();
  }

  // Extract title from first heading
  let title = "";
  if (lines.length > 0 && lines[0].trim().startsWith("# ")) {
    title = lines[0].trim().replace(/^# /, "");
    lines.shift();
    // Remove blank line after title
    while (lines.length > 0 && lines[0].trim() === "") {
      lines.shift();
    }
  }

  const converted = lines.map((line) => convertLine(line));

  const header = [
    "\\documentclass{article}",
    "\\usepackage{amsmath, amssymb}",
    "",
    `\\title{${escapeTexText(title)}}`,
    "",
    "\\begin{document}",
    "\\maketitle",
    "",
  ];

  const footer = ["", "\\end{document}", ""];

  return [...header, ...converted, ...footer].join("\n");
}

function convertLine(line: string): string {
  line = line.trimEnd();

  // Headings
  if (line.startsWith("#### ")) {
    return `\\paragraph*{${escapeTexText(line.slice(5))}}`;
  }
  if (line.startsWith("### ")) {
    return `\\subsubsection*{${escapeTexText(line.slice(4))}}`;
  }
  if (line.startsWith("## ")) {
    return `\\section*{${escapeTexText(line.slice(3))}}`;
  }

  // Horizontal rule
  if (/^---+$/.test(line.trim())) {
    return "\\bigskip\\hrule\\bigskip";
  }

  // Convert inline math: ${} ... {}$ -> $...$
  line = line.replace(/\$\{\}\s*(.*?)\s*\{\}\$/g, (_match, inner) => `$${inner}$`);

  // Convert backtick-delimited math: $` ... `$ -> $...$
  line = line.replace(/\$`\s*(.*?)\s*`\$/g, (_match, inner) => `$${inner}$`);

  // Convert markdown bold **text** -> \textbf{text}
  line = line.replace(/\*\*([^*]+)\*\*/g, (_match, inner) => `\\textbf{${inner}}`);

  // Convert markdown italic *text* -> \textit{text}
  line = line.replace(/\*([^*]+)\*/g, (_match, inner) => `\\textit{${inner}}`);

  // Convert inline code `text` -> \texttt{text} (but not inside math)
  line = line.replace(/`([^`]+)`/g, (_match, inner) => `\\texttt{${escapeTexText(inner)}}`);

  // Convert unordered list items
  if (/^\s*[-*]\s/.test(line)) {
    const content = line.replace(/^\s*[-*]\s/, "");
    return `\\item ${content}`;
  }

  // Convert ordered list items
  if (/^\s*\d+\.\s/.test(line)) {
    const content = line.replace(/^\s*\d+\.\s/, "");
    return `\\item ${content}`;
  }

  // Convert \lbrace/\rbrace back to \{ \} (no longer needed in tex)
  line = line.replace(/\\lbrace/g, "\\{");
  line = line.replace(/\\rbrace/g, "\\}");

  return line;
}

function escapeTexText(text: string): string {
  // Escape special LaTeX characters in plain text (not math)
  return text
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/[&%$#_{}~^]/g, (ch) => `\\${ch}`);
}
