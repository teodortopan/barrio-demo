import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import test from "node:test";

const root = new URL("..", import.meta.url).pathname;
const skipDirectories = new Set([".git", ".next", "node_modules", "out"]);
const textExtensions = new Set([".css", ".js", ".json", ".mjs", ".md", ".ts", ".tsx"]);

function walk(directory) {
  return readdirSync(directory).flatMap((name) => {
    if (skipDirectories.has(name)) return [];
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function sourceText() {
  const sourceRoots = ["app", "components", "lib", "public"];
  const files = sourceRoots.flatMap((directory) => walk(join(root, directory)));
  files.push(join(root, "next.config.mjs"));
  return files
    .filter((path) => textExtensions.has(extname(path)) && !path.endsWith("package-lock.json"))
    .map((path) => `\n--- ${relative(root, path)} ---\n${readFileSync(path, "utf8")}`)
    .join("");
}

test("the repository stays frontend-only", () => {
  for (const forbiddenPath of ["app/api", "middleware.ts", "sql", ".env", ".env.local"]) {
    assert.equal(existsSync(join(root, forbiddenPath)), false, `${forbiddenPath} must not exist`);
  }

  const dependencies = {
    ...JSON.parse(readFileSync(join(root, "package.json"), "utf8")).dependencies,
  };
  for (const packageName of ["@supabase/supabase-js", "resend", "web-push", "pdfkit"]) {
    assert.equal(packageName in dependencies, false, `${packageName} must not be installed`);
  }
});

test("Next.js is configured for a static export", () => {
  const config = readFileSync(join(root, "next.config.mjs"), "utf8");
  assert.match(config, /output:\s*["']export["']/);
  assert.match(config, /trailingSlash:\s*true/);
  assert.match(config, /unoptimized:\s*true/);
});

test("all intended demo routes are present", () => {
  const routeFiles = [
    "app/(resident)/dashboard/page.tsx",
    "app/(resident)/dashboard/informacion/page.tsx",
    "app/(public)/informacion/page.tsx",
    "app/(public)/comunidad/page.tsx",
    "app/(admin)/seguridad/page.tsx",
    "app/(admin)/admin/gestion/page.tsx",
    "app/(admin)/admin/ingresos/page.tsx",
  ];
  for (const route of routeFiles) assert.equal(existsSync(join(root, route)), true, `${route} is missing`);
});

test("API-shaped reads stay local and writes are non-persistent", () => {
  const adapter = readFileSync(join(root, "lib/demo/install-demo-fetch.ts"), "utf8");
  assert.match(adapter, /url\.pathname\.startsWith\(["']\/api\//);
  assert.match(adapter, /method !== ["']GET["'] && method !== ["']HEAD["']/);
  assert.match(adapter, /DEMO_MUTATION_EVENT/);
  assert.match(adapter, /demoGetBody\(url\.pathname, url\.searchParams\)/);
  assert.match(adapter, /403/);
});

test("user mutations are stopped before component handlers run", () => {
  const chrome = readFileSync(join(root, "components/demo/demo-mode-chrome.tsx"), "utf8");
  assert.match(chrome, /document\.addEventListener\(["']click["'], onClickCapture, true\)/);
  assert.match(chrome, /document\.addEventListener\(["']submit["'], onSubmitCapture, true\)/);
  assert.match(chrome, /event\.stopImmediatePropagation\(\)/);
  assert.match(chrome, /\["checkbox", "file", "radio"\]/);
  assert.match(chrome, /data-demo-mutation/);
  assert.doesNotMatch(
    chrome,
    /const stopMutation = \(event: Event\) => \{[\s\S]*?showNotice\(\)[\s\S]*?\n    \};/
  );
});

test("public source does not contain production infrastructure or identifiers", () => {
  const source = sourceText();
  const forbiddenPatterns = [
    /supabase/i,
    /service[_ -]?role/i,
    /cron_secret/i,
    /barrio(?:\s|\/\/)*san(?:\s|\/\/)*jos[eé]/i,
    /teodortopan/i,
    /next\/(?:headers|server)/i,
    /middleware/i,
    /5629-3581/,
  ];
  for (const pattern of forbiddenPatterns) assert.doesNotMatch(source, pattern);
});

test("private document formats are absent", () => {
  const forbiddenExtensions = new Set([".csv", ".doc", ".docx", ".pdf", ".sql", ".txt", ".xls", ".xlsx"]);
  const privateFiles = walk(root).filter((path) => forbiddenExtensions.has(extname(path).toLowerCase()));
  assert.deepEqual(privateFiles, []);
});
