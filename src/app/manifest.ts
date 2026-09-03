import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

// output: "export" では、メタデータのルートにこれが無いとビルドが落ちる（Vercel上でISRを使わないための静的エクスポート）。
export const dynamic = "force-static";

// 無いとAndroid Chromeが「ホーム画面に追加」を出さない。
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME}｜SEOとGEOの最新動向と実務ノウハウ`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    lang: "ja",
    // maskable も同じ画像で兼ねる。図案（src/lib/icon.tsx）は中央だけで成立し四隅が空なので、
    // Androidが円や角丸に切っても欠けない。any だけだと白い下地を足されて図案が縮む。
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
