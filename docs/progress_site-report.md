# 進捗: サイト診断書ツール（/tools/site-report）

URLを1つ入れると、サイト全体を数ページ取得して検査し、
`/learn#plan` の「直す候補が大量に出たときの並べ方」の型（優先度3段＋1件6項目）で
修正提案書として出すツール。社外向けの提案書を手で書いていた作業を、そのままツールにする。

## 既存ツールとの線引き
| | /tools/page-audit | /tools/site-report（新規） |
| --- | --- | --- |
| 入力 | 1ページのURL | サイトのURL（トップでも下層でも可） |
| 取得 | 1本＋robots.txt＋サイトマップ | 代表ページを最大8本＋robots.txt＋サイトマップ |
| 出力 | 指摘ごとに該当コード＋修正後コード | 指摘を**サイト横断で束ね**、3段の優先度と6項目で並べた提案書 |
| 判定 | `src/lib/audit.ts` | 同じ `audit()` の結果を `src/lib/siteReport.ts` が束ねる |
| 用途 | 1ページを直す | 何から着手するかを決める・社外に渡す |

## 決めたこと
- **判定ロジックは増やさない**。`audit.ts` の指摘をそのまま使い、siteReport.ts は
  「束ねる・順番を付ける・6項目に整形する」だけを持つ。判定が2か所に分かれると、片方だけ直る。
- **優先度は `/learn#plan` の3段をそのまま使う**（1段目=クロール資産の一本化／2段目=見え方／3段目=積み上げ）。
  基準は「影響の大きさ」ではなく「他の修正の前提になっているか」。教科書と実装がずれると嘘になるので、
  段の定義・期間・「1段目はまとめて入れてよい」も教科書と同じ文言にする。
- **Claude APIは使わない**（純関数のテンプレのみ）。1実行ごとのAPI費用を発生させない。
- **複数ページを取るので上限を固定する**：最大8ページ・同時4本・全体の期限45秒。
  期限に間に合った分だけで提案書を作り、「何本見たか」を結果に必ず出す。
- サイト単位でしか分からない指摘（title重複・canonicalのホスト混在・/index.html の重複・
  サイトマップに残る旧URL）は siteReport.ts が自分で出す。1ページ版には出せない指摘なので、これが新設の理由。

## ステップ
- [x] `src/lib/siteReport.ts`: 純関数（束ね・3段・6項目・サイト単位の指摘）
- [x] `src/lib/siteReport.test.ts`（＋収集の純関数 `src/lib/siteCrawl.ts` とそのテスト）
- [x] `api/site-report.ts`: ページ収集（sitemap優先・無ければ内部リンク）＋並列取得＋期限
- [x] `src/components/SiteReport.tsx` / `src/app/(ja)/tools/site-report/page.tsx`
- [x] 印刷CSS（`@media print`）でPDF保存できる体裁に
- [x] `src/lib/apps.ts`・`vercel.json`（maxDuration 60）・`/learn#plan` からの導線
- [x] README・`npm run typecheck && npm test && npm run lint && npm run verify:api && npm run build`

## 検証できていないこと
- **実サイトに対するエンドツーエンドの実行**。この作業環境のネットワークポリシーが外部ホストへの接続を拒否する
  （`seo-geo-lab.com:443` への CONNECT が 403）ため、`POST /api/site-report` を実物で通していない。
  純関数（`siteReport.ts` / `siteCrawl.ts`）はテストで網羅し、ページの静的出力とCSSはビルド成果物で確認した。
  本番（またはローカルの `vercel dev`）で1回は実行して、取得本数と所要時間を見ること。
