import { test } from "node:test";
import assert from "node:assert/strict";
import { extractMdx } from "./mdxResponse";

const MDX = `---
title: "canonicalの指定方法"
date: "2026-09-18"
category: "seo"
---

## 結論

canonical は rel="canonical" で指定する。
`;

test("frontmatterから始まる応答はそのまま返す", () => {
  assert.equal(extractMdx([MDX]), MDX.trim());
});

// 2026-09-18 の生成失敗。最後のブロックの中で frontmatter の前に前置きが付いていた。
test("frontmatterの前の前置きを捨てる", () => {
  const text = `すべて確認できました。最終版を出力します。\n\n${MDX}`;
  assert.equal(extractMdx([text]), MDX.trim());
});

// 2026-09-17・09-19 の生成失敗。最後のブロックが独り言だけで、MDXは手前にあった。
test("最後のブロックが独り言のときは手前のMDXを拾う", () => {
  const texts = [MDX, "Now fix the remaining long sentences."];
  assert.equal(extractMdx(texts), MDX.trim());
});

test("frontmatterを持つブロックが複数あるときは最後（＝改稿後）を採る", () => {
  const revised = MDX.replace("canonicalの指定方法", "canonicalの指定方法と別URLが選ばれるとき");
  assert.equal(extractMdx([MDX, revised]), revised.trim());
});

test("前置きの水平線を frontmatter と誤認しない", () => {
  const text = `検討した点を先に書きます。\n\n---\n\n以上です。では最終版。\n\n${MDX}`;
  assert.equal(extractMdx([text]), MDX.trim());
});

test("コードフェンスで囲まれていても外す", () => {
  assert.equal(extractMdx(["```mdx\n" + MDX.trim() + "\n```"]), MDX.trim());
});

test("frontmatterが無ければ最後の非空ブロックを返す（FETCH_FAILEDの判定を後段に残す）", () => {
  assert.equal(extractMdx(["前置き", "FETCH_FAILED"]), "FETCH_FAILED");
  assert.equal(extractMdx(["", "  "]), "");
  assert.equal(extractMdx([]), "");
});

test("title と date の両方が無いブロックは frontmatter と見なさない", () => {
  const noDate = `---\ntitle: "題だけ"\n---\n\n本文。\n`;
  assert.equal(extractMdx([noDate]), noDate.trim());
});
