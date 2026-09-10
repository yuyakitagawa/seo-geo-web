// 教科書（/learn）が記事に追いついているかを報告する（変更はしない）。
//
// ここが出すのは「まだ Claude に判定させていない候補記事」の数で、**採用すべき記事の数ではない**。
// 実際に組み込むかは `npm run knowhow` が1本ずつ判定し、大半は却下される（scripts/knowhow.ts）。
// 採用済みの行はレッスンページに出ているので、この表の「取り入れ済」に数える。
//
// 使い方: npm run learn-gap
import { LESSONS } from "../src/lib/curriculum";
import { lessonGaps } from "../src/lib/lessonFeed";
import { adoptedForTools, getKnowhow, judgedArticleIds } from "../src/lib/knowhow";

const judged = judgedArticleIds();
const gaps = lessonGaps(judged);
const ledger = getKnowhow();
const adopted = ledger.filter((k) => k.status === "採用").length;
const applied = ledger.filter((k) => k.status === "反映済").length;

console.log(
  `レッスン ${LESSONS.length}本 / 判定済みの記事 ${judged.size}本（採用 ${adopted} / 反映済 ${applied} / 却下 ${ledger.length - adopted - applied}）`
);

const pending = gaps.filter((g) => g.unjudged.length > 0);
if (pending.length > 0) {
  console.log("\n■ 本文の更新日より後に出た、未判定の候補記事（多い順）");
  for (const g of pending) {
    console.log(
      `\n  ${String(g.lesson.order).padStart(2, "0")} ${g.lesson.title}  更新 ${g.lesson.updated} / 取り入れ済 ${g.adopted}本 / 未判定 ${g.unjudged.length}本`
    );
    for (const a of g.unjudged.slice(0, 5)) console.log(`     ${a.date} /articles/${a.id} ${a.title}`);
    if (g.unjudged.length > 5) console.log(`     …ほか${g.unjudged.length - 5}本`);
  }
  console.log(`\n判定するには npm run knowhow -- <本数>。候補が多くても採用されるのは一部。`);
} else {
  console.log("\n未判定の候補記事はありません。");
}

const empty = gaps.filter((g) => g.candidates === 0);
if (empty.length > 0) {
  console.log("\n■ 候補記事が0本のレッスン（記事側の題材が足りない。content/howto-topics.csv の材料）");
  for (const g of empty) console.log(`  ${String(g.lesson.order).padStart(2, "0")} ${g.lesson.title}  topics: ${g.lesson.topics.join(" / ")}`);
}

const forTools = adoptedForTools();
if (forTools.length > 0) {
  console.log("\n■ ツール側への反映待ち（人がコード・tools.json を直す）");
  for (const k of forTools) console.log(`  ${k.target} ← /articles/${k.articleId}\n     ${k.knowhow}`);
}
