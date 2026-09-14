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

## リンク構造（2026-09-13 追記）
ディレクトリ構造に続けて、**オプション**でリンク構造も調べられるようにした。

### 決めたこと
- **既定はオフ**。チェックを入れたときだけ最大80ページをたどる。取得ページ数＝実行時間＝費用なので、
  増える実行を利用者が選んだときだけ起こす。`MAX_PAGES`=8 の設計はそのまま残る。
- **クロールしたページは `audit()` にかけない**。リンクを取るだけにして、判定は今までどおり8ページ。
  80ページ分の判定をすると、取得の待ち時間ではなくCPU時間で上限に当たる。
- **深さではなくページ数で制御する**。「5階層まで」だと、トップに100本リンクがあるサイトで
  2階層目だけで100ページ、3階層目で数千ページになり、実行時間が読めない。
- **打ち切ったら断定しない**。上限で止めた場合、その先にリンクがあったかは分からない。
  「どこからもリンクされていない」は候補として出し、`truncated` を結果に必ず載せる。
- **回数制限をこの実行だけ1分1回に絞る**（既定は2回）。
- ナビ・ヘッダー・フッター・サイドバーのリンクは「本文からの案内」に数えない。

### ステップ
- [x] `extractLinks` に `bodyInternal`（ナビ等の外のリンク）を足す
- [x] `src/lib/linkGraph.ts`（被リンク・クリック深度・孤立候補・リンク切れ）＋テスト8件
- [x] `siteCrawl.ts`: `CRAWL_MAX_PAGES` / `CRAWL_CONCURRENCY` / `CRAWL_DEADLINE_MS` / `AUDIT_DEADLINE_WITH_LINKS_MS` / `normalizeUrlKey`
- [x] `api/site-report.ts`: `links: true` のときだけ幅優先クロール。期限を前半（判定）と後半（クロール）で分ける
- [x] `siteReport.ts`: `linkGraphProposals()`（リンク切れは1段目、孤立・本文リンク無し・被リンク薄は3段目）
- [x] UI: チェックボックスと「リンク構造」セクション
- [x] FAQ・README・CLAUDE.md・apps.ts
