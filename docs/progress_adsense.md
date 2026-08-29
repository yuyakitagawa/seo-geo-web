# 進捗: AdSense審査に通る状態にする

目的: 将来AdSenseを申請したときに落ちない状態にしておく。落ちやすい原因（連絡先が無い／
ポリシーの記載不足／著作権と引用の方針が無い／誰がどう作っているか書いていない）を潰す。

## 実装（コード側・完了）
- [x] `src/lib/site.ts`: `CONTACT_EMAIL` / `CONTACT_FORM_URL` / `HAS_CONTACT` / `POLICY_UPDATED` を追加。
      Organization の contactPoint を メール > フォーム > X の順で1つ宣言するよう変更
- [x] `src/app/contact/page.tsx`: お問い合わせページ（受け付ける内容・返信の目安・情報の扱い）。
      窓口のenvが1つも無いときは `notFound()` でビルド時404（中身の無いページを公開しない）
- [x] `src/app/privacy/page.tsx`: AdSenseが要求する開示を追加（第三者配信事業者のCookie、
      パーソナライズ広告の無効化リンク2種、GAオプトアウトアドオン、Vercel Analytics、
      EU/英国のGDPR同意、第三者提供、13歳未満、最終改定日）
- [x] `src/app/disclaimer/page.tsx`: 著作権と引用の方針、権利者からの削除連絡窓口、
      リンクポリシー、記事の作成方法（AI利用の開示）、広告と記事内容の独立性を追加
- [x] `src/app/about/page.tsx`: 「記事の作り方と編集方針」（収集→採用→執筆→自動検査→訂正の5手順）、
      対価を受け取っていないことの明記、FAQに「誰が書いているか」「誤りの指摘方法」を追加
- [x] `src/app/layout.tsx`: `ADSENSE_CLIENT` 設定時に `<meta name="google-adsense-account">` を出力
- [x] `Footer` / `sitemap.ts` / `llms.txt` / `.env.example` / README を更新
- [x] `npm run typecheck && npm run build`（`/contact` が status 404 で出力されることを確認）

## 残り（ユーザー作業）
- [ ] 連絡先を決めて Vercel の環境変数に設定（どちらか片方でよい。実名は不要）
      - `NEXT_PUBLIC_CONTACT_EMAIL`: サイト専用のメールアドレス
      - `NEXT_PUBLIC_CONTACT_FORM_URL`: Googleフォーム等のURL
      設定して再デプロイすると `/contact` が公開され、フッター・sitemap・構造化データに載る
- [ ] 申請直前に `NEXT_PUBLIC_ADSENSE_CLIENT` を設定して再デプロイ（スクリプト・meta・ads.txt が有効化）
- [ ] AdSense管理画面 > プライバシーとメッセージ で EU/英国向け同意メッセージを有効化
- [ ] `NEXT_PUBLIC_GA_ID` を設定（プライバシーポリシーがGA利用を記載しているので、使わないなら記述を消す）

## 残るリスク（コードで解決できない）
- 記事が全文AI生成・人のレビュー無しで毎日公開される運用は、Googleの「大量生成されたコンテンツの不正使用」に
  当たると判断される可能性がある。現状は一次情報の出典必須・自動検査ありで緩和しているが、
  審査前に運営者が全記事を通読し、事実の誤りと重複記事を落としておくのが安全。
- 記事本数25本。ニュース要約中心のため、独自の切り口（日本のサイト運営者向けの打ち手）が
  薄い記事は落としてよい。本数より1本ごとの独自性が見られる。
