# seo-geo-web

SEO・GEO（生成エンジン最適化）・AIO（AI Overview最適化）の最新動向と実務ノウハウを発信するメディア。
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
| `/articles/[slug]` | 記事（Article + BreadcrumbList JSON-LD、出典一覧、関連記事、広告） |
| `/category/{seo,geo,aio,news}` | カテゴリ別一覧 |
| `/tag/[tag]` | タグ別一覧 |
| `/about` `/privacy` `/disclaimer` | 運営者情報（E-E-A-T）/ プライバシー / 免責（AdSense審査に必要） |
| `/sitemap.xml` `/robots.txt` `/feed.xml` `/llms.txt` `/ads.txt` | クローラー・LLM・AdSense向け |

## 記事パイプライン
```
scripts/sources.ts  収集元RSS（公式: Search Central / Search Status / The Keyword / Bing / OpenAI、メディア: SEL / SEJ / SERoundtable / 海外SEO情報ブログ）
      ↓ npm run collect      7日以内・未処理・トピック語を含むものを content/queue.json へ
      ↓ npm run generate N   Claudeが元記事をweb_fetchで読み、frontmatter付きMDXを content/articles/ に draft:true で出力
      ↓ GitHub Actions       毎朝7時JST、上記を実行して PR を作成（.github/workflows/daily-articles.yml）
      ↓ 人間レビュー          draft:false に変更してマージ → Vercel が自動デプロイ
```
処理済みURLは `content/processed.json` に記録し、重複生成を防ぐ。APIエラー時は候補をキューに戻し、内容起因の失敗のみ処理済みにする。

## 記事の型（他媒体との差別化）
- 冒頭に **Key Points パネル**（影響度 / 対象 / 今すぐやること）を固定表示
- 本文に「## 検索側の狙い」（プロダクト側の意図をPdM視点で推論）と「## やること／やらなくていいこと」を必須化
- 日本のサイトでの具体例を最低1つ。AI定型表現は禁止（`scripts/generate.ts` の SYSTEM_PROMPT 参照）

## デザイン
- 黒×生成り（paper）×エレクトリックライム（accent）。カテゴリ色: seo=青 / geo=紫 / aio=ライム / news=橙（`src/lib/categoryStyle.ts`）
- 欧文は Space Grotesk（next/font）、和文は端末フォント
- `globals.css` の `@theme` にトークン集約。ダークモード対応

## 記事 frontmatter
```yaml
title: "..."
description: "..."        # 90〜120字
date: "2026-08-23"
updated: "2026-08-23"     # 任意
category: "seo"           # seo | geo | aio | news
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

## SEO / AIO 対策
- Organization / WebSite / Article / BreadcrumbList の JSON-LD
- 記事の出典を `citation` として構造化データに宣言、本文末尾にも一覧表示
- `llms.txt`（サイト概要＋主要URL）、RSS、sitemap、robots
- 記事冒頭に「## 結論」を置く執筆ルール（AI検索のパッセージ抽出向け）
- 和文Webフォント不使用（端末フォント）で初期表示を軽く保つ

## 未着手 / 将来
- OGP画像の自動生成、記事内検索、英語版
- 業務委託・問い合わせ導線はPVが伸びてから（現段階では設計に含めない）
