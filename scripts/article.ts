// 記事ファイルの採番・書き出しと、生成結果の共通検査。
// ニュース記事とHOW TO記事で採番規則やMDXの取り出し方がずれると id 衝突・壊れたMDXが出るため、ここに集約する。
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import matter from "gray-matter";
import { isCategoryKey } from "../src/lib/site";

export const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");
// コスト優先で sonnet（opus比で約4割減）。品質は下の generateWithReview（執筆→編集長レビューの2段階）で担保する。
// それでも品質が足りなければ claude-opus-5 に戻す。
export const MODEL = "claude-sonnet-5";

/**
 * APIキーが無いまま生成を始めない。キー未設定だと SDK が候補ごとに素の Error を投げ、
 * generate 側が「内容起因の失敗」と誤判定して「採用」を全部「却下」に落としてしまうため、
 * 1件も消費する前にここで止める。
 */
export function requireApiKey() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY が設定されていません（ローカルは実行前に export、Actions は Secrets に登録する）");
  }
}

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

/**
 * 生成の失敗。raw に生出力の先頭を持たせ、candidates.csv のメモから原因を追えるようにする。
 * 2026-09-05、web_fetch が url_not_allowed を返した回の生出力が残っておらず、
 * 「本文13字」という検査結果だけを頼りに再現実行するはめになった。
 */
export class GenerationError extends Error {
  readonly raw: string;
  constructor(message: string, raw = "") {
    super(message);
    this.raw = raw.replace(/\s+/g, " ").trim().slice(0, 200);
  }
}

/**
 * 元記事を取得できなかった合図。プロンプトは「本文の先頭にFETCH_FAILEDとだけ書いて終了」と指示しているが、
 * モデルは frontmatter を先に出してから本文に書くことがある。先頭一致で見ると素通りして、
 * 本文13字の記事として検査まで流れてしまう（2026-09-05に発生）ので、単独行として全体から探す。
 */
function isFetchFailed(text: string): boolean {
  return /^FETCH_FAILED\b/m.test(text);
}

/** 応答から記事MDXを取り出す。最後のtextブロックが本文（途中のtextはツール呼び出し前の前置き） */
function extractText(response: Anthropic.Message): string {
  if (response.stop_reason === "refusal") {
    throw new GenerationError(`refusal: ${response.stop_details?.explanation ?? ""}`);
  }
  // 最後のtextブロックが記事本文（途中のtextはツール呼び出し前の前置きの可能性がある）
  const texts = response.content.filter((b): b is Anthropic.TextBlock => b.type === "text");
  const text = texts.at(-1)?.text.trim() ?? "";
  if (!text) throw new GenerationError("空の応答");
  if (isFetchFailed(text)) throw new GenerationError("fetch failed（元記事を取得できなかった）", text);
  return text;
}

function parseMdx(text: string) {
  const parsed = matter(text.replace(/^```(?:mdx|md)?\n([\s\S]*?)\n```$/m, "$1"));
  if (!parsed.data.title || !parsed.data.date) throw new GenerationError("frontmatter missing title/date", text);
  return parsed;
}

/**
 * 改稿に回してよい草稿の最低文字数。これを下回る草稿は直す材料が無く、
 * レビューが推測で埋めるだけになるので、その場で捨てる。
 */
const REVIEWABLE_MIN_CHARS = 400;

/**
 * 2段階生成: 執筆（web_fetch可）→ 検査に落ちたときだけ編集長レビューで改稿。
 * 草稿が check を通ればそのまま採用して2回目を呼ばない（コスト削減。体感6〜7割は1回で済む）。
 * effort は medium（思考トークンを抑える。出力課金の主要因）。
 * 戻り値の parsed は check を通過済み。usage は合計トークン使用量。
 */
