@AGENTS.md
# seo-geo-web

SEOとGEO（AIO/LLMOを包含。用語はGEOに統一）の最新情報と実務ノウハウをAIで発信するメディア。収益はAdSense。
ただしトップのキャッチコピーとOGPだけは、初見の読者に伝わる「AI対策」を使う（本文・カテゴリはGEOのまま）。
**業務委託・問い合わせ導線はPVが十分に伸びるまで設計に入れない**（運営者方針）。

## 0. AI Handling Rules
- **Token Saving**: 解説は最小限。実行結果と修正コードを即提示。
- **Next.js 16**: APIが学習データと異なる。`node_modules/next/dist/docs/` を先に読む。`params` は Promise、`PageProps<'/path'>` はグローバル型。
- **外部サービスは勝手に作らない**: GitHubリポジトリ・Vercel・Supabase・AdSense等はユーザーが作成する。必要になったら明示して依頼する。
- **記事の事実は一次情報で裏取り**: frontmatter `sources` に必ず出典URL。元記事に無い数値・固有名詞を書かない。

## 1. File Map
- `content/articles/NNNN-slug.mdx`: 記事本体。URLは frontmatter の `id`（連番）で `/articles/<id>`。ファイル名の番号は人間用で、URLには使わない。frontmatter: id/title/description/date/updated（任意。あるときだけ「更新」表示とdateModified）/category/type/tags/impact/audience/actions/sources/supersedes（任意。置き換える古い記事のid）/original（任意）/draft。`type` は news（既定・RSS起点のフロー記事）か howto（テーマ起点のストック記事）。`original: true` は独自記事（自分で取ったログ・実測値・検証が中心）だけに付け、「独自」バッジが出る（要約記事に付けない）。`draft: true` は本番ビルドから除外。
- `content/candidates.csv`: 収集候補リスト（status 候補/採用/却下/公開、話題スコア、メモ）。collect が追記、人が採用/却下、generate が「採用」だけ記事化。コミット対象。
- `content/howto-topics.csv`: HOW TO記事のテーマ表（status/category/title/intent/sources/articleId/note）。人が「採用」を付け、generate-howto が記事化する。出典URLはここに書いたものだけ使える。
- `content/tools.json`: /tools のデータ。公式ページを確認したツールだけ載せる（verified 日付必須）。候補リストの「ツール検知」を確認してから追記。
- `src/app/globals.css` / `src/lib/ui.ts` / `src/components/ui.tsx`: デザインシステム（トークン／クラス定義／部品）。見た目は必ずこの3つ経由で書く。`dark:` は原則書かない（セマンティックトークンが反転する）。詳細は `docs/design-system.md`。
- `src/lib/site.ts`: サイト名・URL・カテゴリ定義。カテゴリのリンク先は `categoryHref()` だけを通す（`/category/*` は廃止し `/seo` `/geo` `/news` に統合。旧URLは `next.config.ts` で308）。`src/lib/content.ts`: MDX読み込み・関連記事。`src/lib/adsense.ts`: 広告設定。
- `src/lib/indexability.ts`: **インデックス判定の集約先**（薄いタグの足切り・`supersedes` によるカニバリ対策）。ページ・sitemap・内部リンクは必ずここを見る。`src/lib/nav.ts`: ハブページ間の回遊（`siblingPages`）。`src/lib/topic.ts`: 同一話題の判定（collect/pick/dupes 共通。**インデックス判定には使わない**）。
- `src/lib/toc.ts`: 記事の目次（MDXから見出しを拾い、rehype-slug と同じidを再現する）。`src/lib/icon.tsx`: ファビコン・アプリアイコン・Xのアイコンの図案（1か所。円形クロップ前提で四隅を空ける）。`src/lib/og.tsx`: OGP画像の共通枠（`ogFrame` / `pageOgImage`）。`opengraph-image.tsx` はセグメントごとに置き、下位ページへ引き継がれる。ただし `openGraph` を自前で書くページには引き継がれないので `images` を明示する。
- `src/lib/glossary.ts`: 用語集（/glossary）のデータ。1語1文の定義＋出典1つ。可視テキストと DefinedTerm の description は同じ文字列。出典はサイトが既に一次情報として確認済みのURLだけ使う。
- `src/lib/apps.ts`: 自作ツールの一覧（/tools のカードと sitemap が参照）。`src/lib/robots.ts`: robots.txt の解析・許可判定（純関数）。`src/lib/crawlers.ts`: AI検索/AI学習クローラー14種（公式ドキュメントで確認、verified付き）。専用ページは持たず、ページ診断の robots.txt 判定と `/learn/geo-implementation` の一覧表・ひな形（`RobotsPresets`）が共有する。`src/lib/audit.ts`: ページ診断の判定本体（指摘＝該当コード＋修正方針＋修正後コード＋出典）。
- `src/lib/promptFit.ts`: プロンプト適合度の判定本体（見出しブロック分割・文字bigramのTF-IDF・重要語のカバレッジ・意図別の形式チェック・修正案。外部APIは使わない）。`src/lib/fetchPage.ts`: 任意URLの取得（SSRF対策・2MB上限・12秒・簡易レート制限）。診断系のAPIは全部これを通す。
- `src/lib/domainPower.ts`: ドメインパワー診断の判定本体（純関数）。**合成スコアは作らない**（重みの根拠が出せないため、素の数値だけ出す）。取得は3つに分かれる: `src/lib/rdap.ts`（RDAP。IANAのブートストラップ経由、キー不要）／`src/lib/whoisJp.ts`（**.jp は RDAP に未対応**なので JPRS WHOIS 43/tcp。接続先固定）／`src/lib/openPageRank.ts`（被リンク。`OPEN_PAGERANK_API_KEY` が無ければ「未計測」）。入力の正規化は `src/lib/domain.ts`（登録ドメインに揃える。Public Suffix List は持たず手書きの接尾辞表）。
- `src/app/api/audit/route.ts` / `src/app/api/prompt-fit/route.ts` / `src/app/api/domain-power/route.ts`: 診断ツールのAPI。任意URLを取りに行くのでSSRF対策（スキーム・ポート・解決先IPをリダイレクトの各ホップで検査。`src/lib/fetchPage.ts`）を外さない。連打の抑制は `src/lib/rateLimit.ts`。
- `src/lib/contact.ts`（検証・通知文）/ `src/lib/contact-notify.ts`（転送先）/ `src/app/api/contact/route.ts`: お問い合わせフォーム。内容はDBにもログにも保存せず、LINE（`src/lib/line.ts`。記事公開の通知と同じBot）とメール（Resend）へ転送するだけ。転送先のenvが1つも無ければフォームを表示しない。実装を変えたら `/privacy` の「お問い合わせフォームについて」も同時に直す。
- `src/lib/audit-log.ts`: 検査されたURLの記録（Supabase `seogeo_audit_log`）。**ホスト名とパスだけ**を残し、クエリ文字列・IP・UAは残さない。保持30日はDB側の関数 `seogeo_log_audit` が担保する。記録内容を変えたら `/tools/page-audit` のFAQと `/privacy`（5章）も同時に直す（書いてある内容と実装がずれると虚偽になる）。
- `src/app/`: ルート。`articles/[slug]`, `news`, `seo`, `geo`, `tag/[tag]`, `about`, `privacy`, `disclaimer`, `tools/page-audit`, `tools/prompt-fit`, `tools/domain-power`, `glossary`, `sitemap.ts`, `robots.ts`, `feed.xml`, `llms.txt`, `ads.txt`。
- `scripts/sources.ts`: 収集元RSS一覧。`scripts/format-html.ts`: 配信HTMLを読むための整形（stdoutのみ。ビルドには関与しない）。`scripts/dupes.ts`: 同じ話題を扱う記事の候補を報告する（変更はしない）。 `scripts/collect.ts`: RSS巡回→candidates.csv（スコア・重複排除・Google News URL復号）。`--since=YYYY-MM-DD` を渡すとバックフィル（Google News検索を暦月の日付窓で掘る＋WordPressフィードを `?paged=N` で遡る。検索語は `sources.ts` の `BACKFILL_QUERIES`）。`scripts/pick.ts`: 候補の自動採用（基本2本/日、スコア6以上の大ニュースは最大4本まで。基準はここだけ直す）。`--since`/`--until`/`--per-month` でバックフィル（月ごとに本数を割り当て、21日制限を外す）。`scripts/generate.ts`: Claude(`claude-sonnet-5`)で2段階生成（執筆→編集長レビュー改稿。`article.ts` の generateWithReview）。`scripts/generate-howto.ts`: 同じくHOW TO記事（テーマ表起点）。プロンプトの共通部分は `scripts/prompt.ts`、採番・`validate()`・書き出しは `scripts/article.ts`。
- `scripts/notify.ts`: 公開した記事のLINE通知（Xの投稿文をそのまま送る。自動投稿はしない）。`.github/workflows/daily-articles.yml`: 毎朝7時JSTに typecheck（生成前の関門。mainが壊れていたらAPI代を使わず終了）→collect→pick→generate --publish→本番ビルド検証→main へ push（自動公開。人のレビューなし）→公開した記事をLINE通知。失敗時もLINE通知（どちらも `LINE_CHANNEL_ACCESS_TOKEN` / `LINE_USER_ID` があるときだけ。失敗通知だけは npm ci が落ちても飛ばすためymlのcurlのまま）。

