import { ADSENSE_PUBLISHER_ID } from "@/lib/adsense";

// 記事も設定もビルド時に確定するので静的ファイルとして配る（クローラーへのTTFBを詰める）。
export const dynamic = "force-static";

// AdSenseのads.txt。パブリッシャーID未設定なら404（誤った空ファイルを配信しない）。
export function GET() {
  if (!ADSENSE_PUBLISHER_ID) return new Response("Not Found", { status: 404 });
  return new Response(`google.com, ${ADSENSE_PUBLISHER_ID}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
