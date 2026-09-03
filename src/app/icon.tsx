import { ImageResponse } from "next/og";
import { iconFrame, loadIconFont } from "@/lib/icon";

// output: "export" では、メタデータのルートにこれが無いとビルドが落ちる（Vercel上でISRを使わないための静的エクスポート）。
export const dynamic = "force-static";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  return new ImageResponse(iconFrame(size.width), { ...size, fonts: await loadIconFont() });
}
