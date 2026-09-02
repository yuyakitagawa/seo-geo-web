import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import AdUnit from "@/components/AdUnit";
import ArticleCard from "@/components/ArticleCard";
import ArticleNextStep from "@/components/ArticleNextStep";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import KeyVisual from "@/components/KeyVisual";
import KeyPoints from "@/components/KeyPoints";
import Toc from "@/components/Toc";
import FollowCta from "@/components/FollowCta";
import ShareButtons from "@/components/ShareButtons";
import CategoryBadge from "@/components/CategoryBadge";
import TypeBadge from "@/components/TypeBadge";
import OriginalBadge from "@/components/OriginalBadge";
import SourceBadge from "@/components/SourceBadge";
import { MDX_FIGURES } from "@/components/figures";
import { getAllArticles, getArticle, getRelatedArticles } from "@/lib/content";
import { supersededBy } from "@/lib/indexability";
import { extractFaq, faqPageJsonLd } from "@/lib/faq";
import { extractToc } from "@/lib/toc";
import { CATEGORIES, SITE_NAME, SITE_URL, categoryHref } from "@/lib/site";
import { CHIP, CONTAINER, EYEBROW, HEADING, LINK, PADDING, PROSE, SURFACE, cx } from "@/lib/ui";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/articles/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  // 続報に置き換えられた記事は同じクエリで最新版と食い合うので、インデックスさせず
  // リンクだけ辿らせる（sitemap からも外れる。判定は src/lib/indexability.ts に集約）。
  const superseded = supersededBy(article);
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `/articles/${article.slug}` },
    // openGraph は上位の値とマージされず丸ごと置き換わるので、siteName / locale もここで書き直す。
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      locale: "ja_JP",
      title: article.title,
      description: article.description,
      url: `${SITE_URL}/articles/${article.slug}`,
      publishedTime: article.date,
      modifiedTime: article.updated,
      tags: article.tags,
    },
    ...(superseded ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ArticlePage({ params }: PageProps<"/articles/[slug]">) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const related = getRelatedArticles(article);
  const url = `${SITE_URL}/articles/${article.slug}`;
  const superseded = supersededBy(article);

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
    // opengraph-image.tsx が生成する実PNG。Article のリッチリザルトは image を要求する。
    image: `${url}/opengraph-image`,
    keywords: article.tags.join(", "),
    articleSection: CATEGORIES[article.category].label,
    author: { "@id": `${SITE_URL}/#organization` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    // 一次情報を citation として宣言。LLMが根拠付きで引用しやすくする。
    ...(article.sources.length ? { citation: article.sources.map((s) => s.url) } : {}),
  };

  // 記事末尾の「## よくある質問」をそのまま FAQPage にする（可視テキストと一言一句一致させるため本文から抽出）。
  const faq = extractFaq(article.body);

  return (
    <article>
      <JsonLd data={articleJsonLd} />
      {faq.length > 0 && <JsonLd data={faqPageJsonLd(url, faq)} />}

      <header className="relative overflow-hidden bg-ink text-paper">
        {/* キービジュアル。本文の可読性を優先し、暗いグラデーションを重ねた上に見出しを置く */}
        <KeyVisual slug={article.slug} category={article.category} className="opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/85 to-ink/55" />
        <div className="bg-grid absolute inset-0 opacity-50" />
        <div className={cx(CONTAINER.wide, "relative pb-14 pt-16 sm:pb-20 sm:pt-24")}>
          <Breadcrumbs
            items={[
              { name: CATEGORIES[article.category].label, href: categoryHref(article.category) },
              { name: article.title },
            ]}
          />
          <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-paper/70">
            <CategoryBadge category={article.category} size="md" />
            <TypeBadge type={article.type} size="md" />
            <OriginalBadge original={article.original} size="md" />
            <SourceBadge sources={article.sources} original={article.original} size="md" />
            <time dateTime={article.date}>{article.date.replaceAll("-", ".")}</time>
            {article.updated !== article.date && <span>更新 <time dateTime={article.updated}>{article.updated.replaceAll("-", ".")}</time></span>}
            <span>{article.readingMinutes} min read</span>
          </div>
          <h1 className="text-[clamp(1.9rem,5vw,3.5rem)] font-bold leading-[1.15] tracking-tight animate-rise">{article.title}</h1>
          {article.description && <p className="mt-6 max-w-2xl text-paper/75 sm:text-lg animate-rise [animation-delay:100ms]">{article.description}</p>}
        </div>
      </header>

      <div className={CONTAINER.wide}>
        <KeyPoints article={article} />

        {superseded && (
          <aside className="mb-10 rounded-3xl border border-accent/40 bg-accent/10 p-6 text-sm leading-relaxed">
            この記事は続報に置き換わっています。最新の内容は
            <Link href={`/articles/${superseded.slug}`} className="mx-1 font-bold underline decoration-accent decoration-2 underline-offset-4">
              {superseded.title}
            </Link>
            を読んでください。
          </aside>
        )}

        <Toc items={extractToc(article.body)} />
        <ArticleNextStep article={article} />

        <div className={cx(PROSE.body, "prose-headings:scroll-mt-24 prose-p:leading-[1.9] sm:prose-lg")}>
          <MDXRemote
            source={article.body}
            components={MDX_FIGURES}
            options={{
              // 図解コンポーネントは cols={[...]} のようにJS式で受け取る。記事はリポジトリ内の
              // 信頼済みコンテンツなので式を許可する（危険な呼び出しの除去 blockDangerousJS は既定で有効のまま）。
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
            <h2 className={cx(EYEBROW.mute, "mb-3")}>Sources · 一次情報</h2>
            <ul className="space-y-2">
              {article.sources.map((s) => (
                <li key={s.url}><a href={s.url} target="_blank" rel="noopener" className={LINK}>{s.title}</a></li>
              ))}
            </ul>
          </section>
        )}

        {article.tags.length > 0 && (
          <ul className="mt-8 flex flex-wrap gap-2 text-sm">
            {article.tags.map((t) => (
              <li key={t}><Link href={`/tag/${encodeURIComponent(t)}`} className={CHIP}>#{t}</Link></li>
            ))}
          </ul>
        )}

        <ShareButtons url={url} title={article.title} />
        <FollowCta />
        <AdUnit placement="bottom" />
      </div>

      {related.length > 0 && (
        <aside aria-label="関連記事" className={cx(CONTAINER.page, "mt-20")}>
          <h2 className={cx(HEADING.section, "mb-6")}>関連記事</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {related.map((a, i) => <ArticleCard key={a.slug} article={a} index={i} />)}
          </div>
        </aside>
      )}
    </article>
  );
}
