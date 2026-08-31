import { ImageResponse } from "next/og";
import { iconFrame, loadIconFont } from "@/lib/icon";

export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(iconFrame(512), { width: 512, height: 512, fonts: await loadIconFont() });
}
