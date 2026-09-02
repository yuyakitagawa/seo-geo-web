// 記事のX投稿文をClaudeに書かせる。毎朝のワークフローの通知ステップ（scripts/notify.ts）から呼ぶ。
// 自動投稿はしない。ここが作るのは「LINEに届いて、人がコピーして貼る文面」だけ。
// 1記事につき本体ツイートとURLのリプライの2つを返す（外部リンクを本体に入れるとリーチが落ちるため）。
// APIキーが無い／生成が検査を通らないときは、テンプレの文面（src/lib/xpost.ts の templatePost）に落とす。
import Anthropic from "@anthropic-ai/sdk";
import { SITE_URL } from "../src/lib/site";
import { assemblePost, bodyBudget, replyPost, templatePost, weight } from "../src/lib/xpost";
import { MODEL } from "./article";

const MIN_BODY_WEIGHT = 60; // これより短い本文は「タイトルを言い換えただけ」になっている

const SYSTEM = `あなたは日本語のSEO/GEO専門メディアの中の人として、公開した記事をXで紹介します。
読者は事業会社・制作会社でSEO/GEOを担当している実務者です。記事を開く理由が1秒で分かる文面を書きます。`;

/** 記事本文からJSX・記法を落として、要点を拾える程度の抜粋にする */
function excerpt(content: string, chars = 2500): string {
  return content
    .replace(/<Figure[A-Za-z]+[\s\S]*?\/>/g, "")
    .replace(/^#{2,}\s*/gm, "")
    .replace(/[*`>]/g, "")
    .trim()
    .slice(0, chars);
}

// 全角換算の文字数。Xの重み付き文字数（半角1・全角2）をそのまま伝えても守れないので、
// プロンプトと差し戻しでは「全角◯字」に直して伝える。
function jp(w: number): number {
  return Math.floor(w / 2);
}

const HOOK_MAX = 32; // フック1行の全角字数
const LINE_MAX = 26; // 要点1行の全角字数

function prompt(data: Record<string, unknown>, content: string, budget: number): string {
  return `次の記事を紹介するXの投稿文を書いてください。

# 形式（守る）
- 1行目: フック。何が起きたか、または読者が何を得るかを1文で言い切る。全角${HOOK_MAX}字以内。疑問形の煽りにしない。
- 空行を1つ入れ、そのあとに要点を3〜4行。各行を「・」で始め、1行1トピック、全角${LINE_MAX}字以内にする。
- 全体で全角${jp(budget)}字以内（半角は0.5字として数える）。字数を超えるくらいなら要点を1行減らす。
- 記事に書いてある事実だけを使う。数値・機能名・社名を作らない。
- URL・ハッシュタグ・@アカウント名は書かない（機械が後ろに付ける）。絵文字も使わない。
- です・ます調。一文は短くする。「〜が重要です」「本記事では」「いかがでしたか」「注目が集まっています」は使わない。

# 記事
タイトル: ${data.title}
説明: ${data.description ?? ""}
本文:
${excerpt(content)}

投稿文の本文だけを出力してください。前置き・引用符・コードフェンスは付けないこと。`;
}

/** 形式違反を検出する。空配列なら合格。差し戻しにそのまま貼るので、直し方まで書く */
function violations(body: string, budget: number): string[] {
  const errors: string[] = [];
  if (/https?:\/\//.test(body)) errors.push("URLを書かない");
  if (body.includes("#")) errors.push("ハッシュタグを書かない");
  if (body.includes("@")) errors.push("@アカウント名を書かない");
  if (weight(body) < MIN_BODY_WEIGHT) errors.push("短すぎる。要点の行を足す");
  const lines = body.split("\n").filter((l) => l.trim());
  const long = lines.filter((l) => weight(l) > (l.startsWith("・") ? LINE_MAX : HOOK_MAX) * 2);
  for (const l of long) {
    const max = l.startsWith("・") ? LINE_MAX : HOOK_MAX;
    errors.push(`「${l.slice(0, 12)}…」の行が全角${jp(weight(l))}字。全角${max}字以内に縮める`);
  }
  if (weight(body) > budget) {
    errors.push(`全体が全角${jp(weight(body))}字。全角${jp(budget)}字以内に収める（要点を1行減らすか、各行を短くする）`);
  }
  return errors;
}

async function write(client: Anthropic, data: Record<string, unknown>, content: string, budget: number): Promise<string> {
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: prompt(data, content, budget) }];
  let errors: string[] = [];
  // 形式を外したときだけ、違反内容を添えて書き直させる（3回まで）。
  for (let attempt = 0; attempt < 3; attempt++) {
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
    errors = violations(body, budget);
    if (!errors.length) return body;
    messages.push(
      { role: "assistant", content: body },
      { role: "user", content: `次の点を直して、投稿文の本文だけを出し直してください。\n${errors.map((e) => `- ${e}`).join("\n")}` }
    );
  }
  throw new Error(`形式を満たす投稿文が得られなかった（${errors.join(" / ")}）`);
}

/** 1記事ぶんの投稿セット。post を投稿し、reply をその投稿への返信として続けて出す */
export type XPost = { post: string; reply: string };

/**
 * 記事1本ぶんのX投稿文。Claudeが本体ツイートの本文を書き、ハッシュタグとURLのリプライはこちらで付ける。
 * 失敗しても通知そのものは止めない（テンプレの文面を返す）。
 */
export async function xPost(data: Record<string, unknown>, content: string): Promise<XPost> {
  const reply = replyPost(`${SITE_URL}/articles/${data.id}`);
  const fallback = (): XPost => ({
    post: templatePost(String(data.title), String(data.description ?? ""), data.tags),
    reply,
  });
  if (!process.env.ANTHROPIC_API_KEY) return fallback();
  try {
    const body = await write(new Anthropic(), data, content, bodyBudget(data.tags));
    return { post: assemblePost(body, data.tags), reply };
  } catch (e) {
    console.error(`X投稿文の生成に失敗したためテンプレを使います（${data.title}）: ${e}`);
    return fallback();
  }
}
