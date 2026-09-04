// 公開した記事をLINEに通知する。Xへの投稿文をそのまま送るので、
// LINEで長押し→コピー→Xに貼るだけで投稿できる（自動投稿はしない。文面は人が見てから出す）。
// 1記事＝2通（本体ツイート＋記事URLのリプライ）。投稿文はClaudeが記事本文を読んで書く（scripts/x-post.ts）。
// 実行: npx tsx scripts/notify.ts content/articles/0123-foo.mdx ...
// LINE_CHANNEL_ACCESS_TOKEN / LINE_USER_ID が無ければ黙って何もしない（未設定でもワークフローは壊さない）。
// ワークフローの失敗通知だけは npm ci が落ちた場合にも飛ばす必要があるため、そちらはyml側のcurlのまま。
import fs from "node:fs";
import matter from "gray-matter";
import { LINE_ENABLED, linePush } from "../src/lib/line";
import { X_HANDLE } from "../src/lib/site";
import { xPost } from "./x-post";

async function push(messages: string[]): Promise<boolean> {
  if (!LINE_ENABLED) {
    // 未設定でも文面は確認できるようにログに出す（ローカルでの文面確認もこれで足りる）。
    console.log("LINE_CHANNEL_ACCESS_TOKEN / LINE_USER_ID が未設定のため送信しません。文面:");
    console.log(messages.join("\n---\n"));
    return false;
  }
  // 5通を超えるぶんの分割は linePush 側が持っている。
  return linePush(messages);
}

async function main() {
  const files = process.argv.slice(2).filter((f) => /\.mdx?$/.test(f));
  if (!files.length) {
    console.log("通知する記事がありません");
    return;
  }
  const articles = files.map((f) => matter(fs.readFileSync(f, "utf8")));
  const posts = await Promise.all(articles.map((a) => xPost(a.data, a.content)));
  const headline = [
    `📝 記事を${articles.length}本公開しました${X_HANDLE ? `（${X_HANDLE} で投稿）` : ""}`,
    "",
    ...articles.map((a) => `・${a.data.title}`),
    "",
    "↓ 1記事につき2通届きます。1通目を投稿し、2通目のURLをその投稿へのリプライに貼ってください。",
  ].join("\n");
  if (await push([headline, ...posts.flatMap((p) => [p.post, p.reply])])) {
    console.log(`LINEに通知しました（${articles.length}本）`);
  }
}

// 通知の失敗で公開済みの記事を巻き戻す意味はないので、ここで握って正常終了する。
main().catch((e) => console.error(`LINE通知に失敗しました（本処理には影響しません）: ${e}`));
