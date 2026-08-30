import type { FaqItem } from "./faq";
import type { CategoryKey } from "./site";
import { SITE_URL } from "./site";

// 「SEO対策とは」「GEOとは」に答える解説ページ（/seo, /geo）のデータ。
// 定義文・要点・FAQ・出典をここ1か所に置き、ページ本文・JSON-LD・llms.txt が同じ文字列を使う。
// AI検索は「質問に直答する短いパッセージ」を抜き出すため、definition は単体で意味が通る1文にする。

export type GuideKey = "seo" | "geo";

export type Guide = {
  key: GuideKey;
  /** ページのパス。解説とそのカテゴリの記事一覧を兼ねる（旧 /category/seo はここへ308） */
  path: string;
  h1: string;
  metaTitle: string;
  /** meta description。90〜120字 */
  description: string;
  /** 用語（DefinedTerm の name） */
  term: string;
  /** 同義語・別表記。AI検索が別エンティティと誤認しないよう束ねる */
  alternateNames: string[];
  /** 「〜とは」への直答1文。ページ冒頭・DefinedTerm.description・llms.txt で同じ文字列 */
  definition: string;
  /** 要点3つ。定義の直後に置く */
  summary: string[];
  /** 公開日・更新日 */
  published: string;
  updated: string;
  /** 関連記事を引くカテゴリ */
  category: CategoryKey;
  faq: FaqItem[];
  sources: { title: string; publisher: string; url: string }[];
};

