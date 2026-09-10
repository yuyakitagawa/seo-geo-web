// 記事1本ずつを Claude に読ませ、「教科書（/learn）とツールに組み込む価値があるか」を判定する。
//
// **大半の記事は却下される**のが正常な状態。毎朝の記事は「その日に何が起きたか」を伝えるフロー情報で、
// 数ヶ月後にも通じる手順・判断基準を含むものは一部しかない。全部を教科書に流すと、
// 教科書が記事一覧の劣化コピーになる（`src/lib/lessonFeed.ts` の冒頭に経緯）。
//
// 判定結果は content/knowhow.csv に積む。**本文は書き換えない**。
// 採用された行はレッスンページの「記事から取り入れたこと」に出る。
// ノウハウをレッスン本文そのものに書き込んだら、人が status を「反映済」に変える（二重に出さないため）。
//
// 使い方: npm run knowhow -- 5   （未判定の記事を新しい順に5本判定。ANTHROPIC_API_KEY 必須）
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { stringify } from "csv-stringify/sync";
import { MODEL, requireApiKey, today } from "./article";
import { getAllArticles } from "../src/lib/content";
import { LESSONS } from "../src/lib/curriculum";
import { candidateLessons } from "../src/lib/lessonFeed";
import { KNOWHOW_COLUMNS, getKnowhow, isKnowhowTarget, judgedArticleIds, type Knowhow } from "../src/lib/knowhow";

const KNOWHOW_PATH = path.join(process.cwd(), "content", "knowhow.csv");
/** ノウハウ1文の上限。長い行は「記事の要約」であってノウハウではない */
const MAX_KNOWHOW = 100;

const SYSTEM = `あなたは日本語のSEO/GEOメディアの編集長です。毎朝自動生成される記事を読み、
「自社の教科書（順番のある実務手順）に恒久的に組み込む価値があるか」だけを判定します。
あなたの仕事は**落とすこと**です。記事の大半は教科書に入れるべきではありません。`;

function prompt(article: { title: string; description: string; date: string; body: string; sources: { title: string; url: string }[] }, lessons: typeof LESSONS): string {
  return `# 判定する記事
公開日: ${article.date}
タイトル: ${article.title}
説明: ${article.description}
出典: ${article.sources.map((s) => `${s.title} ${s.url}`).join(" / ") || "（なし）"}

---
${article.body.slice(0, 12000)}
---

# 組み込み先の候補（このレッスンにしか入れられない）
${lessons.map((l) => `- lesson:${l.slug} … ${l.title}／扱うこと: ${l.objectives.join("、")}／到達チェック: ${l.checklist.join("、")}`).join("\n")}
- tool:page-audit … ページ診断（URLを入れると直すべき箇所を指摘するツール）に、新しい判定項目を足す
- tool:list … 外部ツール比較表に、新しいツールを載せる

# 採用の条件（**4つすべて**を満たすときだけ採用）
1. **数ヶ月後も通じる**。単発の障害・不具合、「テストを開始した」「発表した」だけの記事、
   一時的な順位変動の報告は却下。仕様が確定し、読者の作業内容が変わるものだけ採用。
2. **読者が自分のサイトで実行できる**。具体的な手順・判断基準・しきい値・設定値のいずれかがある。
   「重要だ」「注視したい」で終わる記事は却下。
3. **候補レッスンにまだ書かれていない**。上の「扱うこと」「到達チェック」と同じことを言い換えただけなら却下。
4. **一次情報の裏付けがある**。出典が公式ドキュメント・論文・自分で取った実測のいずれか。
   他媒体の推測・観測だけの記事は却下。

# 出力（JSONだけ。前後に説明を書かない）
採用するとき:
{"adopt": true, "target": "lesson:<slug> か tool:page-audit か tool:list", "knowhow": "<${MAX_KNOWHOW}字以内の1文>", "where": "checklist か body", "reason": "<4条件のどれをどう満たすか。80字以内>"}
却下するとき:
{"adopt": false, "reason": "<4条件のどれを満たさないか。80字以内>"}

knowhow は**読者が自分のサイトで実行できる1文**にする。記事の要約にしない。
記事に書かれていない数値・固有名詞を足さない。`;
}

type Judgement = { adopt: boolean; target?: string; knowhow?: string; where?: string; reason?: string };

