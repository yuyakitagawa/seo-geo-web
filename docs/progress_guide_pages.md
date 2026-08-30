# 進捗: SEO対策 / GEO の説明ページ（/seo, /geo）

## 背景
記事はすべてニュース（フロー）で、「SEO対策とは」「GEOとは」という定義クエリに答えるページが無い。
GoogleのAI機能・ChatGPT・Perplexityは「質問に直答する短いパッセージ＋一次情報」を引用元に選ぶため、
定義・比較表・手順・FAQを1ページに固めた解説ページを2本置く。

※ HOW TO記事（`type: howto`）の追加は別セッション（docs/progress_howto.md）。記事側には触らない。

## 設計
- URL: `/seo`（SEO対策とは） / `/geo`（GEOとは）。カテゴリ一覧 `/category/seo` とは別ページ。
- データ（定義文・要点・FAQ・出典・更新日）は `src/lib/guides.ts` に集約し、
  ページ本文・JSON-LD・llms.txt が同じ文字列を使う（可視テキストと構造化データがずれない）。
- JSON-LD: Article + about(DefinedTerm) + citation(一次情報URL) / FAQPage / BreadcrumbList。
- 事実はすべて一次情報で裏取り（Google検索セントラル、OpenAI、Perplexity、Anthropic、arXiv、web.dev）。

## やること
- [x] 1. `src/lib/guides.ts`（定義・要点・FAQ・出典・JSON-LD）
- [x] 2. `src/components/guide.tsx`（目次・セクション・定義パネル・FAQ・出典・引用ブロック）
- [x] 3. `/seo` ページ
- [x] 4. `/geo` ページ
- [x] 5. sitemap / llms.txt / フッター / トップページから導線
- [x] 6. README 更新

## 検証
- [x] `npm run typecheck && npm run build`

## 追記（2026-08-30）: /geo に「Botの種類・動き・役割」を追加
- [x] `/geo` に `#bots` セクション。Botを役割で4種類（検索インデックス用／AI検索インデックス用／ユーザー起点フェッチャー／モデル学習用）に分け、
      巡回の仕方・robots.txtの効き方・拒否したときに失うものを図＋表で整理。回答が返るまでにどのBotが動くかを `FigurePipeline` で図解。
      名乗りは自己申告なのでIPレンジ（各社公開のJSON）で検証すること、広告・エージェント用の特殊Bot（OAI-AdsBot / Google-CloudVertexBot）も追記。
- [x] `src/lib/guides.ts`: FAQに「AIのBot（クローラー）には何種類ありますか」を追加（FAQPage JSON-LDにも反映）
- [x] 出典URLの更新（移転先へ）: OpenAI → developers.openai.com、Anthropic → support.claude.com、
      Googleのクローラー関連 → developers.google.com/crawling/docs/…（`src/lib/crawlers.ts` / `src/lib/robots.ts` も同様に更新）
- [x] `src/components/figures.tsx`: `FigureCompare` は4カラム時も2列（本文幅 max-w-3xl では4列だと1列157pxで読めない）
- [x] `npm run typecheck` / `npm run build`（devサーバー稼働中のため作業コピーで実行）
- [x] `/seo` にも `#bots`「検索Botの種類と動き」を追加。Googleの3分類（一般的なクローラー／特殊なケース用／ユーザー トリガー フェッチャー）、
      主要トークン別の役割と拒否したときの影響、クロールとレンダリングが別タイミングであること、robots.txt拒否でもURLがインデックスされ得ること、
      偽Googlebotの確認手順（逆引きDNS＋IPレンジ）。AI側のBotは `/geo#bots` へリンク。FAQと出典も追加。
