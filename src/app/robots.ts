import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { CRAWLERS } from "@/lib/crawlers";
import { BLOCKED_SCRAPERS } from "@/lib/scrapers";

// crawl-delay を掛けないクローラー。src/lib/crawlers.ts の14種すべて（AI検索・AI学習・検索エンジン）。
// AIと検索に読まれること自体がこのサイトの目的なので、名前の分かっている相手を待たせる理由がない。
// 待たせるのは `*`、つまり名乗りもしない小規模クローラーだけ。
const NO_DELAY = CRAWLERS.map((c) => c.token);

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
        // 名前の分かっているクローラーは上のグループで受けるので、ここに残るのは名乗らない相手だけ。
        crawlDelay: 5,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
