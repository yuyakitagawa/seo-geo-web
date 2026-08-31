import Link from "next/link";
import ArticleList from "@/components/ArticleList";
import { PageDatesJsonLd } from "@/components/PageDates";
import { getAllArticles, latestUpdated } from "@/lib/content";
import { GUIDE_LIST } from "@/lib/guides";
import { hubPages } from "@/lib/nav";
import { ARTICLES_PER_PAGE, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { CATEGORY_STYLE } from "@/lib/categoryStyle";
import { CONTAINER, HEADING, LINK, PADDING, SURFACE, cx } from "@/lib/ui";
import { Button, CardLink, Eyebrow } from "@/components/ui";

export default function Home() {
  const articles = getAllArticles();
  // 更新日は「載せている記事の最新更新日」。ビルド時刻を使うと、記事が増えていない日も更新扱いになる。
  const updated = latestUpdated(articles);

  return (
    <>
      {updated && <PageDatesJsonLd path="/" name={SITE_NAME} description={SITE_DESCRIPTION} updated={updated} />}
      {/* Hero。ファーストビューに記事を入れるため高さを抑え、1バンドに収める */}
      <section className="relative overflow-hidden bg-ink text-paper">
        <div className="bg-grid absolute inset-0 opacity-50" />
        <div className="pointer-events-none absolute -right-32 -top-40 size-[28rem] rounded-full bg-accent/25 blur-[120px] animate-float" />
        <div className={cx(CONTAINER.page, "relative py-6 sm:py-10")}>
          <div className="animate-rise">
            <p className="mb-3 inline-flex items-center gap-2 text-2xs font-medium uppercase tracking-[0.2em] text-paper/60">
              <span className="size-1.5 rounded-full bg-accent" /> 毎朝更新 · SEO &amp; GEO
            </p>
            <h1 className="text-[clamp(1.5rem,3.6vw,2.25rem)] font-bold leading-tight tracking-tight">
              SEO・AI対策の「今」に<span className="text-accent">追いつける</span>
            </h1>
            <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-relaxed text-paper/60 sm:line-clamp-none">
              Google検索・AI Overview・ChatGPT・Perplexity。公式発表と海外ソースを毎朝巡回し、SEO/GEO担当が今日おさえるべき点だけを日本語で整理します。
            </p>
          </div>
        </div>
      </section>

      {/* Latest。ヒーロー直下に置き、ファーストビューで記事が見えるようにする */}
      <section className={cx(CONTAINER.page, "pb-16 pt-8 sm:pb-20 sm:pt-10")}>
        <div className="mb-5 flex items-end justify-between">
          <h2 className={cx(HEADING.section, "sm:text-3xl")}>新着</h2>
          <Link href="/news" className={cx(LINK, "text-sm font-semibold")}>
            すべての記事（{articles.length}）
          </Link>
        </div>
        <ArticleList articles={articles.slice(0, ARTICLES_PER_PAGE)} featuredFirst />
      </section>

      {/* 用語の解説。定義クエリ（「SEO対策とは」「GEO対策とは」）の受け皿と、その先の教科書・ツールへトップから直接リンクする */}
      <section className={cx(CONTAINER.page, "pb-16 sm:pb-20")}>
        <h2 className={cx(HEADING.label, "mb-6")}>Guides · 解説・教科書・ツール</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {GUIDE_LIST.map((g) => (
            <CardLink key={g.path} href={g.path}>
              <span className={`mb-4 inline-block size-2.5 rounded-full ${CATEGORY_STYLE[g.category].dot}`} />
              <p className={cx(HEADING.section, "text-2xl")}>
                {g.h1} <span className="inline-block transition group-hover:translate-x-1">→</span>
              </p>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-mute">{g.definition}</p>
            </CardLink>
          ))}
        </div>
        {/* 解説を読んだ人の次の行き先。体系（教科書）と実務（ツール）へ。文言は nav.ts と共通 */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {hubPages(["/learn", "/tools"]).map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="group rounded-3xl border border-ink/10 p-5 transition hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)] dark:border-paper/10"
            >
              <p className="font-bold tracking-tight">
                {p.label} <span className="inline-block transition group-hover:translate-x-1">→</span>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-mute">{p.note}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* About strip */}
      <section className={cx(CONTAINER.page, "pb-8")}>
        <div className={cx(SURFACE.accent, PADDING.hero)}>
          <Eyebrow tone="faint">How this is made</Eyebrow>
          <p className="mt-3 max-w-3xl text-xl font-bold leading-snug sm:text-2xl">
            公式発表と一次情報をAIで毎日収集し、出典URLの記載と構成を自動検査したうえで、リンク付きで公開しています。
          </p>
          <Button href="/about" variant="onAccent" className="mt-6">
            {SITE_NAME}について →
          </Button>
        </div>
      </section>
    </>
  );
}
