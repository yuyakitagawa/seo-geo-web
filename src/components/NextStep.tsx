import Link from "next/link";
import type { NavLink } from "@/lib/nav";

/**
 * 「次に見るページ」への導線。一覧・ハブページの末尾と、記事本文の途中の両方で使う。
 * 見た目は GuideCrossLinks にそろえてあるが、こちらは見出しを持つ独立したブロック。
 * 中身は他ページへのリンクだけなので要素は <nav>。<section> のままだと本文抽出に混ざり、
 * AI検索から見た「このページが答えていること」が、リンク先のタイトルで薄まる。
 */
export default function NextStep({
  links,
  title = "次に読む",
  className = "",
}: {
  links: NavLink[];
  title?: string;
  className?: string;
}) {
  if (links.length === 0) return null;
  return (
    <nav aria-label={title} className={`not-prose ${className}`}>
      <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-mute">Next · {title}</h2>
      <ul className="grid gap-4 sm:grid-cols-3">
        {links.map((l) => (
          <li key={l.href} className="grid">
            <Link
              href={l.href}
              className="group rounded-3xl border border-ink/10 p-5 transition hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)] dark:border-paper/10"
            >
              <p className="font-bold tracking-tight">
                {l.label} <span className="inline-block transition group-hover:translate-x-1">→</span>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-mute">{l.note}</p>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
