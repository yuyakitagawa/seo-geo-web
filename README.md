# seo-geo-web

SEOとGEO（生成AI検索最適化。AIO/LLMOと呼ばれる領域を含む）の最新動向と実務ノウハウを発信するメディア。
読者は事業会社・制作会社のSEO/GEO担当。追いきれない量の公式発表と海外ソースから、読むべき変更だけを日本語で整理する。
一次情報（Google Search Central 等）をRSSで毎日収集し、Claudeで日本語解説を生成して自動公開する（GitHub Actions）。

## スタック
- Next.js 16 (App Router, SSG) + TypeScript + Tailwind CSS v4 (+ @tailwindcss/typography)
- 記事: リポジトリ内 MDX（`next-mdx-remote`）。CMS不使用。
- 計測: Vercel Analytics / Speed Insights / GA4（`NEXT_PUBLIC_GA_ID` 設定時）
- 収益: Google AdSense（`NEXT_PUBLIC_ADSENSE_CLIENT` 設定時のみ出力。未設定なら広告関連は一切出ない）
- 記事生成: `@anthropic-ai/sdk`（`claude-sonnet-5`・effort medium。草稿が検査に落ちたときだけ編集長レビューで改稿。品質不足なら `claude-opus-5` へ）

## ページ構成
| パス | 内容 |
|---|---|
| `/` | 新着記事・カテゴリ・タグ |
| `/articles` | 全記事一覧 |
| `/articles/[id]` | 記事（URLは連番 `/articles/12`。Article + BreadcrumbList + FAQPage JSON-LD、出典一覧、関連記事、広告） |
| `/category/{seo,geo,news}` | カテゴリ別一覧 |
| `/tag/[tag]` | タグ別一覧 |
| `/seo` `/geo` | 用語の解説ページ（「SEO対策とは」「GEOとは」）。定義1文＋要点3つ＋比較表＋手順＋FAQ＋一次情報。データは `src/lib/guides.ts`、部品は `src/components/guide.tsx`（Article + DefinedTerm + FAQPage + BreadcrumbList JSON-LD） |
| `/tools` | SEO・GEOツール比較（`content/tools.json`。運営者が公式ページを確認したものだけ掲載、ItemList JSON-LD） |
| `/about` `/privacy` `/disclaimer` | 運営者情報（運営方針・記事の作り方・収集元・FAQ）/ プライバシーポリシー（AdSense・GA・CookieのAdSense必須開示）/ 免責事項（正確性・外部リンク・著作権と引用）|
| `/contact` | お問い合わせ窓口。`NEXT_PUBLIC_CONTACT_EMAIL` / `NEXT_PUBLIC_CONTACT_FORM_URL` / `NEXT_PUBLIC_X_SCREEN_NAME` が**1つも無いとビルド時に404**になり、フッター・sitemapにも出ない |
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
**記事の日付**（`date`）は出典が公開された日に合わせる（生成日ではない）。出典日が取れない・未来日の場合だけ生成日にする。
**重複排除**: URL、および正規化タイトル（PR TIMES転載をInfoseek/Excite等と同一視）。話題の重なり判定は `scripts/topic.ts` に共通化。
**自動公開の関門は2つ**: `scripts/generate.ts` の `validate()`（カテゴリ・description長・actions・本文1,200字以上・必須見出し4種・図解2個以上・FAQ2問以上）と、
Actions上の `npm run typecheck && npm run build`（本番ビルド＝MDXが実際にレンダリングできるか）。どちらかで落ちたらpushしないので、その日は何も公開されない。
APIエラー時は「採用」のまま次回に回し、内容起因の失敗・検査落ちは「却下」にしてメモを残す。

## HOW TO記事パイプライン（ストック型）
上のパイプラインはRSS起点なので、出てくるのはニュース（フロー）だけになる。
検索とAI検索から継続的に読まれるのは手順・定義を持つストック記事なので、別系統で作る。
```
content/howto-topics.csv   テーマ表。人が status を「採用」にする。1行 = 1記事
                           列: status / category / title(タイトル案) / intent(検索意図) / sources(一次情報URL、| 区切り) / articleId / note
      ↓ npm run generate:howto N [--publish]
                           「採用」をN件、Claudeが指定URLをすべてweb_fetchで読んで MDX を出力（scripts/generate-howto.ts）
                           → テーマ表の status を「公開」に
```
- 出典は**テーマ表に書いたURLだけ**を許す（モデルが別URLを足したら記事ごと捨てる）。書ける事実の範囲をテーマ表で固定する。
- 必須見出しは「## 結論 / ## 手順 / ## やること／やらなくていいこと / ## よくある質問」、本文2,000字以上、FAQ3問以上。
- 「最近」「現在」のような時点依存の表現を禁止（半年後に読んでも成立させるため）。
- 生成失敗したテーマは「候補」に戻してメモを残す（ニュース側と違い、テーマ自体は捨てない）。
- プロンプトの共通部分（媒体の性格・図解・文体）は `scripts/prompt.ts`、採番・検査・書き出しは `scripts/article.ts` に集約。

