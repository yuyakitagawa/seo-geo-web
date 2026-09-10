import type { ArticleMeta } from "@/lib/content";
import { IMPACT_LABEL } from "@/lib/content";
import { EN_IMPACT_LABEL } from "@/lib/en";
import { PADDING, SURFACE, cx } from "@/lib/ui";
import { Eyebrow, Steps } from "./ui";

const IMPACT_STYLE = {
  high: "bg-news text-white",
  mid: "bg-accent text-accent-ink",
  low: "bg-fill-strong text-fg",
} as const;

const TEXT = {
  ja: { aria: "この記事のポイント", audience: "対象", impact: IMPACT_LABEL },
  en: { aria: "Key points of this article", audience: "For", impact: EN_IMPACT_LABEL },
} as const;

// 記事冒頭の固定パネル。「影響度 / 対象 / やること」を本文より先に見せる。
// AI検索にとっても、記事の要点が本文中の短いまとまり（パッセージ）として抽出しやすい。
// lang="en" は英語版の記事（/en/articles/*）だけが渡す。
export default function KeyPoints({
  article,
  lang = "ja",
}: {
  article: Pick<ArticleMeta, "impact" | "audience" | "actions">;
  lang?: keyof typeof TEXT;
}) {
  if (!article.impact && !article.audience && article.actions.length === 0) return null;
  const t = TEXT[lang];
  return (
    <aside className={cx(SURFACE.card, PADDING.card, "my-10")} aria-label={t.aria}>
      <div className="flex flex-wrap items-center gap-3">
        <Eyebrow>Key points</Eyebrow>
        {article.impact && (
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${IMPACT_STYLE[article.impact]}`}>{t.impact[article.impact]}</span>
        )}
        {article.audience && <span className="text-sm text-mute">{t.audience}: {article.audience}</span>}
      </div>
      {article.actions.length > 0 && (
        <Steps items={article.actions} className="mt-5" />
      )}
    </aside>
  );
}
