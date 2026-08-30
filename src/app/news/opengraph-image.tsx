import { OG_CONTENT_TYPE, OG_SIZE, pageOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "ニュース";

export default pageOgImage({
  category: "news",
  title: "検索とAI検索のニュース",
  footer: "一次情報を毎朝巡回し、出典リンク付きで解説",
  label: "アーカイブ",
});
