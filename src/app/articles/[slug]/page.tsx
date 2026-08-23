import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import AdUnit from "@/components/AdUnit";
import ArticleCard from "@/components/ArticleCard";
import JsonLd from "@/components/JsonLd";
import { getAllArticles, getArticle, getRelatedArticles } from "@/lib/content";
import { CATEGORIES, SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/articles/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `/articles/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.description,
      url: `${SITE_URL}/articles/${article.slug}`,
      publishedTime: article.date,
      modifiedTime: article.updated,
      tags: article.tags,
    },
  };
}

export default async function ArticlePage({ params }: PageProps<"/articles/[slug]">) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const related = getRelatedArticles(article);
  const url = `${SITE_URL}/articles/${article.slug}`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    dateModified: article.updated,
    inLanguage: "ja",
    mainEntityOfPage: url,
    keywords: article.tags.join(", "),
    articleSection: CATEGORIES[article.category].label,
    author: { "@id": `${SITE_URL}/#organization` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    // 一次情報を citation として宣言。LLMが根拠付きで引用しやすくする。
    ...(article.sources.length ? { citation: article.sources.map((s) => s.url) } : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
      { "@type": "ListItem", position: 2, name: CATEGORIES[article.category].label, item: `${SITE_URL}/category/${article.category}` },
      { "@type": "ListItem", position: 3, name: article.title, item: url },
    ],
  };

  return (
    <article>
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <nav aria-label="パンくず" className="mb-4 text-sm text-neutral-500">
        <ol className="flex flex-wrap gap-1">
          <li><Link href="/" className="hover:underline">ホーム</Link> /</li>
          <li><Link href={`/category/${article.category}`} className="hover:underline">{CATEGORIES[article.category].label}</Link></li>
        </ol>
      </nav>

      <header className="mb-8">
        <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{article.title}</h1>
        <p className="mt-3 text-sm text-neutral-500">
          公開 <time dateTime={article.date}>{article.date}</time>
          {article.updated !== article.date && <> ・ 更新 <time dateTime={article.updated}>{article.updated}</time></>}
          {" "}・ 約{article.readingMinutes}分で読めます
        </p>
        {article.description && <p className="mt-4 text-neutral-700 dark:text-neutral-300">{article.description}</p>}
      </header>

      <div className="prose prose-neutral max-w-none dark:prose-invert prose-headings:scroll-mt-20">
        <MDXRemote
          source={article.body}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]],
            },
          }}
        />
      </div>

      {article.sources.length > 0 && (
        <section className="mt-10 rounded-lg border border-neutral-200 p-4 text-sm dark:border-neutral-800">
          <h2 className="mb-2 font-semibold">参考・一次情報</h2>
          <ul className="list-disc space-y-1 pl-5">
            {article.sources.map((s) => (
              <li key={s.url}><a href={s.url} target="_blank" rel="noopener" className="underline">{s.title}</a></li>
            ))}
          </ul>
        </section>
      )}

      {article.tags.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-2 text-sm">
          {article.tags.map((t) => (
            <li key={t}><Link href={`/tag/${encodeURIComponent(t)}`} className="rounded bg-neutral-100 px-2 py-1 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700">#{t}</Link></li>
          ))}
        </ul>
      )}

      <AdUnit placement="bottom" />

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold">関連記事</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {related.map((a) => <ArticleCard key={a.slug} article={a} />)}
          </div>
        </section>
      )}
    </article>
  );
}
