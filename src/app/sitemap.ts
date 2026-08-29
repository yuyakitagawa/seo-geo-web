import type { MetadataRoute } from "next";
import { getAllArticles, getArticlesByCategory, getArticlesByTag, getIndexableTags, latestUpdated } from "@/lib/content";
import { GUIDE_LIST } from "@/lib/guides";
import { CATEGORY_KEYS, SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getAllArticles();
  const latest = latestUpdated(articles) ?? new Date().toISOString().slice(0, 10);

  return [
    { url: SITE_URL, lastModified: latest, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/articles`, lastModified: latest, changeFrequency: "daily", priority: 0.8 },
    // lastmod はそのページに載っている記事の最新更新日にする。
    // 全ページを同じ日付にすると更新シグナルとして意味を持たない。
    ...CATEGORY_KEYS.map((c) => ({
      url: `${SITE_URL}/category/${c}`,
      lastModified: latestUpdated(getArticlesByCategory(c)) ?? latest,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    { url: `${SITE_URL}/tools`, lastModified: latest, changeFrequency: "weekly", priority: 0.8 },
    // 解説ページ（/seo, /geo）。定義クエリの受け皿でトップページの次に重要なので priority を高くする。
    ...GUIDE_LIST.map((g) => ({
      url: `${SITE_URL}${g.path}`,
      lastModified: g.updated,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    ...["about", "privacy", "disclaimer"].map((p) => ({ url: `${SITE_URL}/${p}`, changeFrequency: "monthly" as const, priority: 0.3 })),
    ...articles.map((a) => ({ url: `${SITE_URL}/articles/${a.slug}`, lastModified: a.updated, changeFrequency: "weekly" as const, priority: 0.6 })),
    // 記事1本だけの薄いタグページは載せない（noindexと同じしきい値。src/lib/content.ts）。
    ...getIndexableTags().map(({ tag }) => ({
      url: `${SITE_URL}/tag/${encodeURIComponent(tag)}`,
      lastModified: latestUpdated(getArticlesByTag(tag)) ?? latest,
      changeFrequency: "weekly" as const,
      priority: 0.4,
    })),
  ];
}
