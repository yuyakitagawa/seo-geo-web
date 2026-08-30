// 同じ話題を扱っている可能性のある記事を報告する（変更はしない）。
//
// 続報が前の記事を置き換えたときは、新しい記事の frontmatter に `supersedes: <古い記事のid>` を書く。
// 指定された記事は noindex, follow ＋ sitemap 除外になり、本文の冒頭から最新版へ送られる
// （判定は src/lib/indexability.ts）。このスクリプトはその指定漏れに気づくためのもの。
//
// **判定結果をそのままインデックス対象の足切りに使わないこと。** sameTopic() は RSS の見出し重複を
// 弾くための基準で、記事タイトルに当てると別の出来事を同一視する（実測: 「Google画像検索25周年」と
// 「トップページのボタンをAI Modeに置き換えるテスト」が共有語 google/ai/mode/検索 だけで一致した）。
// 出るのはあくまで「人が確認する候補」。
//
// 使い方: npm run dupes
import { getAllArticles } from "../src/lib/content";
import { sameTopic, tokens } from "../src/lib/topic";

const articles = getAllArticles().filter((a) => a.type === "news");
const clusters: { head: (typeof articles)[number]; tokens: Set<string>; members: typeof articles }[] = [];

// getAllArticles() は新しい順。先に見たものがその話題の最新版になる。
for (const article of articles) {
  const t = tokens(article.title);
  const hit = clusters.find((c) => sameTopic(c.tokens, t));
  if (hit) hit.members.push(article);
  else clusters.push({ head: article, tokens: t, members: [] });
}

const found = clusters.filter((c) => c.members.length > 0);
const supersededIds = new Set(articles.flatMap((a) => a.supersedes));

console.log(`news記事 ${articles.length}本 / supersedes 指定済み ${supersededIds.size}本`);
if (found.length === 0) {
  console.log("類似の候補はありません。");
} else {
  for (const c of found) {
    console.log(`\n■ 最新: ${c.head.slug} ${c.head.date} ${c.head.title}`);
    for (const m of c.members) {
      const mark = supersededIds.has(m.id) ? "指定済み" : "未指定  ";
      console.log(`  ${mark} └ ${m.slug} ${m.date} ${m.title}`);
    }
  }
  console.log(
    `\n別の出来事なら何もしない。続報で置き換わっているなら、最新記事の frontmatter に supersedes: <古い記事のid> を書く。`
  );
}
