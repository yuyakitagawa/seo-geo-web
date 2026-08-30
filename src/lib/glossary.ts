import { SITE_URL } from "./site";

// SEO・GEOの用語集（/glossary）のデータ。
//
// 「◯◯とは」は検索でもAI検索でも最も多い形の質問で、AI検索は**質問に直答する短い定義文**を抜き出す。
// `/seo` `/geo` は主要語2つを深く説明するページ、ここはその周辺語を1件ずつ短く定義するページ。
//
// ルール:
// - definition は**その1文だけ読んで意味が通る**こと（前の項目や見出しに依存しない）。AI検索がそのまま引用する単位。
// - 出典はこのサイトが既に一次情報として確認済みのものだけを使う（`guides.ts` / `curriculum.ts` / `crawlers.ts` と同じURL）。
//   出典に書かれていない数値・固有名詞は書かない。
// - 可視テキストと DefinedTerm の description は同じ文字列を使う（ずれる余地を作らない）。

export type GlossaryCategoryKey = "basics" | "technical" | "content" | "ai" | "measurement";

export const GLOSSARY_CATEGORIES: Record<GlossaryCategoryKey, { label: string; lead: string }> = {
  basics: {
    label: "検索の基礎",
    lead: "検索エンジンがページを見つけて表示するまでの流れと、そこで使われる言葉。",
  },
  technical: {
    label: "テクニカル",
    lead: "クロール・インデックス・表示速度など、ページを「読める状態」にするための用語。",
  },
  content: {
    label: "コンテンツ",
    lead: "何を書くか、どう評価されるかに関わる用語。",
  },
  ai: {
    label: "AI検索とGEO",
    lead: "生成AIが回答を作るときの仕組みと、そこに関わるクローラー・ファイルの用語。",
  },
  measurement: {
    label: "計測",
    lead: "施策の効果を確認するための指標とレポート。",
  },
};

export const GLOSSARY_CATEGORY_KEYS = Object.keys(GLOSSARY_CATEGORIES) as GlossaryCategoryKey[];