## 2. Operations
- 開発: `npm run dev` / 型: `npm run typecheck` / ビルド: `npm run build`
- HTMLを読む: `npm run html -- <URL|ファイル>`
- アイコン書き出し: `npm run icon`（`src/lib/icon.tsx` の図案を変えたときだけ。favicon.ico と docs/brand/icon-1024.png を再生成）
- 収集: `npm run collect` / 採用: `npm run pick -- 2` / 生成: `npm run generate -- 3`（`ANTHROPIC_API_KEY` 必須。`--publish` で draft:false）
- 公開の通知（手動）: `npm run notify -- content/articles/0123-foo.mdx`（LINE。認証情報が無ければ文面をログに出すだけ）
- 重複話題の検知: `npm run dupes`（報告のみ。続報なら新しい記事に `supersedes: <古い記事のid>` を書く）
- 過去記事のバックフィル（手動のみ。自動実行はしない）: `npm run collect -- --since=2026-03-02 --until=2026-07-14` → `npm run pick -- --since=2026-03-02 --until=2026-07-14 --per-month=5` → `npm run generate -- 30`。手順と注意は `docs/progress_backfill.md`。「採用」を残したまま翌朝のActionsを走らせないこと
- HOW TO生成: `npm run generate:howto -- 1`（`content/howto-topics.csv` の「採用」から。自動実行はしない）
- 公開: 毎朝のActionsが自動で main に push する。止めるときは workflow を disable。手で出すときは `draft: true` → `false` にしてpush

## 3. Env
`.env.example` 参照。`NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_ADSENSE_*` / `NEXT_PUBLIC_GA_ID` / `ANTHROPIC_API_KEY`（Actions Secrets）/ `SUPABASE_URL` `SUPABASE_PUBLISHABLE_KEY`（ページ診断のURL記録。未設定なら記録しない）/ `OPEN_PAGERANK_API_KEY`（ドメインパワー診断の被リンクデータ。未設定なら「未計測」）/ `LINE_CHANNEL_ACCESS_TOKEN` `LINE_USER_ID`（記事公開の通知＋お問い合わせの転送。Actions と Vercel の両方に入れる）/ `RESEND_API_KEY` `CONTACT_FROM_EMAIL` `CONTACT_TO_EMAIL`（お問い合わせのメール転送。任意）。

## 4. Workflow
- 複数ステップの作業は `docs/progress_<作業名>.md` に進捗を記録し、ステップ完了ごとに `[x]` を更新。再開時は進捗ファイルを最初に読む。
- 機能の追加・変更・削除は同一コミットで README.md を更新。
- 実験コード・不採用コードは即削除。コメントアウトで残さない。
- マージ前に最新mainを取り込み、`npm run typecheck && npm run build` が通ることを確認してからマージ。
