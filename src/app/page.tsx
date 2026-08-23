import Link from "next/link";
import ArticleList from "@/components/ArticleList";
import { getAllArticles, getAllTags } from "@/lib/content";
import { ARTICLES_PER_PAGE, CATEGORIES, CATEGORY_KEYS, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export default function Home() {
  const articles = getAllArticles();
  const tags = getAllTags().slice(0, 20);

  return (
    <>
      <section className="mb-10">
        <h1 className="text-2xl font-bold sm:text-3xl">{SITE_NAME}</h1>
        <p className="mt-3 max-w-3xl text-neutral-600 dark:text-neutral-400">{SITE_DESCRIPTION}</p>
        <ul className="mt-4 flex flex-wrap gap-2 text-sm">
          {CATEGORY_KEYS.map((k) => (
            <li key={k}>
              <Link href={`/category/${k}`} className="rounded-full border border-neutral-300 px-3 py-1 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800">
                {CATEGORIES[k].label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">新着記事</h2>
        <ArticleList articles={articles.slice(0, ARTICLES_PER_PAGE)} />
        {articles.length > ARTICLES_PER_PAGE && (
          <p className="mt-6 text-sm"><Link href="/articles" className="underline">すべての記事を見る（{articles.length}件）</Link></p>
        )}
      </section>

      {tags.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 text-lg font-semibold">タグ</h2>
          <ul className="flex flex-wrap gap-2 text-sm">
            {tags.map(({ tag, count }) => (
              <li key={tag}>
                <Link href={`/tag/${encodeURIComponent(tag)}`} className="rounded bg-neutral-100 px-2 py-1 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700">
                  {tag} <span className="text-neutral-500">({count})</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
