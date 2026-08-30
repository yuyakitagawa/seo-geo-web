import type { Metadata } from "next";
import Link from "next/link";
import ArticleList from "@/components/ArticleList";
import CategoryBadge from "@/components/CategoryBadge";
import JsonLd from "@/components/JsonLd";
import PageHeader from "@/components/PageHeader";
import TypeBadge from "@/components/TypeBadge";
import { collectionJsonLd, collectionSummary } from "@/lib/collection";
import { getAllArticles, type ArticleMeta } from "@/lib/content";
import { ARTICLES_PER_PAGE, SITE_URL } from "@/lib/site";

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
  const url = `${SITE_URL}/news`;

  return (
    <>
      <JsonLd data={collectionJsonLd({ url, name: "ニュース（記事アーカイブ）", description: DESCRIPTION, articles })} />
      <PageHeader eyebrow={`News · ${articles.length}本`} title="ニュース" lead={DESCRIPTION} crumbs={[{ name: "ニュース" }]} />
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-12">
        {/* 「SEO・GEOの最新動向は？」のような包括クエリに直答する段落 */}
        <p className="mb-10 max-w-3xl leading-relaxed text-mute">{collectionSummary("SEO・GEO", articles)}</p>

        <ArticleList articles={latest} featuredFirst />

        {articles.length > latest.length && (
          <section className="mt-20">
            <h2 className="text-2xl font-bold tracking-tight">アーカイブ</h2>
            <p className="mb-8 mt-1 text-sm text-mute">公開月ごとの全{articles.length}本。</p>
            <div className="space-y-10">
              {months.map((m) => (
                <div key={m.month}>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-mute">
                    {m.label} <span className="opacity-60">（{m.items.length}）</span>
                  </h3>
                  <ul className="divide-y divide-ink/10 border-y border-ink/10 dark:divide-paper/10 dark:border-paper/10">
                    {m.items.map((a) => (
                      <li key={a.slug}>
                        <Link href={`/articles/${a.slug}`} className="group flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3.5">
                          <time dateTime={a.date} className="w-20 shrink-0 font-mono text-xs text-mute">
                            {a.date.replaceAll("-", ".")}
                          </time>
                          <span className="flex items-center gap-2">
                            <CategoryBadge category={a.category} asLink={false} />
                            <TypeBadge type={a.type} />
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
      </div>
    </>
  );
}
