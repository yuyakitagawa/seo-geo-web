# 運用が安定しない原因への対処（2026-09-07 起草）

## 背景（このリポジトリで確認した事実）
- `npm test` は 44 件あって全部通るが、**CI で一度も走っていない**。`.github/workflows/` にあるのは
  `daily-articles.yml` だけで、PR / push 時のワークフローが存在しない。daily の中でも走るのは
  `typecheck && build` だけで `npm test` は入っていない。＝ 回帰検知が「記事生成のついで」と人の記憶に依存している。
- 重い事故はどれも **ローカルで再現しない層**で起きている（ISR Writes 超過・`/api/*` の
  FUNCTION_INVOCATION_FAILED（`vercel dev` では再現しない ESM/CJS 差）・env 欠落で機能が静かに消える）。
- 整合性が「CLAUDE.md に『同時に直す』と書く」だけで守られている組が複数ある（scrapers.ts ↔ Vercel Firewall、
  audit-log.ts ↔ page-audit FAQ ↔ /privacy、記事 id の採番）。規約は破っても何も落ちない。
  実際に **/privacy が「Vercel Analytics を利用しています」と書いたまま**だった（2026-09-04 に依存ごと削除済み）。

## 手順
### 1. CI を置く
- [x] `.github/workflows/ci.yml`（pull_request / push:main で typecheck・test・lint・build・verify:api）
- [x] `eslint.config.mjs` に `.claude/**` を無視させる（worktree のコピーで 539 errors が出て lint が使えない）
- [x] `daily-articles.yml` の関門にも `npm test` を足す

### 2. 「同時に直す」規約をテストにする
- [x] `src/lib/content.test.ts`: 記事 id の重複・ファイル名の番号と id の一致・sources の有無・supersedes の参照先
- [x] `src/lib/scrapers.test.ts`: 一覧を固定し、変えたら落とす（Firewall 同期を促すメッセージを出す）
- [x] `src/lib/audit-log.ts` に `AUDIT_LOG_RETENTION_DAYS` を置き、/privacy と page-audit FAQ が import する
- [x] `src/app/privacy` の記述と実装の整合テスト（使っていない計測ツールを書かない）

### 3. 本番固有の層に関門を置く
- [x] `logFeatureFlags()` を、本番（`VERCEL_ENV=production`）で必須 env が欠けていたらビルドを落とす形にする
- [x] `scripts/verify-api.ts`: `api/tsconfig.json` で実際に出力して `require()` できるか検査する
      （2026-09-04 の FUNCTION_INVOCATION_FAILED と同じ壊れ方を CI で捕まえる）

## 確認した前提
- 本番の GA4 は有効（トップに `gtag/js?id=G-YD43872M17`）。AdSense は未設定（審査前）。
- 本番の Supabase も有効（`seogeo_audit_log` に 2026-09-06 11:34 UTC の記録が 1 件ある）。
  → 必須にしてよいのは GA4 と ページ診断の利用ログ。AdSense と問い合わせ転送先は意図的に無効なので警告のまま。

## 結果（2026-09-07）
- `npm test` 44件 → **59件**（記事の不変条件8・商用クローラー一覧3・ポリシーと実装の整合4）。全部通る。
- lint: `.claude/**` を除外して 539 errors → **0**（エラーは全部 worktree のコピーだった）。
- `npm run verify:api`: 3本の Functions を CommonJS で読み込めることを確認。
  `api/tsconfig.json` の module を esnext に戻して**落ちること**も確認済み（2026-09-04 の事故を再現できる）。
- 本番 env の関門: `VERCEL_ENV=production` かつ env 未設定で `next build` が落ちること、
  揃っていれば通ることの両方を確認済み。
- **/privacy の虚偽記載を1件修正**: 「Vercel Analytics および Vercel Speed Insights を利用しています」
  → Vercel Analytics は 2026-09-04 に依存ごと削除済みだった。Speed Insights だけに直した。
  この種のずれは `src/lib/policy.test.ts` が今後落とす。
