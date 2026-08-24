# seo-geo-web

SEOとGEO（生成AI検索最適化。AIO/LLMOと呼ばれる領域を含む）の最新動向と実務ノウハウを発信するメディア。
一次情報（Google Search Central 等）をRSSで毎日収集し、Claudeで日本語解説の下書きを生成、人間がレビューして公開する。

## スタック
- Next.js 16 (App Router, SSG) + TypeScript + Tailwind CSS v4 (+ @tailwindcss/typography)
- 記事: リポジトリ内 MDX（`next-mdx-remote`）。CMS不使用。
- 計測: Vercel Analytics / Speed Insights / GA4（`NEXT_PUBLIC_GA_ID` 設定時）
- 収益: Google AdSense（`NEXT_PUBLIC_ADSENSE_CLIENT` 設定時のみ出力。未設定なら広告関連は一切出ない）
- 記事生成: `@anthropic-ai/sdk`（`claude-opus-5` + `web_fetch` サーバーツール）

## ページ構成
| パス | 内容 |
|---|---|
| `/` | 新着記事・カテゴリ・タグ |
| `/articles` | 全記事一覧 |
| `/articles/[id]` | 記事（URLは連番 `/articles/12`。Article + BreadcrumbList JSON-LD、出典一覧、関連記事、広告） |
| `/category/{seo,geo,news}` | カテゴリ別一覧 |
| `/tag/[tag]` | タグ別一覧 |
| `/tools` | SEO・GEOツール比較（`content/tools.json`。運営者が公式ページを確認したものだけ掲載、ItemList JSON-LD） |
| `/about` `/privacy` `/disclaimer` | 運営者情報（E-E-A-T）/ プライバシー / 免責（AdSense審査に必要） |
| `/sitemap.xml` `/robots.txt` `/feed.xml` `/llms.txt` `/ads.txt` | クローラー・LLM・AdSense向け |

## 記事パイプライン
```
scripts/sources.ts  収集元（公式: Search Central / Search Status / The Keyword / Bing / OpenAI、メディア: SEL / SEJ / SERoundtable / 海外SEO情報ブログ、
                    ツール検知: Google News 日本語検索RSS「LLMO」「GEO対策」「AIO対策」「AI検索ツール」「AI visibility」）
      ↓ npm run collect [日数]   content/candidates.csv に「候補」として追記。話題スコア付き。Google NewsのURLは元記事に復号（scripts/googleNews.ts）
      ↓ 人がCSVの status を 採用/却下 に
      ↓ npm run generate N       「採用」をスコア順にN件、Claudeが元記事をweb_fetchで読んで MDX を draft:true で出力 → status を「公開」に
      ↓ GitHub Actions           毎朝7時JST、collect→generate→PR（.github/workflows/daily-articles.yml）
      ↓ 人間レビュー              draft:false に変更してマージ → Vercel が自動デプロイ
```
**話題スコア**: 検索専門の公式ソース+3（その他公式+1）、同じ話題を報じた他ソース数×2（上限+6。タイトルの語の重なりでクラスタ化）、3日以内+1、テーマ語の一致数（上限3）、ツール発表+2。
**重複排除**: URL、および正規化タイトル（PR TIMES転載をInfoseek/Excite等と同一視）。
APIエラー時は「採用」のまま次回に回し、内容起因の失敗のみ「却下」にしてメモを残す。

## 記事の型（他媒体との差別化）
- 冒頭に **Key Points パネル**（影響度 / 対象 / 今すぐやること）を固定表示
- 本文に「## 検索側の狙い」（プロダクト側の意図をPdM視点で推論）と「## やること／やらなくていいこと」を必須化
- 日本のサイトでの具体例を最低1つ。AI定型表現は禁止（`scripts/generate.ts` の SYSTEM_PROMPT 参照）
- **図解を3〜4個必須**（`src/components/figures.tsx`）。MDX内に直接書ける6種:
  `FigureCompare`（比較 2〜3カラム）/ `FigureDoDont`（✓✕の2パネル。やること／やらなくていいことのリストはこれで書く）/
  `FigureFlow`（手順ステップ）/ `FigureStats`（数字カード）/ `FigureBars`（横棒グラフ。マイナス混在で中央0の左右振り分け）/
  `FigureQuote`（一次情報の引用パネル）。
  実画像でなくコード描画なので、生成パイプラインが出力でき、テキストが残るためAI・検索エンジンにも読める。
  props はJS式で渡すため記事ページの `MDXRemote` は `blockJS: false`（記事はリポジトリ内の信頼済みコンテンツ）

## デザイン
- 黒×生成り（paper）×エレクトリックライム（accent）。カテゴリ色: seo=青 / geo=紫 / news=橙（`src/lib/categoryStyle.ts`）
- 欧文は Space Grotesk（next/font）、和文は端末フォント
- `globals.css` の `@theme` にトークン集約。ダークモード対応

## 画像（写真素材を持たずにビジュアルを作る）
- **キービジュアル**: `src/lib/coverArt.ts` が記事idから決定的にSVGを生成（6パターン×カテゴリ色）。
  同じ記事は常に同じ絵になる。`<CoverArt>` が data URI の `<img>` として表示し、
  記事カード・記事ページ冒頭・一覧/カテゴリ/タグ/ツールページのヘッダーで使う。
- **OGP画像**: `src/app/opengraph-image.tsx`（サイト）と `src/app/articles/[slug]/opengraph-image.tsx`（記事ごと）で
  実PNGを生成（`next/og`）。背景は同じキービジュアル。和文は Google Fonts から
  **その画像で使う文字だけ**を切り出して読む（`src/lib/og.tsx` の `loadOgFont`。ImageResponseの500KB制限対策）。
  フォント取得に失敗しても画像自体は出る（和文が欠けるだけ）。ビルド時にネットワークが必要。
- **記事内の図解**: 上記の `figures.tsx`（6種）。

## 記事 frontmatter
```yaml
id: 12                    # 必須。URLになる連番。生成スクリプトが最大値+1を自動採番
title: "..."
description: "..."        # 90〜120字
date: "2026-08-23"
updated: "2026-08-23"     # 任意
category: "seo"           # seo | geo | news
tags: ["SEO", "AI Overview"]
impact: "mid"             # high | mid | low（任意）
audience: "店舗集客サイト"  # 任意
actions:                  # 任意、1〜4項目
  - "robots.txt を確認する"
sources:
  - title: "出典タイトル"
    url: "https://..."
draft: false
```

## セットアップ
```bash
npm ci
cp .env.example .env.local   # 値を設定
npm run dev
```

## SEO / GEO 対策
- Organization / WebSite / Article / BreadcrumbList の JSON-LD
- 記事の出典を `citation` として構造化データに宣言、本文末尾にも一覧表示
- `llms.txt`（サイト概要＋主要URL）、RSS、sitemap、robots
- E-E-A-T: 運営者情報は前職の社名を出さず「大手検索サービス／大規模予約サービスのPdM経験」と記載。連絡窓口は公式Xのみ（`NEXT_PUBLIC_X_SCREEN_NAME` 設定時に Organization contactPoint / sameAs、記事末尾のフォローCTA、aboutの連絡先が有効化）
- 記事冒頭に「## 結論」を置く執筆ルール（AI検索のパッセージ抽出向け）
- 和文Webフォント不使用（端末フォント）で初期表示を軽く保つ

## 未着手 / 将来
- 記事内検索、英語版
- 業務委託・問い合わせ導線はPVが伸びてから（現段階では設計に含めない）
