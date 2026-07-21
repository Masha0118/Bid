import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, relative, sep } from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([".git", "node_modules", "dist", "coverage"]);
const textExtensions = new Set([".md", ".mmd", ".yml", ".yaml", ".json", ".js", ".mjs", ".ts", ".css", ".html", ".txt"]);
const ownScripts = new Set([".github/scripts/validate-repository.mjs", ".github/scripts/validate-links.mjs"]);

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
];

for (const path of paths) {
  const name = path.split("/").at(-1) ?? path;
  if (name === ".env.example") continue;
  if (forbiddenNames.some((pattern) => pattern.test(name))) errors.push(`금지 파일 가능성: ${path}`);
  const info = await stat(join(root, path));
  if (info.size === 0) errors.push(`빈 파일: ${path}`);
}

const joined = (...parts) => parts.join("");
const forbiddenContent = [
  ["분리된 프로젝트 명칭", new RegExp(`\\b${joined("our", "bid")}\\b`, "i")],
  ["제외 대상 클라이언트 기술", new RegExp(`${joined("flut", "ter")}|${joined("모바일 ", "앱")}`, "i")],
  ["별도 구현 배경", new RegExp([
    joined("실제 ", "앱"), joined("원본 ", "프로젝트"), joined("원본 ", "저장소"),
    joined("비공개 ", "원본"), joined("비공개 ", "저장소"),
  ].join("|"), "i")],
  ["소스 비공개 해명", new RegExp([
    joined("운영 ", "소스"), joined("소스코드", "를? 공개하지"), joined("전체 ", "소스코드"),
    joined("소스 ", "공개 정책"), joined("문서만 ", "공개"),
  ].join("|"), "i")],
  ["과거 정적 화면", new RegExp(joined("flow ", "console"), "i")],
  ["제거 대상 저장소 URL", new RegExp(joined("github\\.com\\/Masha0118\\/", "our", "bid"), "i")],
  ["로컬 절대 경로", /[A-Za-z]:\\Users\\/i],
  ["로컬 주소", /https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i],
];
const sensitivePatterns = [
  ["Private Key 값", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["Secret 값", /(?:client[_-]?secret|access[_-]?key|api[_-]?key)\s*[:=]\s*["']?[A-Za-z0-9_\-/+=]{12,}/i],
  ["접속 문자열", /(?:jdbc:[a-z]+:|redis(?:s)?:\/\/|amqps?:\/\/)[^\s<>)"']+/i],
  ["Access Token 값", /(?:bearer\s+[A-Za-z0-9_.-]{20,}|(?:api[_-]?token|auth[_-]?token)\s*[:=]\s*["']?[A-Za-z0-9_.-]{20,})/i],
  ["사설 IP URL", /https?:\/\/(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)\d{1,3}\.\d{1,3}(?::\d+)?/i],
];

for (let index = 0; index < files.length; index += 1) {
  const path = paths[index];
  if (ownScripts.has(path) || path.endsWith("package-lock.json") || !textExtensions.has(extname(path).toLowerCase())) continue;
  const content = await readFile(files[index], "utf8");
  const lines = content.split(/\r?\n/);
  lines.forEach((line, lineIndex) => {
    if (/^<{7}(?: .*)?$/.test(line) || /^>{7}(?: .*)?$/.test(line) || /^={7}$/.test(line)) {
      errors.push(`Git 충돌 표시: ${path}:${lineIndex + 1}`);
    }
    for (const [label, pattern] of [...forbiddenContent, ...sensitivePatterns]) {
      if (pattern.test(line)) errors.push(`${label}: ${path}:${lineIndex + 1}`);
    }
  });

  if (extname(path).toLowerCase() === ".mmd") {
    const first = lines.find((line) => line.trim() && !line.trim().startsWith("%%"));
    if (!first || !/^(?:flowchart|sequenceDiagram|stateDiagram|classDiagram|erDiagram|journey|gantt|pie|mindmap|timeline)\b/.test(first.trim())) {
      errors.push(`Mermaid 시작 구문 확인 필요: ${path}`);
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`저장소 내용 검사 통과 (${files.length} files)`);
