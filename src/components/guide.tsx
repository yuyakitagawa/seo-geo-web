import Link from "next/link";
import type { ReactNode } from "react";
import { COURSE, LESSONS, lessonPath, requireLesson } from "@/lib/curriculum";
import type { FaqItem } from "@/lib/faq";
import { jpDate, type Guide } from "@/lib/guides";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// /seo・/geo の解説ページで使う部品。
// AI検索は「見出し → 直答の1段落 → 表や箇条書き」という並びのパッセージを抜き出すため、
// セクションは必ず h2 + 直答段落から始められる形にしている。

/** 定義パネル。ページ冒頭に置く「〜とは」への直答1文＋要点3つ */
export function GuideAnswer({ guide }: { guide: Guide }) {
  return (
    <section aria-label="定義と要点" className="not-prose -mt-8 mb-14">
      <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-[0_30px_60px_-40px_rgba(0,0,0,0.4)] dark:border-paper/10 dark:bg-white/5 sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-mute">Definition · 1行でいうと</p>
        <p className="mt-4 text-lg font-bold leading-relaxed tracking-tight sm:text-2xl">{guide.definition}</p>
        <ol className="mt-7 space-y-3 border-t border-ink/10 pt-6 dark:border-paper/10">
          {guide.summary.map((s, i) => (
            <li key={s} className="flex gap-4 text-sm leading-relaxed sm:text-base">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-paper dark:bg-paper dark:text-ink">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** 目次。ページ内の h2 と id を1つの配列から出す */
export function GuideToc({ items }: { items: { id: string; label: string }[] }) {
  return (
    <nav aria-label="目次" className="not-prose mb-14">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-mute">Contents</p>
      <ol className="grid gap-2 sm:grid-cols-2">
        {items.map((t, i) => (
          <li key={t.id}>
            <a href={`#${t.id}`} className="flex gap-3 rounded-2xl border border-ink/10 px-4 py-3 text-sm transition hover:bg-ink hover:text-paper dark:border-paper/10 dark:hover:bg-paper dark:hover:text-ink">
              <span className="font-mono text-xs opacity-50">{String(i + 1).padStart(2, "0")}</span>
              {t.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** h2セクション。lead は見出しへの直答1段落 */
export function GuideSection({ id, title, lead, children }: { id: string; title: string; lead?: ReactNode; children?: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2>{title}</h2>
      {lead && <p>{lead}</p>}
      {children}
    </section>
  );
}

/** 表。列幅を指定せず、狭い画面では横スクロールさせる */
export function GuideTable({ head, rows, caption }: { head: string[]; rows: ReactNode[][]; caption?: ReactNode }) {
  return (
    <figure className="not-prose my-8">
      <div className="overflow-x-auto rounded-3xl border border-ink/10 dark:border-paper/10">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-ink/5 text-left text-xs uppercase tracking-wider text-mute dark:bg-paper/5">
            <tr>{head.map((h) => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-ink/10 align-top dark:border-paper/10">
                {r.map((cell, j) => (
                  <td key={j} className={`px-4 py-4 leading-relaxed ${j === 0 ? "font-semibold" : "text-mute"}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption && <figcaption className="mt-3 text-xs text-mute">{caption}</figcaption>}
    </figure>
  );
}

/**
 * 本文中の出典リンク。Googleなどが公式に述べている記述の直後に置き、その一文の一次情報へ直接飛ばす。
 * ページ末尾の GuideSources は一覧、こちらは「どの記述がどの文書由来か」を示すためのもの。
 */
export function GuideRef({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="ml-0.5 break-all text-[0.75em] font-bold text-mute underline decoration-accent decoration-2 underline-offset-4 hover:text-ink dark:hover:text-paper"
    >
      [出典: {label}]
    </a>
  );
}

/** FAQ。可視テキストと FAQPage JSON-LD を同じ配列から出す（src/lib/faq.ts の方針と同じ） */
export function GuideFaq({ items }: { items: FaqItem[] }) {
  return (
    <>
      {items.map((f) => (
        <div key={f.question}>
          <h3>{f.question}</h3>
          <p>{f.answer}</p>
        </div>
      ))}
    </>
  );
}

/** 出典。記事ページと同じ見た目にそろえる */
export function GuideSources({ sources }: { sources: Guide["sources"] }) {
  return (
    <section className="not-prose mt-12 rounded-3xl border border-ink/10 p-6 text-sm dark:border-paper/10">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-mute">Sources · 一次情報</h2>
      <ul className="space-y-2">
        {sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener" className="underline decoration-accent decoration-2 underline-offset-4">{s.title}</a>
            <span className="text-mute">（{s.publisher}）</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * 引用のしかた。出典表記に必要な要素（ページ名・サイト名・URL・更新日）をひとかたまりで置く。
 * AIが回答に出典を添えるとき、この段落をそのまま使えるようにする。
 */
export function GuideCitation({ guide }: { guide: Guide }) {
  const url = `${SITE_URL}${guide.path}`;
  return (
    <section className="not-prose mt-6 rounded-3xl bg-ink p-6 text-sm text-paper dark:bg-paper dark:text-ink sm:p-8">
      <h2 className="text-xs font-bold uppercase tracking-wider opacity-60">Cite this page · このページを引用する</h2>
      <p className="mt-3 leading-relaxed opacity-90">
        このページの内容は、出典を明記すれば引用できます。表記例:「{guide.h1}」{SITE_NAME}、{jpDate(guide.updated)}更新、{url}
      </p>
      <p className="mt-3 text-xs leading-relaxed opacity-60">
        数値・仕様は各社の公式ドキュメントを一次情報にしています。仕様は頻繁に変わるため、判断の前に上記の一次情報で最新の内容を確認してください。
      </p>
    </section>
  );
}

/**
 * 本文の途中に置く教科書（/learn）への導線。
 * 解説ページは定義を読みに来た人が多く、末尾の GuideCrossLinks まで届かないことがあるため、
 * 「読んだ内容を自分のサイトでやる番」になる位置に、該当レッスンを名指しで置く。
 * レッスンの文言は curriculum.ts から引く（同じ文字列を2か所に書かない。slugのtypoはビルドで落ちる）。
 */
export function GuideLessonCta({ slug, lead }: { slug: string; lead: string }) {
  const lesson = requireLesson(slug);
  return (
    <aside aria-label="教科書のレッスンへ" className="not-prose my-12">
      <Link
        href={lessonPath(lesson.slug)}
        className="group block rounded-3xl border border-accent/40 bg-accent/10 p-6 transition hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)] sm:p-8"
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-mute">
          Learn · {COURSE.h1} Lesson {String(lesson.order).padStart(2, "0")} / {LESSONS.length} · 約{lesson.minutes}分
        </p>
        <p className="mt-3 text-lg font-bold leading-snug tracking-tight sm:text-xl">
          {lesson.h1} <span className="inline-block transition group-hover:translate-x-1">→</span>
        </p>
        <p className="mt-3 text-sm leading-relaxed text-mute">{lead}</p>
      </Link>
    </aside>
  );
}

/** もう一方の解説ページ・関連する一覧への導線 */
export function GuideCrossLinks({ links }: { links: { href: string; label: string; note: string }[] }) {
  return (
    <nav aria-label="関連ページ" className="not-prose mt-6 grid gap-4 sm:grid-cols-2">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="group rounded-3xl border border-ink/10 p-6 transition hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)] dark:border-paper/10"
        >
          <p className="text-lg font-bold tracking-tight">
            {l.label} <span className="inline-block transition group-hover:translate-x-1">→</span>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-mute">{l.note}</p>
        </Link>
      ))}
    </nav>
  );
}
