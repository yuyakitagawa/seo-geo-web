# figma-plugin

`src/app/globals.css` のトークンを、Figmaの**変数・スタイル・コンポーネント**として流し込むローカルプラグイン。

MCP（Figmaのリモート実行）は同じ Plugin API のJSを外から流し込む仕組みで、**ツールコール数に上限がある**
（Starterプランでは数十回で止まる。実際に 2026-09-21 に上限に当たって作業が中断した）。
同じJSをローカルプラグインとして置けば、実行回数の制限は無くなる。

## 導入（4ステップ）

1. **Figmaデスクトップアプリ**を開く（ブラウザ版では開発用プラグインを読み込めない）
2. 対象ファイルを開く → メニュー **Plugins → Development → Import plugin from manifest…**
3. このディレクトリの `manifest.json` を選ぶ
4. **Plugins → Development → SEO GEO Lab Design System** で実行

2回目以降は `code.js` を保存して、Figmaでプラグインを再実行するだけ（再インポートは不要）。

## 作られるもの

| 種類 | 中身 |
|---|---|
| 変数コレクション `Palette` | ink / paper / accent / accent-ink / seo / geo / news（7） |
| 変数コレクション `Semantic (Light)` | canvas / fg / mute / surface / line / line-strong / fill / fill-strong / invert / invert-fg（10） |
| 変数コレクション `Semantic (Dark)` | 同じ10個のダーク値 |
| 変数コレクション `Shape & Size` | radius 2 / container 3 / 極小フォント 2（計7、px） |
| テキストスタイル | `display/lg` `heading/xl…sm` `body/lg` `body/md` `label/md` `eyebrow/sm` `badge/xs` `mono/xs`（11） |
| エフェクトスタイル | `shadow-lift` / `shadow-panel`（Figmaは影を変数にできないため） |
| コンポーネント | `Button`（accent / invert / onAccent / outline）/ `Chip` / `Badge`（SEO / GEO / ニュース）/ `Card` |
| フレーム `Design Tokens` | 上記の早見表 |

全変数に `var(--color-ink)` 形式の **WEB code syntax** を付けるので、Figma上からCSSの変数名が引ける。

## 前提と制約

- **無料プランは1コレクション1モードまで**（`addMode` が `Limited to 1 modes only` で落ちる）。
  そのためライトとダークは別コレクションに分けてある。Professional以上なら1コレクション2モードに統合できる
  （`buildSemantic` を書き換える）。
- **フォントはFigmaで使えるものを自動で選ぶ**。和文は Noto Sans JP → Hiragino Sans → Inter、
  欧文は Space Grotesk → Inter、等幅は Geist Mono → Roboto Mono → … の順。本番サイトは欧文 Space Grotesk・
  和文は端末フォントなので、Figma上の和文は**近似**（端末フォントはFigmaで再現できない）。
- 和文と欧文を1つのテキストノードで混ぜられないため、**和文の見出し・本文は和文フォント、
  英字の小さいラベル（eyebrow / label / badge）は欧文フォント**に割り当てている。

## 何度実行しても安全な作り

- 変数・テキストスタイル・エフェクトスタイルは**名前で引いて、あれば値を更新**する（重複を作らない）
- コンポーネントは**同名があれば触らない**（作り直すと配置済みインスタンスの参照が壊れるため）
- `Design Tokens` フレームだけは**毎回作り直す**（古い値の表が残らないように）

## 値を変えるとき

`code.js` の冒頭 `tokens:start` 〜 `tokens:end` にある表（`PALETTE` / `SEMANTIC` / `SHAPE` /
`ELEVATIONS` / `TEXT_STYLES`）だけを直す。**値の正は `src/app/globals.css` の `@theme`**。
CSSだけ直してここを忘れると、Figmaのライブラリが黙って古くなるので `src/lib/figmaTokens.test.ts` が落とす
（`npm test` で走る）。

## 検査

```bash
npm run figma:check   # Plugin API のモックで code.js を実際に実行する
npm test              # globals.css とトークン表のズレを検査（figmaTokens.test.ts）
```

`figma:check`（`smoke-test.mjs`）は Figma 無しで `code.js` を走らせ、以下を検出する:

- フォント未ロードのまま `characters` を書く
- auto-layout の子でないノードへの `layoutSizing* = FILL / HUG`
- 色を 0-255 で渡す / paint の `color` に `a` を混ぜる
- 知らない variable scope
- 期待する変数・スタイル・コンポーネントが作られない
- **2回実行しても増殖しない**（冪等性）

モックなので「Figmaで実際にどう見えるか」は分からない。**最終確認は実機で1回実行して目で見る。**
