import { ImageResponse } from "next/og";
import { iconFrame } from "@/lib/icon";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(iconFrame(size.width), size);
}
