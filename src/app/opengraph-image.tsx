import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";
import { OG_CONTENT_TYPE, OG_SIZE, loadOgFont, ogFrame } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = SITE_NAME;

const TITLE = "SEO・AI対策の「今」に追いつける";
const LABEL = "SEO / GEO";
const FOOTER = "Google検索・AI Overview・ChatGPT・Perplexityを毎朝巡回し、出典リンク付きで解説";

export default async function Image() {
  const fonts = await loadOgFont(TITLE + LABEL + FOOTER + SITE_NAME);
  return new ImageResponse(
    ogFrame({ category: "geo", title: TITLE, footer: FOOTER, label: LABEL }),
    { ...size, fonts }
  );
}
