import Link from "next/link";
import { CATEGORIES, CATEGORY_KEYS, SITE_NAME } from "@/lib/site";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/80 backdrop-blur-md dark:border-paper/10 dark:bg-ink/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="group flex items-center gap-2 text-base font-bold tracking-tight">
          <span className="inline-block size-3 rounded-full bg-accent transition group-hover:scale-125" />
          {SITE_NAME}
        </Link>
        <nav aria-label="カテゴリ">
          <ul className="flex items-center gap-1 rounded-full border border-ink/10 p-1 text-sm dark:border-paper/10">
            {CATEGORY_KEYS.map((key) => (
              <li key={key}>
                <Link
                  href={`/category/${key}`}
                  className="block rounded-full px-3 py-1.5 font-medium transition hover:bg-ink hover:text-paper dark:hover:bg-paper dark:hover:text-ink"
                >
                  {CATEGORIES[key].label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/tools" className="block rounded-full px-3 py-1.5 font-medium transition hover:bg-ink hover:text-paper dark:hover:bg-paper dark:hover:text-ink">
                ツール
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
