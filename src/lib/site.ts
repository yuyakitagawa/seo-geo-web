// サイト基本URL。優先順位:
// 1. NEXT_PUBLIC_SITE_URL（独自ドメイン接続後にVercelの環境変数で設定する）
// 2. VERCEL_PROJECT_PRODUCTION_URL（Vercelが自動注入する本番URL。プレビューでも本番URLを指す）
// 3. ローカル開発
// canonical / OGP / sitemap / JSON-LD のすべてがこの値を基準にするため、URL変更時はここだけ直せばよい。
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  "http://localhost:3000"
).replace(/\/$/, "");

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "SEO・GEO・AIO Lab";

export const SITE_DESCRIPTION =
  "Google検索・AI検索（ChatGPT / Perplexity / AI Overview）の最新アップデートを毎日追い、SEO・GEO・AIOの実務ノウハウとして解説するメディア。検索プロダクトのPdM経験をもとに、一次情報へのリンク付きでまとめます。";

// AI検索エンジンがブランド名の表記ゆれを別エンティティと誤認しないようOrganizationのalternateNameに束ねる。
export const SITE_ALTERNATE_NAMES = [SITE_NAME, "SEO GEO AIO Lab"];

// 公式Xアカウント。未開設の間は空文字にしておくとフォロー導線・twitter:siteが出ない。
export const X_SCREEN_NAME = process.env.NEXT_PUBLIC_X_SCREEN_NAME || "";
export const X_PROFILE_URL = X_SCREEN_NAME ? `https://x.com/${X_SCREEN_NAME}` : "";
export const X_HANDLE = X_SCREEN_NAME ? `@${X_SCREEN_NAME}` : undefined;

export const ORGANIZATION_SAME_AS = [X_PROFILE_URL].filter(Boolean);

// 記事カテゴリ。URL(/category/<key>)・記事frontmatterの category と一致させる。
export const CATEGORIES = {
  seo: { label: "SEO", description: "Google/Bing検索のアルゴリズム更新、テクニカルSEO、コンテンツSEOの実務" },
  geo: { label: "GEO", description: "生成AI検索（ChatGPT Search / Perplexity / Gemini）で引用されるための最適化" },
  aio: { label: "AIO", description: "Google AI Overview / AI Mode の挙動と対策" },
  news: { label: "ニュース", description: "検索・AI業界の最新アップデート速報" },
} as const;
export type CategoryKey = keyof typeof CATEGORIES;
export const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[];
export function isCategoryKey(v: string): v is CategoryKey {
  return v in CATEGORIES;
}

export const ARTICLES_PER_PAGE = 12;
