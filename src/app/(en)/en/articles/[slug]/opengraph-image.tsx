import { ImageResponse } from "next/og";
import { getAllEnArticles, getEnArticle } from "@/lib/content-en";
import { CATEGORIES, SITE_NAME } from "@/lib/site";
import { OG_CONTENT_TYPE, OG_SIZE, ogFontOption, ogFrame } from "@/lib/og";

// output: "export" では、メタデータのルートにこれが無いとビルドが落ちる。
export const dynamic = "force-static";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = `${SITE_NAME} research`;
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllEnArticles().map((a) => ({ slug: a.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getEnArticle(slug);
  if (!article) return new Response("Not found", { status: 404 });

  const footer = article.date.replaceAll("-", ".");
  const font = await ogFontOption(article.title + CATEGORIES[article.category].label + SITE_NAME + footer);
  return new ImageResponse(ogFrame({ category: article.category, title: article.title, footer }), { ...size, ...font });
}
