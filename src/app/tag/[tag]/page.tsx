import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleList from "@/components/ArticleList";
import { getAllTags, getArticlesByTag } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllTags().map(({ tag }) => ({ tag }));
}

export async function generateMetadata({ params }: PageProps<"/tag/[tag]">): Promise<Metadata> {
  const tag = decodeURIComponent((await params).tag);
  return { title: `#${tag} の記事`, description: `「${tag}」に関する記事一覧。`, alternates: { canonical: `/tag/${encodeURIComponent(tag)}` } };
}

export default async function TagPage({ params }: PageProps<"/tag/[tag]">) {
  const tag = decodeURIComponent((await params).tag);
  const articles = getArticlesByTag(tag);
  if (articles.length === 0) notFound();
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">#{tag}</h1>
      <ArticleList articles={articles} />
    </>
  );
}
