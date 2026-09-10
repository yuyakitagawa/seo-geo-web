import type { Impact } from "./content";
import { SITE_NAME } from "./site";

// 英語版（/en）の定数。英語版は独自記事（original: true）の英訳だけを載せる（src/lib/content-en.ts）ので、
// それ以上のことを名乗らない。日本語側の Header / Footer / KeyPoints の文言はここから英語に差し替える。

export const EN_HOME_PATH = "/en";

export const SITE_TITLE_EN = `${SITE_NAME} — First-party research on AI search and crawlers`;

export const SITE_DESCRIPTION_EN =
  "English editions of SEO GEO Lab's original research: measurements from our own server logs and ChatGPT conversation data on how AI search engines and their crawlers actually behave. SEO GEO Lab is a Japanese publication on SEO and GEO (generative engine optimization).";

export const EN_IMPACT_LABEL: Record<Impact, string> = { high: "High impact", mid: "Medium impact", low: "Low impact" };