export async function generateWithReview(
  client: Anthropic,
  {
    system,
    userPrompt,
    reviewPrompt,
    tools,
    check,
  }: {
    system: string;
    userPrompt: string;
    reviewPrompt: string;
    tools?: Anthropic.Messages.ToolUnion[];
    /** 記事の型検査。落ちたら throw（その内容をレビュー指示に添えて改稿させる） */
    check: (parsed: ReturnType<typeof parseMdx>) => void;
  }
) {
  const systemBlocks: Anthropic.Messages.TextBlockParam[] = [{ type: "text", text: system, cache_control: { type: "ephemeral" } }];
  const draft = await client.messages
    .stream({
      model: MODEL,
      max_tokens: 20000,
      output_config: { effort: "medium" },
      system: systemBlocks,
      tools,
      messages: [{ role: "user", content: userPrompt }],
    })
    .finalMessage();
  const draftText = extractText(draft);
  const usage = {
    input: draft.usage.input_tokens ?? 0,
    cached: draft.usage.cache_read_input_tokens ?? 0,
    output: draft.usage.output_tokens ?? 0,
    reviewed: false,
  };

  let draftParsed: ReturnType<typeof parseMdx> | null = null;
  try {
    draftParsed = parseMdx(draftText);
    check(draftParsed);
    return { parsed: draftParsed, usage };
  } catch (e) {
    // レビューは「形を整える」ための工程で、事実を足す手段が無い（改稿にはweb_fetchを渡していない）。
    // 中身の無い草稿を渡して「検査を通せ」と指示すると、元記事を読まないまま推測で本文を埋める。
    // 2026-09-05、取得に失敗した候補がこの経路で2,000字超の記事になり、検査を通ってしまった。
    const draftBody = draftParsed?.content.trim() ?? "";
    if (draftBody.length < REVIEWABLE_MIN_CHARS) {
      throw new GenerationError(`草稿の本文が${draftBody.length}字で改稿できない: ${(e as Error).message}`, draftText);
    }
    // 草稿が型を満たさない場合だけレビューを回す。検査エラーを指示に添えて確実に直させる。
    const final = await client.messages
      .stream({
        model: MODEL,
        max_tokens: 20000,
        output_config: { effort: "medium" },
        system: systemBlocks,
        messages: [
          { role: "user", content: userPrompt },
          { role: "assistant", content: draftText },
          { role: "user", content: `${reviewPrompt}\n\n# 機械検査で検出された問題（必ず直す）\n${(e as Error).message}` },
        ],
      })
      .finalMessage();
    const finalText = extractText(final);
    const parsed = parseMdx(finalText);
    try {
      check(parsed);
    } catch (err) {
      throw new GenerationError((err as Error).message, finalText);
    }
    usage.input += final.usage.input_tokens ?? 0;
    usage.cached += final.usage.cache_read_input_tokens ?? 0;
    usage.output += final.usage.output_tokens ?? 0;
    usage.reviewed = true;
    return { parsed, usage };
  }
}

// 図解コンポーネントの必須プロパティ。属性名が違うと型エラーにならないまま中身が空で描画されるため、
// 生成物の段階で落とす（src/components/figures.tsx のシグネチャと対応）。
const FIGURE_PROPS: Record<string, string[]> = {
  FigureCompare: ["title", "cols"],
  FigureDoDont: ["title", "dos"],
  FigureFlow: ["title", "steps"],
  FigureStats: ["title", "stats"],
  FigureBars: ["title", "bars"],
  FigureQuote: ["text"],
};

function figureErrors(content: string): string[] {
  const errors: string[] = [];
  for (const m of content.matchAll(/<Figure([A-Za-z]+)([\s\S]*?)\/>/g)) {
    const name = `Figure${m[1]}`;
    const required = FIGURE_PROPS[name];
    if (!required) {
      errors.push(`未定義の図解:${name}`);
      continue;
    }
    const missing = required.filter((p) => !new RegExp(`(^|\\s)${p}=`).test(m[2]));
    if (missing.length) errors.push(`${name}の属性欠落:${missing.join("/")}`);
  }
  return errors;
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
  errors.push(...figureErrors(content));
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
