// figma-plugin/code.js のトークン表と src/app/globals.css のズレを見張る。
//
// Figmaのデザインシステム（変数・スタイル）は figma-plugin/code.js を実行して作る。
// つまり同じ値がCSSとプラグインの2か所にある。CSS側だけ直すと、Figmaのライブラリが黙って古くなる
// （見た目の正がコードとデザインで食い違い、どちらが正しいか分からなくなる）。
// 値の正は globals.css。ここで機械的に突き合わせる。
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

const CSS = read("src/app/globals.css");
const PLUGIN = read("figma-plugin/code.js");

type ColorSpec = { alias?: string; hex?: string; alpha?: number };
type Tokens = {
  PALETTE: { name: string; hex: string }[];
  SEMANTIC: { name: string; light: ColorSpec; dark: ColorSpec }[];
  SHAPE: { name: string; value: number; css: string }[];
  ELEVATIONS: { name: string; y: number; radius: number; spread: number; alpha: number }[];
  TEXT_STYLES: { name: string; size: number; lineHeight: number }[];
};

/** code.js の tokens:start 〜 tokens:end をそのまま評価して表を取り出す */
function loadTokens(): Tokens {
  const start = PLUGIN.indexOf("// tokens:start");
  const end = PLUGIN.indexOf("// tokens:end");
  assert.ok(start !== -1 && end > start, "figma-plugin/code.js の tokens:start / tokens:end が見つからない");
  const block = PLUGIN.slice(start, end);
  const factory = new Function(`${block}; return { PALETTE, SEMANTIC, SHAPE, ELEVATIONS, TEXT_STYLES };`);
  return factory() as Tokens;
}

const tokens = loadTokens();

/** `{` から対応する `}` までを切り出す */
function section(marker: string): string {
  const head = CSS.indexOf(marker);
  assert.ok(head !== -1, `globals.css に ${marker} が無い`);
  let depth = 0;
  for (let i = head; i < CSS.length; i++) {
    if (CSS[i] === "{") depth++;
    if (CSS[i] === "}") {
      depth--;
      if (depth === 0) return CSS.slice(head, i);
    }
  }
  throw new Error(`${marker} の括弧が閉じていない`);
}

const THEME = section("@theme {");
const DARK = section("@media (prefers-color-scheme: dark) {");

function declaration(source: string, name: string): string {
  const match = source.match(new RegExp(`--${name}:\\s*([^;]+);`));
  assert.ok(match, `--${name} が見つからない`);
  return match[1].trim();
}

/** CSSの色の書き方を1つの形に正規化する。`var(--color-x)` / `#rrggbb` / `rgb(R G B / A)` */
function normalizeCss(value: string): string {
  const alias = value.match(/^var\(--color-([a-z-]+)\)$/);
  if (alias) return `alias:${alias[1]}`;

  const hex = value.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = hex[1];
    return `rgba:${parseInt(n.slice(0, 2), 16)},${parseInt(n.slice(2, 4), 16)},${parseInt(n.slice(4, 6), 16)},1`;
  }

  const rgb = value.match(/^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*(?:\/\s*([\d.]+)\s*)?\)$/);
  if (rgb) return `rgba:${rgb[1]},${rgb[2]},${rgb[3]},${rgb[4] ?? "1"}`;

  throw new Error(`色の書き方が想定外: ${value}`);
}

/** プラグイン側の指定を同じ形に正規化する */
function normalizeSpec(spec: ColorSpec): string {
  if (spec.alias) return `alias:${spec.alias}`;
  assert.ok(spec.hex, "hex も alias も無い指定がある");
  const n = spec.hex.replace("#", "");
  const alpha = typeof spec.alpha === "number" ? String(spec.alpha) : "1";
  return `rgba:${parseInt(n.slice(0, 2), 16)},${parseInt(n.slice(2, 4), 16)},${parseInt(n.slice(4, 6), 16)},${alpha}`;
}

