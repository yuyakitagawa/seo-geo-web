import type { ArticleMeta } from "./content";
import { LESSONS, type Lesson } from "./curriculum";
import { indexableArticles } from "./indexability";

// 教科書（/learn）と、毎朝生成される記事をつなぐ唯一の場所。
//
// 教科書は手で書いたレッスン本文、記事は自動生成のフロー。放っておくと教科書だけが古くなる。
// ここでレッスンの `topics`（手がかり語）と記事の title / description / tags を突き合わせ、
// 「このレッスンの範囲で、その後に何が起きたか」をレッスンページに自動で載せる。
//
// **判定は語の一致だけ**で、記事がレッスンの記述を否定しているかどうかは分からない。
// 本文の書き換えが要るかは人が決める（`npm run learn-gap` が候補を出す）。

/** 記事側の検索対象。title / description / tags を1本の文字列にする */
function haystack(article: ArticleMeta): string {
  return [article.title, article.description, ...article.tags].join(" ").toLowerCase();
}

/** その記事がレッスンの範囲に入るか。topics のどれか1語でも含めば該当 */
export function matchesLesson(lesson: Lesson, article: ArticleMeta): boolean {
  const text = haystack(article);
  return lesson.topics.some((t) => text.includes(t.toLowerCase()));
}

/**
 * レッスンに該当する公開済み記事を新しい順に返す。
 * noindex の記事（薄いタグ・supersedes で置き換えられたもの）は indexableArticles() の時点で落ちる。
 */
export function lessonArticles(lesson: Lesson, limit = 4): ArticleMeta[] {
  return indexableArticles()
    .filter((a) => matchesLesson(lesson, a))
    .slice(0, limit);
}

/** レッスン本文の更新日より後に出た該当記事。教科書が追いついていない量 */
export function articlesSinceUpdate(lesson: Lesson): ArticleMeta[] {
  return indexableArticles().filter((a) => matchesLesson(lesson, a) && a.date > lesson.updated);
}

export type LessonGap = {
  lesson: Lesson;
  /** 該当記事の総数 */
  total: number;
  /** lesson.updated より後に出た該当記事 */
  since: ArticleMeta[];
};

/** 全レッスンの追随状況。since が多い順＝教科書を先に見直すべき順 */
export function lessonGaps(): LessonGap[] {
  return LESSONS.map((lesson) => ({
    lesson,
    total: indexableArticles().filter((a) => matchesLesson(lesson, a)).length,
    since: articlesSinceUpdate(lesson),
  })).sort((a, b) => b.since.length - a.since.length || a.lesson.order - b.lesson.order);
}
