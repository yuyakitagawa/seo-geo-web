import Link from "next/link";
import ArticleList from "@/components/ArticleList";
import { getAllArticles, getAllTags } from "@/lib/content";
import { GUIDE_LIST } from "@/lib/guides";
import { ARTICLES_PER_PAGE, CATEGORIES, CATEGORY_KEYS, SITE_NAME } from "@/lib/site";
import { CATEGORY_STYLE } from "@/lib/categoryStyle";

export default function Home() {
  const articles = getAllArticles();
  const tags = getAllTags().slice(0, 16);

  return (
    <>
      {/* Hero。ファーストビューに記事を入れるため高さを抑え、1バンドに収める */}
      <section className="relative overflow-hidden bg-ink text-paper">
        <div className="bg-grid absolute inset-0 opacity-50" />
        <div className="pointer-events-none absolute -right-32 -top-40 size-[28rem] rounded-full bg-accent/25 blur-[120px] animate-float" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-5 px-5 py-6 sm:flex-row sm:items-end sm:justify-between sm:py-10">
          <div className="animate-rise">
            <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-paper/60">
              <span className="size-1.5 rounded-full bg-accent" /> 毎朝更新 · SEO &amp; GEO
            </p>
            <h1 className="text-[clamp(1.5rem,3.6vw,2.25rem)] font-bold leading-tight tracking-tight">
              SEO・AI対策の「今」に<span className="text-accent">追いつける</span>
            </h1>
            <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-relaxed text-paper/60 sm:line-clamp-none">
              Google検索・AI Overview・ChatGPT・Perplexity。公式発表と海外ソースを毎朝巡回し、SEO/GEO担当が今日おさえるべき点だけを日本語で整理します。
            </p>
          </div>
          <ul className="flex flex-wrap gap-2 animate-rise [animation-delay:120ms]">
            {CATEGORY_KEYS.map((k) => (
              <li key={k}>
                <Link href={`/category/${k}`} className="inline-flex items-center gap-2 rounded-full border border-paper/20 px-3.5 py-1.5 text-sm font-medium transition hover:border-paper hover:bg-paper hover:text-ink">
                  <span className={`size-2 rounded-full ${CATEGORY_STYLE[k].dot}`} />
                  {CATEGORIES[k].label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Latest。ヒーロー直下に置き、ファーストビューで記事が見えるようにする */}
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-8 sm:pb-20 sm:pt-10">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">新着</h2>
          <Link href="/articles" className="text-sm font-semibold underline decoration-accent decoration-2 underline-offset-4">
            すべての記事（{articles.length}）
          </Link>
        </div>
        <ArticleList articles={articles.slice(0, ARTICLES_PER_PAGE)} featuredFirst />
      </section>

      {/* 用語の解説。定義クエリ（「SEO対策とは」「GEOとは」）の受け皿へトップから直接リンクする */}
      <section className="mx-auto max-w-6xl px-5 pb-16 sm:pb-20">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-mute">Guides · 用語の解説</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {GUIDE_LIST.map((g) => (
            <Link
              key={g.path}
              href={g.path}
              className="group rounded-3xl border border-ink/10 p-7 transition hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)] dark:border-paper/10"
            >
              <span className={`mb-4 inline-block size-2.5 rounded-full ${CATEGORY_STYLE[g.category].dot}`} />
              <p className="text-2xl font-bold tracking-tight">
                {g.h1} <span className="inline-block transition group-hover:translate-x-1">→</span>
              </p>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-mute">{g.definition}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Tags */}
      {tags.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-mute">Topics</h2>
          <ul className="flex flex-wrap gap-2">
            {tags.map(({ tag, count }) => (
              <li key={tag}>
                <Link href={`/tag/${encodeURIComponent(tag)}`} className="inline-block rounded-full border border-ink/15 px-3 py-1.5 text-sm transition hover:bg-ink hover:text-paper dark:border-paper/15 dark:hover:bg-paper dark:hover:text-ink">
                  {tag} <span className="opacity-50">{count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* About strip */}
      <section className="mx-auto max-w-6xl px-5 pb-8">
        <div className="rounded-3xl bg-accent p-8 text-accent-ink sm:p-12">
          <p className="text-xs font-bold uppercase tracking-wider opacity-70">How this is made</p>
          <p className="mt-3 max-w-3xl text-xl font-bold leading-snug sm:text-2xl">
            公式発表と一次情報をAIで毎日収集し、出典URLの記載と構成を自動検査したうえで、リンク付きで公開しています。
          </p>
          <Link href="/about" className="mt-6 inline-block rounded-full bg-accent-ink px-5 py-2.5 text-sm font-semibold text-accent transition hover:opacity-80">
            {SITE_NAME}について →
          </Link>
        </div>
      </section>
    </>
  );
}
