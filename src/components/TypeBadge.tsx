import { TYPE_LABEL, type ArticleType } from "@/lib/content";
import { BADGE, cx } from "@/lib/ui";

// 記事の型（解説＝ストック／ニュース＝フロー）を示すバッジ。
// news は件数が多く既定なので出さない（全記事に付くバッジは情報量がゼロ）。
export default function TypeBadge({ type, size = "sm" }: { type: ArticleType; size?: "sm" | "md" }) {
  if (type !== "howto") return null;
  return (
<span className={cx(BADGE[size], "border border-current text-accent")}>{TYPE_LABEL[type]}</span>
  );
}
