import type { ReactElement } from "react";
import { ImageResponse } from "next/og";
import { CATEGORIES, SITE_NAME, type CategoryKey } from "./site";

// OGP画像（SNSシェア時に出る実PNG）の共通部品。next/og の ImageResponse から使う。
// 背景は黒地＋カテゴリ色のグラデーションだけで作る（画像素材を持たない）。

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

// satoriは8桁hexを解さないためrgbの数値で持ち、不透明度を変えて背景とバッジの両方に使う。
const CATEGORY_RGB: Record<CategoryKey, string> = { seo: "79,124,255", geo: "168,85,247", news: "255,107,53" };
const categoryColor = (c: CategoryKey, alpha = 1) => `rgba(${CATEGORY_RGB[c]},${alpha})`;

export type OgFont = { name: string; data: ArrayBuffer; weight: 700; style: "normal" };

const FONT_ATTEMPTS = 3;
const FONT_TIMEOUT_MS = 10_000;

/**
 * Google Fontsから「その画像で使う文字だけ」に絞ったNoto Sans JPを取得する。
 * 和文フォントを丸ごとリポジトリに置くとImageResponseの容量上限(500KB)を超えるため、
 * text= で必要な字だけ切り出す。一時的な失敗（2026-09-11の "fetch failed"）に備えて間隔を空けて3回まで試す。
 */
async function loadOgFont(text: string, retryDelayMs: number): Promise<OgFont | null> {
  const get = (url: string) =>
    fetch(url, { signal: AbortSignal.timeout(FONT_TIMEOUT_MS) }).then((r) => (r.ok ? r : Promise.reject(new Error(`${r.status} ${url}`))));
  let error: unknown;
  for (let attempt = 1; attempt <= FONT_ATTEMPTS; attempt++) {
    try {
      const css = await get(`https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`).then((r) => r.text());
      const src = css.match(/src:\s*url\(([^)]+)\)/)?.[1];
      if (!src) throw new Error("font url not found");
      const data = await get(src).then((r) => r.arrayBuffer());
      return { name: "Noto Sans JP", data, weight: 700, style: "normal" };
    } catch (e) {
      error = e;
      if (attempt < FONT_ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt));
    }
  }
  console.warn(`OGPフォント取得に${FONT_ATTEMPTS}回失敗（和文なしで生成します）: ${(error as Error).message}`);
  return null;
}

/**
 * ImageResponse に渡すフォント指定。OGP画像はすべてこれを通す（`fonts` を直接組み立てない）。
 * 取得できなかったときは `fonts` ごと省き、next/og 同梱の Geist（欧文のみ）で描く。
 * 空配列を渡すと同梱フォントまで無効になり（next/og は `options.fonts || defaultFonts`）、
 * 「No fonts are loaded」でビルドが落ちる（2026-09-10 のCI、2026-09-11 の PR #57 のプレビューで発生）。
 */
export async function ogFontOption(text: string, { retryDelayMs = 1000 } = {}): Promise<{ fonts?: OgFont[] }> {
  const font = await loadOgFont(text, retryDelayMs);
  return font ? { fonts: [font] } : {};
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
          <div style={{ width: 16, height: 16, borderRadius: 999, backgroundColor: "#2994b9", marginRight: 14 }} />
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
          <div style={{ display: "flex", width: 88, height: 8, borderRadius: 999, backgroundColor: "#2994b9", marginTop: 30 }} />
          <div style={{ fontSize: 56, color: "#f5f5f2", lineHeight: 1.3, marginTop: 26, maxWidth: 1010 }}>{title}</div>
        </div>

        <div style={{ fontSize: 24, color: "rgba(245,245,242,0.55)" }}>{footer}</div>
      </div>
    </div>
  );
}

/**
 * 記事以外のページ（解説・教科書・一覧・固定ページ）のOGP画像ハンドラを作る。
 * 記事と同じ `ogFrame` を通すので、どのURLを共有しても見え方がそろう。
 * 各ページの opengraph-image.tsx は、この戻り値を default export するだけでよい。
 */
export function pageOgImage(props: { category: CategoryKey; title: string; footer: string; label?: string }) {
  return async function Image() {
    const { category, title, footer, label } = props;
    const font = await ogFontOption(title + footer + (label ?? CATEGORIES[category].label) + SITE_NAME);
    return new ImageResponse(ogFrame({ category, title, footer, label }), { ...OG_SIZE, ...font });
  };
}

/** metaTitle（"GEO対策とは｜生成AI検索最適化の定義・…"）の「｜」以降をOGPの脚注に使う。 */
export function subtitleOf(metaTitle: string): string {
  return metaTitle.split("｜")[1] ?? "";
}
