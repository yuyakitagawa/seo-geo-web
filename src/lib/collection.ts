import { earliestPublished, latestPublished, latestUpdated, type ArticleMeta } from "./content";

// 一覧ページ（記事一覧・カテゴリ・タグ）の共通部品。
// AI検索は「◯◯の最新動向は？」のような包括クエリに直答するページを探すため、
// 一覧ページの冒頭に件数・期間を含む1段落を置き、中身は ItemList で機械可読にする。

const jp = (d: string) => d.replaceAll("-", "/");

/** 一覧の表示・構造化データで使う公開期間。空の一覧には値を返さない。 */
export function articleDateRange(articles: ArticleMeta[]): { published: string; lastPublished: string; updated: string } | undefined {
  const published = earliestPublished(articles);
  const lastPublished = latestPublished(articles);
  const updated = latestUpdated(articles);
  return published && lastPublished && updated ? { published, lastPublished, updated } : undefined;
}

/** 包括クエリへの直答段落。件数・期間・最新記事を1段落にまとめる */
export function collectionSummary(label: string, articles: ArticleMeta[]): string {
  if (articles.length === 0) return `${label}の記事はまだありません。`;
  const { published, lastPublished } = articleDateRange(articles)!;
  const period = published === lastPublished ? jp(published) : `${jp(published)}〜${jp(lastPublished)}`;
  const high = articles.filter((a) => a.impact === "high").length;
  return `${label}の記事は${articles.length}本（${period}）。最新は「${articles[0].title}」（${jp(articles[0].date)}）です。${
    high > 0 ? `うち影響度「大」は${high}本。` : ""
  }すべて一次情報のURLを記事末尾に添えています。`;
}

export function collectionJsonLd({
  url,
  name,
  description,
  articles,
}: {
  url: string;
  name: string;
  description: string;
  articles: ArticleMeta[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    url,
    name,
    description,
    inLanguage: "ja",
    isPartOf: { "@id": `${new URL(url).origin}/#website` },
    mainEntity: {
      "@type": "ItemList",
      name,
      numberOfItems: articles.length,
      itemListElement: articles.map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${new URL(url).origin}/articles/${a.slug}`,
        name: a.title,
      })),
    },
    publisher: { "@id": `${new URL(url).origin}/#organization` },
  };
}
