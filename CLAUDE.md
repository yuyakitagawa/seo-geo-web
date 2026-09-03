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
- `content/prompts.csv`: AI検索で打たれると想定した日本語プロンプト（status/category/prompt/note）。**実測ではなく想定**。`npm run prompt-gap` が使う。
- `content/tools.json`: /tools のデータ。公式ページを確認したツールだけ載せる（verified 日付必須）。候補リストの「ツール検知」を確認してから追記。
- `src/app/globals.css` / `src/lib/ui.ts` / `src/components/ui.tsx`: デザインシステム（トークン／クラス定義／部品）。見た目は必ずこの3つ経由で書く。`dark:` は原則書かない（セマンティックトークンが反転する）。詳細は `docs/design-system.md`。
- `src/lib/site.ts`: サイト名・URL・カテゴリ定義。カテゴリのリンク先は `categoryHref()` だけを通す（`/category/*` は廃止し `/seo` `/geo` `/news` に統合。旧URLは `next.config.ts` で308）。`src/lib/content.ts`: MDX読み込み・関連記事。`src/lib/adsense.ts`: 広告設定。
- `src/lib/indexability.ts`: **インデックス判定の集約先**（薄いタグの足切り・`supersedes` によるカニバリ対策）。ページ・sitemap・内部リンクは必ずここを見る。`src/lib/nav.ts`: ハブページ間の回遊（`siblingPages`）。`src/lib/topic.ts`: 同一話題の判定（collect/pick/dupes 共通。**インデックス判定には使わない**）。
- `src/lib/toc.ts`: 記事の目次（MDXから見出しを拾い、rehype-slug と同じidを再現する）。`src/lib/icon.tsx`: ファビコン・アプリアイコン・Xのアイコンの図案（1か所。円形クロップ前提で四隅を空ける）。`src/lib/og.tsx`: OGP画像の共通枠（`ogFrame` / `pageOgImage`）。`opengraph-image.tsx` はセグメントごとに置き、下位ページへ引き継がれる。ただし `openGraph` を自前で書くページには引き継がれないので `images` を明示する。
- `src/lib/glossary.ts`: 用語集（/glossary）のデータ。1語1文の定義＋出典1つ。可視テキストと DefinedTerm の description は同じ文字列。出典はサイトが既に一次情報として確認済みのURLだけ使う。
- `src/lib/apps.ts`: 自作ツールの一覧（/tools のカードと sitemap が参照）。`src/lib/robots.ts`: robots.txt の解析・許可判定（純関数）。`src/lib/crawlers.ts`: AI検索/AI学習クローラー14種（公式ドキュメントで確認、verified付き）。専用ページは持たず、ページ診断の robots.txt 判定と `/learn/geo-implementation` の一覧表・ひな形（`RobotsPresets`）が共有する。`src/lib/scrapers.ts`: **自サイトの** robots.txt で拒否する商用SEOクローラー8種（`src/app/robots.ts` だけが参照する。**crawlers.ts とは目的が違うので混ぜない**。AI検索・AI学習・検索エンジンは1つも止めない）。`src/lib/audit.ts`: ページ診断の判定本体（指摘＝該当コード＋修正方針＋修正後コード＋出典）。
- `src/lib/promptFit.ts`: プロンプト適合度の判定本体（見出しブロック分割・文字bigramのTF-IDF・重要語のカバレッジ・意図別の形式チェック・修正案。外部APIは使わない）。`src/lib/fetchPage.ts`: 任意URLの取得（SSRF対策・2MB上限・12秒・簡易レート制限）。診断系のAPIは全部これを通す。
- `next.config.ts`: `output: "export"`（静的エクスポート。**Vercel の ISR を通さない**。2026-09-03 に ISR Writes 超過でサイトが停止したため。経緯は `docs/progress_vercel-cost.md`）。export では next.config の redirects が効かないので、旧URLの308・OGP画像の Content-Type・API の maxDuration は `vercel.json` に書く。メタデータのルート（opengraph-image / icon / apple-icon / robots / sitemap / manifest）には `export const dynamic = "force-static"` が必須（無いとビルドが落ちる）。
- `api/audit.ts` / `api/prompt-fit.ts`（ルート直下。Vercel Functions。URLは `/api/*` のまま。`next dev` では動かず `vercel dev` が要る。`@/` は使わず相対 import）: 診断ツールのAPI。任意URLを取りに行くのでSSRF対策（スキーム・ポート・解決先IPをリダイレクトの各ホップで検査。`src/lib/fetchPage.ts`）を外さない。連打の抑制と、サイト自身のフォーム以外からの直接呼び出しの遮断（`sameOrigin()`）は `src/lib/rateLimit.ts`。**この2つを外すと関数実行がそのまま費用になる**ので外さない。
- `src/lib/contact.ts`（検証・通知文）/ `src/lib/contact-notify.ts`（転送先）/ `api/contact.ts`: お問い合わせフォーム。内容はDBにもログにも保存せず、LINE（`src/lib/line.ts`。記事公開の通知と同じBot）とメール（Resend）へ転送するだけ。転送先のenvが1つも無ければフォームを表示しない。実装を変えたら `/privacy` の「お問い合わせフォームについて」も同時に直す。
- `src/lib/audit-log.ts`: 検査されたURLの記録（Supabase `seogeo_audit_log`）。**ホスト名とパスだけ**を残し、クエリ文字列・IP・UAは残さない。保持30日はDB側の関数 `seogeo_log_audit` が担保する。記録内容を変えたら `/tools/page-audit` のFAQと `/privacy`（5章）も同時に直す（書いてある内容と実装がずれると虚偽になる）。
- `src/app/`: ルート。`articles/[slug]`, `news`, `seo`, `geo`, `tag/[tag]`, `about`, `privacy`, `disclaimer`, `tools/page-audit`, `tools/prompt-fit`, `glossary`, `sitemap.ts`, `robots.ts`, `feed.xml`, `llms.txt`, `ads.txt`。
- `scripts/sources.ts`: 収集元RSS一覧。`scripts/format-html.ts`: 配信HTMLを読むための整形（stdoutのみ。ビルドには関与しない）。`scripts/dupes.ts`: 同じ話題を扱う記事の候補を報告する（変更はしない）。`scripts/prompt-gap.ts`: `content/prompts.csv` のプロンプトに自サイトのビルド済みHTMLが答えられているかを報告する（`src/lib/promptFit.ts` を流用。要 `npm run build`。変更はしない）。 `scripts/collect.ts`: RSS巡回→candidates.csv（スコア・重複排除・Google News URL復号）。`--since=YYYY-MM-DD` を渡すとバックフィル（Google News検索を暦月の日付窓で掘る＋WordPressフィードを `?paged=N` で遡る。検索語は `sources.ts` の `BACKFILL_QUERIES`）。`scripts/pick.ts`: 候補の自動採用（基本2本/日、スコア6以上の大ニュースは最大4本まで。基準はここだけ直す）。`--since`/`--until`/`--per-month` でバックフィル（月ごとに本数を割り当て、21日制限を外す）。`scripts/generate.ts`: Claude(`claude-sonnet-5`)で2段階生成（執筆→編集長レビュー改稿。`article.ts` の generateWithReview）。`scripts/generate-howto.ts`: 同じくHOW TO記事（テーマ表起点）。プロンプトの共通部分は `scripts/prompt.ts`、採番・`validate()`・書き出しは `scripts/article.ts`。
- `scripts/notify.ts`: 公開した記事のLINE通知（Xの投稿文をそのまま送る。自動投稿はしない）。**1記事＝2通**（本体ツイート＋記事URLのリプライ。外部リンクを含む投稿はリーチが落ちるのでURLは本体に入れない）。投稿文は `scripts/x-post.ts` がClaudeに書かせ（フック1行＋要点3〜4行）、ハッシュタグ（1つまで）・URLのリプライ・280字の勘定は `src/lib/xpost.ts` が持つ。APIキーが無い／検査に3回落ちたらテンプレの文面に落ちる。`.github/workflows/daily-articles.yml`: 毎朝7時JSTに typecheck（生成前の関門。mainが壊れていたらAPI代を使わず終了）→collect→pick→generate --publish→本番ビルド検証→main へ push（自動公開。人のレビューなし）→公開した記事をLINE通知。失敗時もLINE通知（どちらも `LINE_CHANNEL_ACCESS_TOKEN` / `LINE_USER_ID` があるときだけ。失敗通知だけは npm ci が落ちても飛ばすためymlのcurlのまま）。

