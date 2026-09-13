import { OG_CONTENT_TYPE, OG_SIZE, pageOgImage } from "@/lib/og";

// output: "export" では、メタデータのルートにこれが無いとビルドが落ちる（Vercel上でISRを使わないための静的エクスポート）。
export const dynamic = "force-static";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "SEO・GEO診断ツール";

// /tools/page-audit にもこの画像が引き継がれる。
export default pageOgImage({
  category: "seo",
  title: "SEO・GEO診断ツール",
  footer: "無料の診断ツールと国内外のツール比較を1か所で",
  label: "診断ツール",
});
