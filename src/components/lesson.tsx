import Link from "next/link";
import type { ReactNode } from "react";
import JsonLd from "./JsonLd";
import PageHeader from "./PageHeader";
import { GuideFaq, GuideSources, GuideToc } from "./guide";
import type { Case } from "@/lib/cases";
import { CASE_AREAS } from "@/lib/cases";
import { COURSE, LESSONS, LEVELS, type Lesson, lessonJsonLd, lessonNeighbors, lessonPath } from "@/lib/curriculum";
import { faqPageJsonLd } from "@/lib/faq";
import { SITE_URL } from "@/lib/site";

// /learn のレッスンページ共通の枠。各ページは「目次(TOC)」と「本文」だけを書けば、
// 到達目標パネル・現在位置・チェックリスト・FAQ・出典・前後ナビが同じ並びで付く。
// レッスンの見出し構成を全ページでそろえるのは、AI検索が
// 「見出し → 直答の段落 → 表や箇条書き」というまとまりで抜き出すため。

const TONE_BAR = { accent: "bg-accent", seo: "bg-seo", geo: "bg-geo", news: "bg-news" } as const;
const TONE_TEXT = { accent: "text-accent", seo: "text-seo", geo: "text-geo", news: "text-news" } as const;

/** カリキュラム内の現在位置。10レッスンをドットで並べ、いま何番目かを示す */
export function LessonRail({ current }: { current: number }) {
  return (
    <nav aria-label="カリキュラムの現在位置" className="not-prose mb-10">
      <ol className="flex flex-wrap items-center gap-1.5">
        {LESSONS.map((l) => {
          const done = l.order < current;
          const here = l.order === current;
          return (
            <li key={l.slug}>
              <Link
                href={lessonPath(l.slug)}
                aria-current={here ? "step" : undefined}
                title={`${l.order}. ${l.title}`}
                className={`flex size-8 items-center justify-center rounded-lg text-xs font-bold tabular-nums transition ${
                  here
                    ? "bg-accent text-ink"
                    : done
                      ? "bg-ink/10 text-ink dark:bg-paper/15 dark:text-paper"
                      : "border border-ink/10 text-mute hover:border-ink/40 dark:border-paper/10 dark:hover:border-paper/40"
                }`}
              >
                {l.order}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** 到達目標パネル。「このレッスンを終えると何ができるか」を1文で先に出す */
export function LessonGoal({ lesson }: { lesson: Lesson }) {
  const level = LEVELS[lesson.level];
  return (
    <section aria-label="このレッスンの到達目標" className="not-prose -mt-4 mb-12">
      <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-[0_30px_60px_-40px_rgba(0,0,0,0.4)] dark:border-paper/10 dark:bg-white/5 sm:p-9">
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-mute">
          <span className={`inline-flex items-center gap-2 ${TONE_TEXT[level.tone]}`}>
            <span className={`inline-block size-2 rounded-full ${TONE_BAR[level.tone]}`} />
            {level.label}
          </span>
          <span aria-hidden>·</span>
          <span>Lesson {String(lesson.order).padStart(2, "0")} / {LESSONS.length}</span>
          <span aria-hidden>·</span>
          <span>約{lesson.minutes}分</span>
        </div>
        <p className="mt-4 text-lg font-bold leading-relaxed tracking-tight sm:text-2xl">{lesson.goal}</p>
        <div className="mt-7 border-t border-ink/10 pt-6 dark:border-paper/10">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-mute">このレッスンで扱うこと</p>
          <ul className="space-y-2.5">
            {lesson.objectives.map((o) => (
              <li key={o} className="flex gap-3 text-sm leading-relaxed sm:text-base">
                <span className={`mt-2 inline-block size-1.5 shrink-0 rounded-full ${TONE_BAR[level.tone]}`} />
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** 到達チェックリスト。読者が自分のサイトで確認する項目 */
export function LessonChecklist({ items }: { items: string[] }) {
  return (
    <div className="not-prose my-8 rounded-3xl border border-ink/10 p-6 dark:border-paper/10 sm:p-8">
      <ul className="space-y-4">
        {items.map((c) => (
          <li key={c} className="flex gap-4 text-sm leading-relaxed sm:text-base">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border-2 border-ink/25 text-xs dark:border-paper/25" aria-hidden>
              ✓
            </span>
            <span>{c}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * 実例カード。「実施したこと」と「報告された数値」を必ずセットで出し、出典へ直接リンクする。
 * 数値は各社の環境での結果なので、同じ施策で同じ結果が出るという読み方を防ぐ注記を末尾に固定で付ける。
 */
export function CaseList({ cases, note }: { cases: Case[]; note?: ReactNode }) {
  return (
    <div className="not-prose my-10 space-y-5">
      {cases.map((c) => {
        const area = CASE_AREAS[c.area];
        return (
          <article key={c.id} className="overflow-hidden rounded-3xl border border-ink/10 dark:border-paper/10">
            <div className={`h-1.5 ${TONE_BAR[area.tone]}`} />
            <div className="p-6 sm:p-8">
              <p className={`text-xs font-bold uppercase tracking-[0.2em] ${TONE_TEXT[area.tone]}`}>{area.label}</p>
              <h3 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">{c.site}</h3>
              <p className="mt-1 text-sm text-mute">{c.sector}</p>

              <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_1fr]">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-mute">やったこと</p>
                  <p className="text-sm leading-relaxed">{c.did}</p>
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-mute">報告された結果</p>
                  <ul className="space-y-2">
                    {c.results.map((r) => (
                      <li key={r} className="flex gap-2.5 text-sm leading-relaxed">
                        <span className={`mt-2 inline-block size-1.5 shrink-0 rounded-full ${TONE_BAR[area.tone]}`} />
                        <span className="font-semibold">{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <p className="mt-6 border-t border-ink/10 pt-4 text-xs leading-relaxed text-mute dark:border-paper/10">
                出典:{" "}
                <a href={c.source.url} target="_blank" rel="noopener" className="underline decoration-accent decoration-2 underline-offset-4">
                  {c.source.title}
                </a>
                （{c.source.publisher}）
              </p>
            </div>
          </article>
        );
      })}
      <p className="text-xs leading-relaxed text-mute">
        {note ?? "数値は各社の環境・時期・同時に実施した他の施策を含んだ結果です。同じ施策で同じ結果が出ることを示すものではありません。"}
      </p>
    </div>
  );
}

/** 前後のレッスン。最後のレッスンでは目次へ戻す */
export function LessonNav({ slug }: { slug: string }) {
  const { prev, next } = lessonNeighbors(slug);
  return (
    <nav aria-label="前後のレッスン" className="not-prose mt-6 grid gap-4 sm:grid-cols-2">
      {prev ? (
        <Link href={lessonPath(prev.slug)} className="group rounded-3xl border border-ink/10 p-6 transition hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)] dark:border-paper/10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-mute">← 前のレッスン {String(prev.order).padStart(2, "0")}</p>
          <p className="mt-2 text-lg font-bold tracking-tight">{prev.title}</p>
          <p className="mt-2 text-sm leading-relaxed text-mute">{prev.goal}</p>
        </Link>
      ) : (
        <Link href={COURSE.path} className="group rounded-3xl border border-ink/10 p-6 transition hover:-translate-y-1 dark:border-paper/10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-mute">← カリキュラム</p>
          <p className="mt-2 text-lg font-bold tracking-tight">{COURSE.h1}</p>
          <p className="mt-2 text-sm leading-relaxed text-mute">10レッスン全体の地図に戻る。</p>
        </Link>
      )}
      {next ? (
        <Link href={lessonPath(next.slug)} className="group rounded-3xl border border-ink/10 bg-ink p-6 text-paper transition hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)] dark:bg-paper dark:text-ink">
          <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-60">次のレッスン {String(next.order).padStart(2, "0")} →</p>
          <p className="mt-2 text-lg font-bold tracking-tight">{next.title}</p>
          <p className="mt-2 text-sm leading-relaxed opacity-70">{next.goal}</p>
        </Link>
      ) : (
        <Link href={COURSE.path} className="group rounded-3xl border border-ink/10 bg-ink p-6 text-paper transition hover:-translate-y-1 dark:bg-paper dark:text-ink">
          <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-60">修了 →</p>
          <p className="mt-2 text-lg font-bold tracking-tight">カリキュラムに戻る</p>
          <p className="mt-2 text-sm leading-relaxed opacity-70">10レッスンを通した。あとは4週間ごとに数値で確認しながら回す。</p>
        </Link>
      )}
    </nav>
  );
}

/**
 * レッスンページの外枠。各ページは toc と本文だけを渡す。
 * チェックリスト・FAQ・出典・前後ナビはここで固定の順番に並べる。
 */
export function LessonShell({ lesson, toc, children }: { lesson: Lesson; toc: { id: string; label: string }[]; children: ReactNode }) {
  const url = `${SITE_URL}${lessonPath(lesson.slug)}`;
  const fullToc = [...toc, { id: "checklist", label: "到達チェックリスト" }, { id: "faq", label: "よくある質問" }];

  return (
    <>
      <JsonLd data={lessonJsonLd(lesson)} />
      <JsonLd data={faqPageJsonLd(url, lesson.faq)} />
      <PageHeader
        eyebrow={`${COURSE.h1} · Lesson ${String(lesson.order).padStart(2, "0")}`}
        title={lesson.h1}
        lead={lesson.description}
        crumbs={[{ name: COURSE.h1, href: COURSE.path }, { name: lesson.title }]}
      />

      <div className="prose prose-neutral mx-auto max-w-3xl px-5 py-14 dark:prose-invert prose-headings:scroll-mt-24 sm:py-20">
        <LessonRail current={lesson.order} />
        <LessonGoal lesson={lesson} />
        <GuideToc items={fullToc} />

        {children}

        <section id="checklist" className="scroll-mt-24">
          <h2>到達チェックリスト</h2>
          <p>
            次の項目を自分のサイトで確認できたら、このレッスンは終わりです。1つでも「まだ」がある場合は、次のレッスンに進む前にそこを埋めてください。
          </p>
          <LessonChecklist items={lesson.checklist} />
        </section>

        <section id="faq" className="scroll-mt-24">
          <h2>よくある質問</h2>
          <GuideFaq items={lesson.faq} />
        </section>

        <GuideSources sources={lesson.sources} />
        <LessonNav slug={lesson.slug} />
      </div>
    </>
  );
}
