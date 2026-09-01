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
      <div className={cx(CONTAINER.page, "flex min-h-16 items-center justify-between gap-4 py-3")}>
        <Link href="/" className="group flex shrink-0 items-center gap-2 text-base font-bold tracking-tight">
          <span className="inline-block size-3 rounded-full bg-accent shadow-[0_0_14px_var(--color-accent)] transition group-hover:scale-125" />
          <span className="hidden min-[380px]:inline">{SITE_NAME}</span>
        </Link>
        <nav aria-label="サイト" className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex w-max items-center gap-0.5 rounded-full border border-line bg-surface/60 p-1 text-xs sm:gap-1 sm:text-sm">
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
