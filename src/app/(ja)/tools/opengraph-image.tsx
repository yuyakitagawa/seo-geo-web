import { OG_CONTENT_TYPE, OG_SIZE, pageOgImage } from "@/lib/og";

// output: "export" では、メタデータのルートにこれが無いとビルドが落ちる（Vercel上でISRを使わないための静的エクスポート）。
export const dynamic = "force-static";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "SEO・GEOツール比較";

// /tools/page-audit にもこの画像が引き継がれる。
export default pageOgImage({
  category: "seo",
  title: "SEO・GEOツール比較",
  footer: "可視性計測とページ診断を1か所で比べる",
  label: "ツール",
});
