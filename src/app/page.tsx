import Link from "next/link";
import ArticleList from "@/components/ArticleList";
import { getAllArticles, getAllTags } from "@/lib/content";
import { ARTICLES_PER_PAGE, CATEGORIES, CATEGORY_KEYS, SITE_NAME } from "@/lib/site";
import { CATEGORY_STYLE } from "@/lib/categoryStyle";

export default function Home() {
  const articles = getAllArticles();
  const tags = getAllTags().slice(0, 16);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-paper">
        <div className="bg-grid absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute -left-32 top-10 size-[32rem] rounded-full bg-accent/30 blur-[120px] animate-float" />
        <div className="pointer-events-none absolute -right-40 -bottom-40 size-[36rem] rounded-full bg-geo/30 blur-[140px] animate-float [animation-delay:-4s]" />
        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-24 sm:pb-28 sm:pt-32">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-paper/20 px-3 py-1 text-xs font-medium tracking-wider uppercase animate-rise">
            <span className="size-1.5 rounded-full bg-accent" /> Daily updates on search & AI
          </p>
          <h1 className="text-[clamp(2.6rem,8vw,6.5rem)] font-bold leading-[0.95] tracking-tighter animate-rise [animation-delay:80ms]">
            検索は、<br />
            <span className="text-accent">毎日</span>変わる。
          </h1>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-paper/70 sm:text-lg animate-rise [animation-delay:160ms]">
            Google検索・AI Overview・ChatGPT・Perplexity。検索プロダクトを作っていた側の視点で、
            今日のアップデートが「あなたのサイトに何をもたらすか」まで解説します。
          </p>
          <ul className="mt-10 flex flex-wrap gap-2 animate-rise [animation-delay:240ms]">
            {CATEGORY_KEYS.map((k) => (
              <li key={k}>
                <Link href={`/category/${k}`} className="group inline-flex items-center gap-2 rounded-full border border-paper/20 px-4 py-2 text-sm font-medium transition hover:border-paper hover:bg-paper hover:text-ink">
                  <span className={`size-2 rounded-full ${CATEGORY_STYLE[k].dot}`} />
                  {CATEGORIES[k].label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Latest */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">新着</h2>
          <Link href="/articles" className="text-sm font-semibold underline decoration-accent decoration-2 underline-offset-4">
            すべての記事（{articles.length}）
          </Link>
        </div>
        <ArticleList articles={articles.slice(0, ARTICLES_PER_PAGE)} featuredFirst />
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
          <p className="text-xs font-bold uppercase tracking-wider opacity-70">Who writes this</p>
          <p className="mt-3 max-w-3xl text-xl font-bold leading-snug sm:text-2xl">
            大手検索サービスと大規模予約サービスでプロダクトマネージャーをしていた運営者が、一次情報をAIで毎日収集し、人間が確認して公開しています。
          </p>
          <Link href="/about" className="mt-6 inline-block rounded-full bg-accent-ink px-5 py-2.5 text-sm font-semibold text-accent transition hover:opacity-80">
            {SITE_NAME}について →
          </Link>
        </div>
      </section>
    </>
  );
}
