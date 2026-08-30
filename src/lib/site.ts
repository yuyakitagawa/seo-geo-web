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

// 構造化データ用のロゴ。OGP画像（1200x630の横長）ではなく正方形を指す
// （Organization.logo にはOGP用の横長比率ではなく正方形〜近い比率の画像を使う）。
// 実体は src/app/icon-512.png/route.tsx が next/og で生成するPNG。
export const SITE_LOGO = { url: `${SITE_URL}/icon-512.png`, width: 512, height: 512 };

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

// 問い合わせ窓口。運営者は実名・個人用メールを公開しない方針だが、連絡手段がまったく無いサイトは
// AdSense審査（サイトの信頼性）でも検索評価（E-E-A-T）でも不利になる。
// サイト専用のメールアドレスか、フォーム（Googleフォーム等）のURLのどちらかをenvで入れる。
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "";
export const CONTACT_FORM_URL = process.env.NEXT_PUBLIC_CONTACT_FORM_URL || "";
// どれか1つでもあれば /contact を公開する（すべて未設定なら noindex かつ導線も出さない）。
export const HAS_CONTACT = Boolean(CONTACT_EMAIL || CONTACT_FORM_URL || X_PROFILE_URL);

// Organization構造化データの contactPoint。メール > フォーム > X の順で1つだけ宣言する。
export const ORGANIZATION_CONTACT_POINT = CONTACT_EMAIL
  ? { "@type": "ContactPoint", contactType: "customer support", email: CONTACT_EMAIL, availableLanguage: ["ja"] }
  : CONTACT_FORM_URL || X_PROFILE_URL
    ? { "@type": "ContactPoint", contactType: "customer support", url: CONTACT_FORM_URL || X_PROFILE_URL, availableLanguage: ["ja"] }
    : undefined;

// ポリシー類の最終改定日。プライバシーポリシー・免責事項の表示とsitemapのlastmodに使う。
export const POLICY_UPDATED = "2026-08-29";
export const POLICY_UPDATED_LABEL = POLICY_UPDATED.replace(/^(\d{4})-0?(\d+)-0?(\d+)$/, "$1年$2月$3日");

// 記事カテゴリ。記事frontmatterの category と一致させる。
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

// カテゴリのURL。/category/<key> は廃止し、SEO・GEOは解説ページ、ニュースは記事アーカイブに統合した。
// 旧URLからのリダイレクトは next.config.ts に置く。リンクを書く場所は必ずこの関数を通す。
export const CATEGORY_PATH: Record<CategoryKey, string> = { seo: "/seo", geo: "/geo", news: "/news" };
export function categoryHref(key: CategoryKey): string {
  return CATEGORY_PATH[key];
}

export const ARTICLES_PER_PAGE = 12;

// タグページの足切り。記事1本だけのタグページは中身が一覧リンク1個しかなく、
// 「クロール済み - インデックス未登録」を増やしてクロール枠を食う。
// この本数未満のタグは noindex にし、sitemap からも外す（表示側と生成側で同じ値を使う）。
export const TAG_MIN_ARTICLES = 2;
