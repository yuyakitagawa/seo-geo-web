@AGENTS.md
# seo-geo-web

SEOとGEO（AIO/LLMOを包含。用語はGEOに統一）の最新情報と実務ノウハウをAIで発信するメディア。収益はAdSense。
**業務委託・問い合わせ導線はPVが十分に伸びるまで設計に入れない**（運営者方針）。

## 0. AI Handling Rules
- **Token Saving**: 解説は最小限。実行結果と修正コードを即提示。
- **Next.js 16**: APIが学習データと異なる。`node_modules/next/dist/docs/` を先に読む。`params` は Promise、`PageProps<'/path'>` はグローバル型。
- **外部サービスは勝手に作らない**: GitHubリポジトリ・Vercel・Supabase・AdSense等はユーザーが作成する。必要になったら明示して依頼する。
- **記事の事実は一次情報で裏取り**: frontmatter `sources` に必ず出典URL。元記事に無い数値・固有名詞を書かない。

## 1. File Map
- `content/articles/NNNN-slug.mdx`: 記事本体。URLは frontmatter の `id`（連番）で `/articles/<id>`。ファイル名の番号は人間用で、URLには使わない。frontmatter: id/title/description/date/category/tags/impact/audience/actions/sources/draft。`draft: true` は本番ビルドから除外。
- `content/candidates.csv`: 収集候補リスト（status 候補/採用/却下/公開、話題スコア、メモ）。collect が追記、人が採用/却下、generate が「採用」だけ記事化。コミット対象。
- `content/tools.json`: /tools のデータ。公式ページを確認したツールだけ載せる（verified 日付必須）。候補リストの「ツール検知」を確認してから追記。
- `src/lib/site.ts`: サイト名・URL・カテゴリ定義。`src/lib/content.ts`: MDX読み込み・関連記事。`src/lib/adsense.ts`: 広告設定。
- `src/app/`: ルート。`articles/[slug]`, `category/[category]`, `tag/[tag]`, `about`, `privacy`, `disclaimer`, `sitemap.ts`, `robots.ts`, `feed.xml`, `llms.txt`, `ads.txt`。
- `scripts/sources.ts`: 収集元RSS一覧。`scripts/collect.ts`: RSS巡回→candidates.csv（スコア・重複排除・Google News URL復号）。`scripts/generate.ts`: Claude(`claude-opus-5` + web_fetch)で下書きMDX生成。
- `.github/workflows/daily-articles.yml`: 毎朝7時JSTに collect→generate→PR。

## 2. Operations
- 開発: `npm run dev` / 型: `npm run typecheck` / ビルド: `npm run build`
- 収集: `npm run collect` / 生成: `npm run generate -- 3`（`ANTHROPIC_API_KEY` 必須）
- 公開: PRの記事の `draft: true` → `false` にしてマージ

## 3. Env
`.env.example` 参照。`NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_ADSENSE_*` / `NEXT_PUBLIC_GA_ID` / `ANTHROPIC_API_KEY`（Actions Secrets）。

## 4. Workflow
- 複数ステップの作業は `docs/progress_<作業名>.md` に進捗を記録し、ステップ完了ごとに `[x]` を更新。再開時は進捗ファイルを最初に読む。
- 機能の追加・変更・削除は同一コミットで README.md を更新。
- 実験コード・不採用コードは即削除。コメントアウトで残さない。
- マージ前に最新mainを取り込み、`npm run typecheck && npm run build` が通ることを確認してからマージ。
