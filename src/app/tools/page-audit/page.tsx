import type { Metadata } from "next";
import Link from "next/link";
import { lessonNo } from "@/lib/curriculum";
import JsonLd from "@/components/JsonLd";
import PageAudit from "@/components/PageAudit";
import NextStep from "@/components/NextStep";
import { PageDatesJsonLd } from "@/components/PageDates";
import PageHeader from "@/components/PageHeader";
import { faqPageJsonLd, type FaqItem } from "@/lib/faq";
import { APP_TOOLS } from "@/lib/apps";
import { siblingPages } from "@/lib/nav";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { CONTAINER, HEADING, LINK, PADDING, SURFACE, cx } from "@/lib/ui";

const PATH = "/tools/page-audit";
const url = `${SITE_URL}${PATH}`;
const UPDATED = APP_TOOLS.find((t) => t.path === PATH)!.updated;
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
    items: [
      "サーバーが返すHTMLに本文があるか（JS依存の検出）",
      "冒頭の直答文の長さ",
      "質問と回答の形式・FAQPage",
      "原文の引用（GEO論文で最大41%）",
      "具体的な数値（同 約32%）",
      "1文の長さ（同 約29%）",
      "外部の出典リンク（同 約28%）",
      "キーワードの詰め込み（同 効果なし）",
      "公開日・更新日の機械可読性",
      "AI検索クローラー（OAI-SearchBot等）の許可状況",
      "/llms.txt",
    ],
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
    question: "GEOの指摘は何を根拠にしていますか",
    answer:
      "Googleの公開ドキュメントと、生成AIの回答内での可視性を実測した論文「GEO: Generative Engine Optimization」（arXiv:2311.09735、KDD 2024）です。論文は10,000件のクエリで9通りの書き換えを比較し、引用の追加で最大41%、統計の追加で約32%、読みやすさの改善で約29%、出典の明示で約28%可視性が上がり、キーワードの詰め込みはほとんど効かないと報告しています。診断はこの4つが本文にあるかを見ています。ただし論文の測定は特定の生成エンジンと期間のもので、同じ幅の改善を保証するものではありません。",
  },
  {
    question: "検査したURLは保存されますか",
    answer:
      "検査対象ページのホスト名とパス（例: example.com/blog/1）と、判定結果の件数を30日間だけ記録しています。どんなページが検査されているかを把握し、扱う記事の題材を選ぶために使う目的で、公開はしません。URLのクエリ文字列（? 以降）は保存していません。また、検査を実行した方のIPアドレス・ブラウザの情報も保存していません（連続実行を防ぐための一時的な回数制限にだけ使い、記録には残しません）。30日を過ぎた記録は自動的に削除されます。",
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
      <PageDatesJsonLd path={PATH} name={TITLE} description={DESCRIPTION} updated={UPDATED} />
      <PageHeader
        eyebrow="Tool · 無料・登録不要"
        title={TITLE}
        lead="URLを入れると、検索エンジンとAI検索がそのページをどう読むかを検査し、直すべき箇所を該当コードつきで指摘します。"
        crumbs={[{ name: "ツール", href: "/tools" }, { name: "ページ診断" }]}
      />

      <div className={cx(CONTAINER.wide, "space-y-14 py-14 sm:py-20")}>
        <p className="leading-relaxed text-mute">
          このツールは、URLのページをサーバー側で1回取得し、クローラーが最初に受け取るHTMLだけを見て判定します。
          指摘は「該当箇所の実際のコード」「なぜ直すか」「修正後の書き方」の3点で返します。
          点数は出しません。直す順番が分かることを目的にしています。
        </p>

        <PageAudit />

        <section>
          <h2 className={HEADING.section}>検査する項目</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {CHECKS.map((c) => (
              <div key={c.area} className={cx(SURFACE.outline, PADDING.tight)}>
                <p className="font-bold">{c.area}</p>
                <ul className="mt-3 space-y-1.5 text-sm text-mute">
                  {c.items.map((i) => (
                    <li key={i}>・{i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-mute">
            GEO（AI検索）の一部は、生成AIの回答内での可視性を実測した論文{" "}
            <a
              href="https://arxiv.org/abs/2311.09735"
              target="_blank"
              rel="noopener"
              className={LINK}
            >
              GEO: Generative Engine Optimization（arXiv:2311.09735 / KDD 2024）
            </a>
            の測定結果を基準にしています。10,000件のクエリで9通りの書き換えを比較し、引用の追加（最大41%）・統計の追加（約32%）・
            読みやすさの改善（約29%）・出典の明示（約28%）が可視性を上げ、キーワードの詰め込みはほとんど効かないという結果でした。
            この4つが本文にあるかを見て、無ければ入れ方を出します。
          </p>
          <p className="mt-4 text-sm text-mute">
            AIクローラー14種の一覧と、方針別のrobots.txtのひな形は
            <Link href="/learn/geo-implementation#crawlers" className={LINK}>
              レッスン{lessonNo("geo-implementation")}「GEO実装」
            </Link>
            にあります。狙った質問にページの中身が噛み合っているかは
            <Link href="/tools/prompt-fit" className={LINK}>
              プロンプト適合度チェッカー
            </Link>
            が判定します。
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
          {SITE_NAME}は診断結果の正確性・完全性を保証しません。判定は公開ドキュメントと論文に基づく一般的な指摘で、順位や引用を約束するものではありません。
        </p>

        <NextStep links={siblingPages(PATH)} />
      </div>
    </>
  );
}
