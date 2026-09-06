import assert from "node:assert/strict";
import test from "node:test";
import { parse } from "node-html-parser";
import { aiView, type AiViewRow } from "./aiView";

function view(body: string, over: { ldTypes?: string[]; metaDescription?: string } = {}) {
  const root = parse(`<html><body>${body}</body></html>`);
  const el = root.querySelector("body")!;
  return aiView({ body: el, text: el.text.replace(/\s+/g, " ").trim(), ldTypes: over.ldTypes ?? [], metaDescription: over.metaDescription ?? "" });
}
const row = (rows: AiViewRow[], label: string) => rows.find((r) => r.label.startsWith(label));

test("本文: 空のコンテナだけを返すページは、人が見る画面とAIが受け取るHTMLが別物だと出す", () => {
  const spa = row(view('<div id="root"></div>').rows, "本文");
  assert.equal(spa?.kind, "gap");
  assert.match(spa?.code ?? "", /id="root"/);
  const ssr = row(view("<main><p>" + "本文です。".repeat(20) + "</p></main>").rows, "本文");
  assert.equal(ssr?.kind, "same");
});

test("画像: alt が無い画像だけを差として数え、alt=\"\" の装飾は数えない", () => {
  const rows = view('<img src="/a.png" alt="図の説明"><img src="/b.png" alt=""><img src="/c.png">').rows;
  const img = row(rows, "画像の中の文字");
  assert.equal(img?.kind, "gap");
  assert.match(img?.ai ?? "", /1枚だけ文字で届く/);
  assert.match(img?.ai ?? "", /1枚は alt が無く/);
  assert.match(img?.code ?? "", /c\.png/);
  // 装飾だけなら差にしない
  assert.equal(row(view('<img src="/a.png" alt="説明"><img src="/b.png" alt="">').rows, "画像の中の文字")?.kind, "same");
});

test("noscript: 計測タグだけの noscript は本文として数えない", () => {
  assert.equal(row(view('<noscript><img src="https://example.com/pixel.gif" width="1" height="1"></noscript>').rows, "noscript"), undefined);
  const real = row(view("<noscript><p>このサイトはJavaScriptを有効にしてご覧ください。</p></noscript>").rows, "noscript");
  assert.equal(real?.kind, "extra");
});

test("画面に出ていない部分: 入れ子は外側だけ数える", () => {
  const long = "この節はタブを開くまで画面に出ない説明文です。";
  const rows = view(`<div hidden><div class="inner"><p>${long}</p></div></div>`).rows;
  const hidden = row(rows, "画面に出ていない部分");
  assert.equal(hidden?.kind, "extra");
  assert.match(hidden?.human ?? "", /1か所/);
});

test("構造化データと meta description は「画面に出ないがAIには届く」側に並べる", () => {
  const rows = view("<p>本文</p>", { ldTypes: ["Article", "Article", "BreadcrumbList"], metaDescription: "ページの要約です。" }).rows;
  assert.match(row(rows, "構造化データ")?.ai ?? "", /@type: Article, BreadcrumbList/);
  assert.equal(row(rows, "meta description")?.kind, "extra");
});
