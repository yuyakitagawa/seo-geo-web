# seo-geo-web

SEOとGEO（生成AI検索最適化。AIO/LLMOと呼ばれる領域を含む）の最新動向と実務ノウハウを発信するメディア。
読者は事業会社・制作会社のSEO/GEO担当。追いきれない量の公式発表と海外ソースから、読むべき変更だけを日本語で整理する。
一次情報（Google Search Central 等）をRSSで毎日収集し、Claudeで日本語解説を生成して自動公開する（GitHub Actions）。

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
| `/articles/[id]` | 記事（URLは連番 `/articles/12`。Article + BreadcrumbList + FAQPage JSON-LD、出典一覧、関連記事、広告） |
| `/category/{seo,geo,news}` | カテゴリ別一覧 |
| `/tag/[tag]` | タグ別一覧 |
| `/tools` | SEO・GEOツール比較（`content/tools.json`。運営者が公式ページを確認したものだけ掲載、ItemList JSON-LD） |
| `/about` `/privacy` `/disclaimer` | 運営者情報（E-E-A-T）/ プライバシー / 免責（AdSense審査に必要） |
| `/sitemap.xml` `/robots.txt` `/feed.xml` `/llms.txt` `/ads.txt` | クローラー・LLM・AdSense向け |
| `/manifest.webmanifest` `/icon-192.png` `/icon-512.png` | PWAマニフェストとアイコン（`src/lib/icon.tsx` で描画） |

## 記事パイプライン
```
scripts/sources.ts  収集元（公式: Search Central / Search Status / The Keyword / Bing / OpenAI、メディア: SEL / SEJ / SERoundtable / 海外SEO情報ブログ、
                    ツール検知: Google News 日本語検索RSS「LLMO」「GEO対策」「AIO対策」「AI検索ツール」「AI visibility」）
      ↓ npm run collect [日数]   content/candidates.csv に「候補」として追記。話題スコア付き。Google NewsのURLは元記事に復号（scripts/googleNews.ts）
      ↓ npm run pick N           「候補」からN件を自動で「採用」に（scripts/pick.ts）。人が手で status を 採用/却下 にしてもよい
      ↓ npm run generate N [--publish]
                                「採用」をスコア順にN件、Claudeが元記事をweb_fetchで読んで MDX を出力 → status を「公開」に
                                --publish なら draft:false（自動公開）、無指定なら draft:true（下書き）
      ↓ GitHub Actions           毎朝7時JST、collect→pick→generate --publish→本番ビルド検証→main へ push
                                （.github/workflows/daily-articles.yml）→ Vercel が自動デプロイ
```
**話題スコア**: 検索専門の公式ソース+3（その他公式+1）、同じ話題を報じた他ソース数×2（上限+6。タイトルの語の重なりでクラスタ化）、3日以内+1、テーマ語の一致数（上限3）、ツール発表+2。
**自動採用の基準**（`scripts/pick.ts`）: スコア2以上・公開21日以内・「ツール検知」メモなし（PR配信のツール発表は /tools の材料で記事にしない）。
すでに「公開」「採用」にした話題と語が重なるものは選ばない（別ソースが報じた同じ発表の二重記事を防ぐ）。
**重複排除**: URL、および正規化タイトル（PR TIMES転載をInfoseek/Excite等と同一視）。話題の重なり判定は `scripts/topic.ts` に共通化。
**自動公開の関門は2つ**: `scripts/generate.ts` の `validate()`（カテゴリ・description長・actions・本文1,200字以上・必須見出し4種・図解2個以上・FAQ2問以上）と、
Actions上の `npm run typecheck && npm run build`（本番ビルド＝MDXが実際にレンダリングできるか）。どちらかで落ちたらpushしないので、その日は何も公開されない。
APIエラー時は「採用」のまま次回に回し、内容起因の失敗・検査落ちは「却下」にしてメモを残す。

