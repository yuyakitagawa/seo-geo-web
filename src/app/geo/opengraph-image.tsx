import { GUIDES } from "@/lib/guides";
import { OG_CONTENT_TYPE, OG_SIZE, pageOgImage, subtitleOf } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = GUIDES.geo.h1;

export default pageOgImage({
  category: "geo",
  title: GUIDES.geo.h1,
  footer: subtitleOf(GUIDES.geo.metaTitle),
  label: "解説",
});
