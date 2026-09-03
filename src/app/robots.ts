import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { BLOCKED_SCRAPERS } from "@/lib/scrapers";

// 方針: AI検索・AI学習・検索エンジンのクローラー（src/lib/crawlers.ts）はすべて通す。読者に届く経路だから。
// 通さないのは、読者を1人も連れて来ないのに全ページを巡回する商用SEOクローラーだけ（src/lib/scrapers.ts）。
// 2026-09-03、Hobbyプランの上限超過でサイトが停止したため追加した。実リクエストの99%がボットだった。
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: BLOCKED_SCRAPERS.map((s) => s.token), disallow: "/" },
      {
        userAgent: "*",
        allow: "/",
        // /api/* は診断ツールのPOST専用エンドポイントで、GETすると405を返すだけの非コンテンツ。
        // クロールされてもインデックス対象が増えず、Search Consoleに「見つかりませんでした」系の
        // レポートを積み、関数実行だけ増えるので、クロール自体を止める。
        disallow: "/api/",
        // Googlebot は crawl-delay を無視する。効くのは Bing と、名前も知らない小規模クローラー群。
        crawlDelay: 5,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
