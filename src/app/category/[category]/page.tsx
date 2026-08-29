import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleList from "@/components/ArticleList";
import JsonLd from "@/components/JsonLd";
import PageHeader from "@/components/PageHeader";
import { collectionJsonLd, collectionSummary } from "@/lib/collection";
import { getArticlesByCategory } from "@/lib/content";
import { CATEGORIES, CATEGORY_KEYS, SITE_URL, isCategoryKey } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return CATEGORY_KEYS.map((category) => ({ category }));
}

export async function generateMetadata({ params }: PageProps<"/category/[category]">): Promise<Metadata> {
  const { category } = await params;
  if (!isCategoryKey(category)) return {};
  const c = CATEGORIES[category];
  return { title: `${c.label}の記事`, description: c.description, alternates: { canonical: `/category/${category}` } };
}

export default async function CategoryPage({ params }: PageProps<"/category/[category]">) {
  const { category } = await params;
  if (!isCategoryKey(category)) notFound();
  const c = CATEGORIES[category];
  const articles = getArticlesByCategory(category);
  // ストック（解説）を先、フロー（ニュース）を後。AI検索・検索流入の受け皿になるのは解説側なので上に置く。
  const howto = articles.filter((a) => a.type === "howto");
  const news = articles.filter((a) => a.type !== "howto");
  const url = `${SITE_URL}/category/${category}`;

  return (
    <>
      <JsonLd data={collectionJsonLd({ url, name: `${c.label}の記事`, description: c.description, articles })} />
      <PageHeader eyebrow="Category" title={c.label} lead={c.description} crumbs={[{ name: c.label }]} />
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-12">
        {/* 「◯◯の最新動向は？」のような包括クエリに直答する段落。件数と期間を先に出す。 */}
        <p className="mb-10 max-w-3xl leading-relaxed text-mute">{collectionSummary(c.label, articles)}</p>
        {howto.length > 0 && (
          <section className="mb-14">
            <h2 className="mb-5 text-xl font-bold tracking-tight">{category === "news" ? "解説記事" : `${c.label}対策の解説`}</h2>
            <ArticleList articles={howto} />
          </section>
        )}
        {news.length > 0 && (
          <section>
            {howto.length > 0 && <h2 className="mb-5 text-xl font-bold tracking-tight">{c.label}の最新ニュース</h2>}
            <ArticleList articles={news} />
          </section>
        )}
        {articles.length === 0 && <ArticleList articles={articles} />}
      </div>
    </>
  );
}
