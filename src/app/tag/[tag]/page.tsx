import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleList from "@/components/ArticleList";
import PageHeader from "@/components/PageHeader";
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
      <PageHeader eyebrow="Topic" title={`#${tag}`} />
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-12"><ArticleList articles={articles} /></div>
    </>
  );
}
