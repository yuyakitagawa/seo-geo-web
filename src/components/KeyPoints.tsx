import type { ArticleMeta } from "@/lib/content";
import { IMPACT_LABEL } from "@/lib/content";
import { PADDING, SURFACE, cx } from "@/lib/ui";
import { Eyebrow, Steps } from "./ui";

const IMPACT_STYLE = {
  high: "bg-news text-white",
  mid: "bg-accent text-accent-ink",
  low: "bg-fill-strong text-fg",
} as const;

// 記事冒頭の固定パネル。「影響度 / 対象 / やること」を本文より先に見せる。
// AI検索にとっても、記事の要点が本文中の短いまとまり（パッセージ）として抽出しやすい。
export default function KeyPoints({ article }: { article: ArticleMeta }) {
  if (!article.impact && !article.audience && article.actions.length === 0) return null;
  return (
    <aside className={cx(SURFACE.card, PADDING.card, "my-10")} aria-label="この記事のポイント">
      <div className="flex flex-wrap items-center gap-3">
        <Eyebrow>Key points</Eyebrow>
        {article.impact && (
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${IMPACT_STYLE[article.impact]}`}>{IMPACT_LABEL[article.impact]}</span>
        )}
        {article.audience && <span className="text-sm text-mute">対象: {article.audience}</span>}
      </div>
      {article.actions.length > 0 && (
        <Steps items={article.actions} className="mt-5" />
      )}
    </aside>
  );
}
