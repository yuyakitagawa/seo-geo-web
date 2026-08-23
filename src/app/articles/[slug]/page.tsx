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
import KeyPoints from "@/components/KeyPoints";
import FollowCta from "@/components/FollowCta";
import CategoryBadge from "@/components/CategoryBadge";
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

      <header className="relative overflow-hidden bg-ink text-paper">
        <div className="bg-grid absolute inset-0 opacity-50" />
        <div className="relative mx-auto max-w-4xl px-5 pb-14 pt-16 sm:pb-20 sm:pt-24">
          <nav aria-label="パンくず" className="mb-8 text-xs text-paper/60">
            <ol className="flex flex-wrap gap-2">
              <li><Link href="/" className="hover:text-paper">ホーム</Link></li>
              <li aria-hidden>/</li>
              <li><Link href={`/category/${article.category}`} className="hover:text-paper">{CATEGORIES[article.category].label}</Link></li>
            </ol>
          </nav>
          <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-paper/70">
            <CategoryBadge category={article.category} size="md" />
            <time dateTime={article.date}>{article.date.replaceAll("-", ".")}</time>
            {article.updated !== article.date && <span>更新 <time dateTime={article.updated}>{article.updated.replaceAll("-", ".")}</time></span>}
            <span>{article.readingMinutes} min read</span>
          </div>
          <h1 className="text-[clamp(1.9rem,5vw,3.5rem)] font-bold leading-[1.15] tracking-tight animate-rise">{article.title}</h1>
          {article.description && <p className="mt-6 max-w-2xl text-paper/75 sm:text-lg animate-rise [animation-delay:100ms]">{article.description}</p>}
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5">
        <KeyPoints article={article} />

        <div className="prose prose-neutral max-w-none dark:prose-invert prose-headings:scroll-mt-24 prose-p:leading-[1.9] sm:prose-lg">
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
          <section className="mt-12 rounded-3xl border border-ink/10 p-6 text-sm dark:border-paper/10">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-mute">Sources · 一次情報</h2>
            <ul className="space-y-2">
              {article.sources.map((s) => (
                <li key={s.url}><a href={s.url} target="_blank" rel="noopener" className="underline decoration-accent decoration-2 underline-offset-4">{s.title}</a></li>
              ))}
            </ul>
          </section>
        )}

        {article.tags.length > 0 && (
          <ul className="mt-8 flex flex-wrap gap-2 text-sm">
            {article.tags.map((t) => (
              <li key={t}><Link href={`/tag/${encodeURIComponent(t)}`} className="inline-block rounded-full border border-ink/15 px-3 py-1.5 transition hover:bg-ink hover:text-paper dark:border-paper/15 dark:hover:bg-paper dark:hover:text-ink">#{t}</Link></li>
            ))}
          </ul>
        )}

        <FollowCta />
        <AdUnit placement="bottom" />
      </div>

      {related.length > 0 && (
        <section className="mx-auto mt-20 max-w-6xl px-5">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">関連記事</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {related.map((a, i) => <ArticleCard key={a.slug} article={a} index={i} />)}
          </div>
        </section>
      )}
    </article>
  );
}
