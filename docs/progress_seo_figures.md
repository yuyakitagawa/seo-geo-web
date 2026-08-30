# 進捗: /seo の図解追加（Search Consoleの画面模式図）

目的: 「SEO対策とは」の解説ページを文章だけで読ませない。特に、実務で最初に触る
Google Search Consoleの画面を図として見せ、どの数値を見るかを言葉で残す。
スクリーンショットは貼らず（画像内の文字はAI・検索エンジンに読まれない／画面の複製を避ける）、
同じ情報配置をHTMLで描き起こす。

- [x] `src/components/figures.tsx` に汎用の図解を4種追加
      （FigurePipeline 処理の流れ / FigureStack 積み上げ / FigureGauge しきい値の帯 / FigureTimeline 期間の帯）。
      MDX_FIGURES にも登録したので記事からも使える
- [x] `src/components/screens.tsx` を新規作成。Search Consoleと検索結果の画面模式図4種
      （ScreenSearchPerformance / ScreenIndexReport / ScreenUrlInspection / ScreenSerp）。
      ダークモードでも「スクリーンショット」に見えるよう内側は常にライトUI。注釈番号と図の下の凡例を対応させる
- [x] ラベル表記をSearch Consoleヘルプで確認（検索パフォーマンス／ページ インデックス登録／URL 検査の3本）。
      未登録の理由は「検出 - インデックス未登録」「クロール済み - インデックス未登録」
      「代替ページ（適切な canonical タグあり）」「noindex タグによって除外されました」「見つかりませんでした（404）」をそのまま使用
- [x] `src/lib/guides.ts` の SEO の sources に上記ヘルプ3本を追加
- [x] `/seo` に図を10個追加（パイプライン・SERP・3領域の積み上げ・E-E-A-T・CWVのしきい値・90日の帯・GSC3画面・GEOとの比較）。
      目次に「Search Consoleのどこを見るか」を追加
- [x] `npm run typecheck` / `npm run build` が通る
- [x] 1280px・375pxで表示確認（図の内部に横スクロールの破綻なし。タイルのラベルは折り返さない。しきい値の数値は境界の真下）

## 注意
- 画面の数値はすべてサンプル。キャプションに「実際の画面の複製ではなく、数値はすべてサンプル」と明示している。増やすときも同じ扱いにする。
- 375px幅の横はみ出しは解消済み。`GuideRef`（`src/components/guide.tsx`）の出典リンクを `whitespace-nowrap` から `break-all` に変更した。
