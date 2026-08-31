import type { TocItem } from "@/lib/toc";
import { EYEBROW, PADDING, SURFACE, cx } from "@/lib/ui";

// 記事の目次。本文2,500〜3,500字に対して、読者が読む前に全体像をつかむための一覧。
// リンクなので、AI検索・検索エンジンにも記事の構成がそのまま渡る。
// 見出し側の `scroll-mt-24`（記事ページの prose に指定）で、固定ヘッダーに隠れないようにしている。
export default function Toc({ items }: { items: TocItem[] }) {
  if (items.length === 0) return null;

  return (
    <nav aria-labelledby="toc-heading" className={cx(SURFACE.outline, PADDING.tight, "mt-10")}>
      <h2 id="toc-heading" className={cx(EYEBROW.mute, "mb-4")}>
        Contents · 目次
      </h2>
      <ol className="space-y-2.5 text-sm sm:text-base">
        {items.map((item, i) => (
          <li key={item.id} className="flex gap-3">
            <span aria-hidden className="mt-px w-5 shrink-0 text-right font-mono text-xs text-mute">{i + 1}</span>
            <a
              href={`#${item.id}`}
              className="underline decoration-line-strong decoration-2 underline-offset-4 transition hover:decoration-accent"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
