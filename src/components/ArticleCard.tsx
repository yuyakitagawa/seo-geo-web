import Link from "next/link";
import type { ArticleMeta } from "@/lib/content";
import { CATEGORY_STYLE } from "@/lib/categoryStyle";
import CategoryBadge from "./CategoryBadge";
import TypeBadge from "./TypeBadge";

// featured: トップの先頭1件。2カラム分の幅で大きく見せる。
export default function ArticleCard({ article, featured = false, index = 0 }: { article: ArticleMeta; featured?: boolean; index?: number }) {
  const glow = CATEGORY_STYLE[article.category].glow;
  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border border-ink/10 bg-white transition duration-500 hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)] dark:border-paper/10 dark:bg-white/5 ${featured ? "sm:col-span-2" : ""}`}
      style={{ animation: `rise 0.7s cubic-bezier(0.2,0.8,0.2,1) ${Math.min(index, 8) * 60}ms both` }}
    >
      <div className={`pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-gradient-to-br ${glow} to-transparent opacity-0 blur-3xl transition duration-700 group-hover:opacity-100`} />
      <Link href={`/articles/${article.slug}`} className={`relative flex h-full flex-col ${featured ? "p-8 sm:p-10" : "p-6 sm:p-7"}`}>
        <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-mute">
          <CategoryBadge category={article.category} asLink={false} />
          <TypeBadge type={article.type} />
          <time dateTime={article.date}>{article.date.replaceAll("-", ".")}</time>
          <span>{article.readingMinutes} min</span>
        </div>
        <h2 className={`font-bold leading-snug tracking-tight ${featured ? "text-2xl sm:text-4xl" : "text-lg sm:text-xl"}`}>{article.title}</h2>
        {article.description && (
          <p className={`mt-3 text-mute ${featured ? "line-clamp-4 text-base sm:text-lg" : "line-clamp-2 text-sm"}`}>{article.description}</p>
        )}
        <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold">
          読む
          <span className="inline-block transition group-hover:translate-x-1">→</span>
        </span>
      </Link>
    </article>
  );
}
