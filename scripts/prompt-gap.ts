// 狙っているプロンプト（content/prompts.csv）に対して、公開中のページが答えられているかを報告する。
//
// AI検索が回答に載せるのは「そのプロンプトへの答えが、そのページの中で完結して書いてある」ページ。
// 判定は /tools/prompt-fit と同じ src/lib/promptFit.ts をそのまま使い、
// 対象を他人のURLではなく **自サイトのビルド済みHTML**（.next/server/app/**.html）にしたもの。
// 実際にクローラーが受け取るHTMLをそのまま読むので、MDXの原稿ではなく描画後の本文で判定できる。
//
// 変更はしない。出るのは「どのプロンプトに、どのページが、どれだけ答えているか」だけ。
//
// 使い方: npm run build && npm run prompt-gap
//         npm run prompt-gap -- --all   （対象/保留を問わず全プロンプト）
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { analyze, blocksFromHtml, VERDICT_LABEL, type PromptFit } from "../src/lib/promptFit";

const BUILD_DIR = ".next/server/app";
const PROMPTS_CSV = "content/prompts.csv";
// 判定に載せないページ。本文を持たないページ（規約・エラー）と、
// 記事へのリンクを並べただけの一覧ページ（一覧が答えになるプロンプトは想定していない）。
const SKIP = /^\/(_not-found|_global-error|contact|privacy|disclaimer|news|tag\/)/;

type Row = { status: string; category: string; prompt: string; note: string };

function readPrompts(): Row[] {
  const lines = readFileSync(PROMPTS_CSV, "utf8").split("\n");
  const rows: Row[] = [];
  for (const line of lines) {
    if (!line.trim() || line.startsWith("#") || line.startsWith("status,")) continue;
    const [status = "", category = "", prompt = "", note = ""] = line.split(",");
    if (prompt.trim()) rows.push({ status: status.trim(), category: category.trim(), prompt: prompt.trim(), note: note.trim() });
  }
  return rows;
}

/** ビルド済みHTMLを集める。ファイルパスを公開URLのパスに直す */
function pages(dir: string, base = ""): { path: string; file: string }[] {
  const out: { path: string; file: string }[] = [];
  for (const name of readdirSync(dir)) {
    const file = join(dir, name);
    if (statSync(file).isDirectory()) {
      out.push(...pages(file, `${base}/${name}`));
      continue;
    }
    if (!name.endsWith(".html")) continue;
    const slug = name.replace(/\.html$/, "");
    const path = slug === "index" ? base || "/" : `${base}/${slug}`;
    if (SKIP.test(path)) continue;
    out.push({ path, file });
  }
  return out;
}

const all = process.argv.includes("--all");
const prompts = readPrompts().filter((r) => all || r.status === "対象");
if (prompts.length === 0) {
  console.error(`${PROMPTS_CSV} に「対象」のプロンプトがありません。`);
  process.exit(1);
}

let found: { path: string; file: string }[];
try {
  found = pages(BUILD_DIR);
} catch {
  console.error(`${BUILD_DIR} が見つかりません。先に npm run build を実行してください。`);
  process.exit(1);
}

// プロンプトごとに、最も答えているページ1枚を持つ
const best = new Map<string, { fit: PromptFit; path: string; title: string }>();
const promptTexts = prompts.map((p) => p.prompt);

for (const page of found) {
  const { title, blocks } = blocksFromHtml(readFileSync(page.file, "utf8"));
  if (blocks.length === 0) continue;
  const result = analyze({ source: page.path, title, blocks, prompts: promptTexts });
  for (const fit of result.fits) {
    const cur = best.get(fit.prompt);
    if (!cur || fit.fit > cur.fit.fit) best.set(fit.prompt, { fit, path: page.path, title: result.title });
  }
}

const rows = prompts.map((p) => ({ ...p, hit: best.get(p.prompt) }));
rows.sort((a, b) => (a.hit?.fit.fit ?? 0) - (b.hit?.fit.fit ?? 0));

const counts = { covered: 0, weak: 0, missing: 0 };
for (const r of rows) if (r.hit) counts[r.hit.fit.verdict]++;

console.log(`ページ ${found.length}枚 / プロンプト ${prompts.length}本`);
console.log(`答えている ${counts.covered} / 弱い ${counts.weak} / 答えていない ${counts.missing}\n`);

for (const r of rows) {
  if (!r.hit) {
    console.log(`  --  [${r.category}] ${r.prompt}\n      該当ページなし`);
    continue;
  }
  const { fit, path } = r.hit;
  console.log(`${String(fit.fit).padStart(3)}  [${r.category}] ${r.prompt}`);
  console.log(`     ${VERDICT_LABEL[fit.verdict]} — ${path}（見出し「${fit.best?.heading ?? "—"}」／重要語 ${fit.coverage}%）`);
  const missingTerms = fit.terms.filter((t) => t.hit === "none").map((t) => t.term);
  if (missingTerms.length) console.log(`     本文に無い語: ${missingTerms.join(" / ")}`);
  const ng = fit.formats.filter((f) => !f.ok);
  if (ng.length) console.log(`     形式: ${ng.map((f) => f.label).join(" / ")}`);
  if (fit.verdict !== "covered") console.log(`     直し方: ${fit.fix.note}`);
}

console.log(`\n弱い順に並べてある。上から、答えを1文で置くか、無ければ記事を1本足す。`);
