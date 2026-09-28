# Vercel Pro → Cloudflare Workers（無料）への移行（2026-09-27 起草）

## 背景
- Vercel Pro は $20/月固定。今期の従量分 $16.39 はクレジット内なので、使用量を減らしても請求は下がらない。
- Hobby へは戻せない（AdSense 掲載は Fair Use Guidelines 上の商用利用。`docs/progress_vercel-cost.md`）。
- サイトは `output: "export"` の静的ファイルなので、Cloudflare Workers の静的アセット配信にそのまま載る。

## 手順
- [x] Cloudflare アカウント作成・GitHub 連携（ユーザー）。初回ビルドは Next.js 自動検出で `opennextjs-cloudflare build` が走り失敗。
- [x] `wrangler.jsonc` を追加（`out/` を配信。`html_handling: auto-trailing-slash` / `not_found_handling: 404-page`）。
      手元検証: `wrangler deploy --dry-run` で 2,583 ファイルを読込。`wrangler dev` で `/` `/articles/1` `/geo` `/sitemap.xml` `/robots.txt` → 200、存在しないURL → 404。
- [x] Cloudflare のビルド設定（ユーザー）: Build command `npm run build` / Deploy command `npx wrangler deploy`（本番）・`npx wrangler preview`（ブランチ）。
      ビルドは Cloudflare 上で成功（465 ページ）。ブランチの `wrangler preview` は設定に `previews` ブロックが要るので `"previews": {}` を追加。
      Worker URL（Production / Preview）はユーザーが有効化済み。この開発環境からは workers.dev に接続できないので、表示の確認はユーザーのブラウザで行う。
      `NEXT_PUBLIC_*` はビルド時に要るので「Build」側の変数に入れる（実行時の変数とは別）。
- [x] `public/_redirects`（vercel.json の 308 × 6）と `public/_headers`（OGP 画像・アイコンの `Content-Type: image/png`）。`next build` が `out/` に写す。
      `wrangler dev` で検証: 旧URL 3種 → 308、OGP画像（階層 1〜4）と `/icon` `/apple-icon` → `image/png`、`/_headers` `/_redirects` 自体は 404（配信されない）。
- [x] `*.dosankoure.workers.dev`（本番URL・ブランチのプレビュー）に `X-Robots-Tag: noindex`（`_headers` のホスト指定）。
      `wrangler dev --host claude-x-seo-geo-web.dosankoure.workers.dev` で noindex が付き、localhost では付かないことを確認。
      本番ドメインへ切り替えたあとも workers.dev 側は noindex のまま残る。
- [x] API（audit / site-report / quote-readiness / contact）を Worker に載せた。`worker/index.ts` が `/api/*` だけ受けて `api/*.ts` の `POST` に渡す
      （中身は Vercel と共通。`run_worker_first: ["/api/*"]` なのでページ配信では Worker が起動しない）。
      `nodejs_compat` で `node:dns` `node:net` と `process.env` が動くので、`fetchPage.ts` は書き換えていない（workerd の `node:dns` は DoH で解決する）。
      `x-forwarded-for` は送り主が書けるので、Worker で `cf-connecting-ip` に置き換えてから渡す。
      `wrangler dev` で検証: ページ 200、旧URL 308、`GET /api/audit` 405、Origin 無し・別サイト 403、10.0.0.1 / localhost 拒否、
      同一IPの連打で `400,400,400,429,429,429`、`.dev.vars` に LINE の env を入れると contact が 503 でなくなる（process.env が読めている）。
      この環境は外へ出られないので、実サイトの取得（名前解決〜判定）は未検証。
- [x] プレビューで `/tools/page-audit` が動作（seo-geo-lab.com: HTTP 200・200KB・0.3秒で判定まで完了）。
- [x] `observability.enabled` を追加（未設定だと Observability にイベントが1件も出なかった）。
- [x] CPU 時間を実測（2026-09-27、Workers Logs）: `/api/audit` で seo-geo-lab.com（200KB）を診断 → `cpuTimeMs: 70` / `wallTimeMs: 347` / `outcome: ok`。
      無料プランの上限（10ms/回）の7倍だが止められずに完了した。起動直後の1回なので、起動処理の分を含む可能性がある。
- [x] **判断: Workers Free のまま運用する**（運営者、2026-09-27）。超過が続いて `exceededCpu`（エラー 1102）で止められるようになったら、
      Workers Paid（$5/月）に上げるか診断ツールを減らすかを決め直す。止められたときフォームには「通信に失敗しました」と出る。
      見張り方: Observability で `outcome` が `ok` 以外の `/api/*` を探す。
- [x] main へマージ（#102、2026-09-28）。本番ビルドは成功したが、`NEXT_PUBLIC_*` を実行時の欄に入れていたためビルドに効かず、canonical 等が `http://localhost:3000` になった。
      さらに `wrangler deploy` がダッシュボードの実行時の変数を消した → `keep_vars: true` を追加。
- [ ] 実行時の変数（ユーザー。Settings → Variables and Secrets）: `SUPABASE_URL` `SUPABASE_PUBLISHABLE_KEY` と、LINE / Resend の一式。
      お問い合わせフォームはビルド時にも env を見て表示を決める（`CONTACT_FORM_ENABLED`）ので、同じものを Build 側にも入れる。
- [ ] 商用SEOクローラー8種の遮断を Cloudflare WAF に移す（`src/lib/scrapers.ts`）。
- [ ] ドメインを Cloudflare に追加 → ネームサーバー変更 → Custom domain 設定（ユーザー）。
- [ ] 数日様子を見て Vercel を解約し、`vercel.json` `api/tsconfig.json` `verify:api` など Vercel 専用のものを削除。
