// Xへの投稿文の組み立て。文面はClaudeが書く（scripts/x-post.ts）が、
// 文字数の勘定・URL・ハッシュタグの付け方はここに集約する（Claudeに文字数を数えさせない）。
// 外部リンクを含む投稿はリーチが落ちるので、本体ツイート（assemblePost）には本文だけを置き、
// 記事URLは本体にぶら下げるリプライ（replyPost）に回す。1記事＝2投稿で1セット。

export const X_LIMIT = 280; // Xの重み付き文字数。半角=1、日本語などの全角=2
const MAX_TAGS = 1; // ハッシュタグは今のXでは流入にほぼ効かない。付けても1つまで（多いとスパムに見える）

export function weight(s: string): number {
  let w = 0;
  for (const c of s) w += c.codePointAt(0)! < 0x1100 ? 1 : 2;
  return w;
}

/** frontmatter の tags からハッシュタグ行を作る（記号を落とし、1字だけのタグは捨てる） */
export function hashtags(tags: unknown): string {
  if (!Array.isArray(tags)) return "";
  return tags
    .slice(0, MAX_TAGS)
    .map((t) => `#${String(t).replace(/[^\p{L}\p{N}_]/gu, "")}`)
    .filter((t) => t.length > 1)
    .join(" ");
}

/** 本体ツイートの本文に使える重み。Claudeにはこの数値を上限として渡す */
export function bodyBudget(tags: unknown): number {
  const tagLine = hashtags(tags);
  // 本文 + 空行 + ハッシュタグ行。URLは本体に入れないので勘定に入らない。
  return X_LIMIT - (tagLine ? 2 + weight(tagLine) : 0);
}

/** 重みが budget に収まるまで末尾を落とす。落としたときだけ「…」を付ける */
export function truncate(s: string, budget: number): string {
  if (weight(s) <= budget) return s;
  let cut = "";
  for (const c of s) {
    if (weight(cut) + weight(c) > budget - 2) break; // 末尾の「…」の2字ぶんを残す
    cut += c;
  }
  return `${cut.trimEnd()}…`;
}

/** 本体ツイート。本文＋ハッシュタグだけで、URLは入れない（本文が枠を超えていたら詰める） */
export function assemblePost(body: string, tags: unknown): string {
  return [truncate(body.trim(), bodyBudget(tags)), hashtags(tags)].filter(Boolean).join("\n\n");
}

/** 本体ツイートにぶら下げるリプライ。記事URLはここに置く */
export function replyPost(url: string): string {
  return `全文はこちら\n${url}`;
}

/**
 * Claudeを使えないとき（APIキーが無い・生成に失敗した）の本体ツイート。
 * タイトルを先に確保し、残り枠に収まるぶんだけ description を入れる。
 */
export function templatePost(title: string, description: string, tags: unknown): string {
  const room = bodyBudget(tags) - weight(title) - 2;
  let lead = truncate(description, Math.max(room, 0));
  if (weight(lead) < 20) lead = ""; // 数文字だけ載せても読めないので入れない
  return assemblePost([title, lead].filter(Boolean).join("\n\n"), tags);
}