## 2. Operations
- 開発: `npm run dev`（`/api/*` は動かない。診断・お問い合わせのフォームまで試すときは `vercel dev`） / 型: `npm run typecheck` / ビルド: `npm run build`（`out/` に静的ファイルを書き出す）
- HTMLを読む: `npm run html -- <URL|ファイル>`
- アイコン書き出し: `npm run icon`（`src/lib/icon.tsx` の図案を変えたときだけ。favicon.ico と docs/brand/icon-1024.png を再生成）
- 収集: `npm run collect` / 採用: `npm run pick -- 2` / 生成: `npm run generate -- 3`（`ANTHROPIC_API_KEY` 必須。`--publish` で draft:false）
- 公開の通知（手動）: `npm run notify -- content/articles/0123-foo.mdx`（LINE。認証情報が無ければ文面をログに出すだけ）
- 重複話題の検知: `npm run dupes`（報告のみ。続報なら新しい記事に `supersedes: <古い記事のid>` を書く）
- 過去記事のバックフィル（手動のみ。自動実行はしない）: `npm run collect -- --since=2026-03-02 --until=2026-07-14` → `npm run pick -- --since=2026-03-02 --until=2026-07-14 --per-month=5` → `npm run generate -- 30`。手順と注意は `docs/progress_backfill.md`。「採用」を残したまま翌朝のActionsを走らせないこと
- HOW TO生成: `npm run generate:howto -- 1`（`content/howto-topics.csv` の「採用」から。自動実行はしない）
- 公開: 毎朝のActionsが自動で main に push する。止めるときは workflow を disable。手で出すときは `draft: true` → `false` にしてpush

