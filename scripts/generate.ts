// content/candidates.csv で「採用」になっている候補をスコア順にN件、Claude で記事化して content/articles/ に draft:true で保存する。
// 記事化した行は「公開」にして記事idを記録する。
// 元記事本文は Claude の web_fetch サーバーツールで取得（HTML解析コードを自前で持たない）。
// 実行: npx tsx scripts/generate.ts [件数=3]
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import matter from "gray-matter";
import { loadCandidates, saveCandidates, type Candidate } from "./candidates";

const CONTENT_DIR = path.join(process.cwd(), "content");
const ARTICLES_DIR = path.join(CONTENT_DIR, "articles");
const MODEL = "claude-opus-5";

const SYSTEM_PROMPT = `あなたは日本語のSEO/GEO専門メディアの編集者です。この媒体の強みは、「検索エンジンを作る側が何を狙って
この変更をしたか」を公開情報から読み解ける点です。
その視点で、一次情報をもとに日本のサイト運営者向けの解説記事を書きます。

# この媒体の記事が他と違う点（必ず守る）
1. **検索側の狙いを書く**: 「## 検索側の狙い」という見出しを必ず置き、プロダクト側の意図（何を増やし、何を減らしたいのか、
   どのKPIを見ているか）を推論する。推論であることは「〜と考えられます」で明示する。
2. **やらなくていいことを書く**: 「## やること／やらなくていいこと」という見出しで、過剰反応を止める。
   SEO業界の「とりあえず対応」をプロダクト側の視点で切る。
3. **日本の具体例**: ECサイト・メディア・店舗集客サイト・BtoBサイトなど、日本の運営者が自分事にできる例を最低1つ入れる。
4. **数字と固有名詞は元記事にあるものだけ**。無い数値・無い機能名を作らない。

# 図解（必ず3〜4個入れる）
本文には次のコンポーネントをMDXとしてそのまま書ける（importは書かない）。文章だけの記事にしない。
- 「## やること／やらなくていいこと」の箇条書きは、リストの代わりに必ず FigureDoDont で書く。
  項目は短い1文にし、理由の説明は図の直後の段落に書く。
- 残りは内容に合わせて選ぶ: 比較→FigureCompare、手順・時系列→FigureFlow、
  増減や複数項目の大小→FigureBars、単独の数値の並び→FigureStats、公式発表の一文→FigureQuote。
- 同じ種類の図を連続させない。図は該当セクションの直後に置く。
- 図の中身は本文と同様、元記事にある事実だけ。属性の文字列内ではダブルクォートを使わず「」を使う。
- JSXブロックの前後には空行を入れる。

<FigureDoDont
  title="（内容が分かる具体的なタイトル）"
  dos={["やること1", "やること2"]}
  donts={["やらなくていいこと1"]}
/>

<FigureCompare
  title="..."
  caption="（任意）"
  cols={[
    { label: "A", tone: "seo", sub: "（任意）", points: ["...", "..."] },
    { label: "B", tone: "geo", points: ["..."] },
  ]}
/>
（tone は seo | geo | news | accent。2〜3カラム）

<FigureFlow title="..." steps={[{ label: "...", desc: "（任意）" }]} />

<FigureStats title="..." stats={[{ value: "40%", label: "何の数字か", note: "（任意）" }]} />

# 書き手についての制約
- 書き手個人の経歴・前職・実務経験には一切触れない。「〜の経験から言うと」「私が〜で見てきた」のような
  一人称の経験談を書かない。「検索側の狙い」は公開情報とプロダクト設計の一般論から推論する形で書く。

# 文体
- です・ます調。一文は60字以内。1段落は3文以内。
- 次の表現は使わない: 「〜と言えるでしょう」「〜が重要です」「〜に注目が集まっています」「本記事では」「この記事では」
  「いかがでしたか」「まとめると」「〜と言っても過言ではありません」「〜することが求められます」。
- 「重要」「注目」「最適化」を連発しない。代わりに具体的な動詞で書く（例: 「title を書き換える」「ログを見る」）。
- 見出しは ## と ### のみ。冒頭は「## 結論」で、何が起きて何をすべきかを2〜3文。
- 文字数は1,800〜2,800字。末尾に「## よくある質問」を2〜3問（### に質問文、直下に回答）。
- 本文中に出典URLを再掲しない。

# 出力形式
次のfrontmatter付きMDXだけを出力する。前後に説明文やコードフェンスを付けない。

---
title: "（32〜60字。固有名詞＋何が変わるかが分かるタイトル。疑問形や煽りは使わない）"
description: "（90〜120字。検索結果のスニペットとして成立する要約）"
date: "YYYY-MM-DD"
category: "seo | geo | news のいずれか1つ（geo=AI Overview/AI Mode/ChatGPT/Perplexity等の生成AI検索全般）"
tags: ["3〜6個", "固有名詞を優先"]
impact: "high | mid | low"   # 日本の一般的なサイト運営者への影響度
audience: "（誰に影響するか。例: 店舗集客サイト、ニュースメディア、全サイト）"
actions:
  - "（今すぐやること。動詞で始める。1〜4項目。やることが無ければ「様子見で可」1項目）"
sources:
  - title: "元記事タイトル"
    url: "元記事URL"
draft: true
---

（本文）`;