/** 生出力からJSONを取り出す。前後に説明が付いたときも拾えるように最初の { から最後の } まで見る */
function parseJudgement(text: string): Judgement {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error(`JSONが見つからない: ${text.slice(0, 200)}`);
  return JSON.parse(text.slice(start, end + 1)) as Judgement;
}

/** 判定の形式検査。存在しないレッスンや長すぎる1文を、そのまま台帳に入れない */
function validate(j: Judgement, allowed: Set<string>): string[] {
  const errors: string[] = [];
  if (typeof j.adopt !== "boolean") errors.push("adopt が true/false でない");
  if (!j.reason?.trim()) errors.push("reason が空");
  if (j.adopt) {
    if (!j.target || !isKnowhowTarget(j.target)) errors.push(`target が不正: ${j.target}`);
    else if (!allowed.has(j.target)) errors.push(`候補にないレッスンを指した: ${j.target}`);
    const k = j.knowhow?.trim() ?? "";
    if (!k) errors.push("knowhow が空");
    else if (k.length > MAX_KNOWHOW) errors.push(`knowhow が${MAX_KNOWHOW}字を超えた（${k.length}字）`);
    else if ((k.match(/。/g) ?? []).length > 1) errors.push("knowhow が2文以上ある");
  }
  return errors;
}

async function judge(client: Anthropic, article: Parameters<typeof prompt>[0], lessons: typeof LESSONS, allowed: Set<string>): Promise<Judgement> {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    output_config: { effort: "low" }, // 落とすか通すかの判定なので思考を深くする意味がない
    system: SYSTEM,
    messages: [{ role: "user", content: prompt(article, lessons) }],
  });
  if (res.stop_reason === "refusal") throw new Error(`refusal: ${res.stop_details?.explanation ?? ""}`);
  const text = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").at(-1)?.text ?? "";
  const j = parseJudgement(text);
  const errors = validate(j, allowed);
  if (errors.length) throw new Error(`判定の形式が不正（${errors.join(" / ")}）: ${text.slice(0, 300)}`);
  return j;
}

function append(rows: Knowhow[]) {
  const all = [...getKnowhow(), ...rows];
  fs.writeFileSync(KNOWHOW_PATH, stringify(all, { header: true, columns: KNOWHOW_COLUMNS as string[] }), "utf8");
}

async function main() {
  const limit = Number(process.argv[2]) || 5;
  requireApiKey();

  const judged = judgedArticleIds();
  const targets = getAllArticles()
    .filter((a) => !a.draft && !judged.has(a.id))
    .slice(0, limit);

  if (targets.length === 0) {
    console.log("未判定の公開記事はありません。");
    return;
  }

  const client = new Anthropic();
  const rows: Knowhow[] = [];
  let adopted = 0;

  for (const article of targets) {
    // 候補レッスンまで絞ってから聞く。全14レッスンを毎回渡すとプロンプトが伸び、
    // 関係のないレッスンに無理やり紐づけた採用が出る。
    const lessons = candidateLessons(article);
    const allowed = new Set([...lessons.map((l) => `lesson:${l.slug}`), "tool:page-audit", "tool:list"]);
    try {
      const j = await judge(client, article, lessons.length > 0 ? lessons : LESSONS, allowed);
      rows.push({
        status: j.adopt ? "採用" : "却下",
        articleId: article.id,
        target: (j.adopt ? j.target! : "-") as Knowhow["target"],
        knowhow: j.adopt ? j.knowhow!.trim() : "",
        where: j.adopt ? (j.where ?? "") : "",
        reason: j.reason!.trim(),
        judged: today(),
      });
      if (j.adopt) {
        adopted++;
        console.log(`採用 /articles/${article.id} → ${j.target}\n     ${j.knowhow}`);
      } else {
        console.log(`却下 /articles/${article.id} ${article.title}\n     ${j.reason}`);
      }
    } catch (e) {
      // 判定できなかった記事は台帳に書かない（次回もう一度当たる）
      console.error(`判定に失敗 /articles/${article.id} ${article.title}: ${e}`);
    }
  }

  if (rows.length > 0) append(rows);
  console.log(`\n判定 ${rows.length}本 / 採用 ${adopted}本 / 却下 ${rows.length - adopted}本`);
  if (adopted > 0) {
    console.log(
      "採用分はレッスンページの「記事から取り入れたこと」に出る。\n" +
        "レッスン本文そのものに書き込んだら content/knowhow.csv の status を「反映済」に変える（二重に出さないため）。"
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
