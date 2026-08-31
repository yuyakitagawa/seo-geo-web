// 独自記事（自分で取ったログ・実測値・検証結果が中心の記事）を示すバッジ。
// frontmatter の original: true だけに付く。要約記事に付けると意味が消えるので増やさない。
export default function OriginalBadge({ original, size = "sm" }: { original: boolean; size?: "sm" | "md" }) {
  if (!original) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full bg-accent font-bold tracking-wider text-accent-ink ${size === "md" ? "px-3 py-1.5 text-xs" : "px-2 py-1 text-[10px]"}`}
    >
      独自
    </span>
  );
}
