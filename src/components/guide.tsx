import type { ReactNode } from "react";
import { COURSE, LESSONS, lessonNo, lessonPath, requireLesson } from "@/lib/curriculum";
import type { FaqItem } from "@/lib/faq";
import { jpDate, type Guide } from "@/lib/guides";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { EYEBROW, LINK, PADDING, SURFACE, TABLE, cx } from "@/lib/ui";
import { Card, CardLink, Eyebrow } from "./ui";

// /seo・/geo の解説ページで使う部品。
// AI検索は「見出し → 直答の1段落 → 表や箇条書き」という並びのパッセージを抜き出すため、
// セクションは必ず h2 + 直答段落から始められる形にしている。

/** 定義パネル。ページ冒頭に置く「〜とは」への直答1文＋要点3つ */
export function GuideAnswer({ guide }: { guide: Guide }) {
  return (
    <section aria-label="定義と要点" className="not-prose -mt-8 mb-14">
      <Card padding="roomy" className="shadow-panel">
        <Eyebrow>Definition · 1行でいうと</Eyebrow>
        <p className="mt-4 text-lg font-bold leading-relaxed tracking-tight sm:text-2xl">{guide.definition}</p>
        <ol className="mt-7 space-y-3 border-t border-line pt-6">
          {guide.summary.map((s, i) => (
            <li key={s} className="flex gap-4 text-sm leading-relaxed sm:text-base">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-invert text-xs font-bold text-invert-fg">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </Card>
    </section>
  );
}

/** 目次。ページ内の h2 と id を1つの配列から出す */
export function GuideToc({ items }: { items: { id: string; label: string }[] }) {
  return (
    <nav aria-label="目次" className="not-prose mb-14">
      <Eyebrow className="mb-3">Contents</Eyebrow>
      <ol className="grid gap-2 sm:grid-cols-2">
        {items.map((t, i) => (
          <li key={t.id}>
            <a href={`#${t.id}`} className="flex gap-3 rounded-panel border border-line px-4 py-3 text-sm transition hover:bg-invert hover:text-invert-fg">
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
      <div className={TABLE.frame}>
        <table className={cx(TABLE.table, "min-w-[640px]")}>
          <thead className={TABLE.head}>
            <tr>{head.map((h) => <th key={h} className={cx(TABLE.headCell, "font-bold")}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={TABLE.row}>
                {r.map((cell, j) => (
                  <td key={j} className={cx(TABLE.cell, "leading-relaxed", j === 0 ? "font-semibold" : "text-mute")}>{cell}</td>
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
 * 点検チェックリスト。1項目につき「確認すること・どこで見るか・合格の条件・崩れていたときの動き」を
 * まとめて置く。読者がその場で自分のサイトを開いて確認できるように、判断基準まで書ける形にしている。
 */
export function GuideChecklist({
  title,
  cadence,
  items,
  caption,
}: {
  title: string;
  /** 「週に1回・5分」のような頻度。無ければ出さない */
  cadence?: string;
  items: { check: string; where: string; ok: string; ng: ReactNode }[];
  caption?: ReactNode;
}) {
  return (
    <figure className="not-prose my-8">
      <div className={cx(SURFACE.outline, "overflow-hidden")}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-fill px-6 py-4">
          <h3 className="text-sm font-bold tracking-tight sm:text-base">{title}</h3>
          {cadence && <span className="text-xs font-bold uppercase tracking-[0.2em] text-mute">{cadence}</span>}
        </div>
        <ul className="divide-y divide-line">
          {items.map((it) => (
            <li key={it.check} className="flex gap-4 px-6 py-5">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border-2 border-line-strong text-xs" aria-hidden>
                ✓
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-relaxed sm:text-base">{it.check}</p>
                <dl className="mt-3 grid gap-3 text-xs leading-relaxed sm:grid-cols-3">
                  <div>
                    <dt className="font-bold uppercase tracking-[0.2em] text-mute">見る場所</dt>
                    <dd className="mt-1">{it.where}</dd>
                  </div>
                  <div>
                    <dt className="font-bold uppercase tracking-[0.2em] text-mute">合格の条件</dt>
                    <dd className="mt-1">{it.ok}</dd>
                  </div>
                  <div>
                    <dt className="font-bold uppercase tracking-[0.2em] text-mute">崩れていたら</dt>
                    <dd className="mt-1 text-mute">{it.ng}</dd>
                  </div>
                </dl>
              </div>
            </li>
          ))}
        </ul>
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
      className={cx(LINK, "ml-0.5 break-all text-[0.75em] font-bold text-mute hover:text-fg")}
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
    <section className={cx(SURFACE.outline, PADDING.tight, "not-prose mt-12 text-sm")}>
      <h2 className={cx(EYEBROW.mute, "mb-3")}>Sources · 一次情報</h2>
      <ul className="space-y-2">
        {sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener" className={LINK}>{s.title}</a>
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
    <section className={cx(SURFACE.invert, PADDING.card, "not-prose mt-6 text-sm")}>
      <h2 className={EYEBROW.faint}>Cite this page · このページを引用する</h2>
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
      <CardLink href={lessonPath(lesson.slug)} tone="accent">
        <Eyebrow tone="faint">
          Learn · {COURSE.h1} Lesson {lessonNo(lesson.slug)} / {LESSONS.length} · 約{lesson.minutes}分
        </Eyebrow>
        <p className="mt-3 text-lg font-bold leading-snug tracking-tight sm:text-xl">
          {lesson.h1} <span className="inline-block transition group-hover:translate-x-1">→</span>
        </p>
        <p className="mt-3 text-sm leading-relaxed opacity-80">{lead}</p>
      </CardLink>
    </aside>
  );
}

/** もう一方の解説ページ・関連する一覧への導線 */
export function GuideCrossLinks({ links }: { links: { href: string; label: string; note: string }[] }) {
  return (
    <nav aria-label="関連ページ" className="not-prose mt-6 grid gap-4 sm:grid-cols-2">
      {links.map((l) => (
        <CardLink key={l.href} href={l.href}>
          <p className="text-lg font-bold tracking-tight">
            {l.label} <span className="inline-block transition group-hover:translate-x-1">→</span>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-mute">{l.note}</p>
        </CardLink>
      ))}
    </nav>
  );
}