// 出典。用語ごとに1つだけ持つ（複数並べると、どの記述がどの文書由来か分からなくなる）。
const S = {
  essentials: { title: "Google 検索の基本事項", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/essentials?hl=ja" },
  helpful: { title: "有用で信頼性の高い、ユーザー第一のコンテンツの作成", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content?hl=ja" },
  spam: { title: "Google ウェブ検索のスパムに関するポリシー", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/essentials/spam-policies?hl=ja" },
  crawlersOverview: { title: "Google クローラーとフェッチャーの概要", publisher: "Google 検索セントラル", url: "https://developers.google.com/crawling/docs/crawlers-fetchers/overview-google-crawlers?hl=ja" },
  commonCrawlers: { title: "Google の一般的なクローラー", publisher: "Google 検索セントラル", url: "https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers?hl=ja" },
  userTriggered: { title: "ユーザー トリガー フェッチャー", publisher: "Google 検索セントラル", url: "https://developers.google.com/crawling/docs/crawlers-fetchers/google-user-triggered-fetchers?hl=ja" },
  robots: { title: "robots.txt の書き方、設定と送信", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/crawling-indexing/robots/intro?hl=ja" },
  noindex: { title: "noindex でコンテンツをインデックスから除外する", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/crawling-indexing/block-indexing?hl=ja" },
  canonical: { title: "重複した URL を統合する", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls?hl=ja" },
  sitemaps: { title: "サイトマップの作成と送信", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview?hl=ja" },
  structuredData: { title: "構造化データの仕組みについて", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=ja" },
  gallery: { title: "構造化データ マークアップの一覧（検索ギャラリー）", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/appearance/structured-data/search-gallery?hl=ja" },
  jsSeo: { title: "JavaScript の基本を理解する", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics?hl=ja" },
  titleLink: { title: "Google 検索結果のタイトルリンクを管理する", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/appearance/title-link?hl=ja" },
  snippet: { title: "スニペットを管理する", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/appearance/snippet?hl=ja" },
  pageExperience: { title: "ページ エクスペリエンスの概要", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/appearance/page-experience?hl=ja" },
  siteMove: { title: "URL の変更を伴うサイト移転", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes?hl=ja" },
  coreUpdates: { title: "Google 検索のランキング アップデート", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/updates/core-updates?hl=ja" },
  aiFeatures: { title: "AI 機能とウェブサイト", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/appearance/ai-features?hl=ja" },
  aiContent: { title: "Google 検索における AI 生成コンテンツに対する方針", publisher: "Google 検索セントラル ブログ", url: "https://developers.google.com/search/blog/2023/02/google-search-and-ai-content?hl=ja" },
  vitals: { title: "Web Vitals", publisher: "web.dev（Google）", url: "https://web.dev/articles/vitals" },
  lcp: { title: "Optimize Largest Contentful Paint", publisher: "web.dev（Google）", url: "https://web.dev/articles/optimize-lcp" },
  inp: { title: "Optimize Interaction to Next Paint", publisher: "web.dev（Google）", url: "https://web.dev/articles/optimize-inp" },
  cls: { title: "Optimize Cumulative Layout Shift", publisher: "web.dev（Google）", url: "https://web.dev/articles/optimize-cls" },
  perf: { title: "検索パフォーマンス レポート（検索結果）", publisher: "Search Console ヘルプ", url: "https://support.google.com/webmasters/answer/7576553?hl=ja" },
  indexReport: { title: "ページ インデックス登録レポート", publisher: "Search Console ヘルプ", url: "https://support.google.com/webmasters/answer/7440203?hl=ja" },
  urlInspection: { title: "URL 検査ツール", publisher: "Search Console ヘルプ", url: "https://support.google.com/webmasters/answer/9012289?hl=ja" },
  manualActions: { title: "[手動による対策] レポート", publisher: "Search Console ヘルプ", url: "https://support.google.com/webmasters/answer/9044175?hl=ja" },
  trafficDrops: { title: "検索トラフィックの減少をデバッグする", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/monitor-debug/debugging-search-traffic-drops?hl=ja" },
  geoPaper: { title: "GEO: Generative Engine Optimization（arXiv:2311.09735）", publisher: "Aggarwal ほか（KDD 2024）", url: "https://arxiv.org/abs/2311.09735" },
  openaiBots: { title: "Overview of OpenAI Crawlers", publisher: "OpenAI", url: "https://developers.openai.com/api/docs/bots" },
  perplexityBots: { title: "PerplexityBot", publisher: "Perplexity", url: "https://docs.perplexity.ai/guides/bots" },
  anthropicBots: { title: "Does Anthropic crawl data from the web, and how can site owners block the crawler?", publisher: "Anthropic", url: "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler" },
  llmstxt: { title: "The /llms.txt file", publisher: "llmstxt.org", url: "https://llmstxt.org/" },
} as const;

export type GlossaryTerm = {
  /** ページ内アンカーのid。ASCIIのみ */
  slug: string;
  term: string;
  /** 略称・英語表記・言い換え。DefinedTerm の alternateName になる */
  aliases: string[];
  category: GlossaryCategoryKey;
  /** 定義。この1文だけで意味が通ること */
  definition: string;
  /** 実務でどう効くか。1〜2文（任意） */
  note?: string;
  /** サイト内の詳しいページ */
  seeAlso?: { href: string; label: string }[];
  source: { title: string; publisher: string; url: string };
};

export const GLOSSARY: GlossaryTerm[] = [
  // ---------------------------------------------------------------- 検索の基礎
  {
    slug: "seo",
    term: "SEO",
    aliases: ["SEO対策", "検索エンジン最適化", "Search Engine Optimization"],
    category: "basics",
    definition:
      "SEO（検索エンジン最適化）とは、検索エンジンが自社のページを取得し、内容を理解し、ユーザーの検索クエリに対して表示できる状態に整える一連の施策のことです。",
    note: "Googleが公式に示している判断基準は「Google 検索の基本事項」の3本柱（技術的な要件・スパムに関するポリシー・主要なベストプラクティス）で、隠れた裏技はありません。",
    seeAlso: [{ href: "/seo", label: "SEO対策とは（詳しい解説）" }],
    source: S.essentials,
  },
  {
    slug: "crawl",
    term: "クロール",
    aliases: ["crawling", "クローリング"],
    category: "basics",
    definition:
      "クロールとは、検索エンジンのプログラムがリンクやサイトマップをたどってページのURLを訪問し、その中身をダウンロードすることです。",
    note: "クロールされなければインデックスもされません。robots.txt でブロックしているページは、そもそもここで止まります。",
    seeAlso: [{ href: "/tools/ai-crawlers", label: "robots.txt チェッカーで許可状況を見る" }],
    source: S.crawlersOverview,
  },
  {
    slug: "index",
    term: "インデックス",
    aliases: ["インデックス登録", "index", "indexing"],
    category: "basics",
    definition:
      "インデックスとは、検索エンジンがクロールしたページの内容を解析し、検索結果に表示できる形でデータベースに登録することです。",
    note: "クロールされてもインデックスされるとは限りません。Search Consoleの「ページ」レポートで、登録されなかったURLとその理由を確認できます。",
    seeAlso: [{ href: "/learn/technical", label: "テクニカルSEOのレッスン" }],
    source: S.indexReport,
  },
  {
    slug: "query",
    term: "クエリ",
    aliases: ["検索クエリ", "query", "キーワード"],
    category: "basics",
    definition:
      "クエリとは、ユーザーが検索窓に実際に入力した語句のことです。",
    note: "サイト側が狙う「キーワード」と、ユーザーが実際に打つ「クエリ」は一致しないことが多く、Search Consoleの検索パフォーマンスレポートで実際のクエリを確認できます。",
    seeAlso: [{ href: "/learn/search-intent", label: "検索意図のレッスン" }],
    source: S.perf,
  },
  {
    slug: "search-intent",
    term: "検索意図",
    aliases: ["インテント", "search intent", "user intent"],
    category: "basics",
    definition:
      "検索意図とは、ユーザーがそのクエリを打った目的、つまり何を知りたい・したいのかということです。",
    note: "同じ語でも「意味を知りたい」「比較したい」「今すぐ買いたい」で必要なページの形が変わります。",
    seeAlso: [{ href: "/learn/search-intent", label: "検索意図のレッスン" }],
    source: S.helpful,
  },
  {
    slug: "core-update",
    term: "コアアップデート",
    aliases: ["core update", "コア アップデート"],
    category: "basics",
    definition:
      "コアアップデートとは、Googleが年に数回行う検索ランキングの大規模な見直しのことです。",
    note: "Googleは、順位が下がったサイトに必ずしも問題があるわけではないと説明しています。個別のペナルティではなく評価の基準そのものが変わるため、対処は個別の修正ではなくコンテンツ全体の見直しになります。",
    seeAlso: [{ href: "/learn/updates-risk", label: "アップデートと順位変動のレッスン" }],
    source: S.coreUpdates,
  },

  // ---------------------------------------------------------------- テクニカル
  {
    slug: "robots-txt",
    term: "robots.txt",
    aliases: ["ロボッツテキスト"],
    category: "technical",
    definition:
      "robots.txt とは、サイトのルートに置くテキストファイルで、どのクローラーにどのパスのクロールを許可するかを指示するものです。",
    note: "クロールを止めるファイルであって、インデックスを止めるものではありません。インデックスさせたくないページには noindex を使います。",
    seeAlso: [{ href: "/tools/ai-crawlers", label: "robots.txt チェッカー" }],
    source: S.robots,
  },
  {
    slug: "noindex",
    term: "noindex",
    aliases: ["ノーインデックス"],
    category: "technical",
    definition:
      "noindex とは、metaタグまたはHTTPヘッダーで指定する、そのページを検索結果に表示しないための指示です。",
    note: "robots.txt でクロールをブロックしているページの noindex は読まれません。noindex を効かせたいページはクロールを許可しておく必要があります。",
    seeAlso: [{ href: "/learn/technical", label: "テクニカルSEOのレッスン" }],
    source: S.noindex,
  },
  {
    slug: "canonical",
    term: "canonical",
    aliases: ["正規URL", "カノニカル", "rel=canonical"],
    category: "technical",
    definition:
      "canonical とは、同じ内容が複数のURLで見られるときに、どれを代表のURLとして扱ってほしいかを検索エンジンに伝える指定です。",
    note: "指定は絶対的な命令ではなくヒントとして扱われます。内部リンクやサイトマップも同じURLを指しているほうが意図が伝わります。",
    source: S.canonical,
  },
  {
    slug: "sitemap",
    term: "サイトマップ",
    aliases: ["sitemap.xml", "XMLサイトマップ"],
    category: "technical",
    definition:
      "サイトマップとは、サイト内のURLの一覧を検索エンジンに知らせるXMLファイルのことです。",
    note: "掲載してもインデックスが保証されるわけではありません。noindex のURLを載せると矛盾した指示になるので、載せる条件は表示側と必ずそろえます。",
    source: S.sitemaps,
  },
  {
    slug: "structured-data",
    term: "構造化データ",
    aliases: ["structured data", "JSON-LD", "schema.org", "スキーママークアップ"],
    category: "technical",
    definition:
      "構造化データとは、ページの内容が何であるか（記事・商品・FAQなど）を決まった書式で機械に伝えるためのマークアップです。",
    note: "Googleが対応している型と必須項目は検索ギャラリーに一覧があります。可視テキストと内容が一致していることが条件です。",
    seeAlso: [{ href: "/tools/page-audit", label: "ページ診断で構造化データを検査する" }],
    source: S.structuredData,
  },
  {
    slug: "rich-result",
    term: "リッチリザルト",
    aliases: ["rich result", "リッチスニペット"],
    category: "technical",
    definition:
      "リッチリザルトとは、構造化データをもとに、検索結果でレビューの星やFAQの折りたたみなど通常の青いリンク以外の要素が付いた表示のことです。",
    note: "構造化データを付けても表示されるとは限らず、Googleは表示を保証していません。",
    source: S.gallery,
  },
  {
    slug: "rendering",
    term: "レンダリング",
    aliases: ["rendering", "JavaScript SEO"],
    category: "technical",
    definition:
      "レンダリングとは、検索エンジンが取得したHTMLに対してJavaScriptを実行し、ブラウザで見えるのと同じ最終的なページを組み立てる処理のことです。",
    note: "Googlebotはレンダリングを行いますが、クロールとは別のタイミングになります。本文がJavaScriptでしか出ないページは反映が遅れることがあります。",
    seeAlso: [{ href: "/tools/page-audit", label: "サーバーが返すHTMLに本文があるか診断する" }],
    source: S.jsSeo,
  },
  {
    slug: "core-web-vitals",
    term: "Core Web Vitals",
    aliases: ["コアウェブバイタル", "CWV", "ウェブに関する主な指標"],
    category: "technical",
    definition:
      "Core Web Vitals とは、ページの読み込み・応答性・視覚的な安定性を測る3つの指標（LCP・INP・CLS）のことです。",
    note: "ページ エクスペリエンスの一部として扱われますが、Googleはこれだけで順位が決まるものではないとしています。",
    seeAlso: [{ href: "/learn/technical", label: "テクニカルSEOのレッスン" }],
    source: S.vitals,
  },
  {
    slug: "lcp",
    term: "LCP",
    aliases: ["Largest Contentful Paint", "最大コンテンツの描画"],
    category: "technical",
    definition:
      "LCP（Largest Contentful Paint）とは、ページを開いてから画面内で最も大きな要素が表示されるまでの時間を測る指標です。",
    note: "多くの場合、最初に見えるヒーロー画像や見出しがこの要素になります。",
    source: S.lcp,
  },
  {
    slug: "inp",
    term: "INP",
    aliases: ["Interaction to Next Paint", "次のペイントまでのインタラクション"],
    category: "technical",
    definition:
      "INP（Interaction to Next Paint）とは、ユーザーがクリックやタップをしてから、その反応が画面に描画されるまでの遅さを測る指標です。",
    note: "重いJavaScriptがメインスレッドを占有していると悪化します。",
    source: S.inp,
  },
  {
    slug: "cls",
    term: "CLS",
    aliases: ["Cumulative Layout Shift", "累積レイアウトシフト"],
    category: "technical",
    definition:
      "CLS（Cumulative Layout Shift）とは、読み込みの途中でページの要素が予期せず動いてしまう量を測る指標です。",
    note: "画像や広告枠に幅と高さを指定しておけば、後から挿入されても他の要素が押し出されません。",
    source: S.cls,
  },
  {
    slug: "redirect-301",
    term: "301リダイレクト",
    aliases: ["恒久リダイレクト", "permanent redirect", "308リダイレクト"],
    category: "technical",
    definition:
      "301リダイレクトとは、古いURLに来たアクセスを新しいURLへ恒久的に転送し、検索エンジンにURLが移転したことを伝える指定です。",
    note: "リダイレクトを連鎖させず、古いURLから最終的な行き先へ直接向けます。",
    source: S.siteMove,
  },

  // ---------------------------------------------------------------- コンテンツ
  {
    slug: "eeat",
    term: "E-E-A-T",
    aliases: ["経験・専門性・権威性・信頼性", "EEAT", "E-A-T"],
    category: "content",
    definition:
      "E-E-A-Tとは、経験（Experience）・専門性（Expertise）・権威性（Authoritativeness）・信頼性（Trust）の頭文字で、コンテンツの品質を考えるためにGoogleが示している観点です。",
    note: "ランキングに直接使われる単一のスコアではありません。中心にあるのは信頼性で、残りの3つはそれを支える要素として説明されています。",
    seeAlso: [{ href: "/learn/writing", label: "コンテンツの書き方のレッスン" }],
    source: S.helpful,
  },
  {
    slug: "helpful-content",
    term: "有用で信頼性の高いコンテンツ",
    aliases: ["helpful content", "ユーザー第一のコンテンツ"],
    category: "content",
    definition:
      "有用で信頼性の高いコンテンツとは、検索エンジンで上位に出すことではなく、読む人の役に立つことを第一の目的として作られたコンテンツのことです。",
    note: "Googleは自己評価用の質問リストを公開しており、「読んだ人が満足して他を探さずに済むか」という観点で自問することを勧めています。",
    seeAlso: [{ href: "/learn/writing", label: "コンテンツの書き方のレッスン" }],
    source: S.helpful,
  },
  {
    slug: "title-link",
    term: "タイトルリンク",
    aliases: ["title タグ", "検索結果のタイトル"],
    category: "content",
    definition:
      "タイトルリンクとは、検索結果に見出しとして表示されるリンクのテキストのことです。",
    note: "多くの場合 title 要素が使われますが、Googleはページの内容とクエリに応じて別のテキストに書き換えることがあります。",
    source: S.titleLink,
  },
  {
    slug: "snippet",
    term: "スニペット",
    aliases: ["snippet", "説明文", "meta description"],
    category: "content",
    definition:
      "スニペットとは、検索結果でタイトルの下に表示される、ページの内容を説明する短い文章のことです。",
    note: "meta description が使われることもあれば、クエリに合わせて本文から抜き出されることもあります。",
    source: S.snippet,
  },
  {
    slug: "spam-policy",
    term: "スパムに関するポリシー",
    aliases: ["spam policies", "Googleのスパムポリシー"],
    category: "content",
    definition:
      "スパムに関するポリシーとは、Google検索で許可されない手法を定めた規定で、違反すると順位が下がるか検索結果から削除されることがあります。",
    note: "検索順位の操作を主目的とした大量生成、無断複製、期限切れドメインの悪用などが挙げられています。",
    source: S.spam,
  },
  {
    slug: "ai-generated-content",
    term: "AI生成コンテンツ",
    aliases: ["AIライティング", "AI generated content"],
    category: "content",
    definition:
      "AI生成コンテンツとは、生成AIを使って作られた文章や画像などのコンテンツのことです。",
    note: "Googleは、どう作られたかではなく品質で評価するとしており、AIの使用自体は問題にしていません。順位操作を主目的とした大量生成はスパムポリシーの対象です。",
    source: S.aiContent,
  },

  // ---------------------------------------------------------------- AI検索・GEO
  {
    slug: "geo",
    term: "GEO",
    aliases: ["Generative Engine Optimization", "生成AI検索最適化", "AIO", "LLMO", "AEO"],
    category: "ai",
    definition:
      "GEO（Generative Engine Optimization）とは、生成AIが作る回答の中で自社のコンテンツが引用・言及されやすい状態に整える施策のことです。",
    note: "AIO・LLMO・AEOはほぼ同じ対象を指す呼び名違いです。GEOという語は2023年の論文（arXiv:2311.09735）に由来します。",
    seeAlso: [{ href: "/geo", label: "GEOとは（詳しい解説）" }],
    source: S.geoPaper,
  },
  {
    slug: "ai-overview",
    term: "AI Overview",
    aliases: ["AIによる概要", "AI Overviews"],
    category: "ai",
    definition:
      "AI Overview（AIによる概要）とは、Google検索の結果ページの上部に表示される、生成AIがまとめた回答とその参照リンクのことです。",
    note: "Googleは、ここに表示されるための追加要件はなく、通常の検索に対する最適化がそのまま適用されると説明しています。",
    seeAlso: [{ href: "/geo", label: "GEOとは（詳しい解説）" }],
    source: S.aiFeatures,
  },
  {
    slug: "ai-mode",
    term: "AI Mode",
    aliases: ["AIモード"],
    category: "ai",
    definition:
      "AI Mode（AIモード）とは、Google検索の中で、通常の検索結果一覧ではなく生成AIとの対話形式で回答を得るモードのことです。",
    seeAlso: [{ href: "/geo", label: "GEOとは（詳しい解説）" }],
    source: S.aiFeatures,
  },
  {
    slug: "ai-crawler",
    term: "AIクローラー",
    aliases: ["AI bot", "AIボット", "GPTBot", "ClaudeBot", "PerplexityBot"],
    category: "ai",
    definition:
      "AIクローラーとは、生成AIを提供する事業者が運用する、回答の生成やモデルの学習のためにWebページを取得するプログラムのことです。",
    note: "用途は「AI検索の回答に出るため」と「モデルの学習に使われる」に分かれ、robots.txt では別々のトークンで制御します。ブロックの影響が違うので、一括で止めないこと。",
    seeAlso: [{ href: "/tools/ai-crawlers", label: "robots.txt チェッカーで14種を判定する" }],
    source: S.openaiBots,
  },
  {
    slug: "google-extended",
    term: "Google-Extended",
    aliases: ["グーグルエクステンデッド"],
    category: "ai",
    definition:
      "Google-Extended とは、GoogleのAIモデルの学習などにコンテンツを使うかどうかを、robots.txt で個別に制御するためのトークンです。",
    note: "ページのクロールを行う実体ではなく、用途の制御に使うトークンです。ブロックしてもGoogle検索でのインデックスや順位には影響しません。",
    seeAlso: [{ href: "/tools/ai-crawlers", label: "robots.txt チェッカー" }],
    source: S.commonCrawlers,
  },
  {
    slug: "user-triggered-fetcher",
    term: "ユーザー トリガー フェッチャー",
    aliases: ["user-triggered fetcher", "ユーザー起点フェッチャー"],
    category: "ai",
    definition:
      "ユーザー トリガー フェッチャーとは、定期的な巡回ではなく、ユーザーの操作をきっかけにその場でページを取得するプログラムのことです。",
    note: "巡回型のクローラーとは別に扱われ、robots.txt の一般的なクローラー向けの記述に従わない場合があります。",
    source: S.userTriggered,
  },
  {
    slug: "llms-txt",
    term: "llms.txt",
    aliases: ["LLMsテキスト"],
    category: "ai",
    definition:
      "llms.txt とは、サイトの概要と主要なページを大規模言語モデル向けに平文でまとめる、サイトのルートに置く提案仕様のファイルです。",
    note: "標準化された仕様ではなく、対応するかどうかは各AI事業者に委ねられています。実ページ側の書き方を整えるほうが確実です。",
    seeAlso: [{ href: "/llms.txt", label: "このサイトの llms.txt" }],
    source: S.llmstxt,
  },
  {
    slug: "citation",
    term: "引用元リンク",
    aliases: ["citation", "出典リンク", "参照リンク"],
    category: "ai",
    definition:
      "引用元リンクとは、AIが生成した回答の中で、その内容の根拠として示される元ページへのリンクのことです。",
    note: "AI検索から人が訪れる経路はここに限られるため、GEOでは順位ではなく「引用されたか」を成果として見ます。",
    source: S.perplexityBots,
  },
  {
    slug: "ai-training-crawler",
    term: "学習用クローラー",
    aliases: ["training crawler", "AI学習クローラー"],
    category: "ai",
    definition:
      "学習用クローラーとは、AIモデルの訓練データを集める目的でページを取得するクローラーのことです。",
    note: "ブロックしても、検索結果やAI検索での引用には影響しません。引用してほしいが学習には使わせたくない、という切り分けができます。",
    seeAlso: [{ href: "/tools/ai-crawlers", label: "用途別に許可・ブロックを判定する" }],
    source: S.anthropicBots,
  },

  // ---------------------------------------------------------------- 計測
  {
    slug: "search-console",
    term: "Search Console",
    aliases: ["サーチコンソール", "GSC", "Google Search Console"],
    category: "measurement",
    definition:
      "Search Console とは、自分のサイトが Google 検索でどう扱われているかを確認できる、Google の無料ツールです。",
    note: "検索での表示回数・クリック・順位と、インデックス登録の状況を確認できます。SEOの効果は事前に予測できないため、判定材料は基本的にここの前後比較になります。",
    seeAlso: [{ href: "/learn/measurement", label: "計測のレッスン" }],
    source: S.perf,
  },
  {
    slug: "impressions",
    term: "表示回数",
    aliases: ["impressions", "インプレッション"],
    category: "measurement",
    definition:
      "表示回数とは、検索結果に自分のページのリンクが表示された回数のことです。",
    note: "表示回数があるのにクリックが少ない場合、順位ではなくタイトルと説明文が原因のことがあります。",
    source: S.perf,
  },
  {
    slug: "ctr",
    term: "CTR",
    aliases: ["クリック率", "click-through rate"],
    category: "measurement",
    definition:
      "CTR（クリック率）とは、検索結果に表示された回数のうち、実際にクリックされた割合のことです。",
    note: "上位に出ているのにCTRがサイト平均を下回るクエリは、タイトルの書き換えで改善できる候補です。",
    seeAlso: [{ href: "/learn/measurement", label: "計測のレッスン" }],
    source: S.perf,
  },
  {
    slug: "average-position",
    term: "平均掲載順位",
    aliases: ["average position", "平均順位"],
    category: "measurement",
    definition:
      "平均掲載順位とは、対象の期間・クエリにおいて、自分のページが検索結果で表示された位置の平均のことです。",
    note: "検索結果はユーザーや時期によって変わるため、単独の数値より前後比較で見ます。",
    source: S.perf,
  },
  {
    slug: "url-inspection",
    term: "URL検査",
    aliases: ["URL inspection", "URL検査ツール"],
    category: "measurement",
    definition:
      "URL検査とは、Search Console で個別のURLを指定し、インデックスの状況・取得できたHTML・レンダリング結果を確認できる機能です。",
    note: "「なぜこのページが出ないのか」を1URL単位で切り分けるときに使います。",
    source: S.urlInspection,
  },
  {
    slug: "manual-action",
    term: "手動による対策",
    aliases: ["manual action", "手動ペナルティ"],
    category: "measurement",
    definition:
      "手動による対策とは、Googleの担当者がスパムに関するポリシーへの違反を確認したうえで、そのサイトの掲載順位を下げるか検索結果から削除する措置のことです。",
    note: "Search Console にレポートがあり、通知が無ければ手動による対策は受けていません。順位が下がった原因の切り分けで最初に確認します。",
    seeAlso: [{ href: "/learn/updates-risk", label: "アップデートと順位変動のレッスン" }],
    source: S.manualActions,
  },
  {
    slug: "traffic-drop",
    term: "トラフィックの減少",
    aliases: ["traffic drop", "流入減"],
    category: "measurement",
    definition:
      "トラフィックの減少とは、検索からの流入が以前より減った状態のことで、原因は技術的な問題・アルゴリズムの変更・季節性・報道量の変化など複数に分かれます。",
    note: "Googleは減少のパターン別に切り分ける手順を公開しています。原因を決め打ちせず、まずグラフの形を見ます。",
    seeAlso: [{ href: "/learn/updates-risk", label: "アップデートと順位変動のレッスン" }],
    source: S.trafficDrops,
  },
  {
    slug: "page-experience",
    term: "ページ エクスペリエンス",
    aliases: ["page experience", "ページ体験"],
    category: "measurement",
    definition:
      "ページ エクスペリエンスとは、コンテンツの内容そのものとは別に、そのページがどれだけ快適に使えるかという観点のまとまりを指します。",
    note: "Googleは単一の指標ではないとしており、良い体験だけで有用でないコンテンツが上位になるわけではないと説明しています。",
    source: S.pageExperience,
  },
];

export const GLOSSARY_PATH = "/glossary";
export const GLOSSARY_UPDATED = "2026-08-31";
export const GLOSSARY_PUBLISHED = "2026-08-31";

export function termsByCategory(key: GlossaryCategoryKey): GlossaryTerm[] {
  return GLOSSARY.filter((t) => t.category === key);
}

/** 五十音・アルファベット順の索引用。日本語ロケールで並べる */
export function termsSorted(): GlossaryTerm[] {
  return [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term, "ja"));
}

/**
 * DefinedTermSet + DefinedTerm。可視テキストの definition と同じ文字列を description に使う。
 * AI検索は用語ごとの短い定義を単位で抜くため、1つのDefinedTermに1つの定義文だけを持たせる。
 */
export function glossaryJsonLd() {
  const url = `${SITE_URL}${GLOSSARY_PATH}`;
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "@id": `${url}#termset`,
    name: "SEO・GEO用語集",
    url,
    inLanguage: "ja",
    publisher: { "@id": `${SITE_URL}/#organization` },
    hasDefinedTerm: GLOSSARY.map((t) => ({
      "@type": "DefinedTerm",
      "@id": `${url}#${t.slug}`,
      name: t.term,
      alternateName: t.aliases,
      description: t.definition,
      url: `${url}#${t.slug}`,
      inDefinedTermSet: { "@id": `${url}#termset` },
    })),
  };
}