## 3. Env
`.env.example` 参照。`NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_ADSENSE_*` / `NEXT_PUBLIC_GA_ID` / `ANTHROPIC_API_KEY`（Actions Secrets）/ `SUPABASE_URL` `SUPABASE_PUBLISHABLE_KEY`（ページ診断のURL記録。未設定なら記録しない）/ `LINE_CHANNEL_ACCESS_TOKEN` `LINE_USER_ID`（記事公開の通知＋お問い合わせの転送。Actions と Vercel の両方に入れる）/ `RESEND_API_KEY` `CONTACT_FROM_EMAIL` `CONTACT_TO_EMAIL`（お問い合わせのメール転送。任意）。

## 4. Workflow
- 複数ステップの作業は `docs/progress_<作業名>.md` に進捗を記録し、ステップ完了ごとに `[x]` を更新。再開時は進捗ファイルを最初に読む。
- 機能の追加・変更・削除は同一コミットで README.md を更新。
- 実験コード・不採用コードは即削除。コメントアウトで残さない。
- マージ前に最新mainを取り込み、`npm run typecheck && npm run build` が通ることを確認してからマージ。
- **main への push はまとめる**（作業中のコミットはブランチに置き、まとまってから入れる）。
  2026-09-03、11日で157コミット（8/31だけで66）を push した結果、デプロイごとに作り直される ISR キャッシュへの書き込み（ISR Writes）が上限の8.5倍に達し、Hobbyプランで**サイトが停止した**。
  今は `output: "export"` で ISR を通さないのでデプロイ回数は費用に効かないが、`output` を外す変更をするときはこの経緯を思い出すこと。
