# 進捗: GA計測の有効化（Supabase生ログは保留）

目的: PV・流入をGA4で見る。

**Supabase生ログ収集はコスト懸念により保留（運営者判断 2026-08-23）。** PVが伸びて生ログ分析が必要になったら再検討する。再開時の設計メモは末尾に残す。

## 現状

- GA4はコード側実装済み（`src/app/layout.tsx` の `<GoogleAnalytics>`）。`NEXT_PUBLIC_GA_ID` が未設定なため動いていないだけ。**コード変更は不要**。

## やること（ユーザー作業のみ）

- [ ] GA4プロパティ作成 → 測定ID（`G-XXXX`）を取得
- [ ] Vercelの環境変数に `NEXT_PUBLIC_GA_ID` を設定 → 再デプロイ
- [ ] 本番サイトでGA4のリアルタイムレポートに自分のアクセスが出ることを確認

## 保留: Supabase生ログの設計メモ（再開時用）

- 構成: クライアント計測コンポーネント → `sendBeacon` で `POST /api/log` → Route Handler（Node runtime）が service role キーで `pageviews` テーブルにinsert。クライアント直書きはスパム対策上不採用（RLS有効・公開ポリシーなし）。
- 記録項目: ts / path / referrer / ua / lang / screen / session_id / country（`x-vercel-ip-country`。IPは保存しない）。
- 除外: bot UA、`NODE_ENV !== "production"`、env未設定時はno-op。
- 保持180日（`pg_cron` 日次削除）。env: `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`（サーバー専用）。
