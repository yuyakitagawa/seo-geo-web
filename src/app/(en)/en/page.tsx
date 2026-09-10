import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { enArticlePath, getAllEnArticles } from "@/lib/content-en";
import { EN_HOME_PATH, SITE_DESCRIPTION_EN, SITE_TITLE_EN } from "@/lib/en";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { CHIP, CONTAINER, EYEBROW, LIFT, PADDING, SURFACE, cx } from "@/lib/ui";

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE_EN },
  description: SITE_DESCRIPTION_EN,
  alternates: { canonical: EN_HOME_PATH },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: "ja_JP",
    siteName: SITE_NAME,
    title: SITE_TITLE_EN,
    description: SITE_DESCRIPTION_EN,
    url: `${SITE_URL}${EN_HOME_PATH}`,
  },
};

export default function EnHome() {
  const articles = getAllEnArticles();
  const url = `${SITE_URL}${EN_HOME_PATH}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#page`,
    name: SITE_TITLE_EN,
    description: SITE_DESCRIPTION_EN,
    url,
    inLanguage: "en",
    isPartOf: { "@id": `${url}#website` },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: articles.map((a, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}${enArticlePath(a.slug)}`, name: a.title })),
    },
  };

  return (
    <div className={cx(CONTAINER.page, "py-16 sm:py-24")}>
      <JsonLd data={jsonLd} />
      <p className={EYEBROW.accent}>Original research</p>
      <h1 className="mt-4 max-w-3xl text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.1] tracking-tight">
        How AI search engines and their crawlers actually behave, measured
      </h1>
      <p className="mt-6 max-w-2xl text-mute sm:text-lg">{SITE_DESCRIPTION_EN}</p>

      <ul className="mt-14 grid gap-5 sm:grid-cols-2">
        {articles.map((a) => (
          <li key={a.slug}>
            <Link href={enArticlePath(a.slug)} className={cx(SURFACE.card, PADDING.card, LIFT, "block h-full")}>
              <p className="text-xs text-mute">
                <time dateTime={a.date}>{a.date.replaceAll("-", ".")}</time>
              </p>
              <h2 className="mt-3 text-lg font-bold leading-snug">{a.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-mute">{a.description}</p>
              {a.tags.length > 0 && (
                <p className="mt-4 flex flex-wrap gap-2">
                  {a.tags.slice(0, 4).map((t) => <span key={t} className={cx(CHIP, "text-xs")}>{t}</span>)}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
