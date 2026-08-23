import type { Metadata } from "next";
import ArticleList from "@/components/ArticleList";
import { getAllArticles } from "@/lib/content";

export const metadata: Metadata = {
  title: "記事一覧",
  description: "SEO・GEO・AIOに関する全記事の一覧。",
  alternates: { canonical: "/articles" },
};

export default function ArticlesPage() {
  const articles = getAllArticles();
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">記事一覧 <span className="text-base font-normal text-neutral-500">({articles.length}件)</span></h1>
      <ArticleList articles={articles} />
    </>
  );
}
