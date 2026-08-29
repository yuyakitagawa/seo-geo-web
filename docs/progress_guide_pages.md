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
