# 進捗: サイト構成の整理（/category を廃止して /seo /geo /news に統合）

## 決めたこと
ナビは **SEO / GEO / ニュース / ツール** の4本のまま。
`/category/*` は `/seo` `/geo` に解説ページがある以上、同じ記事群を持つ一覧が2種類できて評価が分散するため廃止する。

| 旧 | 新 |
| --- | --- |
| `/category/seo` | `/seo`（解説＋SEO記事一覧） |
| `/category/geo` | `/geo`（解説＋GEO記事一覧） |
| `/category/news` | `/news`（記事アーカイブ） |
| `/articles` | `/news` |
| `/articles/<id>` | 変更なし |

## やったこと
- [x] 1. `categoryHref()` を `src/lib/site.ts` に追加し、カテゴリのリンクを1か所に集約
- [x] 2. `/news` を新設（新着12本＋公開月ごとの全記事アーカイブ）
- [x] 3. `src/components/CategoryArticles.tsx`（解説を上・ニュースを下）を `/seo` `/geo` に設置
- [x] 4. `src/app/category/` と `src/app/articles/page.tsx` を削除
- [x] 5. `next.config.ts` に308リダイレクト4本
- [x] 6. sitemap / llms.txt / Header / トップ / 記事のパンくず / 解説ページの関連リンクを張り替え
- [x] 7. README / CLAUDE.md 更新

## 検証（2026-08-30）
- [x] `npm run typecheck && npm run build && eslint` 通過
- [x] `.next/routes-manifest.json` に308リダイレクト4本を確認
- [x] ビルド出力に `/news` があり、`/category/*` `/articles`（一覧）が無いことを確認
- [x] `news.html`: 新着12本＋「2026年8月」「2026年7月」の月別アーカイブが出力されている
- [x] `geo.html`: 「GEO対策の解説」（1本）と「GEOの最新記事（17）」の2セクションを確認
- [x] sitemap から `/category/*` `/articles` が消え、`/news` が入っていることを確認

## 注意
- ローカルの `preview_start` は worktree ではなく元のリポジトリ側でdevサーバーを起動する。
  そのため検証はビルド成果物（`.next/server/app/*.html`、`routes-manifest.json`）で行った。
- 公開後、Search Console で `/category/*` の旧URLが308に変わっているかを確認する。
