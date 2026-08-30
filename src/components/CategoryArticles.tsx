import ArticleList from "@/components/ArticleList";
import { getArticlesByCategory } from "@/lib/content";
import { CATEGORIES, type CategoryKey } from "@/lib/site";

// 解説ページ（/seo, /geo）の下に置くそのカテゴリの記事一覧。
// ストック（解説）を先、フロー（ニュース）を後に出す。検索とAI検索の受け皿になるのは解説側なので上に置く。
export default function CategoryArticles({ category }: { category: CategoryKey }) {
  const articles = getArticlesByCategory(category);
  if (articles.length === 0) return null;
  const howto = articles.filter((a) => a.type === "howto");
  const news = articles.filter((a) => a.type !== "howto");
  const label = CATEGORIES[category].label;

  return (
    <div className="mx-auto mt-16 max-w-6xl space-y-14 px-5">
      {howto.length > 0 && (
        <section>
          <h2 className="mb-6 text-2xl font-bold tracking-tight">{label}対策の解説</h2>
          <ArticleList articles={howto} />
        </section>
      )}
      {news.length > 0 && (
        <section>
          <h2 className="mb-6 text-2xl font-bold tracking-tight">{label}の最新記事（{news.length}）</h2>
          <ArticleList articles={news} />
        </section>
      )}
    </div>
  );
}
