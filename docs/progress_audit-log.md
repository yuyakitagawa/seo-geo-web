# 進捗: ページ診断で検査されたURLの記録

`/tools/page-audit` に入力されたURLを残し、「どんなページが検査されているか」を記事の題材選びに使う。

前提: [`docs/progress_brushup.md`](progress_brushup.md) の C-1（Supabase 相乗り）。
相乗り先は kujira-watch / stock-alert が乗っている**取引システムの本番DB**で、
2026-08-31 時点で **532MB / 無料枠500MB を超過中**（書き込みはまだ止まっていない）。
容量を食っているのは保持期間の無い生ログなので、**こちらのテーブルには最初から保持期間を入れる**方針で進めた。

---

## 1. 先に文言を直す（実装より前）

記録を始めると、ページに書いてあることが**嘘になる**箇所があった。

- [x] `/tools/page-audit` のFAQ「検査したURLは保存されますか」
      → 「保存していません」から、**何を残し・何を残さないか・いつ消えるか**を書いた文言に差し替え
- [x] `/privacy` に **5章「ツールに入力されたURLの記録」** を新設（旧5〜10章は6〜11章に繰り下げ）。
      2章「取得する情報」にも1行足して5章へ誘導
- [x] `POLICY_UPDATED` を `2026-08-31` に更新（最終改定日の表示と `dateModified` が両方これを見る）
- [x] `APP_TOOLS` の `/tools/page-audit` の `updated` も `2026-08-31` に更新

---

## 2. Supabase 側（`kxrgyguowxtjqexvmlgx` = stock-alert）

相乗り先のDBに他システムを巻き込まない形にするため、**テーブル権限を渡さず関数だけ**を公開する構成にした。

- [x] マイグレーション `seogeo_audit_log`
      - テーブル `public.seogeo_audit_log`（`host` / `path` / `status` / `high` `mid` `low` / `finding_ids` / `elapsed_ms` / `error`）
      - `created_at` と `host` にインデックス、RLS 有効・**ポリシーは作らない**
      - `security definer` 関数 `seogeo_log_audit(...)` … 挿入と同時に **30日より古い行を削除**する。
        保持期間をアプリやcronではなく**DB側**に置いたのは、seo-geo-web の実装が変わっても期限が守られるようにするため
        （`pg_cron` は未インストールで、この構成なら入れずに済む）
      - 関数の EXECUTE を `anon` にだけ付与
- [x] マイグレーション `seogeo_audit_log_revoke_table_grants`
      - Supabase の既定で付く `anon` / `authenticated` のテーブル権限を revoke。
        RLS のポリシー無しで既に閉じているが、将来ポリシーを足したときに開かないようにする

**service_role キーは使わない。** 相乗り先DB全体を触れる鍵をVercelに置かないため、
publishable（anon）キー＋関数のEXECUTEだけ、という最小権限にしてある。

### 実測での確認
| 確認したこと | 結果 |
|---|---|
| publishable キーで RPC を呼べる | `POST /rest/v1/rpc/seogeo_log_audit` → **204** |
| 同じキーでテーブルを直接読めない | `GET /rest/v1/seogeo_audit_log` → **401**（`42501 permission denied`）|
| 30日を過ぎた行が消える | 31日前の行を入れて関数を1回呼ぶ → 該当行 **0件** |
| テーブルサイズ | 空の状態で **64kB**（インデックス込み）|

---

## 3. アプリ側

- [x] `src/lib/audit-log.ts` を追加。`SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` があるときだけ動き、
      無ければ**何もしない**（既存の `NEXT_PUBLIC_GA_ID` や連絡先envと同じ扱い）。
      `new URL()` で **ホスト名とパスだけ**を取り出すので、クエリ文字列は構造的に送られない。
      送信は3秒でタイムアウトし、失敗しても握りつぶす（記録の失敗で診断結果を落とさない）
- [x] `POST /api/audit` の成功時と失敗時の両方から呼ぶ。
      **429（回数制限）で弾いたリクエストは記録しない**（連打がそのまま書き込みに化けるのを防ぐ）
- [x] 依存パッケージは足していない（`@supabase/supabase-js` は入れず、PostgREST に `fetch` する）
- [x] `.env.example` / README / CLAUDE.md を更新

### 実測での確認（`npm run dev` に env を入れて実行）
| 入力 | DBに入った行 |
|---|---|
| `https://seo-geo-lab.com/tools/page-audit?utm_source=test&token=SECRET` | `host=seo-geo-lab.com` / `path=/tools/page-audit` / `status=200` / `mid=1` `low=1` / `finding_ids={date,citation}` — **クエリ文字列は消えている** |
| `http://192.168.0.1/secret` | `status=null` / `error=このIPアドレスは検査できません`（SSRF拒否も記録される）|

確認後、テストで入れた行は**すべて削除済み**（`select count(*)` → 0）。

- [x] `npm run typecheck && npm run build` が通ることを確認

---

## → オーナー作業

Vercel → プロジェクト `seo-geo-web` → Settings → Environment Variables → **Production**

| Key | Value |
|---|---|
| `SUPABASE_URL` | `https://kxrgyguowxtjqexvmlgx.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase → stock-alert → Settings → API Keys の **publishable**（`sb_publishable_...`）|

`NEXT_PUBLIC_` が付かないのでビルドに埋め込まれず、サーバー側だけで読まれる。設定後に Redeploy。
**設定するまでは記録されない**（コードは入っていて、動かないだけ）。

## 残っている判断

- **相乗り先が無料枠を超過したままである点は解決していない。** このテーブル自体は
  保持30日・1行あたり数百バイトなので影響は誤差だが、DB全体が500MBを超えている状態は続く。
  容量の主因は `blog_crawler_log`（kujira-watch、保持期間なし、月150MBペース）で、
  そちらに手を入れてよいかは**未承認**。
- 記録を**何に使うか**はまだ決めていない。いまは貯めるだけで、集計・表示は作っていない。
