import type { TocItem } from "@/lib/toc";

// 記事の目次。本文2,500〜3,500字に対して、読者が読む前に全体像をつかむための一覧。
// リンクなので、AI検索・検索エンジンにも記事の構成がそのまま渡る。
// 見出し側の `scroll-mt-24`（記事ページの prose に指定）で、固定ヘッダーに隠れないようにしている。
export default function Toc({ items }: { items: TocItem[] }) {
  if (items.length === 0) return null;

  return (
    <nav aria-labelledby="toc-heading" className="mt-10 rounded-3xl border border-ink/10 p-6 dark:border-paper/10">
      <h2 id="toc-heading" className="mb-4 text-xs font-bold uppercase tracking-wider text-mute">
        Contents · 目次
      </h2>
      <ol className="space-y-2.5 text-sm sm:text-base">
        {items.map((item, i) => (
          <li key={item.id} className="flex gap-3">
            <span aria-hidden className="mt-px w-5 shrink-0 text-right font-mono text-xs text-mute">{i + 1}</span>
            <a
              href={`#${item.id}`}
              className="underline decoration-ink/20 decoration-2 underline-offset-4 transition hover:decoration-accent dark:decoration-paper/20"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
