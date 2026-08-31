import type { Metadata } from "next";
import type { FaqItem } from "./faq";
import { SITE_NAME, SITE_URL } from "./site";

// /learn のカリキュラム定義。SEOとGEOを「読む → 作る → 回す」の3レベル10レッスンに分け、
// 前提 → 実装 → 運用の順に積めるようにしたもの。
// 各レッスンの本文は src/app/learn/<slug>/page.tsx にあり、ここには
// 「見出し・到達目標・チェックリスト・FAQ・出典」など、目次ページ・JSON-LD・llms.txt が
// 共有するメタデータだけを置く（同じ文字列を2か所に書かない）。

export type LevelKey = 1 | 2 | 3;

export const LEVELS: Record<LevelKey, { label: string; name: string; lead: string; tone: "accent" | "seo" | "geo" }> = {
  1: {
    label: "Level 1",
    name: "基礎 — 仕組みを理解する",
    lead: "検索と生成AIが、どんな順番でページを見つけ、理解し、回答に載せるのかを押さえる。ここを飛ばすと、後の施策が「なぜ効くのか」を説明できなくなる。",
    tone: "accent",
  },
  2: {
    label: "Level 2",
    name: "実装 — 作る・直す",
    lead: "実際にサイトへ手を入れる段階。技術的な土台、本文の書き方、サイト構造、AIクローラーへの対応を、この順番で仕上げる。",
    tone: "seo",
  },
  3: {
    label: "Level 3",
    name: "運用 — 回す・守る",
    lead: "施策を続けるための段階。数値で効果を確認し、実例から共通パターンを取り出し、アップデートやペナルティに備える。",
    tone: "geo",
  },
};

export const LEVEL_KEYS: LevelKey[] = [1, 2, 3];

export type Lesson = {
  slug: string;
  /** 1〜10。目次と前後ナビの順序 */
  order: number;
  level: LevelKey;
  /** 目次・パンくず・前後ナビで使う短いタイトル */
  title: string;
  /** ページのh1。titleより具体的に */
  h1: string;
  metaTitle: string;
  /** meta description。90〜120字 */
  description: string;
  /** このレッスンを終えると何ができるようになるか。1文で言い切る */
  goal: string;
  /** 扱う項目 */
  objectives: string[];
  /** 読了の目安（分） */
  minutes: number;
  /** 到達チェックリスト。読者が自分のサイトで確認する項目 */
  checklist: string[];
  faq: FaqItem[];
  sources: { title: string; publisher: string; url: string }[];
  published: string;
  updated: string;
};

