import Link from "next/link";
import { CATEGORIES, CATEGORY_KEYS, SITE_NAME } from "@/lib/site";

export default function Header() {
  return (
    <header className="border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          {SITE_NAME}
        </Link>
        <nav aria-label="カテゴリ">
          <ul className="flex gap-4 text-sm">
            {CATEGORY_KEYS.map((key) => (
              <li key={key}>
                <Link href={`/category/${key}`} className="hover:underline">
                  {CATEGORIES[key].label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
