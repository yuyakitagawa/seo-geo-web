import { ORGANIZATION_CONTACT_POINT, ORGANIZATION_SAME_AS, SITE_ALTERNATE_NAMES, SITE_LOGO, SITE_NAME, SITE_URL } from "./site";

// サイトの運営主体（Organization）。日本語・英語の両方のルートレイアウトが同じ @id で出す
// （英語版を別エンティティと誤認させない）。記事の author / publisher はこの @id を参照する。
export const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  alternateName: SITE_ALTERNATE_NAMES,
  url: SITE_URL,
  // Article のリッチリザルトは publisher.logo を要求する。@id 参照で記事側と共有する。
  logo: { "@type": "ImageObject", ...SITE_LOGO },
  // 運営方針・記事の作り方を書いたページ。エンティティ（Organization）と /about を結び付ける。
  publishingPrinciples: `${SITE_URL}/about`,
  ...(ORGANIZATION_SAME_AS.length ? { sameAs: ORGANIZATION_SAME_AS } : {}),
  ...(ORGANIZATION_CONTACT_POINT ? { contactPoint: ORGANIZATION_CONTACT_POINT } : {}),
};
