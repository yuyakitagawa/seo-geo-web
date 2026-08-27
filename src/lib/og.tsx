import type { ReactElement } from "react";
import { CATEGORIES, SITE_NAME, type CategoryKey } from "./site";

// OGP画像（SNSシェア時に出る実PNG）の共通部品。next/og の ImageResponse から使う。
// 背景は黒地＋カテゴリ色のグラデーションだけで作る（画像素材を持たない）。

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

// satoriは8桁hexを解さないためrgbの数値で持ち、不透明度を変えて背景とバッジの両方に使う。
const CATEGORY_RGB: Record<CategoryKey, string> = { seo: "79,124,255", geo: "168,85,247", news: "255,107,53" };
const categoryColor = (c: CategoryKey, alpha = 1) => `rgba(${CATEGORY_RGB[c]},${alpha})`;

export type OgFont = { name: string; data: ArrayBuffer; weight: 700; style: "normal" };

/**
 * Google Fontsから「その画像で使う文字だけ」に絞ったNoto Sans JPを取得する。
 * 和文フォントを丸ごとリポジトリに置くとImageResponseの容量上限(500KB)を超えるため、
 * text= で必要な字だけ切り出す。取得に失敗しても画像は生成する（和文が欠けるだけ）。
 */
export async function loadOgFont(text: string): Promise<OgFont[]> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`;
    const css = await fetch(url).then((r) => (r.ok ? r.text() : Promise.reject(new Error(`css ${r.status}`))));
    const src = css.match(/src:\s*url\(([^)]+)\)/)?.[1];
    if (!src) throw new Error("font url not found");
    const data = await fetch(src).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`font ${r.status}`))));
    return [{ name: "Noto Sans JP", data, weight: 700, style: "normal" }];
  } catch (e) {
    console.warn(`OGPフォント取得に失敗（和文なしで生成します）: ${(e as Error).message}`);
    return [];
  }
}

/** OGP画像のJSX。satoriの制約に合わせ、flexboxと絶対配置だけで組む */
export function ogFrame({
  category,
  title,
  footer,
  label,
}: {
  category: CategoryKey;
  title: string;
  footer: string;
  /** バッジの文言。省略時はカテゴリ名 */
  label?: string;
}): ReactElement {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", backgroundColor: "#0a0a0a" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundImage: `linear-gradient(115deg, rgba(10,10,10,0) 40%, ${categoryColor(category, 0.45)} 100%)`,
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          padding: 64,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 16, height: 16, borderRadius: 999, backgroundColor: "#d7ff3b", marginRight: 14 }} />
          <div style={{ fontSize: 28, color: "#f5f5f2" }}>{SITE_NAME}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex" }}>
            <div
              style={{
                backgroundColor: categoryColor(category),
                color: "#ffffff",
                fontSize: 24,
                padding: "8px 22px",
                borderRadius: 999,
              }}
            >
              {label ?? CATEGORIES[category].label}
            </div>
          </div>
          <div style={{ display: "flex", width: 88, height: 8, borderRadius: 999, backgroundColor: "#d7ff3b", marginTop: 30 }} />
          <div style={{ fontSize: 56, color: "#f5f5f2", lineHeight: 1.3, marginTop: 26, maxWidth: 920 }}>{title}</div>
        </div>

        <div style={{ fontSize: 24, color: "rgba(245,245,242,0.55)" }}>{footer}</div>
      </div>
    </div>
  );
}
