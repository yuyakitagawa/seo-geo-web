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
  const url = `${SITE_URL}/category/${category}`;

  return (
    <>
      <JsonLd data={collectionJsonLd({ url, name: `${c.label}の記事`, description: c.description, articles })} />
      <PageHeader eyebrow="Category" title={c.label} lead={c.description} crumbs={[{ name: c.label }]} />
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-12">
        {/* 「◯◯の最新動向は？」のような包括クエリに直答する段落。件数と期間を先に出す。 */}
        <p className="mb-10 max-w-3xl leading-relaxed text-mute">{collectionSummary(c.label, articles)}</p>
        <ArticleList articles={articles} />
      </div>
    </>
  );
}
