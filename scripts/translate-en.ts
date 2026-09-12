// 独自記事（original: true）を英訳して content/articles-en/ に書き出す。
//   npm run translate:en -- 72            （ANTHROPIC_API_KEY 必須）
//   npm run translate:en -- 72 --slug=my-english-slug --force
//
// 独自記事には英語版が必須（src/lib/content-en.test.ts が CI で落とす）。独自記事を公開するときに1回実行する。
// 日本語記事を直したら --force で作り直す（英語版は日本語版の従属物で、英語側だけを手で直さない）。
// 検査は src/lib/enRules.ts（CI と同じ基準）。落ちたら generateWithReview が1回だけ改稿させる。
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import matter from "gray-matter";
import { EN_SLUG_PATTERN, enArticleErrors } from "../src/lib/enRules";
import { ARTICLES_DIR, generateWithReview, requireApiKey } from "./article";

const EN_DIR = path.join(process.cwd(), "content", "articles-en");

function readDir(dir: string) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.mdx?$/.test(f))
    .map((file) => ({ file, raw: fs.readFileSync(path.join(dir, file), "utf8") }))
    .map((f) => ({ ...f, ...matter(f.raw) }));
}

const SYSTEM = `You translate original first-party SEO/GEO research articles from Japanese MDX into publication-quality English MDX for an English-speaking SEO/GEO practitioner audience.

Output ONLY the complete MDX file (YAML frontmatter + body). No code fence around it, no commentary.

# Frontmatter (exactly these keys, in this order)
id (same as Japanese), slug (given), title (<= 70 chars, keep the concrete numbers), description (1–2 sentences, 40–200 chars), date (same), updated (only if the Japanese has it; same value), category (same), type (same), tags (natural English; product names as-is; 独自調査 → Original research), impact (same), audience (translated), actions (translated, same count), sources (copied verbatim: same titles and URLs, nothing added or dropped).
Do not include draft, original or supersedes. Quote YAML strings that contain a colon.

# Body
- Faithful translation in natural, concise, technical English — not word-for-word. Never add a fact, number, name or claim that is not in the Japanese. Never drop a number or finding. Keep hedges. If the source gives slightly different numbers for the same thing in different places, keep each as written.
- "## 結論" → "## Conclusion" and it must be the FIRST h2; its first paragraph must state the answer with the key numbers (AI search snippets take the first ~200 characters of the body). You may lead with a sentence built only from numbers stated elsewhere in the source.
- "## よくある質問" → "## FAQ" (h2, each question as "### ...", answers as plain paragraphs directly under it).
  If the Japanese article has no "## よくある質問" section, do not add an FAQ section. Translate other headings naturally.
- Data that was measured on Japanese text or Japanese prompts: keep the Japanese string verbatim with the English meaning in parentheses on first appearance, and keep character counts as Japanese-character counts.
- Japanese brand/site names: official English name if one exists, otherwise romanize with a short gloss on first use. Code blocks, JSON field names, URLs, user-agent strings, log lines: verbatim (comments may be translated).
- MDX figure components (<FigureCompare>, <FigureDoDont>, <FigurePipeline>, <FigureStats>, <FigureBars>, <FigureFlow>, ...): keep every component (same count), same names and prop structure; translate only string values. Keep JS expression syntax valid. Do not add doLabel/dontLabel/labels/failLabel/marks unless the Japanese passes them.
- Tables: keep all columns and values.
- Links: remove links to Japanese pages (keep the anchor text as plain text), except links to articles listed in the mapping in the user message, which must be rewritten to their /en/articles/<slug> path. External https links stay.
- No 「」 in English prose; use straight double quotes. Do not mention that the article is a translation.`;

async function main() {
  const args = process.argv.slice(2);
  const id = Number(args.find((a) => /^\d+$/.test(a)));
  const force = args.includes("--force");
  if (!Number.isInteger(id) || id <= 0) throw new Error("使い方: npm run translate:en -- <記事id> [--slug=english-slug] [--force]");

  const ja = readDir(ARTICLES_DIR).find((a) => Number(a.data.id) === id);
  if (!ja) throw new Error(`id ${id} の日本語記事が見つからない`);
  if (ja.data.original !== true) throw new Error(`id ${id} は独自記事（original: true）ではない。英語版は独自記事だけに作る`);

  const existing = readDir(EN_DIR);
  const current = existing.find((a) => Number(a.data.id) === id);
  if (current && !force) throw new Error(`英語版が既にある: content/articles-en/${current.file}（作り直すなら --force）`);

  // slug: --slug= > 既存の英語版 > 日本語ファイル名の英字部分（0030-chatgpt-fanout-log-analysis → chatgpt-fanout-log-analysis）
  const slugArg = args.find((a) => a.startsWith("--slug="))?.slice("--slug=".length);
  const slug = slugArg ?? (current ? String(current.data.slug) : ja.file.replace(/^\d+-/, "").replace(/\.mdx?$/, ""));
  if (!EN_SLUG_PATTERN.test(slug) || /^\d{4}-\d{2}-\d{2}/.test(slug)) {
    throw new Error(`英語の slug を --slug= で指定する（ファイル名から作れない: ${slug}）`);
  }

  // 本文中のリンクを英語版に張り替えられる記事（既存の英語版＋今回の記事）
  const mapping = new Map(existing.filter((a) => Number(a.data.id) !== id).map((a) => [Number(a.data.id), String(a.data.slug)]));
  mapping.set(id, slug);
  const enSlugs = new Set(mapping.values());

  requireApiKey();
  const client = new Anthropic();
  const userPrompt = [
    `Translate this article. English slug: ${slug}`,
    "",
    "Internal links that must be rewritten to English (any other internal link must be removed, keeping its text):",
    ...[...mapping].map(([jaId, s]) => `- /articles/${jaId} → /en/articles/${s}`),
    "",
    "Japanese source:",
    ja.raw,
  ].join("\n");

  const { parsed, usage } = await generateWithReview(client, {
    system: SYSTEM,
    userPrompt,
    reviewPrompt: "The translation failed the automated checks below. Output the complete corrected MDX file only, fixing every issue without changing anything else.",
    check: (doc) => {
      const errors = enArticleErrors(ja, { data: doc.data, content: doc.content }, enSlugs);
      if (doc.data.slug !== slug) errors.push(`slug は ${slug}`);
      if (errors.length) throw new Error(errors.join(" / "));
    },
  });

  fs.mkdirSync(EN_DIR, { recursive: true });
  if (current) fs.rmSync(path.join(EN_DIR, current.file));
  const out = path.join(EN_DIR, `${String(id).padStart(4, "0")}-${slug}.mdx`);
  fs.writeFileSync(out, matter.stringify(parsed.content.trim() + "\n", parsed.data));
  console.log(`${path.relative(process.cwd(), out)}（入力 ${usage.input} / 出力 ${usage.output} トークン${usage.reviewed ? "・改稿あり" : ""}）`);
  console.log("公開前に本文を読み、数値と固有名詞が日本語版と一致しているか確認すること。");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
