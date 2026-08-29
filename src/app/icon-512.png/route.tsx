import { ImageResponse } from "next/og";
import { iconFrame } from "@/lib/icon";

export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(iconFrame(512), { width: 512, height: 512 });
}
