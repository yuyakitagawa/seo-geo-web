import Link from "next/link";
import { HAS_CONTACT, SITE_DESCRIPTION, SITE_NAME, X_PROFILE_URL } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="mt-24 bg-ink text-paper dark:bg-paper dark:text-ink">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <p className="text-[clamp(2.5rem,9vw,7rem)] font-bold leading-none tracking-tighter">
          {SITE_NAME.split("・").map((w, i) => (
            <span key={w} className={i % 2 ? "text-accent" : ""}>{w}{i < 1 ? "・" : ""}</span>
          ))}
        </p>
        <p className="mt-6 max-w-xl text-sm opacity-70">{SITE_DESCRIPTION}</p>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-current/20 pt-6 text-sm">
          <p className="opacity-60">© {new Date().getFullYear()} {SITE_NAME}</p>
          <nav aria-label="サイト情報">
            <ul className="flex flex-wrap gap-5">
              <li><Link href="/seo" className="hover:text-accent">SEO対策とは</Link></li>
              <li><Link href="/geo" className="hover:text-accent">GEO対策とは</Link></li>
              <li><Link href="/learn" className="hover:text-accent">SEO・GEO教科書</Link></li>
              <li><Link href="/about" className="hover:text-accent">運営者情報</Link></li>
              {HAS_CONTACT && <li><Link href="/contact" className="hover:text-accent">お問い合わせ</Link></li>}
              <li><Link href="/privacy" className="hover:text-accent">プライバシーポリシー</Link></li>
              <li><Link href="/disclaimer" className="hover:text-accent">免責事項</Link></li>
              <li><a href="/feed.xml" className="hover:text-accent">RSS</a></li>
              {X_PROFILE_URL && <li><a href={X_PROFILE_URL} rel="me noopener" target="_blank" className="hover:text-accent">X</a></li>}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
