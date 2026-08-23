# 進捗: GA計測の有効化 + Supabase生ログ収集

目的: PV・流入をGA4で見る。加えて集計前の生ログ（1PV=1レコード）をSupabase (Postgres) に貯めて、AI流入の分析など自由なSQLクエリをかけられるようにする。

## 現状

- GA4はコード側実装済み（`src/app/layout.tsx` の `<GoogleAnalytics>`）。`NEXT_PUBLIC_GA_ID` が未設定なため動いていないだけ。**コード変更は不要**。
- Supabase連携は未実装。依存パッケージも無し。

## 方針

### GA（コード変更なし）

- ユーザーがGA4プロパティを作成し、測定ID（`G-XXXX`）をVercelの `NEXT_PUBLIC_GA_ID` に設定 → 再デプロイで有効化。

### Supabase生ログ

- 構成: クライアントの計測コンポーネント → `navigator.sendBeacon` で `POST /api/log` → Route Handler（Node runtime）が `@supabase/supabase-js`（service roleキー）で `pageviews` テーブルに1行insert。
- クライアントから直接insertしない理由: anonキー+RLS書き込み許可だとスパムinsertし放題になる。サーバー経由ならキーを秘匿でき、bot除外・項目の付与もサーバーで統一できる。RLSは有効化し公開ポリシーは作らない（service roleのみ書ける）。
- テーブル `pageviews`:
  - `id` bigint identity PK / `ts` timestamptz default now()
  - `path` text / `referrer` text / `ua` text / `lang` text
  - `screen` text（画面幅x高）/ `session_id` text（`sessionStorage` のランダムID。ユーザー特定はしない）
  - `country` text（Vercelの `x-vercel-ip-country` ヘッダー。IPアドレス自体は保存しない）
  - index: `(ts)`, `(path, ts)`
- 除外: UAがbotのもの、`NODE_ENV !== "production"`、env未設定時はno-op（ローカル開発で書き込まれない）。
- 保持期間: 180日。`pg_cron` で古い行を日次削除（無料枠500MBに対し1行数百バイトなので当面は余裕。設定はSQL1回）。
- 無料枠の注意: 1週間アクティビティが無いとプロジェクトが一時停止されるが、PVがある限り書き込みで維持される。
- 閲覧: SupabaseダッシュボードのSQLエディタ（例: 日別PV、リファラ別、AI経由の流入抽出など自由に集計）。

### 環境変数（サーバー専用、Vercelに設定。`NEXT_PUBLIC_` は付けない）

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

## ユーザー作業（外部サービスはユーザーが作成）

- [ ] GA4プロパティ作成 → Vercelに `NEXT_PUBLIC_GA_ID` を設定
- [ ] Supabaseプロジェクト作成（リージョン Tokyo `ap-northeast-1` 推奨）
- [ ] Project Settings → API から URL と service role キーを取得 → 上記2変数をVercelに設定
- [ ] `pageviews` テーブル作成と `pg_cron` の保持期間設定（SQLは実装時に用意する。Claude側でMCP経由のmigration適用も可）

## 実装ステップ（コード側）

- [ ] `@supabase/supabase-js` を依存に追加
- [ ] `src/lib/supabase.ts`: service roleクライアント初期化（env未設定ならnullを返しno-op）
- [ ] `pageviews` テーブル作成SQL（migration）を用意・適用
- [ ] `src/app/api/log/route.ts`: POST受付。bot UA除外、項目整形、`pageviews` にinsert
- [ ] `src/components/PageViewLogger.tsx`: client component。`usePathname` の変化ごとに `sendBeacon`。layout.tsxに配置
- [ ] `src/app/privacy/page.tsx`: Supabaseによるアクセスログ収集を追記
- [ ] `.env.example` / README.md 更新
- [ ] `npm run typecheck && npm run build` 確認
