import Link from "next/link";
import { CONTAINER, cx } from "@/lib/ui";
import { CATEGORIES, CATEGORY_KEYS, SITE_NAME, categoryHref } from "@/lib/site";

// ナビは1つの配列から出す（並び順とラベルの重複定義をなくす）。
const NAV = [
  ...CATEGORY_KEYS.map((key) => ({ href: categoryHref(key), label: CATEGORIES[key].label })),
  { href: "/learn", label: "教科書" },
  { href: "/tools", label: "ツール" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/80 backdrop-blur-md">
      <div className={cx(CONTAINER.page, "flex items-center justify-between gap-4 py-4")}>
        <Link href="/" className="group flex items-center gap-2 text-base font-bold tracking-tight">
          <span className="inline-block size-3 rounded-full bg-accent transition group-hover:scale-125" />
          {SITE_NAME}
        </Link>
        <nav aria-label="サイト">
          <ul className="flex items-center gap-0.5 rounded-full border border-line p-1 text-xs sm:gap-1 sm:text-sm">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block whitespace-nowrap rounded-full px-2.5 py-1.5 font-medium transition hover:bg-invert hover:text-invert-fg sm:px-3"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
