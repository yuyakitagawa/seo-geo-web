// 公開した記事のXへの投稿文を、人が読める場所に出す（自動投稿はしない。文面は人が見てから出す）。
// 1記事＝2つ（本体ツイート＋記事URLのリプライ）。文面はClaudeが記事本文を読んで書く（scripts/x-post.ts）。
// 出し先は2つあり、両方に出す:
//   - GitHub Actions の実行サマリ … GITHUB_STEP_SUMMARY があるとき。コードブロックなので押せばコピーできる
//   - LINE … LINE_CHANNEL_ACCESS_TOKEN / LINE_USER_ID があるとき（未設定なら何もしない）
// どちらも無い環境（手元での文面確認）では標準出力に出す。
// 実行: npx tsx scripts/notify.ts content/articles/0123-foo.mdx ...
// ワークフローの失敗通知だけは npm ci が落ちた場合にも飛ばす必要があるため、そちらはyml側のcurlのまま。
import fs from "node:fs";
import matter from "gray-matter";
import { LINE_ENABLED, linePush } from "../src/lib/line";
import { X_HANDLE } from "../src/lib/site";
import { xPost } from "./x-post";

type Post = { post: string; reply: string };

/**
 * GitHub Actions の実行サマリ（ワークフロー実行ページの本文）に投稿文を書く。
 * コードブロックにするのは、GitHubがコピーボタンを付けてくれてスマホからでも貼れるため。
 * Actions の外では GITHUB_STEP_SUMMARY が無いので false を返す。
 */
function writeStepSummary(titles: string[], posts: Post[]): boolean {
  const path = process.env.GITHUB_STEP_SUMMARY;
  if (!path) return false;

  const lines = [
    `## 記事を${titles.length}本公開しました`,
    "",
    `下の文面をそのまま${X_HANDLE ? ` ${X_HANDLE} ` : "X"}へ。**本体を投稿してから、リプライにURLを貼ってください**`,
    "（外部リンクを含む投稿はリーチが落ちるので、URLは本体に入れない）。",
    "",
  ];
  titles.forEach((title, i) => {
    lines.push(`### ${i + 1}. ${title}`, "", "本体", "", "```text", posts[i].post, "```", "", "リプライ", "", "```text", posts[i].reply, "```", "");
  });
  fs.appendFileSync(path, lines.join("\n"));
  return true;
}

async function main() {
  const files = process.argv.slice(2).filter((f) => /\.mdx?$/.test(f));
  if (!files.length) {
    console.log("通知する記事がありません");
    return;
  }
  const articles = files.map((f) => matter(fs.readFileSync(f, "utf8")));
  const titles = articles.map((a) => String(a.data.title));
  const posts = await Promise.all(articles.map((a) => xPost(a.data, a.content)));

  const summarized = writeStepSummary(titles, posts);
  if (summarized) console.log(`実行サマリに投稿文を出しました（${titles.length}本）`);

  const headline = [
    `📝 記事を${titles.length}本公開しました${X_HANDLE ? `（${X_HANDLE} で投稿）` : ""}`,
    "",
    ...titles.map((t) => `・${t}`),
    "",
    "↓ 1記事につき2通届きます。1通目を投稿し、2通目のURLをその投稿へのリプライに貼ってください。",
  ].join("\n");
  const messages = [headline, ...posts.flatMap((p) => [p.post, p.reply])];

  if (LINE_ENABLED) {
    // 5通を超えるぶんの分割は linePush 側が持っている。
    if (await linePush(messages)) console.log(`LINEに通知しました（${titles.length}本）`);
  } else if (!summarized) {
    // 出し先が1つも無いときだけ、手元で文面を確認できるように標準出力へ流す。
    console.log("LINE_CHANNEL_ACCESS_TOKEN / LINE_USER_ID が未設定のため送信しません。文面:");
    console.log(messages.join("\n---\n"));
  }
}

// 通知の失敗で公開済みの記事を巻き戻す意味はないので、ここで握って正常終了する。
main().catch((e) => console.error(`公開の通知に失敗しました（本処理には影響しません）: ${e}`));
