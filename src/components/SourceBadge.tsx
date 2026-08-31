import type { Source } from "@/lib/content";
import { primaryVendor } from "@/lib/sourceVendor";

// 一次情報バッジ。記事がGoogle・OpenAIなど当事者自身の発表を出典に持つときだけ出す。
// 「根拠の強さ」のバッジは1記事に1つまで（独自 > 公式）。独自記事には出さない。
// 色は親から継承する（黒地の記事ヘッダーでも一覧でもそのまま読める）。
export default function SourceBadge({
  sources,
  original = false,
  size = "sm",
}: {
  sources: Source[];
  original?: boolean;
  size?: "sm" | "md";
}) {
  if (original) return null;
  const vendor = primaryVendor(sources);
  if (!vendor) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full border border-current font-bold tracking-wider opacity-70 ${size === "md" ? "px-3 py-1.5 text-xs" : "px-2 py-1 text-[10px]"}`}
    >
      {vendor.label}公式
    </span>
  );
}
