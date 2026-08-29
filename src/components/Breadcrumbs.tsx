import Link from "next/link";
import JsonLd from "./JsonLd";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export type Crumb = { name: string; href?: string };

/**
 * パンくず。可視UIと BreadcrumbList JSON-LD を同一データから出す（表示と構造化データがずれない）。
 * ホームは常に先頭に付くので items には下位階層だけを渡す。最後の要素はリンクにしない。
 * 黒地のヘッダー内で使う前提の配色。
 */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ name: "ホーム", href: "/" }, ...items];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: i === 0 ? SITE_NAME : c.name,
      item: `${SITE_URL}${c.href ?? ""}`,
    })),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <nav aria-label="パンくず" className="mb-8 text-xs text-paper/60">
        <ol className="flex flex-wrap items-center gap-2">
          {all.map((c, i) => (
            <li key={c.name} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden>/</span>}
              {c.href && i < all.length - 1 ? (
                <Link href={c.href} className="hover:text-paper">{c.name}</Link>
              ) : (
                <span className="line-clamp-1 max-w-[22rem]" aria-current="page">{c.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
