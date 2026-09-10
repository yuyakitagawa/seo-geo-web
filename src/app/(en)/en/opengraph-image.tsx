import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";
import { OG_CONTENT_TYPE, OG_SIZE, ogFontOption, ogFrame } from "@/lib/og";

// output: "export" では、メタデータのルートにこれが無いとビルドが落ちる。
export const dynamic = "force-static";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = `${SITE_NAME} — Original research`;

const TITLE = "How AI search engines and their crawlers actually behave, measured";

export default async function Image() {
  const footer = "Original research";
  const font = await ogFontOption(TITLE + "GEO" + SITE_NAME + footer);
  return new ImageResponse(ogFrame({ category: "geo", title: TITLE, footer }), { ...size, ...font });
}