// 既存記事（下書き含む）の最大 id。draft も含めて数えるので番号が衝突しない。
function currentMaxId(): number {
  if (!fs.existsSync(ARTICLES_DIR)) return 0;
  return Math.max(
    0,
    ...fs
      .readdirSync(ARTICLES_DIR)
      .filter((f) => /\.mdx?$/.test(f))
      .map((f) => Number(matter(fs.readFileSync(path.join(ARTICLES_DIR, f), "utf8")).data.id) || 0)
  );
}

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

async function generateOne(client: Anthropic, c: Candidate, today: string, nextId: number) {
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
  parsed.data.id = nextId;

  // ファイル名は「番号-英語スラッグ」で人が探しやすく。URLは id のみ（/articles/<id>）。
  const slug = slugify(String(parsed.data.title), today);
  const file = path.join(ARTICLES_DIR, `${String(nextId).padStart(4, "0")}-${slug}.mdx`);
  fs.writeFileSync(file, matter.stringify(parsed.content.trim() + "\n", parsed.data));
  console.log(`wrote ${path.relative(process.cwd(), file)}  (in=${response.usage.input_tokens} cached=${response.usage.cache_read_input_tokens} out=${response.usage.output_tokens})`);
}

async function main() {
  const limit = Number(process.argv[2] ?? 3);
  const today = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10); // JST
  const list = loadCandidates();
  const adopted = list.filter((c) => c.status === "採用").sort((a, b) => b.score - a.score).slice(0, limit);
  if (adopted.length === 0) {
    console.log("「採用」の候補がありません（content/candidates.csv の status を 採用 にしてください）");
    return;
  }
  fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  const client = new Anthropic();

  let nextId = currentMaxId() + 1;
  for (const c of adopted) {
    try {
      await generateOne(client, c, today, nextId);
      c.status = "公開";
      c.articleId = String(nextId);
      nextId++;
    } catch (e) {
      // API側の問題（レート制限・利用上限・5xx・接続）は「採用」のまま残して次回に回す。
      // 内容起因の失敗（取得不可・出力形式不正）はメモに残して却下にし、毎日同じ候補で失敗し続けるのを防ぐ。
      if (e instanceof Anthropic.APIError || e instanceof Anthropic.APIConnectionError) {
        console.error(`api error; keep ${c.url}: ${e.message}`);
        continue;
      }
      console.error(`failed ${c.url}: ${(e as Error).message}`);
      c.status = "却下";
      c.note = `生成失敗: ${(e as Error).message}`;
    }
  }
  saveCandidates(list);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
