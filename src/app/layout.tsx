import type { Metadata } from "next";
import { Geist_Mono, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import AdSenseScript from "@/components/AdSenseScript";
import { ADSENSE_CLIENT } from "@/lib/adsense";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GaClickTracker from "@/components/GaClickTracker";
import JsonLd from "@/components/JsonLd";
import { ORGANIZATION_CONTACT_POINT, ORGANIZATION_SAME_AS, SITE_ALTERNATE_NAMES, SITE_DESCRIPTION, SITE_LOGO, SITE_NAME, SITE_URL, X_HANDLE } from "@/lib/site";
import "./globals.css";

// 欧文ディスプレイ書体。和文は端末フォント（CSS側のフォールバック）。
const display = Space_Grotesk({ variable: "--font-display", subsets: ["latin"], weight: ["400", "500", "700"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME}｜SEOとGEOの最新動向と実務ノウハウ`,
    // 固有名（記事タイトル）を先頭に。全記事が同じ接頭辞で始まると検索結果で見分けが付かない。
    template: `%s｜${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": `${SITE_URL}/feed.xml` },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  // ここに title / description / url を書くと、openGraph を自前で持たない全ページ（/tools/page-audit など）が
  // サイト名とトップのURLを名乗ってしまう。全ページ共通の3つだけ置き、残りは各ページの title / description から
  // Next に埋めさせる。トップページ分は src/app/page.tsx が持つ。
  openGraph: { type: "website", locale: "ja_JP", siteName: SITE_NAME },
  // title / description はここで固定しない。Next は twitter.title が無いときだけ openGraph（無ければ
  // metadata）の値で埋める（node_modules/next/dist/lib/metadata/resolve-metadata.js の postProcessMetadata）。
  // ここに書くと twitter オブジェクトごと全下層ページに継承され、記事ページのカードまでサイト名になる。
  twitter: { card: "summary_large_image", site: X_HANDLE, creator: X_HANDLE },
  // AdSenseのサイト所有権確認用メタタグ。パブリッシャーID未設定なら出さない。
  ...(ADSENSE_CLIENT ? { other: { "google-adsense-account": ADSENSE_CLIENT } } : {}),
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  alternateName: SITE_ALTERNATE_NAMES,
  url: SITE_URL,
  // Article のリッチリザルトは publisher.logo を要求する。@id 参照で記事側と共有する。
  logo: { "@type": "ImageObject", ...SITE_LOGO },
  ...(ORGANIZATION_SAME_AS.length ? { sameAs: ORGANIZATION_SAME_AS } : {}),
  ...(ORGANIZATION_CONTACT_POINT ? { contactPoint: ORGANIZATION_CONTACT_POINT } : {}),
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: "ja",
  publisher: { "@id": `${SITE_URL}/#organization` },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${display.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <JsonLd data={organizationJsonLd} />
        <JsonLd data={websiteJsonLd} />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <AdSenseScript />
        <Analytics />
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
