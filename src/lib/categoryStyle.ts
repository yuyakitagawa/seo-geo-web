import type { CategoryKey } from "./site";

// カテゴリ色。Tailwindのクラスは静的に書かないとパージされるため、ここで完全なクラス名を持つ。
export const CATEGORY_STYLE: Record<CategoryKey, { badge: string; dot: string; glow: string }> = {
  seo: { badge: "bg-seo text-white", dot: "bg-seo", glow: "from-seo/40" },
  geo: { badge: "bg-geo text-white", dot: "bg-geo", glow: "from-geo/40" },
  news: { badge: "bg-news text-white", dot: "bg-news", glow: "from-news/40" },
};
