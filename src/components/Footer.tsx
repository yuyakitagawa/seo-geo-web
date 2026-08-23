import Link from "next/link";
import { SITE_NAME, X_PROFILE_URL } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-neutral-200 py-8 text-sm text-neutral-500 dark:border-neutral-800">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4">
        <p>© {new Date().getFullYear()} {SITE_NAME}</p>
        <nav aria-label="サイト情報">
          <ul className="flex flex-wrap gap-4">
            <li><Link href="/about" className="hover:underline">運営者情報</Link></li>
            <li><Link href="/privacy" className="hover:underline">プライバシーポリシー</Link></li>
            <li><Link href="/disclaimer" className="hover:underline">免責事項</Link></li>
            <li><a href="/feed.xml" className="hover:underline">RSS</a></li>
            {X_PROFILE_URL && (
              <li><a href={X_PROFILE_URL} rel="me noopener" target="_blank" className="hover:underline">X</a></li>
            )}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
