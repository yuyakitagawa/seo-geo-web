import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleList from "@/components/ArticleList";
import JsonLd from "@/components/JsonLd";
import PageHeader from "@/components/PageHeader";
import { collectionJsonLd, collectionSummary } from "@/lib/collection";
import { getAllTags, getArticlesByTag, isIndexableTag } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllTags().map(({ tag }) => ({ tag }));
}

export async function generateMetadata({ params }: PageProps<"/tag/[tag]">): Promise<Metadata> {
  const tag = decodeURIComponent((await params).tag);
  return {
    title: `#${tag} の記事`,
    description: `「${tag}」に関する記事一覧。`,
    alternates: { canonical: `/tag/${encodeURIComponent(tag)}` },
    // 記事が1本だけのタグページは中身が薄いのでインデックスさせない（sitemapからも外れる）。
    // リンクは辿らせるのでページ自体は残し、内部リンクの経路として機能させる。
    ...(isIndexableTag(tag) ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function TagPage({ params }: PageProps<"/tag/[tag]">) {
  const tag = decodeURIComponent((await params).tag);
  const articles = getArticlesByTag(tag);
  if (articles.length === 0) notFound();
  const url = `${SITE_URL}/tag/${encodeURIComponent(tag)}`;

  return (
    <>
      <JsonLd data={collectionJsonLd({ url, name: `#${tag} の記事`, description: `「${tag}」に関する記事一覧。`, articles })} />
      <PageHeader eyebrow="Topic" title={`#${tag}`} crumbs={[{ name: `#${tag}` }]} />
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-12">
        <p className="mb-10 max-w-3xl leading-relaxed text-mute">{collectionSummary(`「${tag}」`, articles)}</p>
        <ArticleList articles={articles} />
      </div>
    </>
  );
}
