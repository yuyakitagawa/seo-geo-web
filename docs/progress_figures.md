# 進捗: 記事内の図解（まとめ画像・比較画像）

目的: 文章だけの記事にビジュアルを増やす。実画像ファイルではなくMDXコンポーネントで
「まとめ画像・比較画像」風の図解を描画する（自動生成パイプラインでもClaudeが出力できる。
ダークモード対応・テキストが残るのでSEO/GEOにも有利）。

- [x] `src/components/figures.tsx`: 図解コンポーネント4種
      （FigureCompare 比較 / FigureDoDont やる・やらない / FigureFlow ステップ / FigureStats 数字）
- [x] `articles/[slug]/page.tsx`: MDXRemote に components を渡す。
      next-mdx-remote v6 はデフォルト `blockJS: true` でJSX属性のJS式を除去するため
      `blockJS: false` を指定（記事はリポジトリ内の信頼済みコンテンツ。blockDangerousJS は有効のまま）
- [x] 既存記事16本に図解を追加（全記事に FigureDoDont。内容に応じて FigureCompare/Flow/Stats を追加。
      図の中身はすべて既存本文の言い換えのみ、新しい事実・数値は入れていない）
- [x] `scripts/generate.ts`: SYSTEM_PROMPT に図解の出力ルールを追加
- [x] `npm run typecheck && npm run build` が通る（全16記事プリレンダー成功）
- [x] dev サーバーで表示確認（記事1・9・11、ライト/ダーク）
      ※ content/*.mdx は content.ts のモジュールキャッシュに乗るため、記事編集後は dev サーバー再起動が必要
- [x] README.md 更新
