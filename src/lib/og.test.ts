// Google Fonts に繋がらなくても OGP 画像の生成（＝ next build）が落ちないことを検査する。
//
// 2026-09-11、PR #57 の Vercel プレビューで Google Fonts の fetch が失敗し、
// `fonts: []` を渡した /geo の opengraph-image が「No fonts are loaded」で落ちてビルドごと止まった。
// next/og は `fonts` を省いたときだけ同梱の Geist を使う（空配列は「フォントなし」と解される）。
import assert from "node:assert/strict";
import test from "node:test";
import { ImageResponse } from "next/og";
import { OG_SIZE, ogFontOption, ogFrame, pageOgImage } from "./og";

const realFetch = globalThis.fetch;
const failingFetch = (async () => {
  throw new TypeError("fetch failed");
}) as typeof fetch;

test("取得に失敗したら fonts を省き、同梱フォントで PNG を出す", async (t) => {
  let calls = 0;
  globalThis.fetch = (async (...args: Parameters<typeof fetch>) => {
    calls++;
    return failingFetch(...args);
  }) as typeof fetch;
  t.after(() => void (globalThis.fetch = realFetch));

  const option = await ogFontOption("GEO対策", { retryDelayMs: 0 });
  assert.deepEqual(option, {});
  assert.equal(calls, 3, "3回まで試す");

  const png = await new ImageResponse(ogFrame({ category: "geo", title: "GEO", footer: "x" }), { ...OG_SIZE, ...option }).arrayBuffer();
  assert.ok(png.byteLength > 0);
});

test("pageOgImage も取得失敗で落ちない", async (t) => {
  globalThis.fetch = failingFetch;
  t.after(() => void (globalThis.fetch = realFetch));

  // 既定の再試行間隔（1秒・2秒）を実際に待つ。本番と同じ経路で落ちないことを見る
  const res = await pageOgImage({ category: "geo", title: "GEO対策とは", footer: "定義" })();
  assert.ok((await res.arrayBuffer()).byteLength > 0);
});

test("一時的な失敗は再試行で取り戻す", async (t) => {
  let calls = 0;
  globalThis.fetch = (async (input: Parameters<typeof fetch>[0]) => {
    calls++;
    if (calls === 1) throw new TypeError("fetch failed");
    const url = String(input);
    if (url.startsWith("https://fonts.googleapis.com/")) return new Response("@font-face { src: url(https://fonts.gstatic.com/x.ttf) format('truetype'); }");
    return new Response(new Uint8Array([1, 2, 3]));
  }) as typeof fetch;
  t.after(() => void (globalThis.fetch = realFetch));

  const option = await ogFontOption("GEO", { retryDelayMs: 0 });
  assert.equal(option.fonts?.[0].name, "Noto Sans JP");
  assert.equal(option.fonts?.[0].data.byteLength, 3);
});
