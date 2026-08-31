import { ImageResponse } from "next/og";
import { iconFrame, loadIconFont } from "@/lib/icon";

// manifest.webmanifest から参照するため、ハッシュの付かない固定URLで配る。
export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(iconFrame(192), { width: 192, height: 192, fonts: await loadIconFont() });
}