/** rem / px の長さを px にする */
function toPx(value: string): number {
  const rem = value.match(/^([\d.]+)rem$/);
  if (rem) return Number(rem[1]) * 16;
  const px = value.match(/^([\d.]+)px$/);
  if (px) return Number(px[1]);
  throw new Error(`長さの書き方が想定外: ${value}`);
}

test("パレットの色がglobals.cssと一致する", () => {
  for (const token of tokens.PALETTE) {
    assert.equal(
      normalizeCss(declaration(THEME, `color-${token.name}`)),
      normalizeSpec({ hex: token.hex }),
      `--color-${token.name} がズレている`
    );
  }
});

test("セマンティックの色がライト・ダークともglobals.cssと一致する", () => {
  for (const token of tokens.SEMANTIC) {
    assert.equal(
      normalizeCss(declaration(THEME, `color-${token.name}`)),
      normalizeSpec(token.light),
      `--color-${token.name}（ライト）がズレている`
    );
    assert.equal(
      normalizeCss(declaration(DARK, `color-${token.name}`)),
      normalizeSpec(token.dark),
      `--color-${token.name}（ダーク）がズレている`
    );
  }
});

test("形・幅・極小文字のpx換算がglobals.cssと一致する", () => {
  for (const token of tokens.SHAPE) {
    assert.equal(
      toPx(declaration(THEME, token.name)),
      token.value,
      `--${token.name} がズレている`
    );
    // 早見表と変数の code syntax に出す名前も、CSSの変数名と一致させる
    assert.equal(token.css, `var(--${token.name})`, `${token.name} の css 表記がズレている`);
  }
});

test("影のオフセット・ぼかし・広がり・不透明度がglobals.cssと一致する", () => {
  for (const token of tokens.ELEVATIONS) {
    const value = declaration(THEME, token.name);
    const match = value.match(/^0\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+rgb\(0 0 0 \/ ([\d.]+)\)$/);
    assert.ok(match, `--${token.name} の書き方が想定外: ${value}`);
    assert.deepEqual(
      { y: Number(match[1]), radius: Number(match[2]), spread: Number(match[3]), alpha: Number(match[4]) },
      { y: token.y, radius: token.radius, spread: token.spread, alpha: token.alpha },
      `--${token.name} がズレている`
    );
  }
});

test("globals.cssにあるトークンをプラグインが取りこぼしていない", () => {
  // 増えたトークンに気づかないまま「Figmaに全部入っている」と思い込むのを防ぐ。
  // ここに挙げた接頭辞のトークンは、すべてプラグインの表に載っていなければならない。
  const covered = new Set<string>([
    ...tokens.PALETTE.map((t) => `color-${t.name}`),
    ...tokens.SEMANTIC.map((t) => `color-${t.name}`),
    ...tokens.SHAPE.map((t) => t.name),
    ...tokens.ELEVATIONS.map((t) => t.name)
  ]);

  const watched = /^(color|radius|container|text|shadow)-/;
  const declared = new Set<string>();
  for (const match of THEME.matchAll(/--([a-z0-9-]+):/g)) {
    if (watched.test(match[1])) declared.add(match[1]);
  }

  const missing = [...declared].filter((name) => !covered.has(name));
  assert.deepEqual(missing, [], `プラグインの表に無いトークン: ${missing.join(", ")}`);

  const extra = [...covered].filter((name) => !declared.has(name));
  assert.deepEqual(extra, [], `globals.css に無いトークンを表が持っている: ${extra.join(", ")}`);
});

test("テキストスタイルの行間が文字サイズを下回らない", () => {
  // 行間を詰めすぎると Figma 上で descender が切れる（画面で気づきにくい）。
  for (const style of tokens.TEXT_STYLES) {
    assert.ok(
      style.lineHeight >= style.size,
      `${style.name} の行間 ${style.lineHeight}px が文字サイズ ${style.size}px より小さい`
    );
  }
});
