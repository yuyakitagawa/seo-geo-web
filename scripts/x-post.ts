// 記事のX投稿文をClaudeに書かせる。毎朝のワークフローの通知ステップ（scripts/notify.ts）から呼ぶ。
// 自動投稿はしない。ここが作るのは「LINEに届いて、人がコピーして貼る文面」だけ。
// 1記事＝2通（本体ツイート＋記事URLのリプライ）。URLを本体に入れないのは、外部リンク付きの投稿がリーチで不利なため。
// APIキーが無い／生成が検査を通らないときは、テンプレの文面（src/lib/xpost.ts の templatePost）に落とす。
import Anthropic from "@anthropic-ai/sdk";
import { SITE_URL } from "../src/lib/site";
import { assemblePost, bodyBudget, replyPost, templatePost, weight } from "../src/lib/xpost";
import { MODEL } from "./article";

const MIN_BODY_WEIGHT = 80; // これより短い本文は「タイトルを言い換えただけ」になっている
const ATTEMPTS = 3;

// 全角換算の文字数。Xの重み付き文字数（半角1・全角2）をそのまま伝えても守れないので、
// プロンプトと差し戻しでは「全角◯字」に直して伝える。
function jp(w: number): number {
  return Math.floor(w / 2);
}

const HOOK_MAX = 38; // フック1行の全角字数
const LINE_MAX = 32; // 要点1行の全角字数

// 中身が無いまま行を埋めてしまう言い回し。これで終わる行は、読者が次に何をするか分からない。
const VAGUE = ["が鍵", "が重要", "が有効", "に注目", "が必要", "を意識", "がポイント", "を押さえ", "が求められ", "が不可欠", "を最適化", "が肝心", "に対応を", "が課題"];

const SYSTEM = `あなたは日本語のSEO/GEO専門メディアの中の人として、公開した記事をXで紹介します。
読者は事業会社・制作会社でSEO/GEOを担当している実務者です。抽象論はすぐ見抜かれます。
「そのページの、どこを、どう直すのか」まで書いてある投稿だけが読まれます。`;

