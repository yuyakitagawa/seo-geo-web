import { GUIDES } from "@/lib/guides";
import { OG_CONTENT_TYPE, OG_SIZE, pageOgImage, subtitleOf } from "@/lib/og";

// output: "export" では、メタデータのルートにこれが無いとビルドが落ちる（Vercel上でISRを使わないための静的エクスポート）。
export const dynamic = "force-static";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = GUIDES.seo.h1;

export default pageOgImage({
  category: "seo",
  title: GUIDES.seo.h1,
  footer: subtitleOf(GUIDES.seo.metaTitle),
  label: "解説",
});
