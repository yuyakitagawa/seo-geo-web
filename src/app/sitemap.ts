import type { MetadataRoute } from "next";
import { getArticlesByCategory, getArticlesByTag, latestUpdated } from "@/lib/content";
import { indexableArticles, indexableTags } from "@/lib/indexability";
import { APP_TOOLS } from "@/lib/apps";
import { COURSE, LESSONS, lessonPath } from "@/lib/curriculum";
import { GLOSSARY_PATH, GLOSSARY_UPDATED } from "@/lib/glossary";
import { GUIDE_LIST } from "@/lib/guides";
import { HAS_CONTACT_PAGE } from "@/lib/contact-notify";
import { POLICY_UPDATED, SITE_URL } from "@/lib/site";

// output: "export" では、メタデータのルートにこれが無いとビルドが落ちる（Vercel上でISRを使わないための静的エクスポート）。
export const dynamic = "force-static";

// changefreq と priority は出さない。Googleが無視すると明言している値で、
// 「毎日更新」と書いても実態が伴わなければ何の効果もない（kujira-watch も同じ理由で外した）。
// 効くのは lastmod だけなので、そのページの内容が実際に変わるデータ源から厳密に取る。
export default function sitemap(): MetadataRoute.Sitemap {
  const articles = indexableArticles();
  const latest = latestUpdated(articles) ?? new Date().toISOString().slice(0, 10);

  return [
    { url: SITE_URL, lastModified: latest },
    // 記事アーカイブ。lastmod は載っている記事の最新更新日にする（全ページ同じ日付だと更新シグナルにならない）。
    { url: `${SITE_URL}/news`, lastModified: latest },
    { url: `${SITE_URL}/tools`, lastModified: latest },
    ...APP_TOOLS.map((t) => ({ url: `${SITE_URL}${t.path}`, lastModified: t.updated })),
    // 解説ページ（/seo, /geo）。ページ自身の更新日と、そのカテゴリの記事の最新更新日の新しい方。
    ...GUIDE_LIST.map((g) => ({
      url: `${SITE_URL}${g.path}`,
      lastModified: [g.updated, latestUpdated(getArticlesByCategory(g.category)) ?? g.updated].sort().at(-1)!,
    })),
    { url: `${SITE_URL}${GLOSSARY_PATH}`, lastModified: GLOSSARY_UPDATED },
    // 教科書（/learn）。
    { url: `${SITE_URL}${COURSE.path}`, lastModified: COURSE.updated },
    ...LESSONS.map((l) => ({ url: `${SITE_URL}${lessonPath(l.slug)}`, lastModified: l.updated })),
    // 固定ページ。/contact は窓口（env）が未設定のときビルドで404になるので載せない。
    ...["about", "privacy", "disclaimer", ...(HAS_CONTACT_PAGE ? ["contact"] : [])].map((p) => ({
      url: `${SITE_URL}/${p}`,
      lastModified: POLICY_UPDATED,
    })),
    // 続報に置き換えられた記事（frontmatter の supersedes で指定）は noindex にしているので載せない。
    ...articles.map((a) => ({ url: `${SITE_URL}/articles/${a.slug}`, lastModified: a.updated })),
    // 記事1本だけの薄いタグページは載せない（noindexと同じしきい値。src/lib/indexability.ts）。
    ...indexableTags().map(({ tag }) => ({
      url: `${SITE_URL}/tag/${encodeURIComponent(tag)}`,
      lastModified: latestUpdated(getArticlesByTag(tag)) ?? latest,
    })),
  ];
}
