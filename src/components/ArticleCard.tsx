import Link from "next/link";
import type { ArticleMeta } from "@/lib/content";
import { CATEGORIES } from "@/lib/site";

export default function ArticleCard({ article }: { article: ArticleMeta }) {
  return (
    <article className="rounded-lg border border-neutral-200 p-4 transition hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600">
      <div className="mb-2 flex items-center gap-2 text-xs text-neutral-500">
        <Link href={`/category/${article.category}`} className="rounded bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
          {CATEGORIES[article.category].label}
        </Link>
        <time dateTime={article.date}>{article.date}</time>
        <span>・{article.readingMinutes}分</span>
      </div>
      <h2 className="text-base font-semibold leading-snug">
        <Link href={`/articles/${article.slug}`} className="hover:underline">
          {article.title}
        </Link>
      </h2>
      {article.description && (
        <p className="mt-2 line-clamp-3 text-sm text-neutral-600 dark:text-neutral-400">{article.description}</p>
      )}
    </article>
  );
}
