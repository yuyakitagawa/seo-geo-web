import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import NextStep from "@/components/NextStep";
import PageDates from "@/components/PageDates";
import PageHeader from "@/components/PageHeader";
import {
  GLOSSARY,
  GLOSSARY_CATEGORIES,
  GLOSSARY_CATEGORY_KEYS,
  GLOSSARY_PATH,
  GLOSSARY_PUBLISHED,
  GLOSSARY_UPDATED,
  glossaryJsonLd,
  termsByCategory,
  termsSorted,
} from "@/lib/glossary";
import { siblingPages } from "@/lib/nav";

const TITLE = `SEO・GEO用語集（${GLOSSARY.length}語）`;
const DESCRIPTION =
  "SEOとGEO（生成AI検索最適化）の用語を、1語ずつ1文の定義と一次情報のリンク付きで整理した用語集。クロール・インデックス・構造化データからAI Overview・AIクローラー・llms.txtまで、Google検索セントラルとweb.devの公式ドキュメントを出典にしています。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: GLOSSARY_PATH },
};

export default function GlossaryPage() {
  const sorted = termsSorted();

  return (
    <>
      <JsonLd data={glossaryJsonLd()} />
      <PageHeader
        eyebrow={`Glossary · ${GLOSSARY.length}語`}
        title="SEO・GEO用語集"
        lead="1語につき1文の定義と、その根拠になる公式ドキュメントへのリンクを付けています。定義文はそれだけ読んで意味が通る形にしてあります。"
        crumbs={[{ name: "用語集" }]}
      />

      <div className="mx-auto max-w-4xl px-5 pb-16 pt-12">
        {/* 「SEO用語一覧」のような包括クエリに直答する段落 */}
        <p className="max-w-3xl leading-relaxed text-mute">
          この用語集には、SEOとGEOの実務で出てくる{GLOSSARY.length}語を
          {GLOSSARY_CATEGORY_KEYS.length}分野（{GLOSSARY_CATEGORY_KEYS.map((k) => GLOSSARY_CATEGORIES[k].label).join("・")}）
          に分けて収録しています。出典はGoogle検索セントラル・Search Consoleヘルプ・web.dev・各AI事業者の公式ドキュメントで、
          そこに書かれていない数値や固有名詞は載せていません。
        </p>
        <div className="mb-12 mt-3">
          <PageDates
            path={GLOSSARY_PATH}
            name={TITLE}
            description={DESCRIPTION}
            published={GLOSSARY_PUBLISHED}
            updated={GLOSSARY_UPDATED}
          />
        </div>

        {/* 索引。用語数が増えても目的の語に1タップで飛べるようにする */}
        <nav aria-label="索引" className="mb-16">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-mute">Index</p>
          <ul className="flex flex-wrap gap-2">
            {sorted.map((t) => (
              <li key={t.slug}>
                <a
                  href={`#${t.slug}`}
                  className="inline-block rounded-full border border-ink/15 px-3 py-1.5 text-sm transition hover:bg-ink hover:text-paper dark:border-paper/15 dark:hover:bg-paper dark:hover:text-ink"
                >
                  {t.term}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-16">
          {GLOSSARY_CATEGORY_KEYS.map((key) => {
            const terms = termsByCategory(key);
            if (terms.length === 0) return null;
            return (
              <section key={key} id={key} className="scroll-mt-24">
                <h2 className="text-2xl font-bold tracking-tight">{GLOSSARY_CATEGORIES[key].label}</h2>
                <p className="mb-6 mt-1 text-sm text-mute">{GLOSSARY_CATEGORIES[key].lead}</p>

                {/* 定義リストで出す。AI検索・強調スニペットは <dl> の定義を単位で抜き出す */}
                <dl className="space-y-4">
                  {terms.map((t) => (
                    <div
                      key={t.slug}
                      id={t.slug}
                      className="scroll-mt-24 rounded-3xl border border-ink/10 p-6 dark:border-paper/10"
                    >
                      <dt className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="text-lg font-bold tracking-tight">{t.term}</span>
                        {t.aliases.length > 0 && (
                          <span className="text-xs text-mute">{t.aliases.join(" · ")}</span>
                        )}
                      </dt>
                      <dd className="mt-3">
                        <p className="leading-relaxed">{t.definition}</p>
                        {t.note && <p className="mt-2 text-sm leading-relaxed text-mute">{t.note}</p>}
                        <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                          {t.seeAlso?.map((s) => (
                            <Link
                              key={s.href}
                              href={s.href}
                              className="font-semibold underline decoration-accent decoration-2 underline-offset-4"
                            >
                              {s.label} →
                            </Link>
                          ))}
                          <a
                            href={t.source.url}
                            target="_blank"
                            rel="noopener"
                            className="text-mute underline decoration-ink/20 underline-offset-4 hover:text-ink dark:decoration-paper/20 dark:hover:text-paper"
                          >
                            出典: {t.source.title}（{t.source.publisher}）
                          </a>
                        </p>
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            );
          })}
        </div>

        <NextStep links={siblingPages(GLOSSARY_PATH)} className="mt-20" />
      </div>
    </>
  );
}
