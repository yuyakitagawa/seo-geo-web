import type { MetadataRoute } from "next";
import { getAllArticles, getArticlesByCategory, getArticlesByTag, getIndexableTags, latestUpdated } from "@/lib/content";
import { APP_TOOLS } from "@/lib/apps";
import { GUIDE_LIST } from "@/lib/guides";
import { HAS_CONTACT, POLICY_UPDATED, SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getAllArticles();
  const latest = latestUpdated(articles) ?? new Date().toISOString().slice(0, 10);

  return [
    { url: SITE_URL, lastModified: latest, changeFrequency: "daily", priority: 1 },
    // 記事アーカイブ。lastmod は載っている記事の最新更新日にする（全ページ同じ日付だと更新シグナルにならない）。
    { url: `${SITE_URL}/news`, lastModified: latest, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/tools`, lastModified: latest, changeFrequency: "weekly", priority: 0.8 },
    // 自作ツール。継続的に使われる固定ページなので更新頻度は低く、優先度は高くする。
    ...APP_TOOLS.map((t) => ({
      url: `${SITE_URL}${t.path}`,
      lastModified: t.updated,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    // 解説ページ（/seo, /geo）。定義クエリの受け皿でトップページの次に重要なので priority を高くする。
    ...GUIDE_LIST.map((g) => ({
      url: `${SITE_URL}${g.path}`,
      lastModified: [g.updated, latestUpdated(getArticlesByCategory(g.category)) ?? g.updated].sort().at(-1)!,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    // 固定ページ。/contact は窓口（env）が未設定のときビルドで404になるので載せない。
    ...["about", "privacy", "disclaimer", ...(HAS_CONTACT ? ["contact"] : [])].map((p) => ({
      url: `${SITE_URL}/${p}`,
      lastModified: POLICY_UPDATED,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
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