// 出典。複数レッスンで使い回すものだけ定数にする。
const S = {
  starter: { title: "SEO スターター ガイド", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide?hl=ja" },
  essentials: { title: "Google 検索の基本事項", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/essentials?hl=ja" },
  spam: { title: "Google ウェブ検索のスパムに関するポリシー", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/essentials/spam-policies?hl=ja" },
  helpful: { title: "有用で信頼性の高い、ユーザー第一のコンテンツの作成", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content?hl=ja" },
  aiFeatures: { title: "AI 機能とウェブサイト", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/appearance/ai-features?hl=ja" },
  structuredData: { title: "構造化データの仕組みについて", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=ja" },
  gallery: { title: "構造化データ マークアップの一覧（検索ギャラリー）", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/appearance/structured-data/search-gallery?hl=ja" },
  robots: { title: "robots.txt の書き方、設定と送信", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/crawling-indexing/robots/intro?hl=ja" },
  noindex: { title: "noindex でコンテンツをインデックスから除外する", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/crawling-indexing/block-indexing?hl=ja" },
  canonical: { title: "重複した URL を統合する", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls?hl=ja" },
  sitemaps: { title: "サイトマップの作成と送信", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview?hl=ja" },
  crawlers: { title: "Google の一般的なクローラー", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers?hl=ja" },
  titleLink: { title: "Google 検索結果のタイトルリンクを管理する", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/appearance/title-link?hl=ja" },
  snippet: { title: "スニペットを管理する", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/appearance/snippet?hl=ja" },
  coreUpdates: { title: "Google 検索のランキング アップデート", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/updates/core-updates?hl=ja" },
  trafficDrops: { title: "検索トラフィックの減少をデバッグする", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/monitor-debug/debugging-search-traffic-drops?hl=ja" },
  aiContent: { title: "Google 検索における AI 生成コンテンツに対する方針", publisher: "Google 検索セントラル ブログ", url: "https://developers.google.com/search/blog/2023/02/google-search-and-ai-content?hl=ja" },
  siteMove: { title: "URL の変更を伴うサイト移転", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes?hl=ja" },
  vitals: { title: "Web Vitals（Core Web Vitals のしきい値）", publisher: "web.dev（Google）", url: "https://web.dev/articles/vitals" },
  optimizeLcp: { title: "Optimize Largest Contentful Paint", publisher: "web.dev（Google）", url: "https://web.dev/articles/optimize-lcp" },
  optimizeInp: { title: "Optimize Interaction to Next Paint", publisher: "web.dev（Google）", url: "https://web.dev/articles/optimize-inp" },
  optimizeCls: { title: "Optimize Cumulative Layout Shift", publisher: "web.dev（Google）", url: "https://web.dev/articles/optimize-cls" },
  vitalsBusiness: { title: "The business impact of Core Web Vitals", publisher: "web.dev（Google）", url: "https://web.dev/case-studies/vitals-business-impact" },
  perf: { title: "検索パフォーマンス レポート（検索結果）", publisher: "Search Console ヘルプ", url: "https://support.google.com/webmasters/answer/7576553?hl=ja" },
  indexReport: { title: "ページ インデックス登録レポート", publisher: "Search Console ヘルプ", url: "https://support.google.com/webmasters/answer/7440203?hl=ja" },
  urlInspection: { title: "URL 検査ツール", publisher: "Search Console ヘルプ", url: "https://support.google.com/webmasters/answer/9012289?hl=ja" },
  manualActions: { title: "[手動による対策] レポート", publisher: "Search Console ヘルプ", url: "https://support.google.com/webmasters/answer/9044175?hl=ja" },
  geoPaper: { title: "GEO: Generative Engine Optimization（arXiv:2311.09735）", publisher: "Aggarwal ほか（KDD 2024）", url: "https://arxiv.org/abs/2311.09735" },
  openaiBots: { title: "Overview of OpenAI Crawlers", publisher: "OpenAI", url: "https://platform.openai.com/docs/bots" },
  perplexityBots: { title: "PerplexityBot", publisher: "Perplexity", url: "https://docs.perplexity.ai/guides/bots" },
  anthropicBots: { title: "Does Anthropic crawl data from the web, and how can site owners block the crawler?", publisher: "Anthropic", url: "https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler" },
  llmstxt: { title: "The /llms.txt file", publisher: "llmstxt.org", url: "https://llmstxt.org/" },
  saramin: { title: "Saramin increases organic Search traffic 2X by investing in SEO", publisher: "Google 検索セントラル 成功事例", url: "https://developers.google.com/search/case-studies/saramin-case-study" },
  rakutenRecipe: { title: "Rakuten Recipe increases time on site 1.5X with structured data", publisher: "Google 検索セントラル 成功事例", url: "https://developers.google.com/search/case-studies/rakuten-case-study" },
  eventbrite: { title: "Eventbrite boosts traffic 100% with event structured data", publisher: "Google 検索セントラル 成功事例", url: "https://developers.google.com/search/case-studies/eventbrite-case-study" },
  mxPlayer: { title: "MX Player boosts organic traffic 3X by maximizing video discoverability", publisher: "Google 検索セントラル 成功事例", url: "https://developers.google.com/search/case-studies/mx-case-study" },
  yahooNews: { title: "Yahoo! JAPAN News improved CLS by 0.2", publisher: "web.dev（Google）ケーススタディ", url: "https://web.dev/case-studies/yahoo-japan-news" },
  rakuten24: { title: "How Rakuten 24's investment in Core Web Vitals increased revenue per visitor by 53.37%", publisher: "web.dev（Google）ケーススタディ", url: "https://web.dev/case-studies/rakuten" },
  nuvemshop: { title: "How Nuvemshop's image prioritization strategy led to a 68% improvement in LCP", publisher: "web.dev（Google）ケーススタディ", url: "https://web.dev/case-studies/nuvemshop" },
  redbus: { title: "How redBus improved their INP by 72% and increased sales by 7%", publisher: "web.dev（Google）ケーススタディ", url: "https://web.dev/case-studies/redbus-inp" },
} as const;

export const COURSE = {
  path: "/learn",
  h1: "SEO・GEO教科書",
  metaTitle: "SEO・GEO教科書｜10レッスンで基礎から運用まで（実例つき）",
  description:
    "SEOとGEO（生成AI検索最適化）を、仕組みの理解 → 実装 → 運用の3レベル10レッスンで学ぶ教科書。各レッスンに到達チェックリストを付け、Googleの成功事例やweb.devのケーススタディなど一次情報で確認できる実例だけを載せています。",
  lead: "「SEO対策とは」「GEO対策とは」の次に読む、順番の決まった教科書です。1から10まで通すと、自分のサイトを検索と生成AIの両方に対応させ、数値で確認しながら運用できるようになります。",
  published: "2026-08-30",
  updated: "2026-08-30",
};

export const LESSONS: Lesson[] = [
  {
    slug: "starter-guide",
    order: 1,
    level: 1,
    title: "スターターガイド",
    h1: "スターターガイド：検索と生成AIがページを回答に載せるまで",
    metaTitle: "SEO・GEOスターターガイド｜検索とAIがページを回答に載せる仕組み",
    description:
      "検索エンジンと生成AIが、どんな順番でページを見つけ、理解し、回答に載せるのかを1本で通します。SEOとGEOで共通する土台、2つの流入経路、用語の地図、効果が確認されている施策までを一次情報つきで整理します。",
    goal: "自分のページが検索結果とAIの回答に出るまでの経路を、他人に図で説明できるようになる。",
    objectives: [
      "発見・取得・理解・選択・提示という5段階と、どこで止まると何が起きるか",
      "AIの回答に載る2つの経路（Google検索のインデックス経由と、AI各社の独自クローラー経由）",
      "SEO・GEO・AIO・LLMO・AEO・E-E-A-T・Core Web Vitalsといった用語の関係",
      "「効果が確認されている施策」と「確認されていない施策」の見分け方",
    ],
    minutes: 12,
    checklist: [
      "自分のサイトのトップページが、検索結果に出るまでの5段階のどこまで進んでいるか答えられる",
      "AIの回答に載る2つの経路のうち、自分のサイトがどちらを使えているか説明できる",
      "GEO・AIO・LLMO・AEOが同じ領域の別名だと説明できる",
      "「これをやれば順位が上がる」という話を、公式ドキュメントで確認する習慣がついた",
    ],
    faq: [
      {
        question: "SEOとGEOはどちらから学ぶべきですか",
        answer:
          "SEOが先です。Googleは、AIによる概要やAIモードにページがサポートリンクとして表示されるには、ページがインデックスに登録され、検索でスニペットが表示され、検索の技術的要件を満たしている必要があると説明しています。インデックスに載っていないページはAIの回答の参照元にもなりにくいため、まず検索の土台を作り、そのうえで生成AIに引用されやすい書き方と設定を足すのが順番です。",
      },
      {
        question: "このスターターガイドを読むのにどれくらいかかりますか",
        answer:
          "本文は12分ほどで読み終わる分量です。ただし、到達チェックリストの4項目を自分のサイトで確認する作業を含めると、初めての場合は1時間ほど見ておくと安全です。Search Consoleの登録が済んでいない場合は、所有権確認にさらに時間がかかることがあります。",
      },
      {
        question: "専門用語が多くて挫折しそうです",
        answer:
          "このレッスンには用語の対応表を置いています。SEO・GEO・AIO・LLMO・AEOは指している実務がほぼ同じ言葉で、覚えるべき別物ではありません。まず「クロール」「インデックス」「ランキング」の3語だけ理解できていれば、残りの9レッスンは読み進められます。",
      },
    ],
    sources: [S.starter, S.essentials, S.aiFeatures, S.helpful, S.geoPaper, S.crawlers],
    published: "2026-08-30",
    updated: "2026-08-30",
  },
  {
    slug: "first-week",
    order: 2,
    level: 1,
    title: "初心者向けの初期点検",
    h1: "初心者向け：最初の1週間でやる7つの点検と対策",
    metaTitle: "SEO初心者が最初の1週間でやること｜7つの点検と直し方",
    description:
      "Search Consoleの登録からAIクローラーの確認まで、初心者が最初の1週間で終わらせる7つの点検を日ごとに並べます。よくある症状と原因、その場での直し方、点検が終わったことを確認する方法までを手順化しました。",
    goal: "自分のサイトが「検索と生成AIに読める状態」かどうかを、7日間で確認して直せるようになる。",
    objectives: [
      "1日目〜7日目の作業と、各日の完了条件",
      "インデックス未登録の代表的な原因（noindex・Disallow・canonicalの向き先）と直し方",
      "robots.txtで誤ってGooglebotやAIクローラーを止めていないかの確認方法",
      "改善前の数値を記録し、後から効果を確認できる状態にする方法",
    ],
    minutes: 14,
    checklist: [
      "Search Consoleでサイトの所有権を確認し、検索パフォーマンスの数値が見えている",
      "トップページと主要3ページをURL検査にかけ、すべて「インデックス登録済み」になっている",
      "robots.txt を開き、Disallow の対象が意図したものだけになっている",
      "XMLサイトマップを送信し、Search Consoleで「成功しました」と表示されている",
      "点検前の表示回数・クリック数・インデックス済みページ数をメモに残した",
    ],
    faq: [
      {
        question: "Search Consoleの所有権確認ができません",
        answer:
          "確認方法は、DNSレコードの追加、HTMLファイルのアップロード、HTMLタグの設置、Googleアナリティクスやタグマネージャーとの連携などがあります。サイト全体をまとめて計測できるドメインプロパティを使う場合はDNSレコードの追加が必要で、これはドメインを管理している事業者の管理画面で行います。DNSを触れない場合は、URLプレフィックスプロパティでHTMLタグによる確認を選ぶのが現実的です。",
      },
      {
        question: "記事を公開したのに検索結果に出てきません",
        answer:
          "まずURL検査ツールでそのURLを調べ、「インデックス登録済み」かどうかを確認します。登録されていない場合、原因はnoindexタグ、robots.txtのDisallow、canonicalが別URLを指している、そもそもクロールされていない、のいずれかであることが多いです。登録済みなのに表示されない場合は、インデックスされているが順位が低いという別の問題なので、対策も変わります。",
      },
      {
        question: "robots.txtは作らないといけませんか",
        answer:
          "必須ではありません。robots.txtが無い場合、クローラーはサイト全体をクロールしてよいと解釈します。問題になるのは、内容を確認しないままCMSやテーマが出力しているrobots.txtを放置し、重要なディレクトリがDisallowになっているケースです。作るかどうかより、いま何が書かれているかを確認するほうが先です。",
      },
      {
        question: "1週間で順位は上がりますか",
        answer:
          "上がりません。この7日間の作業は「順位を上げる」ためではなく、「順位がつく前提を満たす」ためのものです。Googleは要件を満たしていてもクロール・インデックス登録・掲載を保証しないと明記しており、効果が出るまでの期間も示していません。当サイトの整理では、技術的な修正の反映は数日から数週間、コンテンツ改善の反映は1〜3か月を見込むのが現実的です。",
      },
    ],
    sources: [S.starter, S.essentials, S.robots, S.noindex, S.canonical, S.sitemaps, S.indexReport, S.urlInspection, S.perf, S.saramin],
    published: "2026-08-30",
    updated: "2026-08-30",
  },
  {
    slug: "search-intent",
    order: 3,
    level: 1,
    title: "検索意図とキーワード設計",
    h1: "検索意図とキーワード設計：どのページを作るかを決める",
    metaTitle: "検索意図とキーワード設計｜作るページの決め方と重複の防ぎ方",
    description:
      "「何のページを作るか」を思いつきではなく検索意図から決める方法です。意図の4分類、Search Consoleのクエリから穴を見つける手順、1ページ1意図の原則、キーワードの食い合い（カニバリゼーション）の直し方を扱います。",
    goal: "作るべきページと、作らなくていいページを、根拠を持って選び分けられるようになる。",
    objectives: [
      "検索意図の4分類（知りたい・したい・行きたい・買いたい）とページ形式の対応",
      "Search Consoleの検索クエリから「答えの無いクエリ」を見つける手順",
      "1ページ1意図の原則と、詰め込みすぎたページの分け方",
      "同じ意図のページが複数ある状態（カニバリゼーション）の見つけ方と統合の判断",
    ],
    minutes: 13,
    checklist: [
      "主要ページ5本について、それぞれ想定する検索意図を1文で書き出した",
      "Search Consoleで表示回数はあるのにクリックが少ないクエリを10件抽出した",
      "同じクエリで複数ページが表示されている状態がないか確認した",
      "次に作るページを3本決め、それぞれ答えるべき質問文を1つずつ書いた",
    ],
    faq: [
      {
        question: "キーワードは月間検索数の多いものから狙うべきですか",
        answer:
          "検索数だけで選ぶと、答える内容が自分のサイトにない領域まで手を広げることになります。実務では、すでにSearch Consoleで表示回数が出ているクエリ（＝Googleが自分のサイトを関連ありと判断しているクエリ）のうち、対応するページが弱いものから着手するほうが早く反応が出ます。検索数の多い一般語は、そのあとで狙う対象です。",
      },
      {
        question: "検索意図はどうやって確認しますか",
        answer:
          "実際にそのクエリで検索し、上位に出ているページの形式を見るのが最も確実です。比較表が並んでいれば比較を求められており、手順の記事が並んでいれば手順が求められています。Googleが実際に何を上位に出しているかは、そのクエリに対する現時点の答えとして最も具体的な情報です。",
      },
      {
        question: "1つの記事に複数のキーワードを入れてはいけませんか",
        answer:
          "入れてはいけないということはありません。問題になるのは、意図の異なるクエリを1ページに詰め込んだ結果、どの意図にも中途半端にしか答えられなくなる場合です。判断の基準はキーワードの数ではなく、そのページが答える質問が1つに絞れているかどうかです。",
      },
      {
        question: "カニバリゼーションは必ず直すべきですか",
        answer:
          "同じ意図に対して複数ページがあり、どれも順位が伸びていない場合は統合を検討します。一方で、Googleが意図ごとに別々のページを正しく出し分けられている場合は、無理に統合する必要はありません。統合する場合は、残すURLへ301リダイレクトするか、canonicalで代表URLを指定します。",
      },
    ],
    sources: [S.starter, S.helpful, S.titleLink, S.snippet, S.canonical, S.perf, S.saramin],
    published: "2026-08-30",
    updated: "2026-08-30",
  },
  {
    slug: "technical",
    order: 4,
    level: 2,
    title: "テクニカルSEO実装",
    h1: "テクニカルSEO実装：クロール・インデックス・表示速度",
    metaTitle: "テクニカルSEO実装｜robots・canonical・構造化データ・Core Web Vitals",
    description:
      "robots.txtとnoindexの使い分け、canonicalによる重複統合、サイトマップ、構造化データ、Core Web Vitalsの直し方を実装単位で整理します。Nuvemshop・redBus・Yahoo! JAPANニュースなど、公開されている改善事例の数値も添えます。",
    goal: "検索エンジンがページを取得し、正しく理解し、快適に表示できる状態を自分で作れるようになる。",
    objectives: [
      "robots.txt（クロールの制御）とnoindex（インデックスの制御）の使い分け",
      "canonical・301リダイレクト・サイトマップで重複と正規URLを整理する",
      "構造化データの選び方と、ページ表示との一致という条件",
      "LCP・INP・CLSそれぞれの代表的な原因と、実際に効果が報告された直し方",
    ],
    minutes: 18,
    checklist: [
      "robots.txtでDisallowにしているパスと、noindexにしているページを一覧にできた",
      "同じ内容が複数URLで見える箇所を洗い出し、canonicalか301で1本化した",
      "自分のページ種別に対応する構造化データの型を選び、リッチリザルトテストで検証した",
      "PageSpeed InsightsでLCP・INP・CLSの現状値を記録し、悪い指標を1つ特定した",
      "ファーストビューの画像に loading=\"lazy\" が付いていないことを確認した",
    ],
    faq: [
      {
        question: "robots.txtでDisallowにすればインデックスされませんか",
        answer:
          "されないとは限りません。Googleは、robots.txtでブロックされたページでも、他のページからリンクされていればURLがインデックスに登録されることがあると説明しています。検索結果に出したくないページには、robots.txtのDisallowではなくnoindexを使います。noindexは、クローラーがそのページを取得できて初めて読み取られるため、Disallowと同時に指定すると機能しません。",
      },
      {
        question: "構造化データを入れると順位が上がりますか",
        answer:
          "構造化データはページの内容を検索エンジンが理解し、リッチリザルトとして表示するための仕組みです。順位を直接上げる設定ではありません。ただし、公開されている成功事例では、Event構造化データの実装後にイベントページへの検索流入が例年比で約100%増えた（Eventbrite）、レシピの構造化データで検索流入が2.7倍になった（楽天レシピ）といった結果が報告されています。表示のされ方が変わることでクリックが増える、という経路で効いていると考えられます。",
      },
      {
        question: "Core Web Vitalsはどこまで直せばよいですか",
        answer:
          "まず「良好」の目安（LCP 2.5秒以内、INP 200ミリ秒以下、CLS 0.1以下）を全体の75パーセンタイルで満たすことを目標にします。3つ全部を同時に追うのではなく、PageSpeed Insightsのフィールドデータで最も悪い1指標に絞るほうが進みます。redBusはINPだけに絞って870〜900msを350〜370msに改善し、売上が7%増えたと報告しています。",
      },
      {
        question: "AMPやPWAは今も必要ですか",
        answer:
          "必須ではありません。Googleは、Googleニュースやトップニュース枠への掲載にAMPを必須とはしておらず、通常のページでCore Web Vitalsを満たせば同じ扱いを受けられます。過去の成功事例にAMPが登場するのは、当時の実装として選ばれたためです。いまから始める場合は、通常のページの表示速度を直すほうが優先です。",
      },
    ],
    sources: [S.essentials, S.robots, S.noindex, S.canonical, S.sitemaps, S.structuredData, S.gallery, S.vitals, S.optimizeLcp, S.optimizeInp, S.optimizeCls, S.nuvemshop, S.redbus, S.yahooNews, S.rakuten24, S.eventbrite, S.rakutenRecipe],
    published: "2026-08-30",
    updated: "2026-08-30",
  },
  {
    slug: "writing",
    order: 5,
    level: 2,
    title: "引用される本文の書き方",
    h1: "引用される本文の書き方：直答・パッセージ・E-E-A-T",
    metaTitle: "AIに引用される本文の書き方｜直答・パッセージ設計・E-E-A-T",
    description:
      "検索結果でも生成AIの回答でも抜き出されやすい本文の書き方を、構成の型として示します。見出しへの直答、1見出し1問いのパッセージ設計、数値と出典の入れ方、E-E-A-Tのページ上での見せ方を扱います。",
    goal: "1つの見出しに対して、そのまま引用できる形の段落を書けるようになる。",
    objectives: [
      "「見出し → 1文で直答 → 根拠 → 詳細」という段落の型",
      "1見出し1問い・自己完結という、パッセージとして抜き出されるための条件",
      "引用・統計・出典を入れることの効果（GEO論文が測定した数値）",
      "E-E-A-T（経験・専門性・権威性・信頼）をページ上の要素に落とす方法",
    ],
    minutes: 15,
    checklist: [
      "主要ページの各h2直下に、その見出しの問いへ1文で答える段落がある",
      "見出しの文言が、読者が実際に検索する質問文に近い形になっている",
      "数値や条件が表・箇条書きで構造化されており、文章の中に埋もれていない",
      "本文中の事実に一次情報へのリンクが付いている",
      "著者・更新日・運営者情報がページから確認できる",
    ],
    faq: [
      {
        question: "AIに引用されやすい書き方は本当に確認されているのですか",
        answer:
          "GEOという用語の初出であるarXiv論文（KDD 2024採録）が、10,000件のクエリからなるベンチマークGEO-benchで9通りの書き換えを比較しています。この論文では、引用の追加で可視性が最大41%、統計の追加で約32%、出典の明示で約28%向上した一方、キーワードの詰め込みはほとんど効果がなかったと報告されています。ただしこれは研究環境での測定であり、各社のサービスがこの通りに動くことを保証するものではありません。",
      },
      {
        question: "結論を先に書くと、記事を最後まで読んでもらえないのでは",
        answer:
          "検索から来た読者は、まず自分の質問に答えているかを確認します。冒頭で答えが見つからないページは、その時点で離脱されます。結論を先に置いたうえで、根拠・条件・例外・手順を続ける構成にすると、答えを得た読者がそのまま詳細へ進みます。生成AIの側も、質問に直答する短い段落を抜き出しやすくなります。",
      },
      {
        question: "E-E-A-Tは具体的に何をすればよいのですか",
        answer:
          "E-E-A-Tは設定項目ではなく、コンテンツを自己点検するための観点です。ページ上の要素に落とすと、実際に使った・行った記録を載せる（経験）、扱う範囲を絞り著者情報を明示する（専門性）、一次情報を自分で公開して参照される状態を作る（権威性）、出典リンクと更新日と運営者情報を出す（信頼）といった形になります。",
      },
      {
        question: "AIで文章を書いてもよいのですか",
        answer:
          "Googleは、コンテンツの制作方法ではなく品質に注目していると説明しており、AIの使用そのものを禁じてはいません。一方でスパムに関するポリシーでは、ユーザーにとっての価値を付加せず検索順位の操作を主な目的として大量にページを生成することを「大量生成されたコンテンツの不正使用」として挙げています。判断の分かれ目は、生成に使ったかどうかではなく、そのページが読者の質問に答えているかどうかです。",
      },
    ],
    sources: [S.helpful, S.aiFeatures, S.spam, S.aiContent, S.geoPaper, S.snippet, S.titleLink],
    published: "2026-08-30",
    updated: "2026-08-30",
  },
  {
    slug: "structure",
    order: 6,
    level: 2,
    title: "サイト構造と内部リンク",
    h1: "サイト構造と内部リンク：トピッククラスタで積み上げる",
    metaTitle: "サイト構造と内部リンク｜トピッククラスタ・URL設計・薄いページの扱い",
    description:
      "個別記事を単発で増やすのをやめ、定義ページを中心に束ねるトピッククラスタの作り方を扱います。URL設計、パンくず、アンカーテキスト、そして増えすぎた薄い一覧ページをどう扱うかまでを実装として整理します。",
    goal: "1本ずつバラバラな記事群を、テーマごとに束ねて評価が積み上がる構造に組み替えられるようになる。",
    objectives: [
      "ハブ（定義・網羅ページ）とスポーク（個別トピック）の役割分担",
      "URL設計とパンくずで階層を明示する",
      "内部リンクのアンカーテキストの書き方と、リンクを置く位置",
      "タグ一覧など中身の薄いページを、noindexとサイトマップからどう外すか",
    ],
    minutes: 14,
    checklist: [
      "主要テーマごとにハブページを1本決め、そこから各記事へリンクがある",
      "各記事からハブページへ戻るリンクがある",
      "アンカーテキストが「こちら」ではなく、リンク先の内容を表す語になっている",
      "パンくずを設置し、BreadcrumbList構造化データを出している",
      "記事1本しかないタグ一覧のような薄いページを、noindexにするか統合した",
    ],
    faq: [
      {
        question: "トピッククラスタとは何ですか",
        answer:
          "1つのテーマについて、全体を扱うハブページと、個別の論点を扱う複数のスポークページを作り、相互にリンクで結ぶ構造のことです。このサイトでいえば「SEO対策とは」「GEO対策とは」がハブ、日々のニュース記事や各レッスンがスポークにあたります。同じテーマのページが相互に参照し合うことで、そのテーマを扱っているサイトだと理解されやすくなります。",
      },
      {
        question: "内部リンクは多いほどよいのですか",
        answer:
          "多さ自体が目的ではありません。重要なのは、重要なページへの経路が短いことと、リンクの文言がリンク先の内容を表していることです。関係の薄いページへ機械的にリンクを張ると、読者にとって邪魔になるうえ、どのページが重要かという情報も薄まります。",
      },
      {
        question: "薄いページはなぜ問題なのですか",
        answer:
          "検索結果に出ないページが増えると、Search Consoleの「クロール済み - インデックス未登録」が増え、クロールされる回数が重要なページに回らなくなることがあります。当サイトでは、記事が1本しかないタグ一覧ページをnoindexにし、サイトマップからも外しています。表示側と生成側で同じしきい値を使い、片方だけ直る状態を防いでいます。",
      },
      {
        question: "URLに日本語を使ってもよいですか",
        answer:
          "使えます。ただし、コピー時にパーセントエンコードされて長くなり、SNSやドキュメントに貼ったときに読みにくくなります。当サイトの記事URLは連番のIDにしており、タイトル変更でURLが変わらないようにしています。どの方式でも、後からURLを変えないことのほうが重要です。",
      },
    ],
    sources: [S.starter, S.essentials, S.canonical, S.noindex, S.sitemaps, S.saramin],
    published: "2026-08-30",
    updated: "2026-08-30",
  },
  {
    slug: "geo-implementation",
    order: 7,
    level: 2,
    title: "GEO実装",
    h1: "GEO実装：AIクローラーの許可と、引用される形に整える",
    metaTitle: "GEO実装｜AIクローラーのrobots.txt設定と引用されるページの作り方",
    description:
      "生成AIに引用されるための実装を、設定と書き方の2つに分けて扱います。OpenAI・Perplexity・Anthropic・Googleの各クローラーをrobots.txtでどう扱うか、ブロックすると何が起きるか、llms.txtの位置づけまでを公式ドキュメントを出典に整理します。",
    goal: "AI各社のクローラーを意図どおりに扱い、引用されやすい形にページを整えられるようになる。",
    objectives: [
      "AIの回答に載る2経路と、それぞれに必要な設定",
      "主要なAIクローラーの役割（検索用・学習用）と、robots.txtでの書き分け",
      "各社が公式に説明している「ブロックしたときに起きること」",
      "llms.txtと構造化データの位置づけ（Googleが不要と明言している範囲）",
    ],
    minutes: 16,
    checklist: [
      "robots.txt を開き、OAI-SearchBot・PerplexityBot・Claude-SearchBotなどの扱いを把握した",
      "検索用クローラーと学習用クローラーのどちらを許可するかを方針として決めた",
      "主要ページの各見出し直下に、質問へ1文で答える段落を置いた",
      "更新日と出典をページ上に表示している",
      "AI検索からの流入を、アクセス解析の参照元で分けて見られるようにした",
    ],
    faq: [
      {
        question: "AIクローラーをブロックすると何が起きますか",
        answer:
          "ボットごとに影響が異なります。OpenAIは、OAI-SearchBotを拒否したサイトはChatGPTの検索の回答に表示されないと説明し、GPTBotの拒否は基盤モデルの学習からの除外を意味するとしています。PerplexityもPerplexityBotの許可を推奨しています。GoogleのGoogle-ExtendedはGeminiアプリの学習・グラウンディング用のトークンで、Google検索へのサイトの登録やランキングには影響しないと明記されています。",
      },
      {
        question: "学習には使われたくないが、AI検索には出たい場合はどうしますか",
        answer:
          "検索用のクローラーと学習用のクローラーが別のユーザーエージェント名で分かれている事業者では、書き分けができます。OpenAIの場合、検索の回答に出したいならOAI-SearchBotを許可し、基盤モデルの学習に使われたくないならGPTBotを拒否する、という指定が可能です。すべての事業者が分離しているわけではないため、各社の公式ドキュメントで現在のボット名を確認してください。",
      },
      {
        question: "llms.txtを置けばAIに引用されますか",
        answer:
          "llms.txtはコミュニティが提案している任意の仕様で、設置すれば引用されると保証する検索エンジンやAI事業者の公式な説明はありません。Googleは、AI機能に表示されるために新しいAIテキストファイルを作る必要はないと明記しています。設置する場合は、本文やサイト構造の代わりではなく補助として扱うのが安全です。",
      },
      {
        question: "GEO専用の構造化データはありますか",
        answer:
          "ありません。Googleは、AIによる概要やAIモードに表示されるために、新たにコンピュータが解読可能なファイルやAIテキストファイルを作る必要はなく、特別なschema.orgの構造化データを追加する必要もないと明記しています。構造化データは、あくまでページの内容を正確に伝えるために使います。",
      },
    ],
    sources: [S.aiFeatures, S.crawlers, S.openaiBots, S.perplexityBots, S.anthropicBots, S.llmstxt, S.geoPaper, S.structuredData],
    published: "2026-08-30",
    updated: "2026-08-30",
  },
  {
    slug: "measurement",
    order: 8,
    level: 3,
    title: "計測と改善サイクル",
    h1: "計測と改善サイクル：何を見て、いつ判断するか",
    metaTitle: "SEO・GEOの計測｜Search Consoleの見方とAI流入の測り方",
    description:
      "順位チェックツールの体感ではなく、Search Consoleの数値で判断するための手順です。見る順番（表示回数→クリック→順位）、インデックス状況の読み方、AI検索からの流入の測り方、4週間サイクルでの判断基準を扱います。",
    goal: "施策の効果を数値で確認し、続けるか畳むかを自分で判断できるようになる。",
    objectives: [
      "検索パフォーマンス・ページインデックス登録・URL検査の3画面の役割",
      "表示回数・クリック数・CTR・平均掲載順位を見る順番",
      "AI検索（AIによる概要／AIモード、ChatGPT、Perplexity）からの流入の測り方と限界",
      "4週間サイクルで判断し、効果の出ない施策を畳む基準",
    ],
    minutes: 15,
    checklist: [
      "検索パフォーマンスで、直近28日と前年同期を比較できる状態になっている",
      "主要ページごとの表示回数・クリック数・CTRを一覧にできた",
      "インデックス登録レポートの「未登録」の内訳を確認し、公開したいページが混ざっていないことを確認した",
      "アクセス解析で、ChatGPTやPerplexityからの参照を分けて見られるようにした",
      "施策ごとに開始日をメモし、4週間後に見直す予定を入れた",
    ],
    faq: [
      {
        question: "順位チェックツールとSearch Consoleのどちらを信じればよいですか",
        answer:
          "判断にはSearch Consoleを使います。順位チェックツールが返すのは特定の条件で取得した1つの順位で、実際のユーザーが見る検索結果は端末・地域・パーソナライズによって変わります。Search Consoleの平均掲載順位は、実際に表示された結果の平均なので、自サイトの状況としてはこちらが実態に近い数値です。",
      },
      {
        question: "AIによる概要やAIモードからの流入はどこで見られますか",
        answer:
          "Googleは、AIによる概要やAIモードに表示されたサイトも、Search Consoleの検索タイプ「ウェブ」のパフォーマンスレポートに含まれると説明しています。つまり通常の検索と合算されており、AI機能だけを切り出したレポートは提供されていません。ChatGPTやPerplexityからの流入は、アクセス解析の参照元ドメインで判別します。",
      },
      {
        question: "AI可視性ツールは契約すべきですか",
        answer:
          "測っているものを理解したうえでなら有用です。これらのツールが測るのは、ツールが投げた質問に対する回答であり、実ユーザーが受け取った回答そのものではありません。契約前に、自分で決めた質問を追跡できるか（カスタムプロンプトに対応しているか）を確認するのが実務上の分かれ目になります。",
      },
      {
        question: "効果が出ない施策はいつ畳めばよいですか",
        answer:
          "当サイトの整理では、技術的な修正は数週間、コンテンツの改善は1〜3か月を見て、表示回数がまったく動かなければ前提を疑います。順位そのものではなく表示回数を先に見るのは、表示回数が増えていればクリックされていなくてもインデックスと関連性は前進しているためです。Googleは効果が出るまでの期間を保証していません。",
      },
    ],
    sources: [S.perf, S.indexReport, S.urlInspection, S.aiFeatures, S.trafficDrops, S.essentials],
    published: "2026-08-30",
    updated: "2026-08-30",
  },
  {
    slug: "case-studies",
    order: 9,
    level: 3,
    title: "実例：強いサイトがやったこと",
    h1: "実例：検索とAIに強いサイトが実際にやったこと",
    metaTitle: "SEO・GEOの実例11件｜公式に公開された施策と結果の数値",
    description:
      "Google 検索セントラルの成功事例、web.devのケーススタディ、GEO論文から、施策と結果の数値が同じ文書で公開されている事例だけを集めました。楽天レシピ・Saramin・Eventbrite・Yahoo! JAPANニュース・redBusなどの実施内容を、共通パターンとともに整理します。",
    goal: "公開されている実例から共通パターンを取り出し、自分のサイトで次に手を付ける場所を決められるようになる。",
    objectives: [
      "構造化データ・Core Web Vitals・テクニカル基礎・生成AIの4領域の実例",
      "各社が「実際に何をしたか」と「報告された数値」",
      "11件に共通する3つのパターン",
      "他社の数値を自社に当てはめるときの注意点",
    ],
    minutes: 17,
    checklist: [
      "自分のサイトに最も近い業種・規模の事例を1件選んだ",
      "その事例が実施した施策のうち、自分のサイトで未実施のものを書き出した",
      "共通パターン3つのうち、自分のサイトで欠けているものを特定した",
      "他社の数値をそのまま目標値にしていない",
    ],
    faq: [
      {
        question: "なぜ事例が11件しかないのですか",
        answer:
          "「実施した施策」と「結果の数値」が同じ一次情報の中で公開されている事例だけを載せているためです。施策と数値が別々の情報源にある、数値の出どころが不明、運営者本人の発表ではない、といった事例は、因果関係を確認できないので除いています。件数より、確認できることを優先しています。",
      },
      {
        question: "同じ施策をすれば同じ結果が出ますか",
        answer:
          "出ません。各事例の数値は、その企業のサイト規模・業種・実施時期・同時に行った他の施策を含んだ結果です。ここから読み取るべきは倍率ではなく、「どの種類の作業が、どの指標に効いた例があるか」という対応関係です。自社の目標値は、自社の現状値を基準に設定してください。",
      },
      {
        question: "日本のサイトの事例はありますか",
        answer:
          "あります。楽天レシピ（レシピの構造化データで検索流入2.7倍）、Yahoo! JAPANニュース（CLS改善でセッションあたりPV15.1%増）、Rakuten 24（Core Web Vitalsへの投資で訪問者あたり収益53.37%増）の3件が、Googleが公開している日本サイトの事例です。",
      },
    ],
    sources: [S.saramin, S.rakutenRecipe, S.eventbrite, S.mxPlayer, S.yahooNews, S.rakuten24, S.nuvemshop, S.redbus, S.vitalsBusiness, S.geoPaper],
    published: "2026-08-30",
    updated: "2026-08-30",
  },
  {
    slug: "updates-risk",
    order: 10,
    level: 3,
    title: "アップデート対応とリスク管理",
    h1: "アップデート対応とリスク管理：落ちたときに何をするか",
    metaTitle: "コアアップデート対応とリスク管理｜順位下落時の手順と禁止事項",
    description:
      "コアアップデートで順位が落ちたときの確認手順、スパムに関するポリシーで禁止されている行為、手動による対策を受けたときの流れ、サイトリニューアル時のリスクを、Googleの公式ドキュメントを出典に整理します。",
    goal: "順位や流入が落ちたときに、原因を切り分けて手順どおりに対応できるようになる。",
    objectives: [
      "コアアップデートとは何で、Googleが何を推奨しているか",
      "流入が落ちたときの切り分け（技術的・アルゴリズム・季節性・手動対策）",
      "スパムに関するポリシーの禁止事項と、違反したときに起きること",
      "サイト移転・リニューアルで流入を落とさないための手順",
    ],
    minutes: 15,
    checklist: [
      "Search Consoleの「手動による対策」を確認し、問題が検出されていないことを確認した",
      "流入が落ちたときに見る順番（技術→アルゴリズム→季節性）を決めた",
      "自分のサイトにスパムポリシー違反にあたる要素がないか点検した",
      "URLを変更する予定がある場合、301リダイレクトの対応表を用意した",
    ],
    faq: [
      {
        question: "コアアップデートで順位が落ちたら何を直せばよいですか",
        answer:
          "Googleは、コアアップデートによる変動は個々のページに問題があることを必ずしも示すものではなく、修正すべき特定の項目があるわけではないと説明しています。推奨されているのは、有用で信頼性の高い、ユーザー第一のコンテンツになっているかを自己評価することです。順位が戻るのは次回以降のアップデートのタイミングになることがあり、即時の回復は保証されていません。",
      },
      {
        question: "検索流入が急に減りました。何から確認しますか",
        answer:
          "Googleは検索トラフィック減少のデバッグ手順を公開しています。まず技術的な問題（サーバー障害、robots.txtの誤設定、noindexの混入、サイト移転の失敗）を除外し、次にSearch Consoleの「手動による対策」を確認し、それから季節性やアルゴリズム更新を検討する、という順番です。原因の切り分けを飛ばして本文を書き直すと、直っていない原因が残ります。",
      },
      {
        question: "手動による対策を受けたらどうなりますか",
        answer:
          "Search Consoleの「手動による対策」レポートに問題が表示され、該当ページまたはサイト全体が検索結果で下位に表示されるか、表示されなくなります。指摘された問題を修正したうえで再審査をリクエストする流れになります。再審査には時間がかかり、承認も保証されていません。",
      },
      {
        question: "サイトリニューアルで流入が落ちるのはなぜですか",
        answer:
          "URLが変わったのに旧URLから新URLへの301リダイレクトが用意されていない、リダイレクト先がすべてトップページになっている、noindexやrobots.txtの検証環境の設定を本番に持ち込んでしまった、といった原因が典型です。Googleは、URLの変更を伴うサイト移転の手順を公開しており、旧URLと新URLの対応表を作ってから移行することを前提にしています。",
      },
    ],
    sources: [S.coreUpdates, S.trafficDrops, S.spam, S.manualActions, S.siteMove, S.helpful, S.aiContent],
    published: "2026-08-30",
    updated: "2026-08-30",
  },
];

const BY_SLUG = new Map(LESSONS.map((l) => [l.slug, l]));

export function lessonPath(slug: string): string {
  return `${COURSE.path}/${slug}`;
}

export function getLesson(slug: string): Lesson | undefined {
  return BY_SLUG.get(slug);
}

/** ビルド時に必ず存在する前提のレッスンを引く（ページ側から使う。typoはビルドで落ちる） */
export function requireLesson(slug: string): Lesson {
  const l = BY_SLUG.get(slug);
  if (!l) throw new Error(`curriculum.ts: unknown lesson slug "${slug}"`);
  return l;
}

export function lessonsByLevel(level: LevelKey): Lesson[] {
  return LESSONS.filter((l) => l.level === level);
}

/** 前後のレッスン。最初と最後は undefined になる */
export function lessonNeighbors(slug: string): { prev?: Lesson; next?: Lesson } {
  const i = LESSONS.findIndex((l) => l.slug === slug);
  return { prev: LESSONS[i - 1], next: LESSONS[i + 1] };
}

/** カリキュラム全体の順序を宣言する。AIが「順番のある教材」だと解釈できるようにする */
export function courseJsonLd() {
  const url = `${SITE_URL}${COURSE.path}`;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${url}#curriculum`,
    name: COURSE.h1,
    description: COURSE.description,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: LESSONS.length,
    itemListElement: LESSONS.map((l) => ({
      "@type": "ListItem",
      position: l.order,
      name: l.title,
      description: l.goal,
      url: `${SITE_URL}${lessonPath(l.slug)}`,
    })),
  };
}

export function courseArticleJsonLd() {
  const url = `${SITE_URL}${COURSE.path}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: COURSE.metaTitle,
    name: COURSE.h1,
    description: COURSE.description,
    datePublished: COURSE.published,
    dateModified: COURSE.updated,
    inLanguage: "ja",
    mainEntityOfPage: url,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    author: { "@id": `${SITE_URL}/#organization` },
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

/** レッスン本文。Article と LearningResource を兼ねさせ、到達目標を teaches に出す */
export function lessonJsonLd(lesson: Lesson) {
  const url = `${SITE_URL}${lessonPath(lesson.slug)}`;
  return {
    "@context": "https://schema.org",
    "@type": ["Article", "LearningResource"],
    "@id": `${url}#article`,
    headline: lesson.metaTitle,
    name: lesson.h1,
    description: lesson.description,
    datePublished: lesson.published,
    dateModified: lesson.updated,
    inLanguage: "ja",
    mainEntityOfPage: url,
    isPartOf: { "@id": `${SITE_URL}${COURSE.path}#curriculum`, "@type": "ItemList", name: COURSE.h1 },
    position: lesson.order,
    learningResourceType: "レッスン",
    educationalLevel: LEVELS[lesson.level].name,
    teaches: [lesson.goal, ...lesson.objectives],
    timeRequired: `PT${lesson.minutes}M`,
    author: { "@id": `${SITE_URL}/#organization` },
    publisher: { "@id": `${SITE_URL}/#organization`, name: SITE_NAME },
    citation: lesson.sources.map((s) => s.url),
  };
}

// OGP画像のピクセルサイズ。`src/lib/og.tsx` の OG_SIZE と同じ値だが、
// あちらは next/og（ImageResponse）を持ち込むのでページ側からは参照しない。
const OG_PIXELS = { width: 1200, height: 630 };

/**
 * レッスンページの metadata。10ページで完全に同じ形なので1か所に置く。
 *
 * `openGraph` を自前で持つページには、上位セグメントの `opengraph-image.tsx` が
 * **自動では引き継がれない**（`/tools/page-audit` のように openGraph を書いていない
 * ページは引き継がれる）。明示しないとレッスン10ページだけ og:image が消えるので、
 * `/learn` の画像を images に入れる。
 */
export function lessonMetadata(lesson: Lesson): Metadata {
  return {
    title: lesson.metaTitle,
    description: lesson.description,
    alternates: { canonical: lessonPath(lesson.slug) },
    openGraph: {
      type: "article",
      title: lesson.metaTitle,
      description: lesson.description,
      url: `${SITE_URL}${lessonPath(lesson.slug)}`,
      publishedTime: lesson.published,
      modifiedTime: lesson.updated,
      images: [{ url: `${SITE_URL}${COURSE.path}/opengraph-image`, ...OG_PIXELS, alt: COURSE.h1 }],
    },
  };
}
