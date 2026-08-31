# /tools/ai-crawlers の削除と page-audit への統合

## 背景
`/tools/ai-crawlers`（robots.txt を貼り付けて14種のクローラーの許可状況を判定）は、
判定ロジックが `/tools/page-audit` と重複していた（`src/lib/audit.ts` が同じ `CRAWLERS` × `check()` を実行し、
robots.txt はサーバー側で自動取得する）。
貼り付け式は page-audit より入力コストが高いうえ、売りにしていた「入力を送信しない」は
robots.txt が公開ファイルである以上、実質的な価値がない。

クローラー14種の一覧表と3方針の比較は、すでに `/learn/geo-implementation` が同じ `CRAWLERS` から描画している。
そのため page-audit に表を作り直すと三重の重複になる。資産は学習ページ側に集約する。

## 手順
- [x] 1. robots.txt ひな形（`PRESETS`）を `/learn/geo-implementation` に移設（`RobotsPresets` コンポーネント）
- [x] 2. `/tools/ai-crawlers` ページと `AiCrawlerChecker` を削除
- [x] 3. `next.config.ts` に 308 リダイレクト（→ `/tools/page-audit`）
- [x] 4. `apps.ts` / `nav.ts` / sitemap からエントリを削除
- [x] 5. 内部リンクの張り替え（glossary 5件・learn 4件・page-audit 1件）
- [x] 6. README.md / CLAUDE.md / crawlers.ts のコメント更新
- [x] 7. `npm run typecheck && npm run build`

## 残すもの
- `src/lib/crawlers.ts`（`audit.ts` と `/learn/geo-implementation` が使う）
- `src/lib/robots.ts`（`audit.ts` が使う）
