import assert from "node:assert/strict";
import test from "node:test";
import { assemblePost, bodyBudget, hashtags, templatePost, truncate, weight, X_LIMIT } from "./xpost";

const URL = "https://seo-geo-lab.com/articles/123";
const TAGS = ["SEO", "GEO", "AI検索", "余分"];

test("全角は2字、半角は1字として数える", () => {
  assert.equal(weight("abc"), 3);
  assert.equal(weight("あいう"), 6);
});

test("ハッシュタグは3つまで。記号は落とし、1字だけのタグは捨てる", () => {
  assert.equal(hashtags(TAGS), "#SEO #GEO #AI検索");
  assert.equal(hashtags(["a b", "#"]), "#ab");
  assert.equal(hashtags(undefined), "");
});

test("本文の枠はURL23字ぶんとハッシュタグを引いた残り", () => {
  assert.equal(bodyBudget(URL, TAGS), X_LIMIT - 23 - (1 + weight("#SEO #GEO #AI検索")) - 2);
});

test("枠に収まる本文は詰めない", () => {
  assert.equal(truncate("あいう", 10), "あいう");
});

test("枠を超えた本文は末尾を落として「…」を付ける", () => {
  const cut = truncate("あ".repeat(20), 10);
  assert.ok(cut.endsWith("…"));
  assert.ok(weight(cut) <= 10);
});

test("組み立てた投稿文はXの上限に収まり、末尾がURLとハッシュタグになる", () => {
  const post = assemblePost("あ".repeat(300), URL, TAGS);
  assert.ok(weight(post) - weight(URL) + 23 <= X_LIMIT);
  assert.ok(post.endsWith(`${URL}\n#SEO #GEO #AI検索`));
});

test("テンプレは説明が枠に入らないときタイトルとURLだけにする", () => {
  const post = templatePost("あ".repeat(110), "説明".repeat(50), URL, TAGS);
  assert.equal(post.includes("説明"), false);
  assert.ok(weight(post) - weight(URL) + 23 <= X_LIMIT);
});
