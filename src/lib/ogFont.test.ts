import assert from "node:assert/strict";
import { test } from "node:test";

import { iconFontOption } from "./icon";
import { ogFontOption } from "./og";

// next/og に `fonts: []` を渡すと「No fonts are loaded」で落ち、
// 静的エクスポートのビルドが丸ごと失敗する（2026-09-10、CIがGoogle Fontsに繋がらず発生）。
// フォントを取れなかったときは `fonts` ごと省き、next/og の既定フォントに戻す。
async function withFailingFetch<T>(fn: () => Promise<T>): Promise<T> {
  const real = globalThis.fetch;
  globalThis.fetch = () => Promise.reject(new Error("offline"));
  try {
    return await fn();
  } finally {
    globalThis.fetch = real;
  }
}

test("フォントを取得できないとき、アイコンは fonts を渡さない", async () => {
  const option = await withFailingFetch(() => iconFontOption());
  assert.deepEqual(option, {});
  assert.ok(!("fonts" in option), "空配列ではなくキーごと無いこと");
});

test("フォントを取得できないとき、OGP画像は fonts を渡さない", async () => {
  const option = await withFailingFetch(() => ogFontOption("見出し"));
  assert.deepEqual(option, {});
  assert.ok(!("fonts" in option), "空配列ではなくキーごと無いこと");
});
