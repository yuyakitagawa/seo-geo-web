// AI検索・AI学習・検索エンジンのクローラー一覧。robots.txt チェッカー（/tools/ai-crawlers）のデータ。
// 各行は提供元の公式ドキュメントで user-agent トークンと用途を確認したものだけを載せる（verified は確認日）。
// 出典に書かれていない用途・効果は書かない。

export type CrawlerPurpose = "ai-search" | "ai-training" | "search";

export const PURPOSE: Record<CrawlerPurpose, { label: string; lead: string }> = {
  "ai-search": {
    label: "AI検索の回答に出るため",
    lead: "AIが回答を作るときにページを読み、回答内にリンクを出すためのクローラー。ブロックすると引用されなくなる。",
  },
  "ai-training": {
    label: "AIモデルの学習に使われる",
    lead: "生成AIの学習データを集めるクローラー。ブロックしても検索結果やAI検索での引用には影響しない。",
  },
  search: {
    label: "検索エンジンのインデックス",
    lead: "従来の検索結果に載せるためのクローラー。Googleの場合はAI Overview・AI Modeもこれで制御する。",
  },
};

export type Crawler = {
  /** robots.txt に書く user-agent トークン */
  token: string;
  vendor: string;
  purpose: CrawlerPurpose;
  /** 何をするクローラーか（公式ドキュメントの記述に沿う） */
  role: string;
  /** ブロックすると何が起きるか */
  ifBlocked: string;
  source: { title: string; url: string };
  verified: string;
  /** 補足（robots.txt が効かない場合など） */
  note?: string;
};

const V = "2026-08-30";
const OPENAI = { title: "OpenAI Bots", url: "https://developers.openai.com/api/docs/bots" };
const PERPLEXITY = { title: "Perplexity Bots", url: "https://docs.perplexity.ai/guides/bots" };
const ANTHROPIC = {
  title: "Anthropic: Does Anthropic crawl data from the web?",
  url: "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler",
};
const GOOGLE_CRAWLERS = {
  title: "Google 検索セントラル: Google の一般的なクローラー",
  url: "https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers",
};
const GOOGLE_AI = { title: "Google 検索セントラル: AI 機能と Google 検索", url: "https://developers.google.com/search/docs/appearance/ai-features" };

