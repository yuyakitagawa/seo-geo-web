// 教科書と記事のつなぎ（src/lib/lessonFeed.ts）が、静かに切れないことを検査する。
//
// このつなぎが切れても画面は壊れない。「最新動向」の節が消えるだけなので気づけない。
// topics の書き忘れ・全レッスンが同じ記事を拾う雑な語・判定の取りこぼしを、ここで落とす。
import assert from "node:assert/strict";
import test from "node:test";
import type { ArticleMeta } from "./content";
import { LESSONS } from "./curriculum";
import { indexableArticles } from "./indexability";
import { lessonArticles, lessonGaps, matchesLesson } from "./lessonFeed";

const lesson = (slug: string) => {
  const l = LESSONS.find((x) => x.slug === slug);
  assert.ok(l, `レッスン ${slug} が無い`);
  return l;
};

const fake = (over: Partial<ArticleMeta>): ArticleMeta => ({
  id: 1,
  slug: "1",
  title: "",
  description: "",
  date: "2026-09-01",
  updated: "2026-09-01",
  category: "news",
  type: "news",
  tags: [],
  sources: [],
  actions: [],
  supersedes: [],
  draft: false,
  original: false,
  ...over,
});

test("全レッスンに topics がある", () => {
  for (const l of LESSONS) {
    assert.ok(l.topics.length > 0, `${l.slug} に topics が無い`);
  }
});

test("topics は大文字小文字を無視して一致する", () => {
  const l = lesson("geo-implementation");
  assert.ok(matchesLesson(l, fake({ title: "OpenAIがGPTBotの挙動を変更" })));
  assert.ok(matchesLesson(l, fake({ description: "ROBOTS.TXT の書き方が変わる" })));
  assert.ok(matchesLesson(l, fake({ tags: ["llms.txt"] })));
  assert.ok(!matchesLesson(l, fake({ title: "Googleが5月コアアップデートを完了" })));
});

test("1つのレッスンが記事の大半をさらわない", () => {
  const total = indexableArticles().length;
  assert.ok(total > 0, "公開記事が1本も無い");
  for (const l of LESSONS) {
    const hits = indexableArticles().filter((a) => matchesLesson(l, a)).length;
    assert.ok(hits <= total * 0.6, `${l.slug} が記事の${Math.round((hits / total) * 100)}%を拾っている。topics の語が広すぎる`);
  }
});

test("教科書全体としては公開記事の過半をどこかのレッスンに送れている", () => {
  const covered = indexableArticles().filter((a) => LESSONS.some((l) => matchesLesson(l, a))).length;
  const total = indexableArticles().length;
  assert.ok(covered > total / 2, `レッスンに紐づく記事が ${covered}/${total} 本しかない`);
});

test("lessonArticles は新しい順で、上限を守る", () => {
  for (const l of LESSONS) {
    const list = lessonArticles(l, 3);
    assert.ok(list.length <= 3);
    for (let i = 1; i < list.length; i++) assert.ok(list[i - 1].date >= list[i].date, `${l.slug} の並びが日付順でない`);
  }
});

test("lessonGaps は全レッスンを返し、更新後の記事が多い順に並ぶ", () => {
  const gaps = lessonGaps();
  assert.equal(gaps.length, LESSONS.length);
  for (let i = 1; i < gaps.length; i++) assert.ok(gaps[i - 1].since.length >= gaps[i].since.length);
});
