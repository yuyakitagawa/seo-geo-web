# 進捗: /seo を短くして、実務手順を教科書（/learn）へ移す

`/seo` が長すぎる。役割分担（`/seo` `/geo` = 定義、`/learn` = 順番のある実務手順）どおりに、
手順にあたる節を教科書へ引っ越し、ページ途中に教科書への導線を置く。

## 判断
- 移すのは「手順」だけ。定義・Googleの公式基準・誤解・GEOとの関係は `/seo` に残す。
- `/seo` の「Search Consoleのどこを見るか」は `/learn/measurement`（レッスン08）に**すでに同じ内容がある**ため、
  引っ越しではなく削除＋導線に置き換える（同じ文章を2か所に置かない）。
- ページ途中の導線は `NextStep`（記事本文で使っているものと同じ部品）を「Googleが公式に示している基準」の直後に置く。
  本文を読み切る前に見える位置に出す（`ArticleNextStep` と同じ考え方）。

## ステップ
- [x] 1. `/seo` の「最初の90日でやること」を `/learn`（目次ページ）へ移す
- [x] 2. `/seo` の「Search Consoleのどこを見るか」を削除（内容は `/learn/measurement` にある）
- [x] 3. `/seo` の「検索Botの種類と動き」から、実装の話（JSレンダリング・偽Googlebotの確認）を `/learn/technical` へ移す
- [x] 4. `/seo` の途中に教科書への導線（`NextStep`）を追加
- [x] 5. 移動に合わせてメタ情報を直す（`guides.ts` のtitle/description/出典、`nav.ts`、`geo/page.tsx` の紹介文、`curriculum.ts` の更新日）
- [x] 6. README を更新し、`npm run typecheck && npm run build` を通す

## 結果
- `/seo` は576行 → 512行。節は10 → 8（`最初の90日でやること` と `Search Consoleのどこを見るか` が無くなった）。
- 途中の導線は「Googleが公式に示している基準」の直後。実測でページ全体の約51%の位置に出る。
- ついでに消した重複: `/seo` の Core Web Vitals のゲージ図はレッスン04と同じものだったので `/seo` 側を削除
  （しきい値の表は定義として残す）。
- 移した先: 90日 → `/learn`（`#plan`）、GSCの3画面 → `/learn/measurement`（既存）、
  JSレンダリングと偽Googlebotの確認 → `/learn/technical`（`#rendering`。到達目標・チェックリスト・出典も追加）。
- 更新日を動かしたもの: `GUIDES.seo`・`COURSE`・レッスン04（内容が変わったページだけ）。
