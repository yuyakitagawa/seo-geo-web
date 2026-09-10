import { SITE_URL } from "./site";

// opengraph-image.tsx が書き出される実URL。
//
// route group（`(ja)` `(en)`）の下にあるメタデータのルートは、Next が衝突よけに
// 「親ディレクトリの djb2 ハッシュ（36進6桁）」をファイル名に付ける
// （例: `/articles/75/opengraph-image-pnm8o`）。`${url}/opengraph-image` と手で書くと404になる
// （2026-09-11、全記事の JSON-LD `image` と全レッスンの og:image がこれで404だった）。
// 規則は next/dist/lib/metadata/get-metadata-route の getMetadataRouteSuffix。
// Next を上げて規則が変わったら ogImage.test.ts が落ちる。

/** src/app 以下で opengraph-image.tsx を置いているディレクトリ（route group込み）。増やしたらここにも足す */
export const OG_SEGMENTS = [
  "/(ja)",
  "/(ja)/about",
  "/(ja)/articles/[slug]",
  "/(ja)/geo",
  "/(ja)/glossary",
  "/(ja)/learn",
  "/(ja)/news",
  "/(ja)/seo",
  "/(ja)/tools",
  "/(en)/en",
  "/(en)/en/articles/[slug]",
] as const;

const isGroup = (seg: string) => seg.startsWith("(") && seg.endsWith(")");
const isParallel = (seg: string) => seg.startsWith("@");

/** next/dist/shared/lib/hash の djb2Hash と同じ（32bit） */
function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xffffffff;
  return hash >>> 0;
}

/**
 * `segment` の opengraph-image の絶対URL。動的セグメントは `params` で埋める。
 * 例: ogImageUrl("/(ja)/articles/[slug]", { slug: "75" }) → `${SITE_URL}/articles/75/opengraph-image-pnm8o`
 * （og:image に付く `?<hash>` はキャッシュ破り用で、無くても200が返るので付けない）
 */
export function ogImageUrl(segment: string, params: Record<string, string> = {}): string {
  if (!(OG_SEGMENTS as readonly string[]).includes(segment)) {
    throw new Error(`opengraph-image.tsx が無いセグメント: ${segment}（OG_SEGMENTS を確認）`);
  }
  const parts = segment.split("/").filter(Boolean);
  const suffix = parts.some((s) => isGroup(s) || isParallel(s)) ? `-${djb2(segment).toString(36).slice(0, 6)}` : "";
  const route = parts
    .filter((s) => !isGroup(s) && !isParallel(s))
    .map((s) => {
      const name = s.match(/^\[(.+)\]$/)?.[1];
      if (!name) return s;
      if (params[name] === undefined) throw new Error(`${segment} の [${name}] が params に無い`);
      return encodeURIComponent(params[name]);
    });
  return `${SITE_URL}/${[...route, `opengraph-image${suffix}`].join("/")}`;
}
