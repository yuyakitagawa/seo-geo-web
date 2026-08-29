import { ImageResponse } from "next/og";
import { iconFrame } from "@/lib/icon";

// iOSのホーム画面追加用。無いとスクリーンショットが縮小されてぼやける。
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(iconFrame(size.width), size);
}