const SEO: Guide = {
  key: "seo",
  path: "/seo",
  h1: "SEO対策とは",
  metaTitle: "SEO対策とは｜定義・3つの領域・最初の90日でやること",
  description:
    "SEO対策（検索エンジン最適化）の定義、テクニカル・コンテンツ・外部評価の3領域、Googleが公式に示す基準（検索の基本事項・E-E-A-T・Core Web Vitals）と、最初の90日でやることを一次情報のリンク付きで整理します。",
  term: "SEO対策",
  alternateNames: ["SEO", "Search Engine Optimization", "検索エンジン最適化"],
  definition:
    "SEO対策（Search Engine Optimization／検索エンジン最適化）とは、検索エンジンが自社サイトのページを取得（クロール）し、内容を理解（インデックス）し、ユーザーの検索クエリに対して上位に表示できる状態に整える一連の施策のことです。",
  summary: [
    "作業はテクニカルSEO（読める状態にする）・コンテンツSEO（検索意図に答える）・外部評価（他サイトから参照される）の3領域に分かれ、この順に土台を積む。",
    "Googleが公式に示している判断基準は「Google検索の基本事項」の3本柱（技術的な要件・スパムに関するポリシー・主要なベストプラクティス）で、隠れた裏技はない。",
    "SEOの土台はそのままAI検索にも効く。Googleは、AIによる概要やAIモードに表示されるための追加要件はなく、特別な最適化も必要ないと明記している。",
  ],
  published: "2026-08-30",
  updated: "2026-08-30",
  category: "seo",
  faq: [
    {
      question: "SEO対策とは何ですか",
      answer:
        "SEO対策（検索エンジン最適化）とは、GoogleやBingなどの検索エンジンが自社のページを取得（クロール）し、内容を理解（インデックス）し、ユーザーの検索クエリに対して上位に表示できる状態に整える一連の施策です。作業はテクニカルSEO・コンテンツSEO・外部評価の3領域に分かれ、技術的な土台、検索意図に答えるページ、他サイトからの参照という順に積み上げます。",
    },
    {
      question: "SEO対策は何から始めればよいですか",
      answer:
        "最初にGoogle Search Consoleにサイトを登録し、インデックス登録の状況とrobots.txtを確認します。ページがクロール・インデックスされていない状態では、どれだけ記事を書いても検索結果には出ないためです。次に、すでにインデックスされているページのタイトルと本文が検索意図に答えているかを見直します。",
    },
    {
      question: "SEO対策は自分でできますか。外注は必要ですか",
      answer:
        "robots.txtとXMLサイトマップの確認、Search Consoleの登録、タイトルと見出しの整理、内部リンクの追加といった初期の作業は、専門業者でなくても実施できます。外注が必要になるのは、サイト全体の構造変更、継続的な大量のコンテンツ制作、開発を伴う表示速度の改善など、社内の工数や技術で足りない部分です。",
    },
    {
      question: "SEOの効果が出るまでどのくらいかかりますか",
      answer:
        "Googleは効果が出るまでの期間を保証しておらず、インデックス登録や掲載も保証されていません。変更の反映は推測ではなくSearch Consoleの表示回数・クリック数・インデックス状況で確認します。当サイトの整理では、技術的な修正は数日から数週間、コンテンツの改善は1〜3か月、外部からの参照が増える効果はそれ以上を見込むのが現実的です。",
    },
    {
      question: "E-E-A-Tとは何ですか。ランキング要因ですか",
      answer:
        "E-E-A-TはExperience（経験）・Expertise（専門性）・Authoritativeness（権威性）・Trust（信頼）の頭文字で、Googleが「有用で信頼性の高い、ユーザー第一のコンテンツ」を作れているかを自己評価するための観点として公開しているものです。E-E-A-Tという単一のスコアが公開されているわけではないため、順位を直接操作する設定ではなく、コンテンツを点検するチェックリストとして使います。",
    },
    {
      question: "Core Web Vitalsの合格ラインはいくつですか",
      answer:
        "Core Web VitalsはLCP（読み込み）・INP（応答性）・CLS（視覚的な安定性）の3指標です。良好とされる目安はLCPが2.5秒以内、INPが200ミリ秒以下、CLSが0.1以下で、判定はモバイルとPCを分けたうえで全体の75パーセンタイルの値で見ます。",
    },
    {
      question: "SEO対策とGEOは別々に取り組む必要がありますか",
      answer:
        "土台は共通なので、SEOをやめてGEOだけを行う意味はありません。Googleは、AIによる概要やAIモードに表示されるための追加要件はなく、特別な最適化を行う必要もないと公式ドキュメントで説明しています。GEO側の追加作業は、新しいマークアップの追加ではなく、質問にそのまま答える短い段落を置くことと、AI各社のクローラーをrobots.txtで止めないことの2点です。",
    },
  ],
  sources: [
    { title: "SEO スターター ガイド", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide?hl=ja" },
    { title: "Google 検索の基本事項", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/essentials?hl=ja" },
    { title: "有用で信頼性の高い、ユーザー第一のコンテンツの作成", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content?hl=ja" },
    { title: "Google ウェブ検索のスパムに関するポリシー", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/essentials/spam-policies?hl=ja" },
    { title: "ページ エクスペリエンスの概要", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/appearance/page-experience?hl=ja" },
    { title: "Web Vitals（Core Web Vitals のしきい値）", publisher: "web.dev（Google）", url: "https://web.dev/articles/vitals" },
    { title: "構造化データの仕組みについて", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=ja" },
    { title: "AI 機能とウェブサイト", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/appearance/ai-features?hl=ja" },
  ],
};

const GEO: Guide = {
  key: "geo",
  path: "/geo",
  h1: "GEOとは",
  metaTitle: "GEOとは｜生成AI検索最適化の定義・SEOとの違い・AIクローラー一覧",
  description:
    "GEO（Generative Engine Optimization／生成AI検索最適化）の定義、AIO・LLMOとの違い、SEOとの違い、ChatGPTやGeminiに引用されるまでの経路とAIクローラーの一覧を、各社の公式ドキュメントを出典に整理します。",
  term: "GEO",
  alternateNames: ["Generative Engine Optimization", "生成AI検索最適化", "AIO", "LLMO", "AEO"],
  definition:
    "GEO（Generative Engine Optimization／生成AI検索最適化）とは、ChatGPT・Gemini・GoogleのAIによる概要／AIモード・Perplexityといった生成AIが組み立てる回答の中で、自社の情報が引用・言及されるようにする取り組みのことです。",
  summary: [
    "用語の初出は2023年11月にarXivで公開された論文「GEO: Generative Engine Optimization」。日本で使われるAIO・LLMOは同じ領域を指す別の呼び名で、当サイトはGEOに統一している。",
    "AIの回答に載る経路は2つ。Google検索のインデックス経由（AIによる概要・AIモード）と、AI各社の独自クローラー経由（OAI-SearchBot、PerplexityBot、Claude-SearchBotなど）で、前者はSEOそのもの、後者はrobots.txtでの許可が前提になる。",
    "Googleは、AI機能に表示されるための追加要件はなく、新しいAIテキストファイルや特別な構造化データを作る必要もないと明記している。GEO固有の作業は「質問に短く直答する書き方」と「クローラーを止めない設定」に集約される。",
  ],
  published: "2026-08-30",
  updated: "2026-08-30",
  category: "geo",
  faq: [
    {
      question: "GEOとは何ですか",
      answer:
        "GEO（Generative Engine Optimization、生成AI検索最適化）とは、ChatGPT・Gemini・GoogleのAIによる概要／AIモード・Perplexityといった生成AIが組み立てる回答の中で、自社の情報が引用・言及されるようにする取り組みです。検索結果の順位を上げる従来のSEOと違い、AIが回答を作るときの参照元として選ばれることを目標にします。",
    },
    {
      question: "GEOという言葉はどこから来たのですか",
      answer:
        "2023年11月にarXivで公開された論文「GEO: Generative Engine Optimization」（Aggarwalほか）が初出です。この論文は、生成AIの回答内での可視性をコンテンツ制作者が高めるための枠組みとしてGEOを提案し、評価用のベンチマークGEO-benchを併せて公開しています。",
    },
    {
      question: "AIO・LLMO・AEOはGEOと違うものですか",
      answer:
        "指している実務の中身はほぼ同じで、呼び名の違いです。AIO（AI Optimization）とLLMO（Large Language Model Optimization）は主に日本で使われる語、AEO（Answer Engine Optimization）は回答エンジン向けの最適化を指す語で、いずれも生成AIの回答で引用されることを目標にします。当サイトでは用語をGEOに統一して表記します。",
    },
    {
      question: "AI検索に載るために特別な最適化やマークアップは必要ですか",
      answer:
        "Googleは公式ドキュメントで、AIによる概要やAIモードにコンテンツが表示されるための追加要件はなく、別途特別な最適化を行う必要もないと明記しています。同じドキュメントでは、新たにコンピュータが解読可能なファイルやAIテキストファイル、特別なschema.orgの構造化データを作る必要もないと説明されています。必要なのは、ページがインデックスに登録され、検索でスニペットが表示され、検索の技術的要件を満たしていることです。",
    },
    {
      question: "llms.txtを置けばAIに引用されますか",
      answer:
        "llms.txtはコミュニティが提案している任意の仕様で、設置すれば引用されると保証する検索エンジンやAI事業者の公式な説明はありません。Googleは、AI機能に表示されるために新しいAIテキストファイルを作る必要はないと明記しています。設置する場合は、本文やサイト構造の代わりではなく補助として扱うのが安全です。",
    },
    {
      question: "AIクローラーをブロックすると何が起きますか",
      answer:
        "ボットごとに影響が異なります。OpenAIは、OAI-SearchBotを拒否したサイトはChatGPTの検索の回答に表示されないと説明し、GPTBotの拒否は基盤モデルの学習からの除外を意味するとしています。PerplexityもPerplexityBotの許可を推奨しています。GoogleのGoogle-ExtendedはGeminiアプリの学習・グラウンディング用のトークンで、Google検索へのサイトの登録やランキングには影響しないと明記されています。",
    },
    {
      question: "GEOの成果はどうやって測りますか",
      answer:
        "Googleは、AIによる概要やAIモードに表示されたサイトもSearch Consoleの検索タイプ「ウェブ」のパフォーマンスレポートに含まれると説明しています。ChatGPTやPerplexityからの流入は、アクセス解析の参照元で判別します。AIの回答に自社が出た割合を測る専用ツールもありますが、測っているのはツールが投げた質問への回答であり、実ユーザーが受け取った回答そのものではありません。",
    },
    {
      question: "SEOをやっていればGEOは不要ですか",
      answer:
        "土台は共通なので、SEOをやめてGEOだけを行う意味はありません。一方で、質問文にそのまま答える短い段落を置く、数値や条件を表・箇条書きで構造化する、更新日と出典を明示するといった「抜き出されやすい書き方」はGEO側の追加作業になります。",
    },
  ],
  sources: [
    { title: "AI 機能とウェブサイト", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/appearance/ai-features?hl=ja" },
    { title: "Google の一般的なクローラー（Google-Extended）", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers?hl=ja" },
    { title: "Overview of OpenAI Crawlers", publisher: "OpenAI", url: "https://platform.openai.com/docs/bots" },
    { title: "PerplexityBot", publisher: "Perplexity", url: "https://docs.perplexity.ai/guides/bots" },
    { title: "Does Anthropic crawl data from the web, and how can site owners block the crawler?", publisher: "Anthropic", url: "https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler" },
    { title: "GEO: Generative Engine Optimization（arXiv:2311.09735）", publisher: "Aggarwal ほか", url: "https://arxiv.org/abs/2311.09735" },
    { title: "The /llms.txt file", publisher: "llmstxt.org", url: "https://llmstxt.org/" },
    { title: "Google 検索の基本事項", publisher: "Google 検索セントラル", url: "https://developers.google.com/search/docs/essentials?hl=ja" },
  ],
};

export const GUIDES: Record<GuideKey, Guide> = { seo: SEO, geo: GEO };
export const GUIDE_LIST: Guide[] = [SEO, GEO];

/** YYYY-MM-DD を「2026年8月30日」にする（引用時の出典表記に使う） */
export function jpDate(d: string): string {
  const [y, m, day] = d.split("-");
  return `${y}年${Number(m)}月${Number(day)}日`;
}

/** 解説ページの構造化データ。定義は DefinedTerm、一次情報は citation として宣言する */
export function guideJsonLd(guide: Guide) {
  const url = `${SITE_URL}${guide.path}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: guide.metaTitle,
    name: guide.h1,
    description: guide.description,
    datePublished: guide.published,
    dateModified: guide.updated,
    inLanguage: "ja",
    mainEntityOfPage: url,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    author: { "@id": `${SITE_URL}/#organization` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    about: {
      "@type": "DefinedTerm",
      "@id": `${url}#term`,
      name: guide.term,
      alternateName: guide.alternateNames,
      description: guide.definition,
      inDefinedTermSet: { "@type": "DefinedTermSet", name: `${guide.term}用語集`, url },
    },
    citation: guide.sources.map((s) => s.url),
  };
}
