import type { MetadataRoute } from "next";
import { getAllArticles, getAllTags } from "@/lib/content";
import { CATEGORY_KEYS, SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getAllArticles();
  const latest = articles[0]?.updated ?? new Date().toISOString().slice(0, 10);

  return [
    { url: SITE_URL, lastModified: latest, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/articles`, lastModified: latest, changeFrequency: "daily", priority: 0.8 },
    ...CATEGORY_KEYS.map((c) => ({ url: `${SITE_URL}/category/${c}`, lastModified: latest, changeFrequency: "daily" as const, priority: 0.7 })),
    ...["about", "privacy", "disclaimer"].map((p) => ({ url: `${SITE_URL}/${p}`, changeFrequency: "monthly" as const, priority: 0.3 })),
    ...articles.map((a) => ({ url: `${SITE_URL}/articles/${a.slug}`, lastModified: a.updated, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...getAllTags().map(({ tag }) => ({ url: `${SITE_URL}/tag/${encodeURIComponent(tag)}`, lastModified: latest, changeFrequency: "weekly" as const, priority: 0.4 })),
  ];
}
