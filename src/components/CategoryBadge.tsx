import Link from "next/link";
import { CATEGORY_STYLE } from "@/lib/categoryStyle";
import { CATEGORIES, type CategoryKey } from "@/lib/site";

// asLink=false はカード全体が<a>の中で使う（<a>の入れ子はHTML不正でハイドレーションエラーになる）。
export default function CategoryBadge({ category, size = "sm", asLink = true }: { category: CategoryKey; size?: "sm" | "md"; asLink?: boolean }) {
  const className = `inline-flex items-center rounded-full font-bold uppercase tracking-wider ${CATEGORY_STYLE[category].badge} ${size === "md" ? "px-3.5 py-1.5 text-xs" : "px-2.5 py-1 text-[10px]"}`;
  if (!asLink) return <span className={className}>{CATEGORIES[category].label}</span>;
  return <Link href={`/category/${category}`} className={className}>{CATEGORIES[category].label}</Link>;
}
