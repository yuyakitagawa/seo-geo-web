// content/howto-topics.csv で「採用」になっているテーマをN件、Claude でHOW TO記事（ストック型）にして
// content/articles/ に保存する。記事化したテーマは「公開」にして記事idを記録する。
// ニュース記事（generate.ts）との違いは、起点がRSSではなく人が決めたテーマで、
// 出典が公式ドキュメントであること。記事は日付が変わっても読める形（手順・チェックリスト）で書く。
// 実行: npx tsx scripts/generate-howto.ts [件数=1] [--publish]
import Anthropic from "@anthropic-ai/sdk";
import { loadTopics, saveTopics, type Topic } from "./howto";
import { currentMaxId, GenerationError, generateWithReview, requireApiKey, today as jstToday, validate, writeArticle } from "./article";
import { AUTHOR_RULES, CREDIBILITY_RULES, DEPTH_RULES, FIGURE_RULES, MEDIA_INTRO, REVIEW_PROMPT, styleRules } from "./prompt";
import { CATEGORIES } from "../src/lib/site";

const SYSTEM_PROMPT = `${MEDIA_INTRO}
この記事は速報ではなく、検索とAI検索から継続的に読まれる解説記事です。半年後に読んでも成立する形で書きます。

# この媒体のHOW TO記事が他と違う点（必ず守る）
1. **公式ドキュメントに書いてあることだけ書く**: 指定された出典URLをweb_fetchですべて読み、そこに書かれている
   事実・用語・数値だけで構成する。出典に無い手順・ツール名・数値を足さない。
2. **手順にする**: 「## 手順」という見出しを必ず置き、上から順に実行できる形（1手順=1動作）で書く。
   FigureFlow で全体像を先に出し、各手順の詳細は本文で補う。
3. **やらなくていいことを書く**: 「## やること／やらなくていいこと」という見出しで、工数と効果の観点から
   やらなくてよい作業を明示する。
4. **日本の具体例**: ECサイト・メディア・店舗集客サイト・BtoBサイトのいずれかを例に、手順を1つ具体化する。
5. **時点に依存する表現を使わない**: 「最近」「現在」「今後」を使わない。時期に触れる場合は
   「2026年8月時点の公式ドキュメントでは」のように、いつの情報かを明示する。
6. **「## 結論」の1文目は、指定された検索意図にそのまま答える断定文**にする。

${FIGURE_RULES}

${DEPTH_RULES}

${CREDIBILITY_RULES}

${AUTHOR_RULES}

${styleRules({ chars: "2,500〜4,000字", faq: "3〜5問" })}

# 出力形式
次のfrontmatter付きMDXだけを出力する。前後に説明文やコードフェンスを付けない。

---
title: "（32〜60字。検索意図の言葉を含む。疑問形や煽りは使わない）"
description: "（90〜120字。検索結果のスニペットとして成立する要約）"
date: "YYYY-MM-DD"
category: "（指定されたカテゴリをそのまま書く）"
type: "howto"
tags: ["3〜6個", "固有名詞を優先"]
audience: "（誰向けか。例: 全サイト、BtoBサイト）"
actions:
  - "（この記事を読んだ人が最初にやること。動詞で始める。1〜4項目）"
sources:
  - title: "（読んだ公式ドキュメントのページタイトル）"
    url: "（指定されたURLのいずれか。指定外のURLは書かない）"
draft: true
---

（本文。見出しは「## 結論」→（必要なら解説の見出し）→「## 手順」→「## やること／やらなくていいこと」→「## よくある質問」の順）`;

const HOWTO_SHAPE = {
  headings: ["## 結論", "## 手順", "## やること／やらなくていいこと", "## よくある質問"],
  minChars: 2000,
  minFaq: 3,
};

// 出典はテーマ表で指定したURLだけを許す。モデルが別のURLを足した記事は捨てる（一次情報の裏取りが崩れるため）。
function checkSources(data: Record<string, unknown>, allowed: string[]) {
  const sources = Array.isArray(data.sources) ? data.sources : [];
  const urls = sources.map((s) => String((s as { url?: unknown })?.url ?? ""));
  const extra = urls.filter((u) => !allowed.includes(u));
  if (extra.length) throw new Error(`指定外の出典URL: ${extra.join(", ")}`);
  if (urls.length === 0) throw new Error("出典なし");
}

async function generateOne(client: Anthropic, t: Topic, today: string, nextId: number, publish: boolean) {
  const userPrompt = `以下のテーマでHOW TO記事を書いてください。
出典URLはすべてweb_fetchで取得して読んでください。1つでも取得できない場合は、
推測で補わずに本文の先頭に「FETCH_FAILED」とだけ書いて終了してください。

- テーマ（タイトル案。より良い表現があれば変えてよい）: ${t.title}
- 読者の検索意図: ${t.intent}
- カテゴリ: ${t.category}（${CATEGORIES[t.category].label}）
- 出典URL:
${t.sources.map((u) => `  - ${u}`).join("\n")}
- 今日の日付: ${today}`;

  const { parsed, usage } = await generateWithReview(client, {
    system: SYSTEM_PROMPT,
    userPrompt,
    reviewPrompt: REVIEW_PROMPT,
    tools: [{ type: "web_fetch_20260209", name: "web_fetch", max_uses: t.sources.length + 2 }],
    check: (p) => {
      validate(p.data, p.content, HOWTO_SHAPE);
      checkSources(p.data, t.sources);
    },
  });

  // 型・カテゴリ・日付・draft はモデルの出力に関わらず固定する
  parsed.data.type = "howto";
  parsed.data.category = t.category;
  parsed.data.draft = !publish;
  parsed.data.date = today;
  parsed.data.id = nextId;

  const file = writeArticle(parsed.data, parsed.content, nextId, today);
  console.log(`wrote ${file}  (in=${usage.input} cached=${usage.cached} out=${usage.output} reviewed=${usage.reviewed})`);
}

async function main() {
  requireApiKey();
  const args = process.argv.slice(2);
  const publish = args.includes("--publish");
  const limit = Number(args.find((a) => /^\d+$/.test(a)) ?? 1);
  const today = jstToday();
  const list = loadTopics();
  const adopted = list.filter((t) => t.status === "採用" && t.sources.length > 0).slice(0, limit);
  if (adopted.length === 0) {
    console.log("「採用」のテーマがありません（content/howto-topics.csv の status を 採用 にしてください）");
    return;
  }
  const client = new Anthropic();

  let nextId = currentMaxId() + 1;
  for (const t of adopted) {
    try {
      await generateOne(client, t, today, nextId, publish);
      t.status = "公開";
      t.articleId = String(nextId);
      nextId++;
    } catch (e) {
      // API側の問題は「採用」のまま残して次回に回す。内容起因の失敗はメモに残して候補へ戻し、人が直す。
      if (e instanceof Anthropic.APIError || e instanceof Anthropic.APIConnectionError) {
        console.error(`api error; keep ${t.title}: ${e.message}`);
        continue;
      }
      console.error(`failed ${t.title}: ${(e as Error).message}`);
      t.status = "候補";
      // 生出力の先頭を残す。検査結果だけでは原因（取得失敗・途中終了・形式崩れ）を切り分けられない。
      const raw = e instanceof GenerationError && e.raw ? ` / 生出力: ${e.raw}` : "";
      t.note = `生成失敗: ${(e as Error).message}${raw}`;
    }
  }
  saveTopics(list);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
