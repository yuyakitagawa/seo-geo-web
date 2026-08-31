// 公開した記事をLINEに通知する。Xへの投稿文をそのまま1メッセージで送るので、
// LINEで長押し→コピー→Xに貼るだけで投稿できる（自動投稿はしない。文面は人が見てから出す）。
// 実行: npx tsx scripts/notify.ts content/articles/0123-foo.mdx ...
// LINE_CHANNEL_ACCESS_TOKEN / LINE_USER_ID が無ければ黙って何もしない（未設定でもワークフローは壊さない）。
// ワークフローの失敗通知だけは npm ci が落ちた場合にも飛ばす必要があるため、そちらはyml側のcurlのまま。
import fs from "node:fs";
import matter from "gray-matter";
import { LINE_ENABLED, linePush } from "../src/lib/line";
import { SITE_URL, X_HANDLE } from "../src/lib/site";

const X_LIMIT = 280; // Xの重み付き文字数。半角=1、日本語などの全角=2、URLは長さに関わらず23
const URL_WEIGHT = 23;

function weight(s: string): number {
  let w = 0;
  for (const c of s) w += c.codePointAt(0)! < 0x1100 ? 1 : 2;
  return w;
}

function hashtags(tags: unknown): string {
  if (!Array.isArray(tags)) return "";
  return tags
    .slice(0, 3)
    .map((t) => `#${String(t).replace(/[^\p{L}\p{N}_]/gu, "")}`)
    .filter((t) => t.length > 1)
    .join(" ");
}

/** Xの投稿文。タイトル・URL・タグを先に確保し、残り枠に収まるぶんだけ説明文を入れる */
function xPost(data: Record<string, unknown>): string {
  const title = String(data.title);
  const url = `${SITE_URL}/articles/${data.id}`;
  const tail = [url, hashtags(data.tags)].filter(Boolean).join("\n");
  // 本文は「タイトル + 空行 + 説明 + 空行 + tail」。空行4字ぶんを引いた残りが説明の枠。
  const room = X_LIMIT - weight(title) - (weight(tail) - weight(url) + URL_WEIGHT) - 4;
  let lead = String(data.description ?? "");
  if (weight(lead) > room) {
    let cut = "";
    for (const c of lead) {
      if (weight(cut) + weight(c) > room - 2) break; // 末尾の「…」の2字ぶんを残す
      cut += c;
    }
    lead = `${cut}…`;
  }
  if (weight(lead) < 20) lead = ""; // 数文字だけ載せても読めないので入れない
  return [title, lead, tail].filter(Boolean).join("\n\n");
}

async function push(messages: string[]): Promise<boolean> {
  if (!LINE_ENABLED) {
    // 未設定でも文面は確認できるようにログに出す（ローカルでの文面確認もこれで足りる）。
    console.log("LINE_CHANNEL_ACCESS_TOKEN / LINE_USER_ID が未設定のため送信しません。文面:");
    console.log(messages.join("\n---\n"));
    return false;
  }
  return linePush(messages);
}

async function main() {
  const files = process.argv.slice(2).filter((f) => /\.mdx?$/.test(f));
  if (!files.length) {
    console.log("通知する記事がありません");
    return;
  }
  const articles = files.map((f) => matter(fs.readFileSync(f, "utf8")).data);
  const headline = [
    `📝 記事を${articles.length}本公開しました${X_HANDLE ? `（${X_HANDLE} で投稿）` : ""}`,
    "",
    ...articles.map((a) => `・${a.title}`),
    "",
    "↓ 続くメッセージがXの投稿文です。長押しでコピーして貼り付けてください。",
  ].join("\n");
  if (await push([headline, ...articles.map(xPost)])) console.log(`LINEに通知しました（${articles.length}本）`);
}

// 通知の失敗で公開済みの記事を巻き戻す意味はないので、ここで握って正常終了する。
main().catch((e) => console.error(`LINE通知に失敗しました（本処理には影響しません）: ${e}`));
