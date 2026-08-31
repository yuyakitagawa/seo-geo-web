import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import PageHeader from "@/components/PageHeader";
import PromptFit from "@/components/PromptFit";
import { faqPageJsonLd, type FaqItem } from "@/lib/faq";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { CONTAINER, HEADING, LINK, PADDING, SURFACE, cx } from "@/lib/ui";

const PATH = "/tools/prompt-fit";
const url = `${SITE_URL}${PATH}`;
const TITLE = "プロンプト適合度チェッカー（狙った質問にページが答えているか）";
const DESCRIPTION =
  "AI検索で狙っているプロンプトを最大5本入れると、ページのどの見出しがその質問に答えているか、どの語が本文に足りないか、何を書き足せばいいかを返します。公開前の原稿でも判定できます。無料・登録不要。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
};

const STEPS = [
  {
    title: "本文を見出し単位のブロックに分ける",
    body: "h1〜h4で区切り、各ブロックの本文・表・番号付きリストの有無を取ります。AI検索は「ページ全体」ではなく、質問に答えている箇所を切り出して引用するためです。",
  },
  {
    title: "プロンプトとブロックの距離を測る",
    body: "日本語を形態素解析なしで扱うため、文字bigram（英数字は単語）でベクトル化し、TF-IDFのコサイン類似度でブロックを順位づけします。最も近いブロックが、そのプロンプトを担当している箇所です。",
  },
  {
    title: "語の一致・直答・形式を見る",
    body: "プロンプトの語が本文に出てくるか、担当ブロックの先頭に結論の1文があるか、質問の意図（定義・手順・比較・費用・事例・判断）に合った形式（番号付きリスト・表・金額・数値）があるかを判定します。",
  },
  {
    title: "書き足す文の型を出す",
    body: "足りない箇所には、入れる見出し・入れる場所・本文に入れる語・意図に合った文の型を返します。文章そのものは書きません（事実はあなたの一次情報から書いてください）。",
  },
];

const FAQ: FaqItem[] = [
  {
    question: "「ベクトル」とは何を計算していますか",
    answer:
      "本文とプロンプトを、文字2文字の並び（英数字は単語）の出現頻度に変換したベクトルです。TF-IDFで重み付けし、コサイン類似度で近さを測ります。大規模言語モデルの埋め込み（エンベディング）ではありません。外部のAIには一切送らず、計算はすべてサーバー内で完結します。",
  },
  {
    question: "LLMの埋め込みを使った判定と何が違いますか",
    answer:
      "埋め込みは言い換えを含む意味の近さを捉えられますが、この判定は語の重なりを見ています。そのため「言い換えているだけで意味は合っている」場合も「語が足りない」と出ます。AI検索では質問に使われた語がページにそのまま書かれているかが引用の手がかりになるため、この指摘は実務上そのまま直す価値があります。",
  },
  {
    question: "適合度が100なら引用されますか",
    answer:
      "されません。この判定が見ているのは、狙った質問に対してページの中身が噛み合っているかだけです。実際に引用されるかは、サイト全体の評価、一次情報の有無、競合ページの内容で決まります。",
  },
  {
    question: "公開前の原稿でも使えますか",
    answer:
      "使えます。「原稿を貼り付け」に切り替えると、Markdownの見出し（#）をそのまま見出しとして読みます。公開してから直すより、書いている途中で見出しの割り当てを決めるほうが手戻りがありません。",
  },
  {
    question: "入力した原稿やプロンプトは保存されますか",
    answer:
      "保存していません。判定のあいだメモリ上で処理するだけで、サーバーには残しません。連続実行を防ぐための一時的な回数制限だけを行っています。",
  },
];

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": `${url}#app`,
  name: TITLE,
  url,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  browserRequirements: "JavaScriptが有効なブラウザ",
  description: DESCRIPTION,
  offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
  isAccessibleForFree: true,
  publisher: { "@id": `${SITE_URL}/#organization` },
};

export default function PromptFitToolPage() {
  return (
    <>
      <JsonLd data={softwareJsonLd} />
      <JsonLd data={faqPageJsonLd(url, FAQ)} />
      <PageHeader
        eyebrow="Tool · 無料・登録不要"
        title={TITLE}
        lead="狙っているプロンプトを並べると、ページのどの見出しがその質問を担当しているか、何が足りないかを返します。"
        crumbs={[{ name: "ツール", href: "/tools" }, { name: "プロンプト適合度" }]}
      />

      <div className={cx(CONTAINER.wide, "space-y-14 py-14 sm:py-20")}>
        <p className="leading-relaxed text-mute">
          AI検索は、ページ全体ではなく質問に答えている箇所を切り出して引用します。
          だから「良い記事を書いたのに引用されない」ときの原因は、たいてい内容の質ではなく、
          狙った質問とページの中身がずれていること、または答えが見出しの下に埋もれていることです。
          このツールは、狙っているプロンプトとページの中身の距離を測り、どのブロックを直すかを返します。
        </p>

        <PromptFit />

        <section>
          <h2 className={HEADING.section}>判定の手順</h2>
          <ol className="mt-4 space-y-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className={cx(SURFACE.outline, PADDING.tight)}>
                <p className="font-bold">
                  <span className="mr-2 font-mono text-mute">{i + 1}</span>
                  {s.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-mute">{s.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-mute">
            title・構造化データ・robots.txt など、ページが読める状態かどうかは
            <Link href="/tools/page-audit" className={LINK}>
              SEO/GEO ページ診断
            </Link>
            が担当します。こちらは「何が書かれているか」だけを見ます。
          </p>
        </section>

        <section className="space-y-4">
          <h2 className={HEADING.section}>よくある質問</h2>
          <dl className="space-y-5">
            {FAQ.map((f) => (
              <div key={f.question} className={cx(SURFACE.outline, PADDING.tight)}>
                <dt className="font-bold leading-snug">{f.question}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-mute">{f.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="text-xs text-mute">
          {SITE_NAME}は判定結果の正確性・完全性を保証しません。適合度は語の重なりに基づく機械的な指標で、順位や引用を約束するものではありません。
        </p>
      </div>
    </>
  );
}
