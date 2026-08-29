import type { Metadata } from "next";
import ArticleList from "@/components/ArticleList";
import JsonLd from "@/components/JsonLd";
import PageHeader from "@/components/PageHeader";
import { collectionJsonLd, collectionSummary } from "@/lib/collection";
import { getAllArticles } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

const DESCRIPTION = "Google検索・AI Overview・AI Mode・ChatGPT・Perplexityのアップデート解説を新しい順に一覧。全記事に影響度・対象・やることと一次情報のURLが付いています。";

export const metadata: Metadata = {
  title: "記事一覧",
  description: DESCRIPTION,
  alternates: { canonical: "/articles" },
};

export default function ArticlesPage() {
  const articles = getAllArticles();
  const url = `${SITE_URL}/articles`;
  return (
    <>
      <JsonLd data={collectionJsonLd({ url, name: "記事一覧", description: DESCRIPTION, articles })} />
      <PageHeader eyebrow={`All articles · ${articles.length}`} title="記事一覧" lead={DESCRIPTION} crumbs={[{ name: "記事一覧" }]} />
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-12">
        <p className="mb-10 max-w-3xl leading-relaxed text-mute">{collectionSummary("SEO・GEO", articles)}</p>
        <ArticleList articles={articles} />
      </div>
    </>
  );
}
