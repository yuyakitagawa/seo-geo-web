// 教科書と記事のつなぎ（src/lib/lessonFeed.ts / knowhow.ts）が、静かに切れないことを検査する。
//
// このつなぎが切れても画面は壊れない。「記事から取り入れたこと」の節が消えるだけなので気づけない。
// topics の書き忘れ・全レッスンが同じ記事を拾う雑な語・台帳の壊れた行を、ここで落とす。
import assert from "node:assert/strict";
import test from "node:test";
import type { ArticleMeta } from "./content";
import { LESSONS } from "./curriculum";
import { indexableArticles } from "./indexability";
import { candidateLessons, lessonGaps, lessonKnowhow, matchesLesson } from "./lessonFeed";
import { KNOWHOW_STATUSES, getKnowhow, isKnowhowTarget, judgedArticleIds } from "./knowhow";

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
  for (const l of LESSONS) assert.ok(l.topics.length > 0, `${l.slug} に topics が無い`);
});

test("topics は大文字小文字を無視して一致する", () => {
  const l = lesson("geo-implementation");
  assert.ok(matchesLesson(l, fake({ title: "OpenAIがGPTBotの挙動を変更" })));
  assert.ok(matchesLesson(l, fake({ description: "ROBOTS.TXT の書き方が変わる" })));
  assert.ok(matchesLesson(l, fake({ tags: ["llms.txt"] })));
  assert.ok(!matchesLesson(l, fake({ title: "Googleが5月コアアップデートを完了" })));
});

test("1つのレッスンが記事の大半を候補にさらわない", () => {
  const total = indexableArticles().length;
  assert.ok(total > 0, "公開記事が1本も無い");
  for (const l of LESSONS) {
    const hits = indexableArticles().filter((a) => matchesLesson(l, a)).length;
    assert.ok(hits <= total * 0.6, `${l.slug} が記事の${Math.round((hits / total) * 100)}%を候補にしている。topics の語が広すぎる`);
  }
});

test("公開記事の過半はどこかのレッスンの候補になる", () => {
  const total = indexableArticles().length;
  const covered = indexableArticles().filter((a) => candidateLessons(a).length > 0).length;
  assert.ok(covered > total / 2, `候補になる記事が ${covered}/${total} 本しかない`);
});

// ここが本題。候補に挙がっただけの記事を教科書に出さないための線引き。
test("判定していない記事は、候補に一致してもレッスンに出ない", () => {
  const judged = judgedArticleIds();
  for (const l of LESSONS) {
    for (const k of lessonKnowhow(l, 99)) {
      assert.ok(judged.has(k.articleId), `/articles/${k.articleId} が台帳に無いのに ${l.slug} に出ている`);
      assert.ok(k.knowhow.trim() !== "", `/articles/${k.articleId} のノウハウが空のまま出ている`);
    }
  }
});

test("台帳の行はすべて実在する記事と反映先を指す", () => {
  const ids = new Set(indexableArticles().map((a) => a.id));
  for (const k of getKnowhow()) {
    assert.ok(KNOWHOW_STATUSES.includes(k.status), `不明な status: ${k.status}`);
    assert.ok(k.judged !== "", `/articles/${k.articleId} の判定日が空`);
    assert.ok(k.reason !== "", `/articles/${k.articleId} の理由が空（却下でも必ず書く）`);
    if (k.status === "却下") continue;
    assert.ok(ids.has(k.articleId), `存在しない記事を指している: ${k.articleId}`);
    assert.ok(isKnowhowTarget(k.target) && k.target !== "-", `反映先が不正: ${k.target}`);
  }
});

test("lessonKnowhow は新しい記事順で、上限を守る", () => {
  for (const l of LESSONS) {
    const list = lessonKnowhow(l, 3);
    assert.ok(list.length <= 3);
    for (let i = 1; i < list.length; i++) assert.ok(list[i - 1].article.date >= list[i].article.date, `${l.slug} の並びが日付順でない`);
  }
});

test("lessonGaps は全レッスンを返し、未判定が多い順に並ぶ", () => {
  const gaps = lessonGaps(judgedArticleIds());
  assert.equal(gaps.length, LESSONS.length);
  for (let i = 1; i < gaps.length; i++) assert.ok(gaps[i - 1].unjudged.length >= gaps[i].unjudged.length);
});
