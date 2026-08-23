import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleList from "@/components/ArticleList";
import PageHeader from "@/components/PageHeader";
import { getArticlesByCategory } from "@/lib/content";
import { CATEGORIES, CATEGORY_KEYS, isCategoryKey } from "@/lib/site";

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
  return (
    <>
      <PageHeader eyebrow="Category" title={c.label} lead={c.description} />
      <div className="mx-auto max-w-6xl px-5 pb-16"><ArticleList articles={getArticlesByCategory(category)} /></div>
    </>
  );
}
