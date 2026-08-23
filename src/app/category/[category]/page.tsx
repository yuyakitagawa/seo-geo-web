import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleList from "@/components/ArticleList";
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
      <h1 className="text-2xl font-bold">{c.label}</h1>
      <p className="mb-6 mt-2 text-neutral-600 dark:text-neutral-400">{c.description}</p>
      <ArticleList articles={getArticlesByCategory(category)} />
    </>
  );
}
