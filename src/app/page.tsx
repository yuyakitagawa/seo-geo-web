import type { Metadata } from "next";
import Link from "next/link";
import ArticleList from "@/components/ArticleList";
import { PageDatesJsonLd } from "@/components/PageDates";
import { getAllArticles, latestUpdated } from "@/lib/content";
import { GUIDE_LIST } from "@/lib/guides";
import { hubPages } from "@/lib/nav";
import { ARTICLES_PER_PAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { CATEGORY_STYLE } from "@/lib/categoryStyle";
import { CONTAINER, HEADING, LINK, PADDING, SURFACE, cx } from "@/lib/ui";
import { Button, CardLink, Eyebrow } from "@/components/ui";

// トップの og:url。layout の openGraph から url を外したので、ここで名乗る。
export const metadata: Metadata = {
  openGraph: { url: SITE_URL },
};

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
      <section id="latest" className={cx(CONTAINER.page, "scroll-mt-24 pb-20 pt-14 sm:pb-28 sm:pt-20")}>
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className={cx(HEADING.label, "mb-2 text-accent")}>Latest briefings</p>
            <h2 className={cx(HEADING.section, "text-3xl sm:text-4xl")}>今日、読むべきこと</h2>
          </div>
          <Link href="/news" className={cx(LINK, "text-sm font-semibold")}>
            すべての記事（{articles.length}）
          </Link>
        </div>
        <ArticleList articles={articles.slice(0, ARTICLES_PER_PAGE)} featuredFirst />
      </section>

      {/* 用語の解説。定義クエリ（「SEO対策とは」「GEO対策とは」）の受け皿と、その先の教科書・ツールへトップから直接リンクする */}
      <section className={cx(CONTAINER.page, "pb-20 sm:pb-28")}>
        <div className="mb-8 max-w-2xl">
          <p className={cx(HEADING.label, "mb-2 text-accent")}>Start where you are</p>
          <h2 className={cx(HEADING.section, "text-3xl sm:text-4xl")}>知る、試す、深める。</h2>
          <p className="mt-3 text-sm leading-relaxed text-mute sm:text-base">気になるテーマから入っても、仕事で使えるところまで迷わず進めるように設計しています。</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {GUIDE_LIST.map((g) => (
            <CardLink key={g.path} href={g.path}>
              <span className={`mb-5 inline-block size-2.5 rounded-full ${CATEGORY_STYLE[g.category].dot} shadow-[0_0_18px_currentColor]`} />
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
      <section className={cx(CONTAINER.page, "pb-10")}>
        <div className={cx(SURFACE.accent, PADDING.hero, "relative overflow-hidden")}>
          <div className="pointer-events-none absolute -right-20 -top-28 size-72 rounded-full border-[28px] border-accent-ink/10" aria-hidden />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <Eyebrow tone="faint">Why trust this</Eyebrow>
              <p className="mt-3 max-w-3xl text-2xl font-bold leading-snug tracking-tight sm:text-3xl">
                速さより、確かさ。<br />一次情報まで、ちゃんとたどれる。
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-accent-ink/75">公式発表と海外ソースをAIで毎日収集し、出典URLと構成を検査して公開。情報の判断を、少しだけ速くします。</p>
            </div>
            <Button href="/about" variant="onAccent" className="w-fit">
              編集方針を見る →
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