export const CRAWLERS: Crawler[] = [
  {
    token: "OAI-SearchBot",
    vendor: "OpenAI",
    purpose: "ai-search",
    role: "ChatGPTの検索結果にサイトを表示するためのクローラー。学習用のGPTBotとは独立して設定できる。",
    ifBlocked: "ChatGPTの検索結果に表示されなくなる。",
    source: OPENAI,
    verified: V,
  },
  {
    token: "ChatGPT-User",
    vendor: "OpenAI",
    purpose: "ai-search",
    role: "ユーザーがChatGPTに質問したときに、その場でページを見に行くアクセス。自動巡回はしない。",
    ifBlocked: "ユーザーがChatGPT上でページを開こうとしても取得できなくなる。",
    note: "ユーザー起点のアクセスのため、robots.txt が適用されない場合があると公式に書かれている。",
    source: OPENAI,
    verified: V,
  },
  {
    token: "PerplexityBot",
    vendor: "Perplexity",
    purpose: "ai-search",
    role: "Perplexityの検索結果にサイトを出し、リンクするためのクローラー。基盤モデルの学習には使われない。",
    ifBlocked: "Perplexityの検索結果に表示されなくなる。",
    source: PERPLEXITY,
    verified: V,
  },
  {
    token: "Perplexity-User",
    vendor: "Perplexity",
    purpose: "ai-search",
    role: "ユーザーの質問に答えるためにページを訪問し、回答にリンクを添えるアクセス。巡回や学習には使われない。",
    ifBlocked: "回答の中でページが開かれなくなる。",
    source: PERPLEXITY,
    verified: V,
  },
  {
    token: "Claude-SearchBot",
    vendor: "Anthropic",
    purpose: "ai-search",
    role: "Claudeの検索結果の品質を上げるためにコンテンツを解析するクローラー。",
    ifBlocked: "検索用のインデックスに入らなくなり、Claudeの回答での露出が減る。",
    source: ANTHROPIC,
    verified: V,
  },
  {
    token: "Claude-User",
    vendor: "Anthropic",
    purpose: "ai-search",
    role: "ユーザーがClaudeに質問したときにページへアクセスする。",
    ifBlocked: "ユーザー起点のアクセスでページを取得できなくなる。",
    source: ANTHROPIC,
    verified: V,
  },
  {
    token: "Googlebot",
    vendor: "Google",
    purpose: "search",
    role: "Google検索のクローラー。AI Overview・AI Modeのための別トークンは無く、Googlebotがその制御になる。",
    ifBlocked: "Google検索に載らなくなる。AI Overview・AI Modeにも出なくなる。",
    note: "検索には載せたうえで引用文だけ抑えたい場合は nosnippet / data-nosnippet / max-snippet を使う。",
    source: GOOGLE_AI,
    verified: V,
  },
  {
    token: "Bingbot",
    vendor: "Microsoft",
    purpose: "search",
    role: "Bing検索のクローラー。",
    ifBlocked: "Bing検索に載らなくなる。",
    source: { title: "Bing Webmaster: Which crawlers does Bing use?", url: "https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0" },
    verified: V,
  },
  {
    token: "GPTBot",
    vendor: "OpenAI",
    purpose: "ai-training",
    role: "OpenAIの基盤モデルの学習にコンテンツを使うためのクローラー。",
    ifBlocked: "OpenAIのモデル学習に使われなくなる。ChatGPTの検索結果への表示（OAI-SearchBot）とは別。",
    source: OPENAI,
    verified: V,
  },
  {
    token: "ClaudeBot",
    vendor: "Anthropic",
    purpose: "ai-training",
    role: "Anthropicの生成AIモデルの学習に使う可能性のあるコンテンツを集めるクローラー。",
    ifBlocked: "今後のモデル学習データから除外される。",
    source: ANTHROPIC,
    verified: V,
  },
  {
    token: "Google-Extended",
    vendor: "Google",
    purpose: "ai-training",
    role: "Geminiアプリと Vertex AI 向けの学習・グラウンディングにコンテンツを使うかどうかを制御するトークン。単独のUser-Agent文字列は持たない。",
    ifBlocked: "Geminiアプリなどの学習・グラウンディングに使われなくなる。Google検索への掲載には影響しない。",
    note: "AI Overview・AI Modeへの表示は Google-Extended では止まらない（制御は Googlebot 側）。",
    source: GOOGLE_CRAWLERS,
    verified: V,
  },
  {
    token: "Applebot-Extended",
    vendor: "Apple",
    purpose: "ai-training",
    role: "Appleの生成AIモデルの学習にコンテンツを使うかどうかを制御するトークン。",
    ifBlocked: "Appleの生成AIモデルの学習に使われなくなる。Applebotによる検索用のクロールは続く。",
    source: { title: "Apple: About Applebot", url: "https://support.apple.com/en-us/119829" },
    verified: V,
  },
  {
    token: "meta-externalagent",
    vendor: "Meta",
    purpose: "ai-training",
    role: "AIモデルの学習、またはコンテンツのインデックスによる製品改善に使われるクローラー。",
    ifBlocked: "Metaのモデル学習・インデックスに使われなくなる。",
    source: { title: "Meta: Web crawlers", url: "https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/" },
    verified: V,
  },
  {
    token: "CCBot",
    vendor: "Common Crawl",
    purpose: "ai-training",
    role: "Common Crawlの公開アーカイブを作るクローラー。",
    ifBlocked: "Common Crawlの公開データセットに含まれなくなる。",
    source: { title: "Common Crawl: CCBot", url: "https://commoncrawl.org/ccbot" },
    verified: V,
  },
];

export const PURPOSE_ORDER: CrawlerPurpose[] = ["ai-search", "search", "ai-training"];

/** robots.txt のひな形。方針ごとに1つ */
export const PRESETS: { key: string; label: string; lead: string; build: () => string }[] = [
  {
    key: "cite-not-train",
    label: "AI検索には出す・学習には使わせない",
    lead: "回答内での引用は受け入れつつ、モデルの学習データから外す。もっとも選ばれる設定。",
    build: () =>
      [
        "# AI検索の引用は許可、モデル学習は拒否",
        ...CRAWLERS.filter((c) => c.purpose === "ai-training").map((c) => `User-agent: ${c.token}\nDisallow: /\n`),
        "User-agent: *",
        "Disallow:",
        "",
        "Sitemap: https://example.com/sitemap.xml",
      ].join("\n"),
  },
  {
    key: "allow-all",
    label: "すべて許可",
    lead: "引用も学習も止めない。露出を最大化する設定。",
    build: () => ["# すべてのクローラーを許可", "User-agent: *", "Disallow:", "", "Sitemap: https://example.com/sitemap.xml"].join("\n"),
  },
  {
    key: "block-ai",
    label: "AI関連をすべて拒否",
    lead: "AI検索の引用も学習も止め、従来の検索エンジンだけを許可する。AI経由の流入は無くなる。",
    build: () =>
      [
        "# AI検索・AI学習を拒否、検索エンジンは許可",
        ...CRAWLERS.filter((c) => c.purpose !== "search").map((c) => `User-agent: ${c.token}\nDisallow: /\n`),
        "User-agent: *",
        "Disallow:",
        "",
        "Sitemap: https://example.com/sitemap.xml",
      ].join("\n"),
  },
];
