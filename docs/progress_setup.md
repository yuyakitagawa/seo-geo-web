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
- [ ] GitHubリポジトリ作成 → `git remote add origin` → 初回push
- [ ] GitHub Secrets に `ANTHROPIC_API_KEY` を登録（Actions用）
- [ ] Vercelプロジェクト作成（Root Directory = リポジトリ直下）、`NEXT_PUBLIC_SITE_URL` 設定
- [ ] ドメイン決定・取得・Vercel接続、`NEXT_PUBLIC_SITE_NAME` 決定（現状の仮名: SEO・GEO・AIO Lab）
- [ ] GA4プロパティ作成 → `NEXT_PUBLIC_GA_ID`
- [ ] Search Console 登録、sitemap送信
- [ ] 記事20〜30本公開後に AdSense 申請 → `NEXT_PUBLIC_ADSENSE_*`

## 次のステップ（Claude作業）
- [ ] 9/1以降に `npm run generate 1` で生成を実走し、プロンプト調整
- [ ] 柱記事（基礎解説）を5本程度追加して初期コンテンツを厚くする
- [ ] OGP画像生成（`opengraph-image.tsx`）
