import type { Metadata } from "next";
import Link from "next/link";
import ArticleList from "@/components/ArticleList";
import CategoryBadge from "@/components/CategoryBadge";
import JsonLd from "@/components/JsonLd";
import NextStep from "@/components/NextStep";
import PageDates from "@/components/PageDates";
import PageHeader from "@/components/PageHeader";
import TypeBadge from "@/components/TypeBadge";
import OriginalBadge from "@/components/OriginalBadge";
import SourceBadge from "@/components/SourceBadge";
import { articleDateRange, collectionJsonLd, collectionSummary } from "@/lib/collection";
import { getAllArticles, getAllTags, type ArticleMeta } from "@/lib/content";
import { siblingPages } from "@/lib/nav";
import { ARTICLES_PER_PAGE, SITE_URL } from "@/lib/site";
import { CONTAINER, HEADING, cx } from "@/lib/ui";

const DESCRIPTION =
  "Google検索・AI Overview・AI Mode・ChatGPT・Perplexityのアップデート解説を新しい順に一覧。全記事に影響度・対象・やることと一次情報のURLが付いています。";

export const metadata: Metadata = {
  title: "ニュース（記事アーカイブ）",
  description: DESCRIPTION,
  alternates: { canonical: "/news" },
};

/** 年月ごとにまとめる。記事が増えてもアーカイブの一覧性が落ちないようにする */
function byMonth(articles: ArticleMeta[]): { month: string; label: string; items: ArticleMeta[] }[] {
  const map = new Map<string, ArticleMeta[]>();
  for (const a of articles) {
    const month = a.date.slice(0, 7);
    map.set(month, [...(map.get(month) ?? []), a]);
  }
  return [...map]
    .sort((x, y) => (x[0] < y[0] ? 1 : -1))
    .map(([month, items]) => ({ month, label: month.replace(/^(\d{4})-0?(\d+)$/, "$1年$2月"), items }));
}

export default function NewsPage() {
  const articles = getAllArticles();
  const latest = articles.slice(0, ARTICLES_PER_PAGE);
  const months = byMonth(articles);
  const tags = getAllTags().slice(0, 16);
  const url = `${SITE_URL}/news`;
  const dates = articleDateRange(articles);

  return (
    <>
      <JsonLd data={collectionJsonLd({ url, name: "ニュース（記事アーカイブ）", description: DESCRIPTION, articles })} />
      <PageHeader eyebrow={`News · ${articles.length}本`} title="ニュース" lead={DESCRIPTION} crumbs={[{ name: "ニュース" }]} />
      <div className={cx(CONTAINER.page, "pb-16 pt-12")}>
        {/* 「SEO・GEOの最新動向は？」のような包括クエリに直答する段落 */}
        <p className="max-w-3xl leading-relaxed text-mute">{collectionSummary("SEO・GEO", articles)}</p>
        {dates && (
          <div className="mb-10 mt-3">
            <PageDates
              path="/news"
              name="ニュース（記事アーカイブ）"
              description={DESCRIPTION}
              published={dates.published}
              updated={dates.updated}
            />
          </div>
        )}

        <ArticleList articles={latest} featuredFirst />

        {/* タグ。記事を探す導線なので、記事一覧のこのページに置く */}
        {tags.length > 0 && (
          <section className="mt-20">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-mute">Topics</h2>
            <ul className="flex flex-wrap gap-2">
              {tags.map(({ tag, count }) => (
                <li key={tag}>
                  <Link href={`/tag/${encodeURIComponent(tag)}`} className="inline-block rounded-full border border-ink/15 px-3 py-1.5 text-sm transition hover:bg-ink hover:text-paper dark:border-paper/15 dark:hover:bg-paper dark:hover:text-ink">
                    {tag} <span className="opacity-50">{count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {articles.length > latest.length && (
          <section className="mt-20">
            <h2 className={HEADING.section}>アーカイブ</h2>
            <p className="mb-8 mt-1 text-sm text-mute">公開月ごとの全{articles.length}本。</p>
            <div className="space-y-10">
              {months.map((m) => (
                <div key={m.month}>
                  <h3 className={cx(HEADING.label, "mb-3")}>
                    {m.label} <span className="opacity-60">（{m.items.length}）</span>
                  </h3>
                  <ul className="divide-y divide-line border-y border-line">
                    {m.items.map((a) => (
                      <li key={a.slug}>
                        <Link href={`/articles/${a.slug}`} className="group flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3.5">
                          <time dateTime={a.date} className="w-20 shrink-0 font-mono text-xs text-mute">
                            {a.date.replaceAll("-", ".")}
                          </time>
                          <span className="flex items-center gap-2">
                            <CategoryBadge category={a.category} asLink={false} />
                            <TypeBadge type={a.type} />
                            <OriginalBadge original={a.original} />
                            <SourceBadge sources={a.sources} original={a.original} />
                          </span>
                          <span className="flex-1 font-medium leading-snug underline-offset-4 group-hover:underline">{a.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        <NextStep links={siblingPages("/news")} className="mt-20" />
      </div>
    </>
  );
}
