# プロジェクト立ち上げ（2026-08-23 開始）

## 方針
- SEO/GEO/AIOの最新情報をAIで記事化し、AdSenseで収益化。業務委託導線は設計に入れない。
- kujira-watch（stock-alert）の知見を流用: Next.js 16 + Vercel + AdSense、JSON-LD/llms.txt/RSS、和文Webフォント不使用。
- CMSは使わずMDXをリポジトリ管理（microCMSのAPI上限・コスト回避、PRレビューで公開制御）。

## 完了
- [x] Next.js 16 + TS + Tailwind v4 scaffold、依存追加（next-mdx-remote, gray-matter, reading-time, analytics, adsense）
- [x] サイト設定・MDXローダー・記事/カテゴリ/タグ/一覧ページ
- [x] about / privacy / disclaimer（AdSense審査用）
- [x] sitemap / robots / feed.xml / llms.txt / ads.txt / JSON-LD
- [x] AdSense コンポーネント（env未設定時は完全無効）
- [x] 収集スクリプト（RSS 9ソース、動作確認済み: 36件キュー）
- [x] 生成スクリプト（claude-opus-5 + web_fetch）。API上限のため実走未確認（9/1以降に再試行）
- [x] GitHub Actions（毎朝7時JSTにPR作成）
- [x] シード記事1本（SEO/GEO/AIOの違い）
- [x] `npm run build` 成功（23ページ）

## 次のステップ（ユーザー作業が必要なもの）
- [ ] 公式Xアカウント作成 → Vercel環境変数 `NEXT_PUBLIC_X_SCREEN_NAME` に設定（フッター/twitter:site/Organization sameAs・contactPoint/フォローCTAに反映）
- [x] サイト名の決定（「SEO GEO Lab」に確定。`NEXT_PUBLIC_SITE_NAME` で上書き可）
- [x] GitHubリポジトリ作成 → https://github.com/yuyakitagawa/seo-geo-web（初回push済み）
- [ ] GitHub Secrets に `ANTHROPIC_API_KEY` を登録（Actions用）
- [x] Vercelプロジェクト作成
- [x] ドメイン取得・接続 → **https://seo-geo-lab.com** （お名前.com、2026-08-25接続。www/旧vercel.app URLは308で新ドメインへ。NEXT_PUBLIC_SITE_URL設定済み）
- [ ] GA4プロパティ作成 → `NEXT_PUBLIC_GA_ID`
- [ ] Search Console 登録（https://seo-geo-lab.com で）、sitemap送信 ← ドメイン確定したので実施可能
- [ ] 記事20〜30本公開後に AdSense 申請 → `NEXT_PUBLIC_ADSENSE_*`

## 運用メモ
- 候補リストのスプレッドシート: https://docs.google.com/spreadsheets/d/1KsTQgFcZeE9-rdDJh84rmmJsYk41vcL0QoRf0naj5tQ/edit （2026-08-24時点のスナップショット。正は content/candidates.csv。シート側で status を変えたら CSV に反映する）
- 企画済み・未執筆: 記事候補 id 17〜21 相当（Decision Coverage / キーワード宇宙 / プロンプトインジェクション / カニバリ統合 / E-E-A-Tチェッカー）は candidates.csv の note に「企画案」として保持

## 次のステップ（Claude作業）
- [ ] 9/1以降に `npm run generate 1` で生成を実走し、プロンプト調整
- [x] 記事12本公開（2026-08-23。用語はGEOに統一、AIO/LLMOは包含）
- [ ] OGP画像生成（`opengraph-image.tsx`）
