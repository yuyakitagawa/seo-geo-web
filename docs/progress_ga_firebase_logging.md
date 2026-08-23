# 進捗: GA計測の有効化 + Firebase生ログ収集

目的: PV・流入をGA4で見る。加えて集計前の生ログ（1PV=1レコード）をFirebase (Cloud Firestore) に貯めて、AI流入の分析など自由なクエリをかけられるようにする。

## 現状

- GA4はコード側実装済み（`src/app/layout.tsx` の `<GoogleAnalytics>`）。`NEXT_PUBLIC_GA_ID` が未設定なため動いていないだけ。**コード変更は不要**。
- Firebase連携は未実装。依存パッケージも無し。

## 方針

### GA（コード変更なし）

- ユーザーがGA4プロパティを作成し、測定ID（`G-XXXX`）をVercelの `NEXT_PUBLIC_GA_ID` に設定 → 再デプロイで有効化。

### Firebase生ログ

- 構成: クライアントの計測コンポーネント → `navigator.sendBeacon` で `POST /api/log` → Route Handler（Node runtime）が `firebase-admin` でFirestoreの `pageviews` コレクションに1件書き込み。
- クライアントから直接Firestoreに書かない理由: セキュリティルールを書き込み許可にするとスパム書き込みし放題になる。サーバー経由なら認証情報を秘匿でき、bot除外・項目の付与もサーバーで統一できる。
- 記録項目（1レコード）:
  - `ts`（サーバー時刻）/ `path` / `referrer` / `ua` / `lang`
  - `screen`（画面幅x高）/ `sessionId`（`sessionStorage` のランダムID。ユーザー特定はしない）
  - `country`（Vercelの `x-vercel-ip-country` ヘッダー。IPアドレス自体は保存しない）
  - `expireAt`（TTL用。180日後）
- 除外: UAがbotのもの、`NODE_ENV !== "production"`、env未設定時はno-op（ローカル開発で書き込まれない）。
- コスト: Firestore無料枠は書き込み2万/日。現状PVでは余裕。TTLで肥大化も防ぐ。
- 閲覧: 当面Firebaseコンソールで見る。分析用スクリプトはPVが伸びてから検討。

### 環境変数（サーバー専用、Vercelに設定）

```
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=   # サービスアカウント鍵JSONのprivate_key（改行は\nエスケープ）
```

## ユーザー作業（外部サービスはユーザーが作成）

- [ ] GA4プロパティ作成 → Vercelに `NEXT_PUBLIC_GA_ID` を設定
- [ ] Firebaseプロジェクト作成 → Firestore有効化（本番モード、ロケーション `asia-northeast1` 推奨）
- [ ] サービスアカウント鍵を発行（プロジェクトの設定 → サービスアカウント → 新しい秘密鍵の生成）→ 上記3変数をVercelに設定
- [ ] Firebaseコンソールで `pageviews` コレクションに `expireAt` のTTLポリシーを設定
- [ ] プライバシーポリシー文面の確認（Firebase追記後）

## 実装ステップ（コード側）

- [ ] `firebase-admin` を依存に追加
- [ ] `src/lib/firebase.ts`: Admin SDK初期化（env未設定ならnullを返しno-op）
- [ ] `src/app/api/log/route.ts`: POST受付。bot UA除外、項目整形、`pageviews` に書き込み
- [ ] `src/components/PageViewLogger.tsx`: client component。`usePathname` の変化ごとに `sendBeacon`。layout.tsxに配置
- [ ] `src/app/privacy/page.tsx`: Firebaseによるアクセスログ収集を追記
- [ ] `.env.example` / README.md 更新
- [ ] `npm run typecheck && npm run build` 確認
