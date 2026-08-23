// content/queue.json の先頭N件を Claude で記事化し、content/articles/<slug>.mdx に draft:true で保存する。
// 元記事本文は Claude の web_fetch サーバーツールで取得（HTML解析コードを自前で持たない）。
// 実行: npx tsx scripts/generate.ts [件数=3]
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import matter from "gray-matter";
import type { Candidate } from "./collect";

const CONTENT_DIR = path.join(process.cwd(), "content");
const ARTICLES_DIR = path.join(CONTENT_DIR, "articles");
const QUEUE_PATH = path.join(CONTENT_DIR, "queue.json");
const PROCESSED_PATH = path.join(CONTENT_DIR, "processed.json");
const MODEL = "claude-opus-5";

const SYSTEM_PROMPT = `あなたは日本語のSEO/GEO/AIO専門メディアの編集者です。検索プロダクトのPdM経験を持つ運営者に代わり、
一次情報をもとに日本の実務者向けの解説記事を書きます。

# 記事の要件
- 言語: 日本語。です・ます調。
- 冒頭の見出し「## 結論」で、何が起きて実務者は何をすべきかを2〜3文で書く（AI検索に引用されやすい書き方）。
- 元記事の翻訳・要約ではなく、「日本のサイト運営者にとって何が変わるか」「やるべきこと/やらなくていいこと」を加える。
- 事実と意見を分ける。推測は「〜と考えられます」と明示する。元記事に無い数値・固有名詞を作らない。
- 見出しは ## と ### のみ。1段落は3文以内。表や箇条書きを適宜使う。
- 文字数は1,500〜2,500字。
- 末尾に「## よくある質問」を2〜3問置く（### に質問文、直下に回答）。
- 本文中に出典URLを再掲しない（frontmatterのsourcesに入れる）。
- 「本記事は」「この記事では」などのメタな前置きを書かない。

# 出力形式
次のfrontmatter付きMDXだけを出力する。前後に説明文やコードフェンスを付けない。

---
title: "（32〜60字。固有名詞＋何が変わるかが分かるタイトル）"
description: "（90〜120字。検索結果のスニペットとして成立する要約）"
date: "YYYY-MM-DD"
category: "seo | geo | aio | news のいずれか1つ"
tags: ["3〜6個", "固有名詞を優先"]
sources:
  - title: "元記事タイトル"
    url: "元記事URL"
draft: true
---

（本文）`;

function slugify(title: string, date: string) {
  const ascii = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return ascii.length >= 8 ? ascii : `${date}-${Math.abs(hash(title)).toString(36)}`;
}
function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return h;
}

async function generateOne(client: Anthropic, c: Candidate, today: string) {
  const userPrompt = `以下の元記事をweb_fetchで取得して読み、記事を書いてください。
取得に失敗した場合は、タイトルと概要のみで書くのではなく、本文の先頭に「FETCH_FAILED」とだけ書いて終了してください。

- 元記事タイトル: ${c.title}
- 元記事URL: ${c.url}
- 発信元: ${c.source}（${c.kind === "official" ? "公式発表" : "業界メディア"}）
- 概要: ${c.summary || "(なし)"}
- 今日の日付: ${today}`;

  const response = await client.messages
    .stream({
      model: MODEL,
      max_tokens: 16000,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      tools: [{ type: "web_fetch_20260209", name: "web_fetch", max_uses: 3 }],
      messages: [{ role: "user", content: userPrompt }],
    })
    .finalMessage();

  if (response.stop_reason === "refusal") {
    throw new Error(`refusal: ${response.stop_details?.explanation ?? ""}`);
  }
  // 最後のtextブロックが記事本文（途中のtextはツール呼び出し前の前置きの可能性がある）
  const texts = response.content.filter((b): b is Anthropic.TextBlock => b.type === "text");
  const text = texts.at(-1)?.text.trim() ?? "";
  if (!text || text.startsWith("FETCH_FAILED")) throw new Error("fetch failed");

  const body = text.replace(/^```(?:mdx|md)?\n([\s\S]*?)\n```$/m, "$1");
  const parsed = matter(body);
  if (!parsed.data.title || !parsed.data.date) throw new Error("frontmatter missing title/date");

  // 出典・draft はモデルの出力に関わらず固定する
  parsed.data.sources = [{ title: c.title, url: c.url }];
  parsed.data.draft = true;
  parsed.data.date = today;

  const slug = slugify(String(parsed.data.title), today);
  const file = path.join(ARTICLES_DIR, `${slug}.mdx`);
  fs.writeFileSync(file, matter.stringify(parsed.content.trim() + "\n", parsed.data));
  console.log(`wrote ${path.relative(process.cwd(), file)}  (in=${response.usage.input_tokens} cached=${response.usage.cache_read_input_tokens} out=${response.usage.output_tokens})`);
}

async function main() {
  const limit = Number(process.argv[2] ?? 3);
  const today = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10); // JST
  const queue: Candidate[] = fs.existsSync(QUEUE_PATH) ? JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8")) : [];
  const processed: string[] = fs.existsSync(PROCESSED_PATH) ? JSON.parse(fs.readFileSync(PROCESSED_PATH, "utf8")) : [];
  if (queue.length === 0) {
    console.log("queue is empty");
    return;
  }
  fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  const client = new Anthropic();

  const batch = queue.slice(0, limit);
  const rest = queue.slice(limit);
  for (const c of batch) {
    try {
      await generateOne(client, c, today);
    } catch (e) {
      // API側の問題（レート制限・利用上限・5xx・接続）は候補を戻して次回に回す。
      // 内容起因の失敗（取得不可・出力形式不正）は処理済みにして、同じ候補で毎日失敗し続けるのを防ぐ。
      if (e instanceof Anthropic.APIError || e instanceof Anthropic.APIConnectionError) {
        console.error(`api error; re-queue ${c.url}: ${e.message}`);
        rest.unshift(c);
        continue;
      }
      console.error(`failed ${c.url}: ${(e as Error).message}`);
    }
    processed.push(c.url);
  }

  fs.writeFileSync(QUEUE_PATH, JSON.stringify(rest, null, 2) + "\n");
  fs.writeFileSync(PROCESSED_PATH, JSON.stringify([...new Set(processed)], null, 2) + "\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
