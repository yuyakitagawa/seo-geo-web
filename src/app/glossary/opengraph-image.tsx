import { GLOSSARY } from "@/lib/glossary";
import { OG_CONTENT_TYPE, OG_SIZE, pageOgImage } from "@/lib/og";

// output: "export" では、メタデータのルートにこれが無いとビルドが落ちる（Vercel上でISRを使わないための静的エクスポート）。
export const dynamic = "force-static";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "SEO・GEO用語集";

export default pageOgImage({
  category: "seo",
  title: "SEO・GEO用語集",
  footer: `${GLOSSARY.length}語を1文の定義と一次情報のリンクで`,
  label: "用語集",
});
