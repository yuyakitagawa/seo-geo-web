import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleList from "@/components/ArticleList";
import JsonLd from "@/components/JsonLd";
import NextStep from "@/components/NextStep";
import PageDates from "@/components/PageDates";
import PageHeader from "@/components/PageHeader";
import { articleDateRange, collectionJsonLd, collectionSummary } from "@/lib/collection";
import { getAllTags, getArticlesByTag } from "@/lib/content";
import { siblingPages } from "@/lib/nav";
import { isIndexableTag } from "@/lib/indexability";
import { SITE_URL } from "@/lib/site";
import { CONTAINER, cx } from "@/lib/ui";

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
  const dates = articleDateRange(articles)!;

  return (
    <>
      <JsonLd data={collectionJsonLd({ url, name: `#${tag} の記事`, description: `「${tag}」に関する記事一覧。`, articles })} />
      <PageHeader eyebrow="Topic" title={`#${tag}`} crumbs={[{ name: `#${tag}` }]} />
      <div className={cx(CONTAINER.page, "pb-16 pt-12")}>
        <p className="max-w-3xl leading-relaxed text-mute">{collectionSummary(`「${tag}」`, articles)}</p>
        <div className="mb-10 mt-3">
          <PageDates
            path={`/tag/${encodeURIComponent(tag)}`}
            name={`#${tag} の記事`}
            description={`「${tag}」に関する記事一覧。`}
            published={dates.published}
            updated={dates.updated}
          />
        </div>
        <ArticleList articles={articles} />
        <NextStep links={siblingPages(`/tag/${tag}`)} className="mt-20" />
      </div>
    </>
  );
}
