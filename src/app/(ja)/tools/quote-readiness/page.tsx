import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import NextStep from "@/components/NextStep";
import PageHeader from "@/components/PageHeader";
import QuoteReadiness from "@/components/QuoteReadiness";
import { PageDatesJsonLd } from "@/components/PageDates";
import { APP_TOOLS } from "@/lib/apps";
import { siblingPages } from "@/lib/nav";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { CONTAINER, HEADING, PADDING, SURFACE, cx } from "@/lib/ui";

const PATH = "/tools/quote-readiness";
const TITLE = "引用しやすさ診断";
const DESCRIPTION = "URLを入力するだけで、見出しごとの本文を切り出し、前の文章に依存せずAIが引用しやすい構造かを無料で診断します。";
const UPDATED = APP_TOOLS.find((tool) => tool.path === PATH)!.updated;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": `${SITE_URL}${PATH}#app`,
  name: TITLE,
  url: `${SITE_URL}${PATH}`,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  browserRequirements: "JavaScriptが有効なブラウザ",
  description: DESCRIPTION,
  offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
  isAccessibleForFree: true,
  publisher: { "@id": `${SITE_URL}/#organization` },
};

const CHECKS = [
  ["冒頭の直接回答", "最初の文が前置きや予告ではなく、質問への答え・定義・結論から始まるかを見ます。AIが短い回答を組み立てるとき、冒頭だけで要点を取得しやすくなるため重要です。"],
  ["文脈からの独立", "「これ」「そのため」「前述」など、前の文章を必要とする始まり方ではないかを見ます。検索結果では段落だけが抜き出されることがあるため、単独でも意味が通る文章が引用に向いています。"],
  ["対象と主張", "誰・何について、何を述べているのかが引用候補内で完結しているかを見ます。対象と主張が揃うと、AIが別の対象の説明と取り違えにくくなります。"],
  ["理由・条件・具体性", "適用条件、例、数値、調査、出典などの手掛かりがあるかを見ます。具体的な限定や根拠があるほど、AIがどの質問・状況で使える情報かを判断しやすくなります。"],
  ["結論を支える理由", "「〜ため」「〜ので」など、結論と理由が同じ引用候補にあるかを見ます。結論だけでなく根拠も一緒に示せる文章は、回答の説明材料として使いやすくなります。"],
  ["引用候補のまとまり", "見出し直後の本文の最初の1〜3文が、長すぎず短すぎない一つの説明になっているかを見ます。AIが前後を補わず、そのまま根拠として扱いやすくするためです。"],
];

export default function QuoteReadinessPage() {
  return (
    <>
      <JsonLd data={softwareJsonLd} />
      <PageDatesJsonLd path={PATH} name={TITLE} description={DESCRIPTION} updated={UPDATED} />
      <PageHeader
        eyebrow="Tool · 無料・登録不要"
        title={TITLE}
        lead="URLを入力するだけで、見出し直後の本文が前後の文脈なしでも引用できる構造かを確認します。"
        crumbs={[{ name: "診断ツール", href: "/tools" }, { name: "引用しやすさ診断" }]}
      />

      <div className={cx(CONTAINER.wide, "space-y-14 py-14 sm:py-20")}>
        <div className={cx(SURFACE.accent, PADDING.card)}>
          <p className="font-bold">この診断が見ないもの</p>
          <p className="mt-2 text-sm leading-relaxed">
            見出しと本文の単語一致率、検索順位、実際にAI検索で引用される確率は測りません。文章を単独で抜き出したときに、対象・主張・理由が残るかだけをルールで確認します。
          </p>
        </div>

        <QuoteReadiness />

        <section>
          <h2 className={HEADING.section}>AI引用で確認する6項目</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {CHECKS.map(([title, detail]) => (
              <div key={title} className={cx(SURFACE.outline, PADDING.tight)}>
                <h3 className={HEADING.card}>{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={cx(SURFACE.outline, PADDING.card)}>
          <h2 className={HEADING.section}>診断結果の読み方</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div><dt className="font-bold">切り出せる</dt><dd className="mt-1 leading-relaxed text-mute">機械的に確認できる範囲で、前置きや文脈依存がなく、対象と主張を含む引用候補があります。</dd></div>
            <div><dt className="font-bold">要確認</dt><dd className="mt-1 leading-relaxed text-mute">明確な欠陥は検出されませんでしたが、理由・条件などの要素が不足しています。</dd></div>
            <div><dt className="font-bold">切り出しにくい</dt><dd className="mt-1 leading-relaxed text-mute">前置き、文脈依存、本文不足のいずれかがあります。×の項目から直してください。</dd></div>
          </dl>
        </section>

        <p className="text-xs leading-relaxed text-mute">
          {SITE_NAME}は診断結果の正確性・完全性を保証しません。日本語の表現をルールで検査するver1であり、文章の事実性や意味の正しさは判定しません。
        </p>

        <NextStep links={siblingPages(PATH)} />
      </div>
    </>
  );
}
