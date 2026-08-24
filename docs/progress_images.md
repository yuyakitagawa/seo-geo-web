# 進捗: サイト全体の画像を増やす

「文章だけだと面白くない」への対応。写真素材を持たない前提で、
コード生成のビジュアルをサイト全体に行き渡らせる。

- [x] `src/lib/coverArt.ts`: 記事idから決定的にSVGキービジュアルを生成（6パターン×カテゴリ色）
      文字列で返す設計にして、`<img>` と OGP（satori）の両方から同じ絵を使う
- [x] `src/components/CoverArt.tsx`: data URI の `<img>` として表示
- [x] `ArticleCard`: カード上部（featuredは左半分）にキービジュアル。カテゴリバッジを画像上に重ねる
- [x] 記事ページ冒頭にキービジュアル（21:9）
- [x] `PageHeader`: 黒地ヘッダー＋右側にキービジュアル（記事一覧 / カテゴリ / タグ / ツール）
- [x] OGP画像を実PNGで生成（`src/app/opengraph-image.tsx` / `articles/[slug]/opengraph-image.tsx`）
      和文は Google Fonts から「その画像で使う文字だけ」を切り出して取得（500KB制限対策・失敗時は和文なしで続行）
- [x] `figures.tsx` に `FigureBars`（横棒グラフ・増減は中央0）と `FigureQuote`（引用パネル）を追加
- [x] 記事16本の図解を3〜4個に増やす（サブエージェント3本で実施）
- [x] `scripts/generate.ts`: 図解3〜4個必須＋新2種をプロンプトに追加
- [x] README 更新
- [x] about ページにもヘッダーを適用
- [x] `npm run typecheck && npm run build`（記事16本＋OGP画像16枚がプリレンダー成功。
      生成PNGは 1200x630 / 約115KB で和文が入っていることを確認）
- [x] 表示確認（トップ / 記事 / カテゴリ / ツール / about / OGP、ライト・ダーク・モバイル390px）

## 注意
- 記事MDXを編集したら dev サーバーを再起動する（content.ts がモジュールキャッシュを持つ）
- OGP画像のビルドにはネットワークが必要（Google Fontsのサブセット取得）。
  失敗しても `loadOgFont` が空配列を返して画像は生成される（和文が欠けるだけ）。