## 記事の型（他媒体との差別化）
- frontmatter の `type` で **news（フロー）/ howto（ストック）** を区別する。カテゴリページは howto を上、news を下に分けて出す
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
- **キービジュアルはコードで生成する**（`src/components/KeyVisual.tsx`）。写真素材は持たない。
  記事ID（slug）をシードにした擬似乱数で図柄を決めるので、同じ記事は常に同じ絵になり、
  毎朝の自動生成パイプラインでも人手が要らない。図柄は5種（同心円 / 縦棒 / ノード /
  波 / タイル）、配色はカテゴリ色＋アクセント。インラインSVGなので追加リクエストは発生しない。
  使い所は記事ページのヘッダー背景（`articles/[slug]/page.tsx`）と一覧カードの上部帯（`ArticleCard.tsx`）。
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
type: "news"              # news（既定・省略可） | howto
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
- **用語の解説ページ `/seo` `/geo`**: 「SEO対策とは」「GEOとは」という定義クエリの受け皿。
  定義文・要点・FAQ・出典・更新日を `src/lib/guides.ts` の1か所に持ち、**可視テキスト・JSON-LD（DefinedTerm / FAQPage）・llms.txt が同じ文字列を使う**。
  記事（フロー）と違い日付で古くならないストックページなので、sitemap の priority はトップの次に高い 0.9。
  事実は各社の公式ドキュメント（Google 検索セントラル / OpenAI / Perplexity / Anthropic / arXiv / web.dev）で裏取りし、citation に入れている。
- **一覧ページの冒頭に直答段落**（件数・期間・最新記事。`src/lib/collection.ts`）。
  「◯◯の最新動向は？」のような包括クエリにそのまま答えるパッセージをAI検索に渡す。
- **薄いタグページの足切り**: 記事が `TAG_MIN_ARTICLES`（`src/lib/site.ts`、既定2）本未満のタグは
  `noindex, follow` にし sitemap からも外す。表示側と生成側が `src/lib/content.ts` の同じ関数を見るのでズレない。
  ページ自体は残すので内部リンクの経路としては機能する。
- sitemap の `lastmod` はそのページに載っている記事の最新更新日（全ページ同じ日付にしない）
- `llms.txt`（冒頭に「用語の定義」＝ `/seo` `/geo` の定義文をそのまま掲載・サイト概要・記事の作り方・収集元の一次情報源・引用時の注意・最新50本）、RSS、sitemap、robots
- テキスト系ルート（`llms.txt` / `feed.xml` / `ads.txt`）は `force-static`。全ページが静的生成。
- アイコン一式: `favicon.ico`（静的）/ `icon.tsx`(32) / `apple-icon.tsx`(180) / `icon-192.png` `icon-512.png`（manifest参照用の固定URL）/ `manifest.ts`
- E-E-A-T: 運営者個人の経歴は一切載せない方針。**about には記事がAI生成・自動公開であることと自動検査の内容、
  収集元の媒体一覧（`scripts/sources.ts` の `home` から生成）、FAQを掲載する**。記事本文でも一人称の経験談は書かない。
  連絡窓口は匿名のまま用意する（メール or フォーム or 公式X。Organization contactPoint はメール > フォーム > X の順で1つ宣言）

## AdSense審査で見られる点（実装済み）
- 固定ページ: `/about`（運営者・記事の作り方・編集方針・FAQ）/ `/privacy` / `/disclaimer` / `/contact`。全ページのフッターから到達できる
- プライバシーポリシーに **AdSenseが要求する開示**（第三者配信事業者によるCookie使用、パーソナライズ広告の無効化リンク、
  GAオプトアウトアドオン、EU/英国の同意、13歳未満）を記載。文言を削るとポリシー違反になる
- 免責事項に著作権・引用の方針と権利者からの連絡窓口
- 広告には必ず「広告」ラベル（`src/components/AdUnit.tsx`）。記事と誤認させる置き方をしない
- `ADSENSE_CLIENT` 設定時のみ、`<meta name="google-adsense-account">`（所有権確認）と `/ads.txt` を出力
- **審査前にユーザー側で必要な作業**: 連絡先env（`NEXT_PUBLIC_CONTACT_EMAIL` など）の設定、AdSense管理画面でのEU同意メッセージ（Privacy & messaging）の有効化
- 記事冒頭に「## 結論」を置き、その1文目をタイトルへの直答の断定文にする執筆ルール（AI検索のパッセージ抽出向け）。
  FAQの回答は質問文を読まなくても意味が通る形にする。
- 和文Webフォント不使用（端末フォント）で初期表示を軽く保つ

## 未着手 / 将来
- 記事内検索、英語版
- タグURLのASCII化（現状 `/tag/店舗集客`）。308リダイレクトと衝突管理が必要なので、タグが定着してから判断する
- 週次/月次のまとめページ。記事本数が増えて一覧が長くなってから
- 業務委託の導線はPVが伸びてから（現段階では設計に含めない。`/contact` は問い合わせ受付のみで受注導線は置かない）
