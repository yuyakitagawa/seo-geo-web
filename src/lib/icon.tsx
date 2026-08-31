import type { ReactElement } from "react";

// ファビコン・アプリアイコン・Xのプロフィール画像に使う共通図案。
// 黒地に「SG」。S（＝SEO）は生成り、G（＝GEO）はブランド色で塗り分ける。
// Xはアイコンを円形に切るため、四隅には何も置かない（中央だけで成立させる）。
// 画像素材は持たず next/og でその場で描く。書体はサイトの見出しと同じ Space Grotesk。

export type IconFont = { name: string; data: ArrayBuffer; weight: 700; style: "normal" };

/**
 * 「SG」の2文字だけに絞った Space Grotesk 700 を Google Fonts から取る。
 * satoriの既定フォントには太字が無く、字画が細くなって小サイズで潰れるため。
 * 取得に失敗しても描画は続ける（細い字で出るだけ）。
 */
export async function loadIconFont(): Promise<IconFont[]> {
  try {
    const url = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&text=SG";
    const css = await fetch(url).then((r) => (r.ok ? r.text() : Promise.reject(new Error(`css ${r.status}`))));
    const src = css.match(/src:\s*url\(([^)]+)\)/)?.[1];
    if (!src) throw new Error("font url not found");
    const data = await fetch(src).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`font ${r.status}`))));
    return [{ name: "Space Grotesk", data, weight: 700, style: "normal" }];
  } catch (e) {
    console.warn(`アイコン用フォントの取得に失敗（細字で生成します）: ${(e as Error).message}`);
    return [];
  }
}

export function iconFrame(size: number): ReactElement {
  const letter = {
    display: "flex",
    fontSize: size * 0.46,
    fontWeight: 700,
    letterSpacing: -size * 0.014,
    lineHeight: 1,
  } as const;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0a0a",
      }}
    >
      <div style={{ ...letter, color: "#f5f5f2" }}>S</div>
      <div style={{ ...letter, color: "#2994b9" }}>G</div>
    </div>
  );
}
