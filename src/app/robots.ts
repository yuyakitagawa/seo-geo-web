import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // AI検索・AI学習クローラーを含め全許可（GEOの前提）。
    // /api/* は診断ツールのPOST専用エンドポイントで、GETすると405を返すだけの非コンテンツ。
    // クロールされてもインデックス対象が増えず、Search Consoleに「見つかりませんでした」系の
    // レポートを積むだけなので、クロール自体を止める。
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
