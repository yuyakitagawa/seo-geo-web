import Link from "next/link";
import type { ArticleMeta } from "@/lib/content";
import { CATEGORY_STYLE } from "@/lib/categoryStyle";
import { LIFT, SURFACE, cx } from "@/lib/ui";
import KeyVisual from "./KeyVisual";
import CategoryBadge from "./CategoryBadge";
import TypeBadge from "./TypeBadge";
import OriginalBadge from "./OriginalBadge";
import SourceBadge from "./SourceBadge";

// featured: トップの先頭1件。2カラム分の幅で大きく見せる。
export default function ArticleCard({ article, featured = false, index = 0 }: { article: ArticleMeta; featured?: boolean; index?: number }) {
  const glow = CATEGORY_STYLE[article.category].glow;
  return (
    <article
      className={cx("group relative overflow-hidden", SURFACE.card, LIFT, featured && "sm:col-span-2")}
      style={{ animation: `rise 0.7s cubic-bezier(0.2,0.8,0.2,1) ${Math.min(index, 8) * 60}ms both` }}
    >
      <div className={`pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-gradient-to-br ${glow} to-transparent opacity-0 blur-3xl transition duration-700 group-hover:opacity-100`} />
      <Link href={`/articles/${article.slug}`} className="relative flex h-full flex-col">
        <div className={`relative overflow-hidden bg-ink ${featured ? "h-36 sm:h-44" : "aspect-[16/6]"}`}>
          <KeyVisual slug={article.slug} category={article.category} className="transition duration-700 group-hover:scale-105" />
        </div>
        <div className={`flex flex-1 flex-col ${featured ? "p-7 sm:p-8" : "p-6 sm:p-7"}`}>
          <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-mute">
            <CategoryBadge category={article.category} asLink={false} />
            <TypeBadge type={article.type} />
            <OriginalBadge original={article.original} />
            <SourceBadge sources={article.sources} type={article.type} original={article.original} />
            <time dateTime={article.date}>{article.date.replaceAll("-", ".")}</time>
          </div>
          <h2 className={`font-bold leading-snug tracking-tight ${featured ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"}`}>{article.title}</h2>
          {article.description && (
            <p className={`mt-3 text-mute ${featured ? "line-clamp-2 text-base" : "line-clamp-2 text-sm"}`}>{article.description}</p>
          )}
          <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold">
            読む
            <span className="inline-block transition group-hover:translate-x-1">→</span>
          </span>
        </div>
      </Link>
    </article>
  );
}
