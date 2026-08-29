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

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "SEO GEO Lab";

export const SITE_DESCRIPTION =
  "Google検索・AI検索（AI Overview / ChatGPT / Perplexity）の最新アップデートを毎日追い、SEOとGEO（生成AI検索最適化）の実務ノウハウとして解説するメディア。SEO/GEO担当が読むべき変更だけを、一次情報へのリンク付きで日本語にまとめます。";

// AI検索エンジンがブランド名の表記ゆれを別エンティティと誤認しないようOrganizationのalternateNameに束ねる。
export const SITE_ALTERNATE_NAMES = [SITE_NAME, "SEO・GEO Lab", "SEOGEOラボ"];

// 公式Xアカウント。未開設の間は空文字にしておくとフォロー導線・twitter:siteが出ない。
export const X_SCREEN_NAME = process.env.NEXT_PUBLIC_X_SCREEN_NAME || "";
export const X_PROFILE_URL = X_SCREEN_NAME ? `https://x.com/${X_SCREEN_NAME}` : "";
export const X_HANDLE = X_SCREEN_NAME ? `@${X_SCREEN_NAME}` : undefined;

export const ORGANIZATION_SAME_AS = [X_PROFILE_URL].filter(Boolean);
// フォローintent。プロフィールへの素のリンクよりワンタップ少なくフォローできる。
export const X_FOLLOW_URL = X_SCREEN_NAME ? `https://x.com/intent/follow?screen_name=${X_SCREEN_NAME}` : "";

// Organization構造化データの contactPoint。運営者は実名・メールを公開しない方針のため、
// 連絡先は公式XのみをE-E-A-T（連絡可能性）のシグナルとして宣言する。Xが未設定なら出さない。
export const ORGANIZATION_CONTACT_POINT = X_PROFILE_URL
  ? { "@type": "ContactPoint", contactType: "customer support", url: X_PROFILE_URL, availableLanguage: ["ja"] }
  : undefined;

// 記事カテゴリ。URL(/category/<key>)・記事frontmatterの category と一致させる。
export const CATEGORIES = {
  seo: { label: "SEO", description: "Google/Bing検索のアルゴリズム更新、テクニカルSEO、コンテンツSEOの実務" },
  geo: { label: "GEO", description: "生成AI検索最適化。Google AI Overview / AI Mode、ChatGPT、Perplexity、Geminiで引用されるための実務" },
  news: { label: "ニュース", description: "検索・AI業界の最新アップデート速報" },
} as const;
export type CategoryKey = keyof typeof CATEGORIES;
export const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[];
export function isCategoryKey(v: string): v is CategoryKey {
  return v in CATEGORIES;
}

export const ARTICLES_PER_PAGE = 12;

// タグページの足切り。記事1本だけのタグページは中身が一覧リンク1個しかなく、
// 「クロール済み - インデックス未登録」を増やしてクロール枠を食う。
// この本数未満のタグは noindex にし、sitemap からも外す（表示側と生成側で同じ値を使う）。
export const TAG_MIN_ARTICLES = 2;
