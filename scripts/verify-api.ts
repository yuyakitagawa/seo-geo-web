// 本番の /api/* が読み込めることを、Vercel と同じ変換設定で確かめる。
//
// Vercel のビルダー（@vercel/node）はエントリに近い tsconfig を拾って関数を変換する。ここが
// ルートの tsconfig（module: esnext）に落ちると、出力が import 文のままの ESM になり、拡張子無しの
// 相対 import（../src/lib/audit）を Node が読めず、本番だけ FUNCTION_INVOCATION_FAILED になる。
// 2026-09-04 に実際に起きた。`vercel dev` は別経路で変換するので再現せず、型検査もビルドも通ってしまう。
//
// そこで api/tsconfig.json で実際に出力し、出力を require() して読み込めるところまでを検査する。
// 落ちたときは本番の関数が動かない状態なので、CI はここで止める。
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const API_DIR = path.join(ROOT, "api");
// 出力先はリポジトリ内に置く。tmp に出すと node_modules を辿れず、実際には解決できる import まで落ちる
const out = path.join(ROOT, ".api-verify");
fs.rmSync(out, { recursive: true, force: true });

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

try {
  // noEmit / incremental はルートの tsconfig から継承するのでここで打ち消す
  execFileSync(
    "npx",
    ["tsc", "-p", "api/tsconfig.json", "--noEmit", "false", "--outDir", out, "--incremental", "false", "--tsBuildInfoFile", "null"],
    { cwd: ROOT, stdio: "inherit" }
  );
} catch {
  fail("api/tsconfig.json での変換に失敗しました");
}

const entries = fs
  .readdirSync(API_DIR)
  .filter((f) => f.endsWith(".ts"))
  .map((f) => f.replace(/\.ts$/, ".js"));

if (entries.length === 0) fail("api/ に関数のエントリがありません");

const require_ = createRequire(import.meta.url);
for (const entry of entries) {
  const file = path.join(out, "api", entry);
  if (!fs.existsSync(file)) fail(`${entry} が出力されていません（rootDir がずれている可能性）`);

  const source = fs.readFileSync(file, "utf8");
  // CommonJS で出ていること。import 文が残っていると Node が ES module として読もうとして落ちる
  if (/^\s*import\s/m.test(source) || /^\s*export\s/m.test(source)) {
    fail(`${entry} が ESM で出力されています（api/tsconfig.json の module を commonjs に保つこと）`);
  }

  try {
    const mod = require_(file);
    // Vercel Functions は HTTP メソッド名の named export（POST など）か default export をハンドラにする
    const handlers = ["default", "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];
    if (!handlers.some((name) => typeof mod[name] === "function")) {
      fail(`${entry} にハンドラの export がありません（${handlers.join(" / ")} のいずれか）`);
    }
  } catch (e) {
    fail(`${entry} を読み込めません: ${(e as Error).message}`);
  }
  console.log(`✓ ${entry}`);
}

fs.rmSync(out, { recursive: true, force: true });
console.log(`Vercel Functions ${entries.length} 本を CommonJS で読み込めました`);
