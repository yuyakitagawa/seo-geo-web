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
- [ ] API（audit / site-report / quote-readiness / contact）を Worker の `main` に載せ替え。`fetchPage.ts` の `node:dns` 依存を外す。
      連打制限は Cloudflare の Rate Limiting ルールへ。CPU 時間（無料 10ms/回）を実測する。
- [ ] 商用SEOクローラー8種の遮断を Cloudflare WAF に移す（`src/lib/scrapers.ts`）。
- [ ] ドメインを Cloudflare に追加 → ネームサーバー変更 → Custom domain 設定（ユーザー）。
- [ ] 数日様子を見て Vercel を解約し、`vercel.json` `api/tsconfig.json` `verify:api` など Vercel 専用のものを削除。
