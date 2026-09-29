// インデックス判定の約束。ここがずれると「sitemap に載っているのに noindex」「独自記事が検索から消える」が
// 黙って起きる。
import assert from "node:assert/strict";
import test from "node:test";
import { getAllArticles } from "./content";
import { indexableArticles, indexableTags, isCurrentArticle, isIndexableArticle, isSummaryArticle } from "./indexability";

test("要約記事（news かつ original でない）だけが要約扱いになる", () => {
  assert.equal(isSummaryArticle({ type: "news", original: false }), true);
  assert.equal(isSummaryArticle({ type: "news", original: true }), false);
  assert.equal(isSummaryArticle({ type: "howto", original: false }), false);
  assert.equal(isSummaryArticle({ type: "howto", original: true }), false);
});

test("独自記事と HOW TO は、置き換えられていない限りインデックス対象", () => {
  for (const a of getAllArticles()) {
    if (a.original || a.type === "howto") {
      assert.equal(isIndexableArticle(a), isCurrentArticle(a), `/articles/${a.slug}`);
    }
  }
  const slugs = new Set(indexableArticles().map((a) => a.slug));
  const kept = getAllArticles().filter((a) => a.original || a.type === "howto");
  assert.ok(kept.some((a) => slugs.has(a.slug)), "独自記事・HOW TO が1本もインデックス対象に残っていない");
});

test("sitemap に載る記事に要約記事が混ざらない", () => {
  for (const a of indexableArticles()) {
    assert.equal(isSummaryArticle(a), false, `/articles/${a.slug} は要約記事なのに sitemap に載る`);
  }
});

test("インデックス対象のタグの本数は、インデックス対象の記事だけで数える", () => {
  const indexable = new Set(indexableArticles().map((a) => a.slug));
  for (const { tag, count } of indexableTags()) {
    const actual = getAllArticles().filter((a) => a.tags.includes(tag) && indexable.has(a.slug)).length;
    assert.equal(count, actual, `#${tag}`);
  }
});
