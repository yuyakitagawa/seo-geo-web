# 進捗: /learn 教科書カリキュラム（SEO・GEO 10レッスン）

「SEO対策とは」「GEOとは」（/seo, /geo）の下に、段階を追って学べる教科書を作る。
実例は Google 検索セントラルの成功事例・web.dev のケーススタディ・GEO論文だけを出典にし、
出典に無い数値・固有名詞は書かない（CLAUDE.md の方針）。

## 設計
- `/learn` … カリキュラム目次（3レベル×10レッスンのロードマップ）
- `/learn/<slug>` … 各レッスン。前後リンクと到達チェックリスト付き
- レベル1 基礎: starter-guide / first-week / search-intent
- レベル2 実装: technical / writing / structure / geo-implementation
- レベル3 運用: measurement / case-studies / updates-risk

## ステップ
- [x] 実例の一次情報を取得・URL到達確認（Google成功事例4件 / web.dev 5件 / arXiv GEO論文）
- [x] `src/lib/cases.ts`（検証済み事例データ。数値は出典どおり）
- [x] `src/lib/curriculum.ts`（レッスン定義・JSON-LD・前後関係）
- [x] `src/components/lesson.tsx`（レッスン共通UI: 到達目標・チェックリスト・事例カード・前後ナビ）
- [x] `/learn` 目次ページ
- [x] レベル1 3ページ
- [x] レベル2 4ページ
- [x] レベル3 3ページ
- [x] sitemap / Header / Footer / llms.txt / /seo / /geo の導線
- [x] README 更新
- [x] `npm run typecheck && npm run build`
