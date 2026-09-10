import { ImageResponse } from "next/og";
import { iconFontOption, iconFrame } from "@/lib/icon";

export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(iconFrame(512), { width: 512, height: 512, ...(await iconFontOption()) });
}
