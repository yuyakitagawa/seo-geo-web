// 情報収集元。一次情報（公式）を最優先し、業界メディアは速報の補完として扱う。
// kind: official=公式発表（そのまま記事化の価値が高い） / media=業界メディア（複数が報じた話題を優先）
// alwaysInclude: トピックキーワードに関係なく全件を候補にする（検索専門の公式ソースのみ）
export type FeedSource = { name: string; url: string; kind: "official" | "media"; lang: "en" | "ja"; alwaysInclude?: boolean; keywords?: string[] };
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
];

// 記事化の対象にするキーワード（タイトル or 概要に1つ以上含まれること）。
// 業界メディアは検索以外の話題（広告・SNS等）も多いため、ここで絞る。
export const TOPIC_KEYWORDS = [
  "seo", "search", "検索", "ranking", "algorithm", "core update", "spam update",
  "ai overview", "ai mode", "geo", "generative", "llm", "chatgpt", "perplexity", "gemini",
  "crawl", "index", "schema", "structured data", "llms.txt", "robots",
  "core web vitals", "search console", "bing", "citation", "aio",
];
