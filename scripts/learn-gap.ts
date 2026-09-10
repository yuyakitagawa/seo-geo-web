// 教科書（/learn）が記事に追いついているかを報告する（変更はしない）。
//
// レッスン本文の更新日より後に出た該当記事が多いほど、そのレッスンは書き換えの検討が要る。
// 該当記事が0本のレッスンは、逆に記事側の題材が足りていない（content/howto-topics.csv の材料になる）。
// 判定は語の一致だけ（src/lib/lessonFeed.ts）。書き換えるかどうかは人が決める。
//
// 使い方: npm run learn-gap
import { LESSONS } from "../src/lib/curriculum";
import { lessonGaps } from "../src/lib/lessonFeed";

const gaps = lessonGaps();
const behind = gaps.filter((g) => g.since.length > 0);
const empty = gaps.filter((g) => g.total === 0);

console.log(`レッスン ${LESSONS.length}本 / 更新後の記事あり ${behind.length}本 / 該当記事なし ${empty.length}本`);

if (behind.length > 0) {
  console.log("\n■ 本文の更新日より後に出た記事（多い順）");
  for (const g of behind) {
    console.log(`\n  ${String(g.lesson.order).padStart(2, "0")} ${g.lesson.title}  更新 ${g.lesson.updated} / 該当 ${g.total}本 / 更新後 ${g.since.length}本`);
    for (const a of g.since.slice(0, 5)) console.log(`     ${a.date} /articles/${a.slug} ${a.title}`);
    if (g.since.length > 5) console.log(`     …ほか${g.since.length - 5}本`);
  }
}

if (empty.length > 0) {
  console.log("\n■ 該当記事が0本のレッスン（記事側の題材が足りない）");
  for (const g of empty) {
    console.log(`  ${String(g.lesson.order).padStart(2, "0")} ${g.lesson.title}  topics: ${g.lesson.topics.join(" / ")}`);
  }
}

console.log(
  "\n本文の記述と食い違う記事があればレッスンを直し、frontmatter ではなく src/lib/curriculum.ts の updated を進める。\n" +
    "食い違っていないなら何もしない（記事はレッスンページに自動で並ぶ）。"
);
