import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import PageAudit from "@/components/PageAudit";
import PageHeader from "@/components/PageHeader";
import { faqPageJsonLd, type FaqItem } from "@/lib/faq";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PATH = "/tools/page-audit";
const url = `${SITE_URL}${PATH}`;
const TITLE = "SEO/GEO ページ診断（URLを入れるだけ）";
const DESCRIPTION =
  "URLを入力すると、title・構造化データ・見出し・robots.txt・AI検索クローラーの許可状況などを検査し、直すべき箇所を実際のコードと修正後の書き方つきで指摘します。無料・登録不要。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
};

const CHECKS = [
  {
    area: "技術",
    items: ["HTTPステータスとリダイレクトの連鎖", "noindex（metaとX-Robots-Tag）", "canonical の有無と絶対URL", "lang / viewport", "robots.txt によるクロール可否", "取得時間とHTMLサイズ"],
  },
  {
    area: "SEO",
    items: ["title の有無と長さ", "meta description の有無と長さ", "h1 の個数", "見出しの階層の飛び", "alt の無い画像", "OGP", "JSON-LD の有無・構文・必須プロパティ"],
  },
  {
    area: "GEO（AI検索）",
    items: ["サーバーが返すHTMLに本文があるか（JS依存の検出）", "冒頭の直答文の長さ", "質問と回答の形式・FAQPage", "外部の出典リンク", "公開日・更新日の機械可読性", "AI検索クローラー（OAI-SearchBot等）の許可状況", "/llms.txt"],
  },
];

const FAQ: FaqItem[] = [
  {
    question: "この診断は何を見ていますか",
    answer:
      "入力されたURLをサーバー側で1回取得し、返ってきたHTMLとレスポンスヘッダー、同じドメインの robots.txt と llms.txt を読んで判定します。ブラウザでJavaScriptを実行した後の状態ではなく、クローラーが最初に受け取る状態を見ています。",
  },
  {
    question: "JavaScriptで本文を描画しているページはどう判定されますか",
    answer:
      "サーバーが返すHTMLに本文が入っていない場合は「本文が少ない」と指摘します。Googleはレンダリングを行いますが、AI検索のクローラーの多くはJavaScriptを実行しないため、引用対象になりにくい状態です。サーバー側で本文を出力する構成に変えるのが修正方針になります。",
  },
  {
    question: "指摘がゼロなら上位に表示されますか",
    answer:
      "されません。この診断が見ているのは、検索エンジンとAIがページを正しく読める状態かという前提条件だけです。順位や引用は、扱う内容そのものと他サイトからの評価で決まります。",
  },
  {
    question: "検査したURLは保存されますか",
    answer:
      "保存していません。入力されたURLはその場の取得にだけ使い、結果もサーバーには残しません。連続実行を防ぐための一時的な回数制限だけを行っています。",
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

export default function PageAuditToolPage() {
  return (
    <>
      <JsonLd data={softwareJsonLd} />
      <JsonLd data={faqPageJsonLd(url, FAQ)} />
      <PageHeader
        eyebrow="Tool · 無料・登録不要"
        title={TITLE}
        lead="URLを入れると、検索エンジンとAI検索がそのページをどう読むかを検査し、直すべき箇所を該当コードつきで指摘します。"
        crumbs={[{ name: "ツール", href: "/tools" }, { name: "ページ診断" }]}
      />

      <div className="mx-auto max-w-4xl space-y-14 px-5 py-14 sm:py-20">
        <p className="leading-relaxed text-mute">
          このツールは、URLのページをサーバー側で1回取得し、クローラーが最初に受け取るHTMLだけを見て判定します。
          指摘は「該当箇所の実際のコード」「なぜ直すか」「修正後の書き方」の3点で返します。
          点数は出しません。直す順番が分かることを目的にしています。
        </p>

        <PageAudit />

        <section>
          <h2 className="text-2xl font-bold tracking-tight">検査する項目</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {CHECKS.map((c) => (
              <div key={c.area} className="rounded-3xl border border-ink/10 p-6 dark:border-paper/10">
                <p className="font-bold">{c.area}</p>
                <ul className="mt-3 space-y-1.5 text-sm text-mute">
                  {c.items.map((i) => (
                    <li key={i}>・{i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-mute">
            AI検索クローラーの設定だけを詳しく見たい場合は、
            <Link href="/tools/ai-crawlers" className="underline decoration-accent decoration-2 underline-offset-4">
              AI検索クローラー robots.txt チェッカー
            </Link>
            を使ってください。狙った質問にページの中身が噛み合っているかは
            <Link href="/tools/prompt-fit" className="underline decoration-accent decoration-2 underline-offset-4">
              プロンプト適合度チェッカー
            </Link>
            が判定します。
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">よくある質問</h2>
          <dl className="space-y-5">
            {FAQ.map((f) => (
              <div key={f.question} className="rounded-3xl border border-ink/10 p-6 dark:border-paper/10">
                <dt className="font-bold leading-snug">{f.question}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-mute">{f.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="text-xs text-mute">
          {SITE_NAME}は診断結果の正確性・完全性を保証しません。判定は公開ドキュメントに基づく一般的な指摘で、順位や引用を約束するものではありません。
        </p>
      </div>
    </>
  );
}
