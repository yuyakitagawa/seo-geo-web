import type { Metadata } from "next";
import ArticleList from "@/components/ArticleList";
import PageHeader from "@/components/PageHeader";
import { getAllArticles } from "@/lib/content";

export const metadata: Metadata = {
  title: "記事一覧",
  description: "SEO・GEOに関する全記事の一覧。",
  alternates: { canonical: "/articles" },
};

export default function ArticlesPage() {
  const articles = getAllArticles();
  return (
    <>
      <PageHeader eyebrow={`All articles · ${articles.length}`} title="記事一覧" art={{ seed: 1, category: "geo" }} />
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-12"><ArticleList articles={articles} /></div>
    </>
  );
}
