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

## 手順（ISRをやめる本体・2026-09-04 実装、ブランチ `chore/static-export`）
- [x] `next.config.ts` に `output: "export"` を追加。`redirects()` は export で効かないので `vercel.json` の `redirects` に移した（5 本）。
- [x] `opengraph-image.tsx`（9 本）・`icon.tsx`・`apple-icon.tsx`・`robots.ts`・`sitemap.ts`・`manifest.ts` に `export const dynamic = "force-static"` を追加（export ではこれが無いとビルドが落ちる）。
- [x] `src/app/api/*` を `api/audit.ts` `api/prompt-fit.ts` `api/contact.ts` に移した（Web 標準の `Request`/`Response` のまま。`runtime` / `maxDuration` の export は外し、上限は `vercel.json` の `functions`）。
      `@/lib` の alias は `@vercel/node` で解決されない可能性があるので、API から届く範囲（`api/*.ts` と `src/lib/contact.ts` `contact-notify.ts`）は相対 import にした。
- [x] OGP 画像・アイコンは拡張子無しのファイルで書き出されるので、`vercel.json` の `headers` で `Content-Type: image/png` を付けた。
- [x] `@vercel/analytics` を外した（Pro は無料枠が無く従量課金。GA4 と重複）。`@vercel/speed-insights` は無料枠で止まるだけなので残した。
- [x] README.md / CLAUDE.md を更新（ホスティング方針・API の置き場所・`vercel dev`・push の規則）。
- [x] 手元の検証: `npm run typecheck` / `npm test`（19 件）/ `npm run build`（`out/` に 1,704 ファイル。OGP 画像は PNG、404.html あり、Vercel Analytics のスクリプトは消えている）。
- [x] Vercel Firewall にカスタムルール **「Deny commercial SEO crawlers」** を追加（2026-09-04。無料。deny された通信は Edge Requests にも転送量にも数えられない）。
      `src/lib/scrapers.ts` の 8 種を User-Agent の部分一致で deny。CLI で入れた（`vercel firewall rules add ... --action deny` → `vercel firewall publish`）。
      `vercel.json` の `routes` に書く方法もあるが、`redirects` / `headers` と併用できないので使わない。
      検証: AhrefsBot / SemrushBot / MJ12bot の UA → 403、Googlebot / GPTBot / ブラウザ → 200。
      **scrapers.ts を変えたら `vercel firewall rules edit "Deny commercial SEO crawlers"` で同期する**（`vercel firewall rules list --expand` で現状を見る）。
- [ ] Spend Management（Pro のみ）で上限額を設定し、超えたら通知。**ダッシュボード作業（ユーザー）**。
- [x] Vercel のビルダーで検証（`vercel pull` → `vercel build`。出力は `.vercel/output`）: `api/audit.func` `prompt-fit.func` `contact.func` が Node 24 で生成され、
      相対 import した `src/lib/*` が関数に同梱される。`maxDuration: 30`、旧URLの 308（5本）、OGP・アイコンの `image/png` ヘッダ、末尾スラッシュの 308、
      `articles/1.html → /articles/1` のクリーンURL（`overrides`）、`404.html` を確認。
- [x] `vercel dev`（`.claude/launch.json` の `vercel-dev`）で実行経路を検証: `/category/seo` → 308 `/seo`、存在しないURL → 404、`GET /api/audit` → 405、
      `POST /api/audit` は Origin 無しで 403・同一オリジンで 200（example.com の診断結果が返る）、`POST /api/prompt-fit` も 200。
- [x] 2026-09-04 07:08 JST に main へ入り本番デプロイ。ページ・OGP画像・308・404 は正常。
- [x] **本番だけ `/api/*` が 500（FUNCTION_INVOCATION_FAILED）** → hotfix。原因: Vercel のビルダー（`@vercel/node` 5.8）はルートの tsconfig
      （`module: esnext`）で関数を変換するため、出力が `import` 文のままの ESM になり、拡張子無しの相対 import（`../src/lib/audit`）を Node が
      読めなかった（ログ: `Failed to load the ES module`）。`vercel dev` は別経路で変換するので再現しない。
      対処: `api/tsconfig.json` で `module: commonjs` / `moduleResolution: node` に固定（ビルダーはエントリに近い tsconfig を拾う）。
      `vercel build` の出力を `node -e 'require(".../audit.func/api/audit.js")'` で読み込めることを確認してから本番へ。

## さらに $0 にしたい場合（別途判断）
静的エクスポートにしておけば、商用利用可の無料ホスティング（Cloudflare Pages: 静的配信は無制限・無料）へ移せる。
API は Pages Functions（無料枠 10 万リクエスト/日）に載せ替えるが、Workers には `node:dns` が無いので `fetchPage.ts` の SSRF 判定（解決先 IP 検査）を作り直す必要がある。
アカウント・DNS はユーザーが作る（勝手に作らない）。まずは上の手順で Pro を $20 固定に収め、移行は AdSense の収益と見比べて決める。
