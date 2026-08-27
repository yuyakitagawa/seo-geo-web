import { ImageResponse } from "next/og";
import { getAllArticles, getArticle } from "@/lib/content";
import { CATEGORIES, SITE_NAME } from "@/lib/site";
import { OG_CONTENT_TYPE, OG_SIZE, loadOgFont, ogFrame } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = `${SITE_NAME}の記事`;
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllArticles().map((a) => ({ slug: a.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return new Response("Not found", { status: 404 });

  const footer = `${article.date.replaceAll("-", ".")}　·　${article.readingMinutes} min read`;
  const fonts = await loadOgFont(article.title + CATEGORIES[article.category].label + SITE_NAME + footer);

  return new ImageResponse(
    ogFrame({ category: article.category, title: article.title, footer }),
    { ...size, fonts }
  );
}
