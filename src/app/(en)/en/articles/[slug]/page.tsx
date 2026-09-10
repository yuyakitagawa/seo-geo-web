import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import KeyPoints from "@/components/KeyPoints";
import KeyVisual from "@/components/KeyVisual";
import Toc from "@/components/Toc";
import { MDX_FIGURES_EN } from "@/components/figures";
import { EN_FAQ_HEADING, enArticlePath, getAllEnArticles, getEnArticle } from "@/lib/content-en";
import { EN_HOME_PATH } from "@/lib/en";
import { extractFaq, faqPageJsonLd } from "@/lib/faq";
import { ogImageUrl } from "@/lib/ogImage";
import { extractToc } from "@/lib/toc";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { CONTAINER, EYEBROW, LINK, PADDING, PROSE, SURFACE, cx } from "@/lib/ui";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllEnArticles().map((a) => ({ slug: a.slug }));
}

// 日本語版と英語版を hreflang で相互に宣言する（どちらも自分自身を canonical にする）。
// x-default は日本語版（サイトの既定言語）。
function languages(id: number, slug: string) {
  return { ja: `/articles/${id}`, en: enArticlePath(slug), "x-default": `/articles/${id}` };
}

export async function generateMetadata({ params }: PageProps<"/en/articles/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = getEnArticle(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: enArticlePath(article.slug), languages: languages(article.id, article.slug) },
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      locale: "en_US",
      alternateLocale: "ja_JP",
      title: article.title,
      description: article.description,
      url: `${SITE_URL}${enArticlePath(article.slug)}`,
      publishedTime: article.date,
      modifiedTime: article.updated,
      tags: article.tags,
    },
  };
}

export default async function EnArticlePage({ params }: PageProps<"/en/articles/[slug]">) {
  const { slug } = await params;
  const article = getEnArticle(slug);
  if (!article) notFound();

  const url = `${SITE_URL}${enArticlePath(article.slug)}`;
  const jaUrl = `${SITE_URL}/articles/${article.id}`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    dateModified: article.updated,
    inLanguage: "en",
    mainEntityOfPage: url,
    image: ogImageUrl("/(en)/en/articles/[slug]", { slug: article.slug }),
    isPartOf: { "@id": `${SITE_URL}${EN_HOME_PATH}#website` },
    // 日本語の原文。同じ調査の翻訳であることを宣言し、別の記事として重複扱いされないようにする。
    translationOfWork: { "@id": `${jaUrl}#article` },
    keywords: article.tags.join(", "),
    author: { "@id": `${SITE_URL}/#organization` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    ...(article.sources.length ? { citation: article.sources.map((s) => s.url) } : {}),
  };
  const faq = extractFaq(article.body, EN_FAQ_HEADING);

  return (
    <article>
      <JsonLd data={articleJsonLd} />
      {faq.length > 0 && <JsonLd data={faqPageJsonLd(url, faq)} />}

      <header className="relative overflow-hidden bg-ink text-paper">
        {/* 図柄は日本語版と同じ（slug ではなく id をシードにする） */}
        <KeyVisual slug={String(article.id)} category={article.category} className="opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/85 to-ink/55" />
        <div className="bg-grid absolute inset-0 opacity-50" />
        <div className={cx(CONTAINER.wide, "relative pb-14 pt-16 sm:pb-20 sm:pt-24")}>
          <Breadcrumbs lang="en" items={[{ name: article.title }]} />
          <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-paper/70">
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-ink">Original research</span>
            <time dateTime={article.date}>{article.date.replaceAll("-", ".")}</time>
            {article.updated !== article.date && <span>Updated <time dateTime={article.updated}>{article.updated.replaceAll("-", ".")}</time></span>}
            <a href={`/articles/${article.id}`} hrefLang="ja" className="underline decoration-paper/40 underline-offset-4 hover:text-paper">
              日本語版
            </a>
          </div>
          <h1 className="text-[clamp(1.9rem,5vw,3.5rem)] font-bold leading-[1.15] tracking-tight animate-rise">{article.title}</h1>
          {article.description && <p className="mt-6 max-w-2xl text-paper/75 sm:text-lg animate-rise [animation-delay:100ms]">{article.description}</p>}
        </div>
      </header>

      <div className={CONTAINER.wide}>
        <KeyPoints article={article} lang="en" />
        <Toc items={extractToc(article.body)} label="Contents" />

        <div className={cx(PROSE.body, "prose-headings:scroll-mt-24 prose-p:leading-[1.8] sm:prose-lg")}>
          <MDXRemote
            source={article.body}
            components={MDX_FIGURES_EN}
            options={{
              // 日本語版と同じ理由で式を許可する（リポジトリ内の信頼済みコンテンツ）。
              blockJS: false,
              mdxOptions: {
                remarkPlugins: [remarkGfm],
                rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]],
              },
            }}
          />
        </div>

        {article.sources.length > 0 && (
          <section className={cx(SURFACE.outline, PADDING.tight, "mt-12 text-sm")}>
            <h2 className={cx(EYEBROW.mute, "mb-3")}>Sources</h2>
            <ul className="space-y-2">
              {article.sources.map((s) => (
                <li key={s.url}><a href={s.url} target="_blank" rel="noopener" className={LINK}>{s.title}</a></li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-6 text-sm text-mute">
          This is the English edition of research first published in Japanese by {SITE_NAME}.{" "}
          <a href={`/articles/${article.id}`} hrefLang="ja" className={LINK}>Read the Japanese original</a>.
        </p>
      </div>
    </article>
  );
}
