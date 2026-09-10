import { GUIDES } from "@/lib/guides";
import { OG_CONTENT_TYPE, OG_SIZE, pageOgImage, subtitleOf } from "@/lib/og";

// output: "export" では、メタデータのルートにこれが無いとビルドが落ちる（Vercel上でISRを使わないための静的エクスポート）。
export const dynamic = "force-static";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = GUIDES.geo.h1;

export default pageOgImage({
  category: "geo",
  title: GUIDES.geo.h1,
  footer: subtitleOf(GUIDES.geo.metaTitle),
  label: "解説",
});
