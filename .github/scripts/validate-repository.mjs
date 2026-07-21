import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative, sep } from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([".git", "node_modules", "dist", "coverage"]);
const textExtensions = new Set([".md", ".mmd", ".yml", ".yaml", ".json", ".js", ".mjs", ".ts", ".css", ".html", ".txt"]);
const ownScripts = new Set([
  ".github/scripts/validate-repository.mjs",
  ".github/scripts/validate-links.mjs",
]);

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collect(absolute));
    else files.push(absolute);
  }
  return files;
}

const files = await collect(root);
const paths = files.map((file) => relative(root, file).split(sep).join("/"));
const errors = [];

const forbiddenNames = [
  /^\.env(?:\..+)?$/i,
  /^application-prod\.(?:yml|yaml|properties)$/i,
  /^google-services\.json$/i,
  /(?:firebase|service-account).*(?:\.json|\.yml|\.yaml)$/i,
  /\.(?:pem|p12|pfx|jks|keystore|dump|rdb)$/i,
  /(?:production|operation|server).+\.log$/i,
  /(?:source|project).+\.(?:zip|7z|tar|gz)$/i,
];

for (const path of paths) {
  const name = path.split("/").at(-1) ?? path;
  if (name === ".env.example") continue;
  if (forbiddenNames.some((pattern) => pattern.test(name))) {
    errors.push(`공개 금지 가능성이 있는 파일: ${path}`);
  }
}

const sensitivePatterns = [
  ["private key 값", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["client/access secret 값", /(?:client[_-]?secret|access[_-]?key)\s*[:=]\s*["']?[A-Za-z0-9_\-/+=]{12,}/i],
  ["접속 문자열", /(?:jdbc:[a-z]+:|redis(?:s)?:\/\/|amqps?:\/\/)[^\s<>)"']+/i],
  ["토큰 값", /(?:bearer\s+[A-Za-z0-9_.-]{20,}|(?:api[_-]?token|auth[_-]?token)\s*[:=]\s*["']?[A-Za-z0-9_.-]{20,})/i],
  ["이메일 주소", /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i],
  ["전화번호", /(?<!\d)(?:01[016789][ -]?)\d{3,4}[ -]?\d{4}(?!\d)/],
  ["Windows 절대 경로", /\b[A-Za-z]:\\(?:Users|Documents and Settings|ProgramData)\\[^\s`"']+/],
  ["서버 IP 주소", /https?:\/\/(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?/i],
];

for (let index = 0; index < files.length; index += 1) {
  const path = paths[index];
  if (ownScripts.has(path) || path.endsWith("package-lock.json") || !textExtensions.has(extname(path).toLowerCase())) continue;
  const content = await readFile(files[index], "utf8");
  const lines = content.split(/\r?\n/);
  lines.forEach((line, lineIndex) => {
    if (/^<{7} .+$/.test(line) || /^>{7} .+$/.test(line) || (/^={7}$/.test(line) && lines.some((item) => /^<{7} .+$/.test(item)))) {
      errors.push(`Git 충돌 표시: ${path}:${lineIndex + 1}`);
    }
    for (const [label, pattern] of sensitivePatterns) {
      if (pattern.test(line)) errors.push(`${label}: ${path}:${lineIndex + 1}`);
    }
  });
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`저장소 충돌 표시·금지 파일·민감정보 검사 통과 (${files.length} files)`);