/** 記事本文からJSX・記法を落として、要点を拾える程度の抜粋にする */
function excerpt(content: string, chars = 3500): string {
  return content
    .replace(/<Figure[A-Za-z]+[\s\S]*?\/>/g, "")
    .replace(/^#{2,}\s*/gm, "")
    .replace(/[*`>]/g, "")
    .trim()
    .slice(0, chars);
}

function prompt(data: Record<string, unknown>, content: string, budget: number): string {
  return `次の記事を紹介するXの投稿文を書いてください。

# 形
- 1行目: フック。全角${HOOK_MAX}字以内。記事を読んでいない人が、それだけで1つ知識を持ち帰れる事実を言い切る。
- 空行を1つ入れ、そのあとに要点を2〜3行。各行を「・」で始め、全角${LINE_MAX}字以内。
- 全体で全角${jp(budget)}字以内（半角は0.5字として数える）。字数を超えるくらいなら要点を1行減らす。

# 中身（ここが本題）
- **どの行にも、固有名詞・数値・具体的な操作対象のどれかを必ず入れる**。
  （例: 発表元の社名、機能名、タグ名、どのページ種別、いつから、何%）
- タイトルの言い換えを書かない。記事を読まないと分からない事実を選んで書く。
- 「〜が鍵」「〜が重要」「〜が有効」「〜に注目」で終わる行は書かない。何がどうなるのかを書く。
- 否定だけの行（「〜ではない」）は多くても1行まで。残りは「何をすればいいか」を書く。
- 記事に書いてある事実だけを使う。数値・機能名・社名を作らない。
- 数値は条件ごと写す。字数のために条件を落として言い切らない
  （記事が「レビュー1〜13件で53.5%」なら「レビュー1件で53.5%」と書かない）。

# 悪い例（この記事の場合）
・魔法のランキングスイッチではない ← 読者は何をすればいいか分からない
・店舗名や著者名の表記統一が鍵 ← 「鍵」で終わる行に中身はない
・一般記事より店舗/EC/著者ページで有効 ← 何が有効なのかが無い

# 良い例
・Googleは「ランキング要因ではない」と明言
・schemaのnameと実際の店舗名がズレると別の店として扱われる
・直す順番は店舗ページ→EC商品ページ→著者ページ

# その他の制約
- URL・ハッシュタグ・@アカウント名は書かない（機械が後ろに付ける）。絵文字も使わない。
- です・ます調。一文は短くする。「本記事では」「いかがでしたか」「注目が集まっています」は使わない。

# 記事
タイトル: ${data.title}
説明: ${data.description ?? ""}
本文:
${excerpt(content)}

投稿文の本文だけを出力してください。前置き・引用符・コードフェンスは付けないこと。`;
}

/**
 * 形式違反を検出する。差し戻しにそのまま貼るので、直し方まで書く。
 * hard は投稿できない致命的な違反、soft は中身の薄さ（最後の1回では通す。テンプレに落ちるより薄くても本文の方がまし）。
 */
function violations(body: string, budget: number): { hard: string[]; soft: string[] } {
  const hard: string[] = [];
  const soft: string[] = [];
  const lines = body.split("\n").filter((l) => l.trim());

  if (/https?:\/\//.test(body)) hard.push("URLを書かない");
  if (body.includes("#")) hard.push("ハッシュタグを書かない");
  if (body.includes("@")) hard.push("@アカウント名を書かない");
  if (weight(body) < MIN_BODY_WEIGHT) hard.push("短すぎる。要点の行を足す");
  for (const l of lines) {
    const max = l.startsWith("・") ? LINE_MAX : HOOK_MAX;
    if (weight(l) > max * 2) hard.push(`「${l.slice(0, 12)}…」の行が全角${jp(weight(l))}字。全角${max}字以内に縮める`);
  }
  if (weight(body) > budget) {
    hard.push(`全体が全角${jp(weight(body))}字。全角${jp(budget)}字以内に収める（要点を1行減らすか、各行を短くする）`);
  }

  for (const l of lines) {
    const vague = VAGUE.find((v) => l.includes(v));
    if (vague) soft.push(`「${l}」は「${vague}」で終わっていて中身がない。何がどうなるのかを書く`);
  }
  // 固有名詞・数値がまったく無い行は、たいてい一般論で埋めた行になっている。
  const bullets = lines.filter((l) => l.startsWith("・"));
  const concrete = bullets.filter((l) => /[0-9A-Za-z]|[ァ-ヶー]{3,}|「.+?」/.test(l));
  if (bullets.length && concrete.length < Math.min(2, bullets.length)) {
    soft.push("要点の行に固有名詞・数値・具体的な操作対象が入っていない。記事から具体名を拾って書き直す");
  }
  const negatives = lines.filter((l) => /(ではない|ありません|しません)。?$/.test(l));
  if (negatives.length > 1) soft.push("否定だけの行が2行以上ある。1行までにして、残りはやることを書く");

  return { hard, soft };
}

async function write(client: Anthropic, data: Record<string, unknown>, content: string, budget: number): Promise<string> {
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: prompt(data, content, budget) }];
  let last = "";
  let errors: string[] = [];
  // 形式・中身を外したときだけ、違反内容を添えて書き直させる。
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      output_config: { effort: "low" }, // 短文なので思考を深くする意味がない
      system: SYSTEM,
      messages,
    });
    if (res.stop_reason === "refusal") throw new Error(`refusal: ${res.stop_details?.explanation ?? ""}`);
    const body = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .at(-1)
      ?.text.trim()
      .replace(/^```[a-z]*\n([\s\S]*?)\n```$/m, "$1")
      .trim();
    if (!body) throw new Error("空の応答");
    const { hard, soft } = violations(body, budget);
    if (!hard.length && !soft.length) return body;
    last = body;
    errors = [...hard, ...soft];
    // 最後の1回で残ったのが中身の薄さだけなら、テンプレに落とすより本文を出す。
    if (attempt === ATTEMPTS && !hard.length) {
      console.error(`X投稿文に薄い行が残りました（${data.title}）: ${soft.join(" / ")}`);
      return body;
    }
    messages.push(
      { role: "assistant", content: body },
      { role: "user", content: `次の点を直して、投稿文の本文だけを出し直してください。\n${errors.map((e) => `- ${e}`).join("\n")}` }
    );
  }
  throw new Error(`形式を満たす投稿文が得られなかった（${errors.join(" / ")}）${last ? `\n最後の出力:\n${last}` : ""}`);
}

/**
 * 記事1本ぶんのX投稿。本体ツイートと、記事URLのリプライの2通を返す。
 * 失敗しても通知そのものは止めない（テンプレの文面を返す）。
 */
export async function xPost(data: Record<string, unknown>, content: string): Promise<{ post: string; reply: string }> {
  const reply = replyPost(`${SITE_URL}/articles/${data.id}`);
  const fallback = () => templatePost(String(data.title), String(data.description ?? ""), data.tags);
  if (!process.env.ANTHROPIC_API_KEY) return { post: fallback(), reply };
  try {
    const body = await write(new Anthropic(), data, content, bodyBudget(data.tags));
    return { post: assemblePost(body, data.tags), reply };
  } catch (e) {
    console.error(`X投稿文の生成に失敗したためテンプレを使います（${data.title}）: ${e}`);
    return { post: fallback(), reply };
  }
}
