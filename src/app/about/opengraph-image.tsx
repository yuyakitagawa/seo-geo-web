import { OG_CONTENT_TYPE, OG_SIZE, pageOgImage } from "@/lib/og";
import { SITE_NAME } from "@/lib/site";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "運営者情報";

export default pageOgImage({
  category: "seo",
  title: "運営者情報",
  footer: `${SITE_NAME}の運営方針・記事の作り方・収集元`,
  label: "About",
});
