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
};

// Google News の検索RSS。PR TIMES・Web担当者Forum・アドタイ等を横断して日本語ニュースを拾える。
function googleNewsJa(query: string) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ja&gl=JP&ceid=JP:ja`;
}

// ツール発表の検知語。タイトル or 概要にこのどれかを含むものだけ候補にする。
export const TOOL_KEYWORDS = ["ツール", "診断", "チェッカー", "チェックツール", "ダッシュボード", "提供開始", "リリース", "公開", "β版", "ベータ", "可視性", "visibility", "tracker", "launch"];
// keywords: そのソースだけに適用する絞り込み語（未指定なら TOPIC_KEYWORDS）

export const FEED_SOURCES: FeedSource[] = [
  // --- 公式 ---
  { name: "Google Search Central Blog", alwaysInclude: true, url: "https://feeds.feedburner.com/blogspot/amDG", kind: "official", lang: "en" },
  { name: "Google Search Status Dashboard", alwaysInclude: true, url: "https://status.search.google.com/en/feed.atom", kind: "official", lang: "en" },
  { name: "Google The Keyword (Search)", url: "https://blog.google/products/search/rss/", kind: "official", lang: "en" },
  { name: "Bing Webmaster Blog", alwaysInclude: true, url: "https://blogs.bing.com/webmaster/feed", kind: "official", lang: "en" },
  { name: "OpenAI News", url: "https://openai.com/news/rss.xml", kind: "official", lang: "en", keywords: ["search", "seo", "crawl", "browse", "citation", "publisher", "atlas", "shopping"] },
  // --- 業界メディア ---
  { name: "Search Engine Land", url: "https://searchengineland.com/feed", kind: "media", lang: "en" },
  { name: "Search Engine Journal", url: "https://www.searchenginejournal.com/feed/", kind: "media", lang: "en" },
  { name: "Search Engine Roundtable", url: "https://www.seroundtable.com/rss.xml", kind: "media", lang: "en" },
  { name: "海外SEO情報ブログ", url: "https://www.suzukikenichi.com/blog/feed/", kind: "media", lang: "ja" },
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
