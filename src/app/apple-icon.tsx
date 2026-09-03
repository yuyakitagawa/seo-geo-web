import { ImageResponse } from "next/og";
import { iconFrame, loadIconFont } from "@/lib/icon";

// output: "export" では、メタデータのルートにこれが無いとビルドが落ちる（Vercel上でISRを使わないための静的エクスポート）。
export const dynamic = "force-static";

// iOSのホーム画面追加用。無いとスクリーンショットが縮小されてぼやける。
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  return new ImageResponse(iconFrame(size.width), { ...size, fonts: await loadIconFont() });
}
