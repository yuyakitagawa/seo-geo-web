import type { Metadata } from "next";
import Link from "next/link";
import { Geist_Mono, Space_Grotesk } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import GaClickTracker from "@/components/GaClickTracker";
import JsonLd from "@/components/JsonLd";
import { EN_HOME_PATH, SITE_DESCRIPTION_EN, SITE_TITLE_EN } from "@/lib/en";
import { ORGANIZATION_JSON_LD } from "@/lib/organization";
import { SITE_NAME, SITE_URL, X_HANDLE, X_PROFILE_URL } from "@/lib/site";
import { CONTAINER, cx } from "@/lib/ui";
import "../../globals.css";

// 英語版（/en）のルートレイアウト。<html lang="en"> を出すため、日本語側（src/app/(ja)/layout.tsx）とは
// 別のルートレイアウトにしている（ルートグループ (ja) / (en)。行き来するとフルリロードになるが、日英の往復は稀）。
// 日本語側の Header / Footer は文言が日本語固定なので使わず、ここに最小限の英語版を置く。
// AdSense は入れない（審査前。英語面を審査に巻き込む理由がない）。GA4 は同じプロパティでパスで分ける。

const display = Space_Grotesk({ variable: "--font-display", subsets: ["latin"], weight: ["400", "500", "700"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE_EN, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION_EN,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: { type: "website", locale: "en_US", alternateLocale: "ja_JP", siteName: SITE_NAME },
  twitter: { card: "summary_large_image", site: X_HANDLE, creator: X_HANDLE },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}${EN_HOME_PATH}#website`,
  name: SITE_NAME,
  url: `${SITE_URL}${EN_HOME_PATH}`,
  description: SITE_DESCRIPTION_EN,
  inLanguage: "en",
  publisher: { "@id": `${SITE_URL}/#organization` },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function EnRootLayout({ children }: LayoutProps<"/en">) {
  return (
    <html lang="en" className={`${display.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <JsonLd data={ORGANIZATION_JSON_LD} />
        <JsonLd data={websiteJsonLd} />
        <header className="sticky top-0 z-50 border-b border-line bg-canvas/80 backdrop-blur-md">
          <div className={cx(CONTAINER.page, "flex min-h-16 items-center justify-between gap-4 py-3")}>
            <Link href={EN_HOME_PATH} className="group flex shrink-0 items-center gap-2 text-base font-bold tracking-tight">
              <span className="inline-block size-3 rounded-full bg-accent shadow-[0_0_14px_var(--color-accent)] transition group-hover:scale-125" />
              <span>{SITE_NAME}</span>
            </Link>
            <nav aria-label="Site">
              <ul className="flex items-center gap-1 rounded-full border border-line bg-surface/60 p-1 text-xs sm:text-sm">
                <li>
                  <Link href={EN_HOME_PATH} className="block whitespace-nowrap rounded-full px-3 py-1.5 font-medium transition hover:bg-invert hover:text-invert-fg">
                    Research
                  </Link>
                </li>
                <li>
                  <Link href="/" hrefLang="ja" lang="ja" className="block whitespace-nowrap rounded-full px-3 py-1.5 font-medium transition hover:bg-invert hover:text-invert-fg">
                    日本語
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="mt-24 bg-invert text-invert-fg">
          <div className={cx(CONTAINER.page, "py-16")}>
            <p className="text-[clamp(2.5rem,9vw,7rem)] font-bold leading-none tracking-tighter">{SITE_NAME}</p>
            <p className="mt-6 max-w-xl text-sm opacity-70">{SITE_DESCRIPTION_EN}</p>
            <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-current/20 pt-6 text-sm">
              <p className="opacity-60">© {new Date().getFullYear()} {SITE_NAME}</p>
              <nav aria-label="Site information">
                <ul className="flex flex-wrap gap-5">
                  <li><Link href="/" hrefLang="ja" className="hover:text-accent">Japanese edition</Link></li>
                  <li><Link href="/about" hrefLang="ja" className="hover:text-accent">About (Japanese)</Link></li>
                  <li><Link href="/privacy" hrefLang="ja" className="hover:text-accent">Privacy policy (Japanese)</Link></li>
                  {X_PROFILE_URL && <li><a href={X_PROFILE_URL} rel="me noopener" target="_blank" className="hover:text-accent">X</a></li>}
                </ul>
              </nav>
            </div>
          </div>
        </footer>
        <SpeedInsights />
        {GA_ID && (
          <>
            <GoogleAnalytics gaId={GA_ID} />
            <GaClickTracker />
          </>
        )}
      </body>
    </html>
  );
}
