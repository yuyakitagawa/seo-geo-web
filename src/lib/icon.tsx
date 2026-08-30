import type { ReactElement } from "react";

// ファビコン・アプリアイコンの共通図案。黒地に生成りの「SG」＋ブランドカラーの点。
// 画像素材を持たない方針なので next/og でその場で描く（欧文だけなので追加フォントは不要）。
export function iconFrame(size: number): ReactElement {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        backgroundColor: "#0a0a0a",
        color: "#f5f5f2",
        fontSize: size * 0.46,
        fontWeight: 700,
        letterSpacing: -size * 0.02,
      }}
    >
      SG
      <div
        style={{
          position: "absolute",
          right: size * 0.12,
          top: size * 0.12,
          width: size * 0.16,
          height: size * 0.16,
          borderRadius: 999,
          backgroundColor: "#2994b9",
        }}
      />
    </div>
  );
}
