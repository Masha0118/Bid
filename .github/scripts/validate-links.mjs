import { access, readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, join, normalize, relative, resolve, sep } from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([".git", "node_modules", "dist"]);

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await markdownFiles(absolute));
    else if (extname(entry.name).toLowerCase() === ".md") files.push(absolute);
  }
  return files;
}

const files = await markdownFiles(root);
const errors = [];
const linkPattern = /!?(?:\[[^\]]*\])\(([^)]+)\)/g;

for (const file of files) {
  const content = await readFile(file, "utf8");
  for (const match of content.matchAll(linkPattern)) {
    const raw = match[1].trim().replace(/^<|>$/g, "");
    if (!raw || raw.startsWith("#") || /^(?:https?:|mailto:|tel:)/i.test(raw)) continue;
    const withoutFragment = raw.split("#", 1)[0].split("?", 1)[0];
    if (!withoutFragment) continue;
    let decoded;
    try { decoded = decodeURIComponent(withoutFragment); } catch { decoded = withoutFragment; }
    const target = resolve(dirname(file), normalize(decoded));
    if (!target.startsWith(root)) {
      errors.push(`저장소 밖을 가리키는 링크: ${relative(root, file)} -> ${raw}`);
      continue;
    }
    try {
      await access(target);
      await stat(target);
    } catch {
      errors.push(`존재하지 않는 내부 링크: ${relative(root, file)} -> ${raw}`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Markdown 내부 링크 검사 통과 (${files.length} files)`);