## 記事の型（他媒体との差別化）
- 冒頭に **Key Points パネル**（影響度 / 対象 / 今すぐやること）を固定表示
- 本文に「## 影響を受けるページ・クエリ」（自社のどのページ・クエリが動くかを特定。検索側のKPI推測は書かない）と「## やること／やらなくていいこと」を必須化
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
- **キービジュアルは持たない**。記事カード・記事ページ・一覧ヘッダーはタイポグラフィと
  カテゴリ色だけで組む。装飾画像は使わない。
- **OGP画像**: `src/app/opengraph-image.tsx`（サイト）と `src/app/articles/[slug]/opengraph-image.tsx`（記事ごと）で
  実PNGを生成（`next/og`）。背景は黒地＋カテゴリ色のグラデーション。和文は Google Fonts から
  **その画像で使う文字だけ**を切り出して読む（`src/lib/og.tsx` の `loadOgFont`。ImageResponseの500KB制限対策）。
  フォント取得に失敗しても画像自体は出る（和文が欠けるだけ）。ビルド時にネットワークが必要。
- **記事内の図解**: 上記の `figures.tsx`（6種）。本文中のビジュアルはこれだけ。

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
- **構造化データ**: Organization / WebSite（全ページ）、Article（記事）、CollectionPage + ItemList（一覧・カテゴリ・タグ）、
  ItemList（/tools）、BreadcrumbList（全ページ）、FAQPage（記事の「## よくある質問」と /about）
- **BreadcrumbList は `src/components/Breadcrumbs.tsx` が可視UIとJSON-LDを同じ配列から出す**（表示と構造化データがずれない）。
  一覧・固定ページは `PageHeader` に `crumbs` を渡すだけで付く。
- **FAQPage は記事本文から抽出する**（`src/lib/faq.ts`）。可視テキストと一言一句一致させるため別データを持たない。
  生成側は `validate()` でFAQ2問以上を必須にしている。
- 記事の出典を `citation` として構造化データに宣言、本文末尾にも一覧表示
- **一覧ページの冒頭に直答段落**（件数・期間・最新記事。`src/lib/collection.ts`）。
  「◯◯の最新動向は？」のような包括クエリにそのまま答えるパッセージをAI検索に渡す。
- **薄いタグページの足切り**: 記事が `TAG_MIN_ARTICLES`（`src/lib/site.ts`、既定2）本未満のタグは
  `noindex, follow` にし sitemap からも外す。表示側と生成側が `src/lib/content.ts` の同じ関数を見るのでズレない。
  ページ自体は残すので内部リンクの経路としては機能する。
- sitemap の `lastmod` はそのページに載っている記事の最新更新日（全ページ同じ日付にしない）
- `llms.txt`（サイト概要・記事の作り方・収集元の一次情報源・引用時の注意・最新50本）、RSS、sitemap、robots
- テキスト系ルート（`llms.txt` / `feed.xml` / `ads.txt`）は `force-static`。全ページが静的生成。
- アイコン一式: `favicon.ico`（静的）/ `icon.tsx`(32) / `apple-icon.tsx`(180) / `icon-192.png` `icon-512.png`（manifest参照用の固定URL）/ `manifest.ts`
- E-E-A-T: 運営者個人の経歴は一切載せない方針。**about には記事がAI生成・自動公開であることと自動検査の内容、
  収集元の媒体一覧（`scripts/sources.ts` の `home` から生成）、FAQを掲載する**。記事本文でも一人称の経験談は書かない。
  連絡窓口は公式Xのみ（`NEXT_PUBLIC_X_SCREEN_NAME` 設定時に Organization contactPoint / sameAs、記事末尾のフォローCTA、aboutの連絡先が有効化）
- 記事冒頭に「## 結論」を置き、その1文目をタイトルへの直答の断定文にする執筆ルール（AI検索のパッセージ抽出向け）。
  FAQの回答は質問文を読まなくても意味が通る形にする。
- 和文Webフォント不使用（端末フォント）で初期表示を軽く保つ

## 未着手 / 将来
- 記事内検索、英語版
- タグURLのASCII化（現状 `/tag/店舗集客`）。308リダイレクトと衝突管理が必要なので、タグが定着してから判断する
- 週次/月次のまとめページ。記事本数が増えて一覧が長くなってから
- 業務委託・問い合わせ導線はPVが伸びてから（現段階では設計に含めない）
