// content/candidates.csv で「採用」になっている候補をスコア順にN件、Claude で記事化して content/articles/ に保存する。
// 記事化した行は「公開」にして記事idを記録する。
// 元記事本文は Claude の web_fetch サーバーツールで取得（HTML解析コードを自前で持たない）。
// 実行: npx tsx scripts/generate.ts [件数=3] [--publish]
//   --publish: draft:false で書き出す（GitHub Actions の自動公開用。人のレビューを挟まない）
import Anthropic from "@anthropic-ai/sdk";
import { loadCandidates, saveCandidates, type Candidate } from "./candidates";
import { currentMaxId, GenerationError, generateWithReview, requireApiKey, today as jstToday, validate, writeArticle } from "./article";
import { AUTHOR_RULES, CREDIBILITY_RULES, DEPTH_RULES, FIGURE_RULES, MEDIA_INTRO, REVIEW_PROMPT, styleRules } from "./prompt";

const SYSTEM_PROMPT = `${MEDIA_INTRO}
追いきれない量の公式発表と海外ソースの中から、担当者が読むべき変更だけを日本語で整理します。

# この媒体の記事が他と違う点（必ず守る）
1. **影響を受けるページ・クエリを特定する**: 「## 影響を受けるページ・クエリ」という見出しを必ず置き、
   どの種類のページとクエリが動くか、逆にどこは影響が小さいかを書く。検索側の社内KPIや意図の推測は書かない。
   推論を含む場合は「〜と考えられます」で明示する。
2. **やらなくていいことを書く**: 「## やること／やらなくていいこと」という見出しで、過剰反応を止める。
   SEO業界の「とりあえず対応」を、工数と効果の観点で切る。
3. **日本の具体例**: ECサイト・メディア・店舗集客サイト・BtoBサイトなど、日本の運営者が自分事にできる例を最低1つ入れる。
4. **数字と固有名詞は元記事にあるものだけ**。無い数値・無い機能名を作らない。
5. **「## 結論」の1文目は「何が変わったか」**を書く。

${FIGURE_RULES}

${DEPTH_RULES}

${CREDIBILITY_RULES}

${AUTHOR_RULES}

${styleRules({ chars: "2,200〜3,200字", faq: "3問" })}

# 出力形式
次のfrontmatter付きMDXだけを出力する。前後に説明文やコードフェンスを付けない。

---
title: "（32〜60字。固有名詞＋何が変わるかが分かるタイトル。疑問形や煽りは使わない）"
description: "（90〜120字。検索結果のスニペットとして成立する要約）"
date: "YYYY-MM-DD"
category: "seo | geo | news のいずれか1つ（geo=AI Overview/AI Mode/ChatGPT/Perplexity等の生成AI検索全般）"
type: "news"
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

// 自動公開ではこの検査が唯一の関門になる。記事の型（SYSTEM_PROMPT）を満たさない出力は捨てて、
// 候補を「却下」に落とす（同じ候補で毎日失敗し続けないように）。
const NEWS_SHAPE = {
  headings: ["## 結論", "## 影響を受けるページ・クエリ", "## やること／やらなくていいこと", "## よくある質問"],
  minChars: 1800,
  minFaq: 3,
};

async function generateOne(client: Anthropic, c: Candidate, today: string, nextId: number, publish: boolean) {
  const userPrompt = `以下の元記事をweb_fetchで取得して読み、記事を書いてください。
取得に失敗した場合は、タイトルと概要のみで書くのではなく、本文の先頭に「FETCH_FAILED」とだけ書いて終了してください。

- 元記事タイトル: ${c.title}
- 元記事URL: ${c.url}
- 発信元: ${c.source}（${c.kind === "official" ? "公式発表" : "業界メディア"}）
- 概要: ${c.summary || "(なし)"}
- 今日の日付: ${today}`;

  const { parsed, usage } = await generateWithReview(client, {
    system: SYSTEM_PROMPT,
    userPrompt,
    reviewPrompt: REVIEW_PROMPT,
    tools: [{ type: "web_fetch_20260209", name: "web_fetch", max_uses: 3 }],
    check: (p) => validate(p.data, p.content, NEWS_SHAPE),
  });

  // 出典・draft はモデルの出力に関わらず固定する
  parsed.data.sources = [{ title: c.title, url: c.url }];
  parsed.data.draft = !publish;
  parsed.data.type = "news";
  // 記事の日付は出典が公開された日に合わせる（生成日ではない）。ニュースの鮮度を実態どおりに示すため。
  // 出典日が取れない候補と、未来日（フィードの日付が進んでいる場合）だけ生成日にフォールバックする。
  const published = String(c.published ?? "").slice(0, 10);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(published) && published <= today ? published : today;
  parsed.data.date = date;
  parsed.data.id = nextId;

  const file = writeArticle(parsed.data, parsed.content, nextId, date);
  console.log(`wrote ${file}  (in=${usage.input} cached=${usage.cached} out=${usage.output} reviewed=${usage.reviewed})`);
}

async function main() {
  requireApiKey();
  const args = process.argv.slice(2);
  const publish = args.includes("--publish");
  const limit = Number(args.find((a) => /^\d+$/.test(a)) ?? 3);
  const today = jstToday();
  const list = loadCandidates();
  const adopted = list.filter((c) => c.status === "採用").sort((a, b) => b.score - a.score).slice(0, limit);
  if (adopted.length === 0) {
    console.log("「採用」の候補がありません（npm run pick を先に実行するか、content/candidates.csv の status を 採用 にしてください）");
    return;
  }
  const client = new Anthropic();

  let nextId = currentMaxId() + 1;
  for (const c of adopted) {
    try {
      await generateOne(client, c, today, nextId, publish);
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
      // 生出力の先頭を残す。検査結果だけでは原因（取得失敗・途中終了・形式崩れ）を切り分けられない。
      const raw = e instanceof GenerationError && e.raw ? ` / 生出力: ${e.raw}` : "";
      c.note = `生成失敗: ${(e as Error).message}${raw}`;
    }
  }
  saveCandidates(list);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
