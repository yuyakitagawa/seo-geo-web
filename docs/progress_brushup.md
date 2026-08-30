# 進捗: ブラッシュアップ（器と計測）

記事の中身は触らない。**改善のループが回る状態**にするのが目的。
「課金の関門 → 計測 → 窓口 → 記事ページの完成度」の順に埋める。

関連: `docs/progress_setup.md`（GA4/Search Console/OGPが未完のまま残っていた）、
`~/stock-alert/docs/progress_seo_traffic.md`（先に測れるようにするのがボトルネック、という結論）。

## 0. 作業ツリーの整理
- [ ] 未コミットの中身を確認し、コミットすべきものと捨てるものを分ける
- [ ] `npm run typecheck && npm run build` が通る状態でコミット

## 1. 課金の前に関門を置く（最優先）
- [ ] `daily-articles.yml` の generate（Anthropic課金）の**前**に typecheck を1回入れる
- [ ] generate 後の typecheck+build（生成物の検証）はそのまま残す
- [ ] ワークフロー失敗に気づく手段を用意する

## 2. 計測を入れる
- [ ] `NEXT_PUBLIC_GA_ID` の設定手順を書き出す（オーナー作業）
- [ ] Search Console 登録・sitemap送信の手順を書き出す（オーナー作業）
- [ ] ベースラインを日付つきで記録する

## 3. /contact を生かす
- [ ] 窓口（メール or フォームURL）の用意手順を書き出す（オーナー作業）

## 4. 記事ページの完成度
- [ ] 目次（TOC）
- [ ] 更新日の表示
- [ ] OGP画像
