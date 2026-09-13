# 進捗: サイト修正提案書にディレクトリ構造を足す

`/tools/site-report` に、URLの並びから分かるディレクトリ構造の診断を足す。

## 決めたこと
- **1本も追加で取得しない**。サイトマップのURL一覧は既に取得済みなので、その文字列を数えるだけにする。
  何千本あっても実行時間と費用は変わらない（`MAX_PAGES`=8 の設計を崩さない）。
- **リンク構造は出さない**。「どのページがどこからリンクされているか」「孤立ページ」「クリック深度」は
  全ページのHTMLが要る。8ページの上限と両立しないので、**できないことをFAQに明記する**（期待させない）。
- 事実（`siteStructure.ts`）と提案文（`siteReport.ts` の `structureProposals()`）を分ける。既存の
  「判定は audit.ts、整形は siteReport.ts」と同じ切り方。
- **サイトマップから20本以上取れたときだけ**数える（`MIN_URLS`）。内部リンク由来の数十本では形が出ない。
- 役割が重なる第1階層（`/blog/` と `/column/`）は**語だけで見ている**ので断定しない。提案文に
  「中身が別物のこともある」と書き、確かめる手順を添える。

## ステップ
- [x] `src/lib/siteStructure.ts`（深さの分布・第1階層・深い枝・働いていない中間階層・重なる第1階層）
- [x] `src/lib/siteStructure.test.ts`（8件）
- [x] `siteReport.ts`: `sourceUrls` を受け取り、`structure` を返し、3段目の提案を3種作る
- [x] `api/site-report.ts`: 収集したURL一覧を渡す（取得はしない）
- [x] `src/components/SiteReport.tsx`: 「URLの構造」セクション（合否は出さない）
- [x] `/tools/site-report` のFAQに「ディレクトリ構造は見る／リンク構造は見ない」を明記
- [x] README・CLAUDE.md・apps.ts
- [x] `npm run typecheck && npm test && npm run lint && npm run verify:api && npm run build`
