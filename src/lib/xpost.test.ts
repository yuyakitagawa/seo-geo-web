import assert from "node:assert/strict";
import test from "node:test";
import { assemblePost, bodyBudget, hashtags, replyPost, templatePost, truncate, weight, X_LIMIT } from "./xpost";

const URL = "https://seo-geo-lab.com/articles/123";
const TAGS = ["SEO", "GEO", "AI検索", "余分"];

test("全角は2字、半角は1字として数える", () => {
  assert.equal(weight("abc"), 3);
  assert.equal(weight("あいう"), 6);
});

test("ハッシュタグは1つまで。記号は落とし、1字だけのタグは捨てる", () => {
  assert.equal(hashtags(TAGS), "#SEO");
  assert.equal(hashtags(["a b"]), "#ab");
  assert.equal(hashtags(["#"]), "");
  assert.equal(hashtags(undefined), "");
});

test("本文の枠はハッシュタグ行を引いた残り。URLは本体に入らないので引かない", () => {
  assert.equal(bodyBudget(TAGS), X_LIMIT - 2 - weight("#SEO"));
  assert.equal(bodyBudget(undefined), X_LIMIT);
});

test("枠に収まる本文は詰めない", () => {
  assert.equal(truncate("あいう", 10), "あいう");
});

test("枠を超えた本文は末尾を落として「…」を付ける", () => {
  const cut = truncate("あ".repeat(20), 10);
  assert.ok(cut.endsWith("…"));
  assert.ok(weight(cut) <= 10);
});

test("本体ツイートはXの上限に収まり、URLを含まずハッシュタグで終わる", () => {
  const post = assemblePost("あ".repeat(300), TAGS);
  assert.ok(weight(post) <= X_LIMIT);
  assert.equal(post.includes("http"), false);
  assert.ok(post.endsWith("\n\n#SEO"));
});

test("リプライは記事URLを載せ、上限に収まる", () => {
  const reply = replyPost(URL);
  assert.ok(reply.includes(URL));
  assert.ok(weight(reply) - weight(URL) + 23 <= X_LIMIT);
});

test("テンプレは説明が枠に入らないときタイトルだけにする", () => {
  const post = templatePost("あ".repeat(140), "説明".repeat(50), TAGS);
  assert.equal(post.includes("説明"), false);
  assert.ok(weight(post) <= X_LIMIT);
});
