# Vercel の費用を抑える構成（2026-09-03 起草）

## 背景（確認済みの事実）
- 2026-09-03、Hobby の ISR Writes 上限（200k）を 8.5 倍超過してサイトが停止し、Pro（$20/月・$20 分のクレジット込み）へ移行した。
- 原因: 全 252 ルートが完全静的（`initialRevalidateSeconds: false`）でも、App Router の静的ページは Vercel 上では ISR キャッシュ経由で配信される。
  ISR キャッシュは **デプロイごとに新規**（前デプロイのキャッシュを引き継がない）で、Write は **8KB 単位**で数える（トップ 168KB ＝ 21 単位、記事中央値 45KB ＝ 6 単位、RSC・OGP 画像も別途）。
  11 日で 157 回 push × 1 デプロイごとに bot が全ページを巡回 ＝ 全ページ書き直し、で上限を超えた。
- **Hobby には戻れない**: Vercel の Fair Use Guidelines は「Google AdSense を含む広告の掲載」を商用利用と明記し、商用は Pro 以上が必須。
- bot 量は 1 日約 6,100 リクエスト（GoogleOther 3,534 件 ＝ 57.6%。記事 0037 のログ集計）。Edge Requests（Pro 10M/月）と転送量（1TB/月）には遠く及ばない。費用要因は ISR Writes だけ。

## 方針
Next.js を `output: "export"` にして **ISR を使わない**。ページは純粋な静的ファイルになり、デプロイ回数が費用に影響しなくなる（「main への push は 1 日 1 回」の制約も外せる）。
診断・問い合わせ API は Vercel のルート `api/` ディレクトリの Functions に移す（`@vercel/fs-detectors` で Next.js プリセットと同居できることを確認済み）。

手元で `output: "export"` の試しビルドは通った（1,244 ファイル・52MB。記事 120 本、OGP 画像・sitemap・robots・feed・llms.txt・404 すべて生成）。

## 先に入れた止血策（2026-09-04・完了）
`output: "export"` への移行は影響範囲が広いので、その前に「今すぐ効く・戻しやすい」ものだけ入れた。

- [x] `robots.txt` で商用SEOクローラー8種を `Disallow: /`（`src/lib/scrapers.ts` → `src/app/robots.ts`）。
      AI検索・AI学習・検索エンジンは1つも止めない。`/api/` は全クローラーに対して除外し、`Crawl-delay: 5` を出す。
      **robots.txt は「お願い」なので、無視する相手は Vercel Firewall で止める**（下の手順に残っている）。
- [x] 診断・お問い合わせAPIに `sameOrigin()` を追加（`src/lib/rateLimit.ts`）。Origin がサイト自身と一致しない
      呼び出しは 403。ブラウザは GET/HEAD 以外に必ず Origin を付けるので、フォームは通りスクリプトの直叩きは落ちる。
- [x] 回数制限を2段にした。IPごと（診断5回/分・お問い合わせ3回/分）＋インスタンス全体60回/分。
      IPを変えながら叩かれてもインスタンス側で止まる。**落とした回は数えない**（数えると洪水中だけ配列が伸びて重くなる）。
- [x] `src/lib/rateLimit.test.ts` を追加（Origin判定・IPごと・全体・洪水時に伸びないこと）。

検証（dev サーバー実測）:
- `POST /api/audit` Origin無し → 403 / 別サイトのOrigin → 403 / 同一オリジン → 200
- ページ内の `fetch("/api/audit")`（フォームと同じ経路）→ 200。3つのフォームはすべて相対パスの `fetch` なので通る
- `POST /api/prompt-fit` を連打 → `200,200,200,429,429,429,429,429`（同一IPの残り枠ぶんだけ通って以降429）
- 生成された `robots.txt` に8種の `Disallow: /`、`*` に `Allow: /` `Disallow: /api/` `Crawl-delay: 5` が出ている

## 手順（ISRをやめる本体・未着手）
- [ ] `next.config.ts` に `output: "export"` を追加。`redirects()` は export で効かないので `vercel.json` の `redirects` に移す（5 本）。
- [ ] `opengraph-image.tsx`（9 本）・`icon.tsx`・`apple-icon.tsx`・`robots.ts`・`sitemap.ts`・`manifest.ts` に `export const dynamic = "force-static"` を追加（export ではこれが無いとビルドが落ちる）。
- [ ] `src/app/api/*` を `api/audit.ts` `api/prompt-fit.ts` `api/contact.ts` に移す（Web 標準の `Request`/`Response` のまま）。`@/lib` の alias は `@vercel/node` で解決されない可能性があるので相対 import にする。`src/lib/fetchPage.ts`（`node:dns` / `node:net`）は Node ランタイムなのでそのまま使える。
- [ ] OGP 画像・アイコンは拡張子無しのファイル（`/articles/1/opengraph-image` など）で書き出されるので、`vercel.json` の `headers` で `Content-Type: image/png` を付ける（プレビューで実際のヘッダを確認）。
- [ ] `@vercel/analytics` を外す（Pro は Web Analytics の無料枠が無く、$0.03/1K イベントの従量課金。GA4 が既にあるので重複）。`@vercel/speed-insights` は無料 10k イベント/月で止まるだけなので任意。
- [ ] Vercel Firewall にカスタムルールを追加（無料。deny された通信は Edge Requests にも転送量にも数えられない）: `src/lib/scrapers.ts` の 8 種の UA を deny。robots.txt は「お願い」で、実際に止めるのはこちら。AI 検索・AI 学習・検索エンジンは止めない。
- [ ] Spend Management（Pro のみ）で上限額を設定し、超えたら通知。
- [ ] `.github/workflows/daily-articles.yml` の本番ビルド検証はそのまま（`next build` が `out/` を作る）。
- [ ] README.md / CLAUDE.md の「push は 1 日 1 回」を書き換える（制約は消えるが、レビューのまとまりとしては残してよい）。
- [ ] プレビューデプロイで `/articles/1` `/articles/1/opengraph-image` `/api/audit`（POST）`/category/seo`（308）`/存在しないURL`（404）を確認してから main へ。

## さらに $0 にしたい場合（別途判断）
静的エクスポートにしておけば、商用利用可の無料ホスティング（Cloudflare Pages: 静的配信は無制限・無料）へ移せる。
API は Pages Functions（無料枠 10 万リクエスト/日）に載せ替えるが、Workers には `node:dns` が無いので `fetchPage.ts` の SSRF 判定（解決先 IP 検査）を作り直す必要がある。
アカウント・DNS はユーザーが作る（勝手に作らない）。まずは上の手順で Pro を $20 固定に収め、移行は AdSense の収益と見比べて決める。
