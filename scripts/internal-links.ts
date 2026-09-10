// 既に公開済みの記事の本文に、内部リンクを後から差し込む。
// 判定は src/lib/internalLinks.ts（純関数・テストあり）。ここはファイルの読み書きだけを持つ。
//
// **本文の文言は1字も変えない**。既に本文にある語を [語](/path) で包むだけなので、
// 差分を読めば何が起きたかが1行で分かる。frontmatter には触れない（生の文字列のまま残す）。
//
// 実行: npx tsx scripts/internal-links.ts          # 報告のみ（既定）
//       npx tsx scripts/internal-links.ts --write   # 書き込む
//       npx tsx scripts/internal-links.ts --max=2   # 1記事あたりの本数（既定3）
import fs from "node:fs";
import path from "node:path";
import { LESSONS } from "../src/lib/curriculum";
import { GLOSSARY } from "../src/lib/glossary";
import { buildLinkRules, insertInternalLinks } from "../src/lib/internalLinks";

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");
const args = process.argv.slice(2);
const write = args.includes("--write");
const maxLinks = Number(args.find((a) => a.startsWith("--max="))?.split("=")[1] ?? 3);

/** frontmatter を触らずに本文だけを差し替えるため、生の文字列を先頭の --- 2つで割る */
function splitFrontmatter(raw: string): { head: string; body: string } | null {
  if (!raw.startsWith("---")) return null;
  const end = raw.indexOf("\n---", 3);
  if (end < 0) return null;
  const cut = raw.indexOf("\n", end + 1) + 1;
  return { head: raw.slice(0, cut), body: raw.slice(cut) };
}

function main() {
  const rules = buildLinkRules(LESSONS, GLOSSARY);
  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".mdx")).sort();

  let changed = 0;
  let stillEmpty = 0;
  let total = 0;

  for (const file of files) {
    const full = path.join(ARTICLES_DIR, file);
    const raw = fs.readFileSync(full, "utf8");
    const split = splitFrontmatter(raw);
    if (!split) {
      console.warn(`[skip] ${file}: frontmatter を読めません`);
      continue;
    }
    // 自分自身のURLへは張らない（id は frontmatter にあるので head から拾う）
    const id = split.head.match(/^id:\s*"?(\d+)"?/m)?.[1];
    const before = (split.body.match(/\]\(\/[^)\s]*\)/g) ?? []).length;

    const { body, inserted } = insertInternalLinks(split.body, rules, {
      maxLinks: Math.max(0, maxLinks - before),
      skipHrefs: id ? [`/articles/${id}`] : [],
    });

    if (inserted.length === 0) {
      if (before === 0) stillEmpty++;
      continue;
    }
    changed++;
    total += inserted.length;
    console.log(`${file}  +${inserted.length}`);
    for (const i of inserted) console.log(`    [${i.phrase}](${i.href})`);
    if (write) fs.writeFileSync(full, split.head + body);
  }

  console.log(
    `\n${changed}本に計${total}本を${write ? "差し込みました" : "差し込めます（--write で書き込み）"}。` +
      `リンクを作れなかった記事: ${stillEmpty}本`,
  );
}

main();
