// 情報収集元。一次情報（公式）を最優先し、業界メディアは速報の補完として扱う。
// kind: official=公式発表（そのまま記事化の価値が高い） / media=業界メディア（複数が報じた話題を優先）
// alwaysInclude: トピックキーワードに関係なく全件を候補にする（検索専門の公式ソースのみ）
export type FeedSource = {
  name: string;
  url: string;
  kind: "official" | "media";
  lang: "en" | "ja";
  alwaysInclude?: boolean;
  keywords?: string[];
  /** tools: AI検索向けツールの発表を検知する専用ソース。候補に「ツール検知」メモが付き、/tools ページ更新の材料になる */
  topic?: "tools";
  /** 媒体のトップページ。/about で「収集元の一次情報源」として読者に開示する（RSSのURLではなく人が読む方） */
  home?: string;
  /** WordPress の `?paged=N` でフィードを遡れるソース。バックフィル（--since）のときだけページを送る */
  paged?: boolean;
};

// Google News の検索RSS。PR TIMES・Web担当者Forum・アドタイ等を横断して日本語ニュースを拾える。
// 検索語には Google 検索の `after:` / `before:` 演算子が使えるので、過去の日付窓を指定して遡れる（バックフィル）。
export function googleNewsSearch(query: string, lang: "en" | "ja") {
  const locale = lang === "ja" ? "hl=ja&gl=JP&ceid=JP:ja" : "hl=en-US&gl=US&ceid=US:en";
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&${locale}`;
}

function googleNewsJa(query: string) {
  return googleNewsSearch(query, "ja");
}

// ツール発表の検知語。タイトル or 概要にこのどれかを含むものだけ候補にする。
export const TOOL_KEYWORDS = ["ツール", "診断", "チェッカー", "チェックツール", "ダッシュボード", "提供開始", "リリース", "公開", "β版", "ベータ", "可視性", "visibility", "tracker", "launch"];
// keywords: そのソースだけに適用する絞り込み語（未指定なら TOPIC_KEYWORDS）

export const FEED_SOURCES: FeedSource[] = [
  // --- 公式 ---
  { name: "Google Search Central Blog", alwaysInclude: true, url: "https://feeds.feedburner.com/blogspot/amDG", home: "https://developers.google.com/search/blog", kind: "official", lang: "en" },
  { name: "Google Search Status Dashboard", alwaysInclude: true, url: "https://status.search.google.com/en/feed.atom", home: "https://status.search.google.com/", kind: "official", lang: "en" },
  { name: "Google The Keyword (Search)", url: "https://blog.google/products/search/rss/", home: "https://blog.google/products/search/", kind: "official", lang: "en" },
  { name: "Bing Webmaster Blog", alwaysInclude: true, url: "https://blogs.bing.com/webmaster/feed", home: "https://blogs.bing.com/webmaster", kind: "official", lang: "en" },
  { name: "OpenAI News", url: "https://openai.com/news/rss.xml", home: "https://openai.com/news/", kind: "official", lang: "en", keywords: ["search", "seo", "crawl", "browse", "citation", "publisher", "atlas", "shopping"] },
  // --- 業界メディア ---
  { name: "Search Engine Land", url: "https://searchengineland.com/feed", home: "https://searchengineland.com/", kind: "media", paged: true, lang: "en" },
  { name: "Search Engine Journal", url: "https://www.searchenginejournal.com/feed/", home: "https://www.searchenginejournal.com/", kind: "media", paged: true, lang: "en" },
  { name: "Search Engine Roundtable", url: "https://www.seroundtable.com/rss.xml", home: "https://www.seroundtable.com/", kind: "media", lang: "en" },
  // 海外SEO情報ブログ（suzukikenichi.com）は外した。記事化に使う web_fetch が url_not_allowed を返し、
  // 元記事を読めない（2026-09-05に3回再現。robots.txt は /blog/ を許可しているのでAPI側の判定）。
  // 候補には挙がるのに1本も書けないので、収集の時点で拾わない。取得できるようになったら戻す。
  // --- ツール検知（Google News 日本語検索） ---
  { name: "Google News: LLMO", url: googleNewsJa("LLMO"), kind: "media", lang: "ja", topic: "tools", keywords: TOOL_KEYWORDS },
  { name: "Google News: GEO対策", url: googleNewsJa("GEO 対策"), kind: "media", lang: "ja", topic: "tools", keywords: TOOL_KEYWORDS },
  { name: "Google News: AIO対策", url: googleNewsJa("AIO 対策"), kind: "media", lang: "ja", topic: "tools", keywords: TOOL_KEYWORDS },
  { name: "Google News: AI検索ツール", url: googleNewsJa("AI検索 ツール"), kind: "media", lang: "ja", topic: "tools", keywords: TOOL_KEYWORDS },
  { name: "Google News: AI visibility", url: googleNewsJa("\"AI visibility\" tool"), kind: "media", lang: "en", topic: "tools", keywords: TOOL_KEYWORDS },
];

// 記事化の対象にするキーワード（タイトル or 概要に1つ以上含まれること）。
// 業界メディアは検索以外の話題（広告・SNS等）も多いため、ここで絞る。
export const TOPIC_KEYWORDS = [
  "seo", "search", "検索", "ranking", "algorithm", "core update", "spam update",
  "ai overview", "ai mode", "geo", "generative", "llm", "chatgpt", "perplexity", "gemini",
  "crawl", "index", "schema", "structured data", "llms.txt", "robots",
  "core web vitals", "search console", "bing", "citation", "aio",
];

// バックフィル（過去記事の掘り起こし）専用の検索語。
// 通常フィードは最新数十件しか返さないため、半年前まで遡るときは Google News 検索に
// 日付窓（after: / before:）を付けて月ごとに掘る。`--since` を渡したときだけ使う。
// ツール検知ソースと違い、こちらは記事化の題材（TOPIC_KEYWORDS で絞る）。
export const BACKFILL_QUERIES: { name: string; query: string; lang: "en" | "ja" }[] = [
  { name: "Backfill: Google コアアップデート", query: "Google コアアップデート 検索順位", lang: "ja" },
  { name: "Backfill: AI Overviews 日本語", query: "AI Overviews 検索 流入", lang: "ja" },
  { name: "Backfill: AIモード", query: "Google AIモード 検索", lang: "ja" },
  { name: "Backfill: 生成AI検索とSEO", query: "生成AI 検索 SEO 対策", lang: "ja" },
  { name: "Backfill: Google core update", query: "Google core update search ranking", lang: "en" },
  { name: "Backfill: AI Overviews", query: "AI Overviews traffic publishers", lang: "en" },
  { name: "Backfill: AI Mode", query: "Google AI Mode search results", lang: "en" },
  { name: "Backfill: ChatGPT search", query: "ChatGPT search citations publishers", lang: "en" },
];
