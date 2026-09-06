import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { CRAWLERS } from "@/lib/crawlers";
import { BLOCKED_SCRAPERS } from "@/lib/scrapers";

// crawl-delay を掛けないクローラー。AI検索（回答に載る経路）と検索エンジンは、記事が出た日のうちに
// 取りに来てほしいので待たせない。AI学習用（GPTBot / ClaudeBot / CCBot など）は待たせたままにする
// ——読者を連れて来るのは前者で、帯域を食うのは後者だから。
const NO_DELAY = CRAWLERS.filter((c) => c.purpose === "ai-search" || c.purpose === "search").map((c) => c.token);

// output: "export" では、メタデータのルートにこれが無いとビルドが落ちる（Vercel上でISRを使わないための静的エクスポート）。
export const dynamic = "force-static";

// 方針: AI検索・AI学習・検索エンジンのクローラー（src/lib/crawlers.ts）はすべて通す。読者に届く経路だから。
// 通さないのは、読者を1人も連れて来ないのに全ページを巡回する商用SEOクローラーだけ（src/lib/scrapers.ts）。
// 2026-09-03、Hobbyプランの上限超過でサイトが停止したため追加した。実リクエストの99%がボットだった。
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: BLOCKED_SCRAPERS.map((s) => s.token), disallow: "/" },
      // /api/* は診断ツールのPOST専用エンドポイントで、GETすると405を返すだけの非コンテンツ。
      // クロールされてもインデックス対象が増えず、Search Consoleに「見つかりませんでした」系の
      // レポートを積み、関数実行だけ増えるので、どのグループでもクロール自体を止める。
      { userAgent: NO_DELAY, allow: "/", disallow: "/api/" },
      {
        userAgent: "*",
        allow: "/",
        disallow: "/api/",
        // Googlebot は crawl-delay を無視する。効くのは名前も知らない小規模クローラー群と、
        // AI学習用のクローラー（Bingbot と AI検索の各種は上のグループで待たせない）。
        crawlDelay: 5,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
