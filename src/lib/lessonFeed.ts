import type { ArticleMeta } from "./content";
import { LESSONS, type Lesson } from "./curriculum";
import { indexableArticles } from "./indexability";
import { adoptedForLesson, type Knowhow } from "./knowhow";

// 教科書（/learn）と、毎朝生成される記事をつなぐ場所。
//
// つなぎ方は2段階に分かれている。混ぜないこと。
//
// 1. **候補を絞る**（ここの `matchesLesson`）… レッスンの `topics`（手がかり語）と記事の
//    title / description / tags を突き合わせるだけ。外部APIを使わない。
//    これは「どのレッスンの話か」の当たりをつけるためのもので、**採否ではない**。
// 2. **採否を決める**（`scripts/knowhow.ts` → `content/knowhow.csv`）… Claudeが1本ずつ
//    「教科書に組み込む価値があるか」を判定する。記事の大半は却下される。
//
// **レッスンページに出るのは2を通った行だけ**（`lessonKnowhow`）。1の結果は画面に出ない。
// 語が一致しただけの記事を並べると、単発の障害報告や「テスト開始」の記事まで教科書に載り、
// 教科書が記事一覧の劣化コピーになる。

/**
 * 教科書がつながる相手＝公開済み・インデックス対象の記事。
 * `draft` を明示的に落とす。`getAllArticles()` が下書きを外すのは NODE_ENV=production のときだけなので、
 * `npm run learn-gap` やテストでは下書きが混ざり、未判定の遅れや候補0本の判定が狂う。
 */
export function feedArticles(): ArticleMeta[] {
  return indexableArticles().filter((a) => !a.draft);
}

/** 記事側の検索対象。title / description / tags を1本の文字列にする */
function haystack(article: ArticleMeta): string {
  return [article.title, article.description, ...article.tags].join(" ").toLowerCase();
}

/** その記事がレッスンの範囲に入るか。topics のどれか1語でも含めば該当（**採否ではなく候補**） */
export function matchesLesson(lesson: Lesson, article: ArticleMeta): boolean {
  const text = haystack(article);
  return lesson.topics.some((t) => text.includes(t.toLowerCase()));
}

/** その記事の候補になるレッスン。scripts/knowhow.ts が判定対象をここまで絞ってから聞く */
export function candidateLessons(article: ArticleMeta): Lesson[] {
  return LESSONS.filter((l) => matchesLesson(l, article));
}

export type LessonKnowhow = Knowhow & { article: ArticleMeta };

/**
 * そのレッスンに組み込むと判定されたノウハウ。新しい記事から順に返す。
 * 出典の記事が noindex（薄いタグ・supersedes で置き換え済み）になっていたら落とす。
 */
export function lessonKnowhow(lesson: Lesson, limit = 4): LessonKnowhow[] {
  const byId = new Map(feedArticles().map((a) => [a.id, a] as const));
  const items: LessonKnowhow[] = [];
  for (const k of adoptedForLesson(lesson.slug)) {
    const article = byId.get(k.articleId);
    if (article) items.push({ ...k, article });
  }
  return items.sort((a, b) => b.article.date.localeCompare(a.article.date)).slice(0, limit);
}

export type LessonGap = {
  lesson: Lesson;
  /** 手がかり語が一致した記事の数（候補。採用数ではない） */
  candidates: number;
  /** 組み込むと判定されたノウハウ */
  adopted: number;
  /** lesson.updated より後に出た候補記事のうち、まだ判定していないもの */
  unjudged: ArticleMeta[];
};

/** 全レッスンの状況。未判定が多い順＝先に `npm run knowhow` を当てるべき順 */
export function lessonGaps(judged: Set<number>): LessonGap[] {
  const articles = feedArticles();
  return LESSONS.map((lesson) => {
    const hits = articles.filter((a) => matchesLesson(lesson, a));
    return {
      lesson,
      candidates: hits.length,
      adopted: adoptedForLesson(lesson.slug).length,
      unjudged: hits.filter((a) => !judged.has(a.id) && a.date > lesson.updated),
    };
  }).sort((a, b) => b.unjudged.length - a.unjudged.length || a.lesson.order - b.lesson.order);
}
