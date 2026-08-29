import { TYPE_LABEL, type ArticleType } from "@/lib/content";

// 記事の型（解説＝ストック／ニュース＝フロー）を示すバッジ。
// news は件数が多く既定なので出さない（全記事に付くバッジは情報量がゼロ）。
export default function TypeBadge({ type, size = "sm" }: { type: ArticleType; size?: "sm" | "md" }) {
  if (type !== "howto") return null;
  return (
    <span
      className={`inline-flex items-center rounded-full border border-current font-bold tracking-wider text-accent ${size === "md" ? "px-3 py-1.5 text-xs" : "px-2 py-1 text-[10px]"}`}
    >
      {TYPE_LABEL[type]}
    </span>
  );
}
