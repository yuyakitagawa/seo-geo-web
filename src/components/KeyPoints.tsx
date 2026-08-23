import type { ArticleMeta } from "@/lib/content";
import { IMPACT_LABEL } from "@/lib/content";

const IMPACT_STYLE = {
  high: "bg-news text-white",
  mid: "bg-accent text-accent-ink",
  low: "bg-ink/10 text-ink dark:bg-paper/15 dark:text-paper",
} as const;

// 記事冒頭の固定パネル。「影響度 / 対象 / やること」を本文より先に見せる。
// AI検索にとっても、記事の要点がひとかたまりの短いパッセージとして抽出しやすい。
export default function KeyPoints({ article }: { article: ArticleMeta }) {
  if (!article.impact && !article.audience && article.actions.length === 0) return null;
  return (
    <aside className="my-10 rounded-3xl border border-ink/10 bg-white p-6 dark:border-paper/10 dark:bg-white/5 sm:p-8" aria-label="この記事のポイント">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-mute">Key points</p>
        {article.impact && (
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${IMPACT_STYLE[article.impact]}`}>{IMPACT_LABEL[article.impact]}</span>
        )}
        {article.audience && <span className="text-sm text-mute">対象: {article.audience}</span>}
      </div>
      {article.actions.length > 0 && (
        <ol className="mt-5 space-y-3">
          {article.actions.map((a, i) => (
            <li key={a} className="flex gap-4">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-paper dark:bg-paper dark:text-ink">{i + 1}</span>
              <span className="leading-relaxed">{a}</span>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
