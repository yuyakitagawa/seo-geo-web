import { GUIDES } from "@/lib/guides";
import { OG_CONTENT_TYPE, OG_SIZE, pageOgImage, subtitleOf } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = GUIDES.seo.h1;

export default pageOgImage({
  category: "seo",
  title: GUIDES.seo.h1,
  footer: subtitleOf(GUIDES.seo.metaTitle),
  label: "解説",
});
