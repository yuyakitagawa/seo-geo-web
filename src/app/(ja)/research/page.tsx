import type { Metadata } from "next";
import ArticleList from "@/components/ArticleList";
import JsonLd from "@/components/JsonLd";
import NextStep from "@/components/NextStep";
import PageDates from "@/components/PageDates";
import PageHeader from "@/components/PageHeader";
import { articleDateRange, collectionJsonLd } from "@/lib/collection";
import { getAllArticles } from "@/lib/content";
import { siblingPages } from "@/lib/nav";
import { SITE_URL } from "@/lib/site";
import { CONTAINER, HEADING, SURFACE, cx } from "@/lib/ui";

const TITLE = "SEO・GEOの独自調査";
const DESCRIPTION =
  "SEO・GEOをクローラーログ、Search Console、AI検索の会話ログで実測した独自調査。計測条件・観測期間・限界を示し、第三者が再検証できる形で公開します。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/research" },
};

export default function ResearchPage() {
  const articles = getAllArticles().filter((article) => article.original);
  const dates = articleDateRange(articles);
  const url = `${SITE_URL}/research`;

  return (
    <>
      <JsonLd data={collectionJsonLd({ url, name: TITLE, description: DESCRIPTION, articles })} />
      <PageHeader
        eyebrow={`Original research · ${articles.length}本`}
        title="独自調査"
        lead={DESCRIPTION}
        crumbs={[{ name: "独自調査" }]}
      />
      <div className={cx(CONTAINER.page, "pb-16 pt-12")}>
        <section className={cx(SURFACE.outline, "mb-12 p-6 sm:p-8")}>
          <h2 className={cx(HEADING.section, "text-2xl")}>この一覧に載せる基準</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-mute">
            外部記事の要約ではなく、運営者が自分で取得したアクセスログ・検索結果・会話ログ・計測値が結論の中心にある記事だけを掲載します。各記事には取得期間、対象、除外条件、観測事実と解釈、再現上の限界を記載します。
          </p>
          {dates && (
            <div className="mt-4">
              <PageDates
                path="/research"
                name={TITLE}
                description={DESCRIPTION}
                published={dates.published}
                updated={dates.updated}
              />
            </div>
          )}
        </section>

        <ArticleList articles={articles} featuredFirst />
        <NextStep links={siblingPages("/research")} className="mt-20" />
      </div>
    </>
  );
}
