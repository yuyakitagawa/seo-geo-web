import assert from "node:assert/strict";
import test from "node:test";
import { diagnoseQuoteReadiness, extractPageContentHtml, extractQuoteBlocks } from "./quoteReadiness";

test("HTMLを見出し単位に分割する", () => {
  const blocks = extractQuoteBlocks(`
    <h1>GEOとは何ですか</h1>
    <p>GEOとは、AI検索で情報を正確に扱いやすくする取り組みです。</p>
    <h4>必要な理由</h4>
    <p>AI検索の回答で参照される接点が増えるためです。</p>
    <h5>診断対象外</h5>
    <p>H5は診断しません。</p>
  `);
  assert.deepEqual(blocks.map((block) => [block.level, block.heading, block.paragraphs.length]), [
    [1, "GEOとは何ですか", 1],
    [4, "必要な理由", 1],
  ]);
});

test("MarkdownのH1〜H4だけを見出しとして扱う", () => {
  const blocks = extractQuoteBlocks("# H1\n本文です。\n\n#### H4\n本文です。\n\n##### H5\n対象外です。");
  assert.deepEqual(blocks.map((block) => [block.level, block.heading]), [[1, "H1"], [4, "H4"]]);
});

test("Markdownを見出し単位に分割する", () => {
  const blocks = extractQuoteBlocks("## 定義\n\nこれは本文です。\n\n### 条件\n条件の本文です。");
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].paragraphs[0], "これは本文です。");
});

test("前置きと文脈依存のある冒頭を弱いと判定する", () => {
  const result = diagnoseQuoteReadiness("## GEOのポイント\n\nこの記事ではGEOについて解説します。\n\nそのため、重要です。");
  assert.equal(result.blocks[0].verdict, "weak");
  assert.equal(result.blocks[0].checks.find((check) => check.id === "opening")?.status, "fail");
});

test("対象・結論・理由がまとまった文章を引用候補にする", () => {
  const result = diagnoseQuoteReadiness("## 引用しやすい文章とは\n\n引用しやすい文章とは、対象と結論が一つの段落で完結している文章です。前後の文脈から切り離しても意味が変わらないため、回答の根拠として扱いやすくなります。");
  assert.equal(result.blocks[0].verdict, "ready");
  assert.equal(result.blocks[0].checks.find((check) => check.id === "claim")?.status, "pass");
  assert.equal(result.blocks[0].checks.find((check) => check.id === "reason")?.status, "pass");
});

test("URL取得HTMLでは記事本文を優先する", () => {
  const html = extractPageContentHtml(`
    <nav><h2>メニュー</h2><p>診断対象外です。</p></nav>
    <article><h2>記事の見出し</h2><p>記事の本文です。</p></article>
    <footer><h2>関連情報</h2><p>診断対象外です。</p></footer>
  `);
  assert.deepEqual(extractQuoteBlocks(html).map((block) => block.heading), ["記事の見出し"]);
});

test("本文のない見出しを弱いと判定する", () => {
  const result = diagnoseQuoteReadiness("## 本文なし");
  assert.equal(result.blocks[0].verdict, "weak");
  assert.equal(result.blocks[0].candidate, "");
});

test("小見出しをまとめる空の親見出しは診断対象から外す", () => {
  const result = diagnoseQuoteReadiness(`
    <h2>基本情報</h2>
    <h3>料金</h3><p>料金は月額1,000円です。</p>
  `);
  assert.deepEqual(result.blocks.map((block) => block.heading), ["料金"]);
});

test("40文字未満の簡潔な回答だけを理由に切り出しにくいとは判定しない", () => {
  const result = diagnoseQuoteReadiness("## 料金\n\n料金は月額1,000円です。");
  assert.notEqual(result.blocks[0].verdict, "weak");
  assert.notEqual(result.blocks[0].checks.find((check) => check.id === "length")?.status, "fail");
});
