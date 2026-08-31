# 進捗: 教科書レッスン13「ブランドをAIに覚えさせる」

AI検索は回答を組み立てる前に候補のブランドを決めている、という構造を扱う章を `/learn` に足す。
既存10レッスンが「取得されたあとに読まれるための作業」だったのに対し、
このレッスンは「そもそも候補に入るための作業」を担当する。

出典は、すでに記事 `content/articles/0009-chatgpt-brand-first-candidate-33x.mdx` で裏取り済みの
外部分析（Suganthan Mohanadasan / PPC Land）と、`src/lib/cases.ts` の GEO 論文（arXiv:2311.09735）のみ。
出典に無い数値・固有名詞は書かない（CLAUDE.md の方針）。景表法などの法令解釈には踏み込まない。

## 設計
- slug は `brand-entity`、order 11、レベル3（運用）。既存レッスンの採番は変えない
- 章の構成は「候補入りの構造 → 同一性 → 外部言及 → 引用材料 → 定点観測」の5節
- 教科書の締めくくりが `updates-risk` から `brand-entity` に移るので、両方の結びを書き換える

## ステップ
- [x] `src/lib/curriculum.ts`: 出典2件を `S` に追加、レッスン13を追記、COURSE のコピーを13レッスンに更新
- [x] `src/app/learn/brand-entity/page.tsx`: 本文5節
- [x] `src/components/lesson.tsx`: ハードコードしていた「10レッスン」を `LESSONS.length` に変更
- [x] `/learn`（読む順番の目安に1行追加）・`/seo`・`/geo`・`learn/structure` の「10レッスン」表記
- [x] `learn/updates-risk`: 締めの段落をレッスン13への引き渡しに変更
- [x] README 更新
- [x] `npm run typecheck && npm run build`
