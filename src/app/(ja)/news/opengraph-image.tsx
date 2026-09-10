import { OG_CONTENT_TYPE, OG_SIZE, pageOgImage } from "@/lib/og";

// output: "export" では、メタデータのルートにこれが無いとビルドが落ちる（Vercel上でISRを使わないための静的エクスポート）。
export const dynamic = "force-static";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "ニュース";

export default pageOgImage({
  category: "news",
  title: "検索とAI検索のニュース",
  footer: "一次情報を毎朝巡回し、出典リンク付きで解説",
  label: "アーカイブ",
});
