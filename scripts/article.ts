// 記事ファイルの採番・書き出しと、生成結果の共通検査。
// ニュース記事とHOW TO記事で採番規則やMDXの取り出し方がずれると id 衝突・壊れたMDXが出るため、ここに集約する。
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import matter from "gray-matter";
import { isCategoryKey } from "../src/lib/site";

export const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");
export const MODEL = "claude-opus-5";

/** JSTの今日 YYYY-MM-DD */
export function today(): string {
  return new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
}

// 既存記事（下書き含む）の最大 id。draft も含めて数えるので番号が衝突しない。
export function currentMaxId(): number {
  if (!fs.existsSync(ARTICLES_DIR)) return 0;
  return Math.max(
    0,
    ...fs
      .readdirSync(ARTICLES_DIR)
      .filter((f) => /\.mdx?$/.test(f))
      .map((f) => Number(matter(fs.readFileSync(path.join(ARTICLES_DIR, f), "utf8")).data.id) || 0)
  );
}

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return h;
}

export function slugify(title: string, date: string) {
  const ascii = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return ascii.length >= 8 ? ascii : `${date}-${Math.abs(hash(title)).toString(36)}`;
}

/** 応答から記事MDXを取り出す。最後のtextブロックが本文（途中のtextはツール呼び出し前の前置き） */
export function extractMdx(response: Anthropic.Message) {
  if (response.stop_reason === "refusal") {
    throw new Error(`refusal: ${response.stop_details?.explanation ?? ""}`);
  }
  const texts = response.content.filter((b): b is Anthropic.TextBlock => b.type === "text");
  const text = texts.at(-1)?.text.trim() ?? "";
  if (!text || text.startsWith("FETCH_FAILED")) throw new Error("fetch failed");
  const parsed = matter(text.replace(/^```(?:mdx|md)?\n([\s\S]*?)\n```$/m, "$1"));
  if (!parsed.data.title || !parsed.data.date) throw new Error("frontmatter missing title/date");
  return parsed;
}

// 自動公開ではこの検査が唯一の関門になる。記事の型を満たさない出力は捨てる。
// headings / minChars / minFaq は記事の型ごとに変える。
export function validate(
  data: Record<string, unknown>,
  content: string,
  { headings, minChars, minFaq }: { headings: string[]; minChars: number; minFaq: number }
) {
  const errors: string[] = [];
  if (!isCategoryKey(String(data.category))) errors.push(`category不正:${data.category}`);
  const description = String(data.description ?? "");
  if (description.length < 40 || description.length > 200) errors.push(`description長さ${description.length}`);
  const actions = data.actions;
  if (!Array.isArray(actions) || actions.length < 1 || actions.length > 4) errors.push("actions不正");
  if (content.length < minChars) errors.push(`本文${content.length}字`);
  for (const h of headings) if (!content.includes(h)) errors.push(`見出し欠落:${h}`);
  if ((content.match(/<Figure[A-Za-z]+/g) ?? []).length < 2) errors.push("図解が2個未満");
  // FAQは FAQPage 構造化データの元データになる（src/lib/faq.ts が本文から抽出する）。
  const faqSection = content.slice(content.indexOf("## よくある質問"));
  if ((faqSection.match(/^### /gm) ?? []).length < minFaq) errors.push(`FAQが${minFaq}問未満`);
  if (errors.length) throw new Error(errors.join(", "));
}

/** 記事ファイルを書き出してパスを返す。ファイル名は「番号-英語スラッグ」、URLは id のみ */
export function writeArticle(data: Record<string, unknown>, content: string, id: number, date: string): string {
  fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  const file = path.join(ARTICLES_DIR, `${String(id).padStart(4, "0")}-${slugify(String(data.title), date)}.mdx`);
  fs.writeFileSync(file, matter.stringify(content.trim() + "\n", data));
  return path.relative(process.cwd(), file);
}
