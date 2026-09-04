import assert from "node:assert/strict";
import test from "node:test";
import { assemblePost, bodyBudget, hashtags, templatePost, truncate, weight, X_LIMIT } from "./xpost";

const TAGS = ["GEO", "AI検索", "余分"];

test("全角は2字、半角は1字として数える", () => {
  assert.equal(weight("abc"), 3);
  assert.equal(weight("あいう"), 6);
});

test("ハッシュタグは先頭1つだけ。記号は落とし、1字だけのタグは捨てる", () => {
  assert.equal(hashtags(TAGS), "#GEO");
  assert.equal(hashtags(["a b"]), "#ab");
  assert.equal(hashtags(["#"]), "");
  assert.equal(hashtags(undefined), "");
});

test("URLは本文に入らないので、枠はハッシュタグぶんだけ減る", () => {
  assert.equal(bodyBudget(TAGS), X_LIMIT - weight("#GEO") - 2);
  assert.equal(bodyBudget([]), X_LIMIT);
});

test("枠に収まる本文は詰めない", () => {
  assert.equal(truncate("あいう", 10), "あいう");
});

test("枠を超えた本文は末尾を落として「…」を付ける", () => {
  const cut = truncate("あ".repeat(20), 10);
  assert.ok(cut.endsWith("…"));
  assert.ok(weight(cut) <= 10);
});

test("組み立てた投稿文はXの上限に収まり、末尾がハッシュタグになる", () => {
  const post = assemblePost("あ".repeat(300), TAGS);
  assert.ok(weight(post) <= X_LIMIT);
  assert.ok(post.endsWith("\n\n#GEO"));
  assert.equal(post.includes("http"), false);
});

test("テンプレは説明が枠に入らないときタイトルだけにする", () => {
  const post = templatePost("あ".repeat(135), "説明".repeat(50), TAGS);
  assert.equal(post.includes("説明"), false);
  assert.ok(weight(post) <= X_LIMIT);
});
