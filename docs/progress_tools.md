# 進捗: 自作の無料ツール（/tools 配下）

## 背景
/tools は外部ツールの比較表だけで、サイト自身が提供する機能が無かった。
「URLを入れると直すべき箇所を実際のコードで指摘し、修正方針を出す」ツールを作る。
判定はすべて公開ドキュメントに根拠があるものだけにし、指摘に出典を添える。

## 作ったもの
- [x] 1. `src/lib/robots.ts` — robots.txt の解析と許可判定（RFC 9309 / Google仕様。純関数）
- [x] 2. `src/lib/crawlers.ts` — AI検索・AI学習・検索のクローラー14種（公式ドキュメントで確認、verified付き）
- [x] 3. `/tools/ai-crawlers` — robots.txt を貼って14種の許可状況を判定＋方針からrobots.txtを生成
- [x] 4. `src/lib/audit.ts` — HTMLを受け取って指摘を返す検査（該当コード＋修正方針＋修正後コード＋出典）
- [x] 5. `src/app/api/audit/route.ts` — URLを取得するAPI（SSRF対策・サイズ/時間制限・簡易レート制限）
- [x] 6. `/tools/page-audit` — URL入力フォームと結果表示
- [x] 7. `/tools` に自作ツールのカード、sitemap に登録
- [x] 8. README / CLAUDE.md 更新

## 検証（2026-08-30）
- [x] robots.txt 判定のケーステスト14件（前方一致・最長一致・`$`・空Disallow・グループ結合・大文字小文字）
- [x] SSRF: `localtest.me`（127.0.0.1に解決）/ `169.254.169.254` / `10.0.0.1` / 非80,443ポート をすべて拒否
- [x] 実サイト検査: seo-geo-lab.com/articles/1 → 指摘1件（titleが62字）
- [x] 実サイト検査: nytimes.com → AI検索クローラー6種のブロックを検出（robots.txtの行番号つき）
- [x] `npm run typecheck && npm run build`

## 追加（2026-09-04〜05、webpita.com の AIO 最適化チェックツールを参考に）
- [x] 6項目: charset / サイトマップ取得可否 / Article の author / BreadcrumbList / 本文中の内部リンク / 運営者情報への導線（別セッション、74b7f7b）
- [x] 8項目: nosnippet・max-snippet:0 / 別URLを指す canonical / title=description / og:description・twitter:card / main・article / Organization・publisher / 曖昧なリンク文言
- [x] 検査項目の一覧を `CHECKLIST` に集約。結果に `passed` / `skipped` を返し、画面でエリア別「n/m 項目に指摘なし」と◎一覧を出す
- [x] `/tools/page-audit` の「検査する項目」を `CHECKLIST` から描画（判定本体と表がずれない）
- [ ] 取り入れていないもの: 100点スコアと S〜D ランク（点数を出さない方針）。入れるなら運営判断

## 保留
- ツールのOGP画像（`/tools/*/opengraph-image.tsx`）は未作成。
- 結果の共有URL（判定結果をクエリに載せる）は未実装。まず使われるかを見る。
