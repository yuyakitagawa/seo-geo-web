import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import NextStep from "@/components/NextStep";
import { PageDatesJsonLd } from "@/components/PageDates";
import PageHeader from "@/components/PageHeader";
import SiteReport from "@/components/SiteReport";
import { APP_TOOLS } from "@/lib/apps";
import { AUDIT_LOG_RETENTION_DAYS } from "@/lib/audit-log";
import { faqPageJsonLd, type FaqItem } from "@/lib/faq";
import { siblingPages } from "@/lib/nav";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { MAX_PAGES } from "@/lib/siteCrawl";
import { STAGES } from "@/lib/siteReport";
import { CONTAINER, HEADING, LINK, PADDING, SURFACE, TABLE, cx } from "@/lib/ui";

const PATH = "/tools/site-report";
const url = `${SITE_URL}${PATH}`;
const UPDATED = APP_TOOLS.find((t) => t.path === PATH)!.updated;
const TITLE = "サイト修正提案書（URLを入れるだけ）";
const DESCRIPTION = `サイトのURLを入力すると、代表ページを最大${MAX_PAGES}本取得してSEO・GEOの観点で検査し、指摘を優先度3段に並べた修正提案書にまとめます。1件ごとに原因・直した後の状態・検証指標と時期まで付き、そのままPDFで保存できます。無料・登録不要。`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
};

/** 1件ごとにそろえる6項目。/learn#plan の表と同じ定義 */
const ITEMS: [string, string][] = [
  ["症状", "検査で観測できた事実だけを書く。直す前の状態が残らないと、直ったかどうかを比べられない"],
  ["対象の範囲", "1本のURLか、テンプレート単位か、ホスト全体か。テンプレート由来の指摘を1ページだけ直して終わらせない"],
  ["原因", "サーバー設定・テンプレート・本文のどこに由来するか。同じ症状が別のページで再発しないようにする"],
  ["直した後の状態", "置き換えるコードや文面を、そのまま入れられる形で"],
  ["検証指標と時期", "何がどうなったら直ったと見るか。「対応済み」という記録だけが残らないようにする"],
  ["優先度", "下の3段のどれか。着手順が、見つけた順や直しやすい順にならないようにする"],
];

const FAQ: FaqItem[] = [
  {
    question: "ページ診断とはどう違いますか",
    answer: `ページ診断は1本のURLを詳しく見るツールで、この提案書はサイト全体を見て「何から着手するか」を決めるためのものです。代表ページを最大${MAX_PAGES}本取得し、同じ指摘が複数ページに出たものを1件に束ねて、優先度3段に並べます。title の重複、canonical の指すホストの混在、サイトマップに残った旧URLのように、1ページだけを見ていても分からない指摘はこちらでしか出ません。1件を実際のコードまで詰めるときはページ診断を使ってください。`,
  },
  {
    question: "どのページを検査していますか",
    answer: `robots.txt の Sitemap 行（無ければ /sitemap.xml）からURLを集め、取得できなければ入力されたページの内部リンクから集めます。そこから、入力URLとトップページを必ず入れたうえで、第1階層が散るように最大${MAX_PAGES}本を選びます。同じテンプレートのページを何本取っても同じ指摘しか出ないためです。検査したURLは結果の「検査したページ」に全部出しています。`,
  },
  {
    question: "優先度はどう決めていますか",
    answer:
      "「影響の大きさ」ではなく「他の修正の前提になっているか」で3段に分けています。重複URLやnoindexが残ったまま本文を直しても、その効果は複数のURLに分散します。この分け方と、1件6項目の書式は当サイトの整理で、Googleが示している基準ではありません。",
  },
  {
    question: "1段目はまとめて直してよいのに、2段目からは1件ずつなのはなぜですか",
    answer:
      "検証の仕方が違うためです。1段目の「重複が消えたか」「リダイレクトが1ホップになったか」は観測すれば直接確認できるので、まとめて入れても互いの効果を打ち消しません。2段目からは表示回数やクリック数で効果を測るため、同時に複数を入れるとどれが効いたか分からなくなります。",
  },
  {
    question: "そのまま社外に渡せますか",
    answer:
      "結果の「印刷 / PDFで保存」からブラウザの印刷機能でPDFにできます。印刷ではサイトのヘッダー・フッターと入力フォームを外し、1件の提案が改ページで割れないようにしています。内容は機械的な検査の結果なので、渡す前に事実確認をしてください。",
  },
  {
    question: "検査したURLは保存されますか",
    answer: `入力されたサイトのホスト名とパス（例: example.com/）と、提案の件数を${AUDIT_LOG_RETENTION_DAYS}日間だけ記録しています。どんなサイトが検査されているかを把握し、扱う記事の題材を選ぶために使う目的で、公開はしません。URLのクエリ文字列（? 以降）、実行した方のIPアドレス・ブラウザの情報は保存していません。${AUDIT_LOG_RETENTION_DAYS}日を過ぎた記録は自動的に削除されます。`,
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

export default function SiteReportToolPage() {
  return (
    <>
      <JsonLd data={softwareJsonLd} />
      <JsonLd data={faqPageJsonLd(url, FAQ)} />
      <PageDatesJsonLd path={PATH} name={TITLE} description={DESCRIPTION} updated={UPDATED} />
      <PageHeader
        eyebrow="Tool · 無料・登録不要"
        title={TITLE}
        lead="サイトのURLを入れると、代表ページを検査して「何から直すか」を優先度つきで並べた提案書にまとめます。"
        crumbs={[{ name: "診断ツール", href: "/tools" }, { name: "サイト修正提案書" }]}
      />

      <div className={cx(CONTAINER.wide, "space-y-14 py-14 sm:py-20")}>
        <p className="leading-relaxed text-mute">
          点検すると、直す候補は数十件単位で出ます。出てきた順に上から直すと、後から「どれが効いたのか」も「本当に直ったのか」も言えなくなります。
          このツールは、サイトの代表ページを取得して検査し、同じ指摘を束ねたうえで、着手順の付いた提案書にして返します。
          点数は出しません。<strong className="text-fg">下の段から片付ければよい状態</strong>にすることが目的です。
        </p>

        <SiteReport />

        <section className="no-print">
          <h2 className={HEADING.section}>提案書の型</h2>
          <p className="mt-3 leading-relaxed text-mute">
            並べ方と書式は、教科書の
            <Link href="/learn#plan" className={LINK}>
              「直す候補が大量に出たときの並べ方」
            </Link>
            と同じです。優先度は「影響の大きさ」ではなく「他の修正の前提になっているか」で3段に分け、下から順に片付けます。
          </p>
          <div className="mt-5 space-y-3">
            {[...STAGES].reverse().map((s) => (
              <div key={s.stage} className={cx(SURFACE.outline, PADDING.tight)}>
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <p className="font-bold">{s.label}</p>
                  <span className="text-sm text-mute">{s.span}</span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-mute">{s.desc}</p>
                <p className="mt-1.5 text-sm leading-relaxed">
                  {s.batch ? "まとめて一度に入れてよい。" : "1件ずつ入れる。"}
                  {s.measure}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 leading-relaxed text-mute">1件につき、次の6項目をそろえます。そのまま着手と検証の単位になります。</p>
          <div className={cx(TABLE.frame, "mt-3")}>
            <table className={TABLE.table}>
              <thead className={TABLE.head}>
                <tr>
                  <th className={TABLE.headCell}>項目</th>
                  <th className={TABLE.headCell}>書く内容</th>
                </tr>
              </thead>
              <tbody>
                {ITEMS.map(([name, body]) => (
                  <tr key={name} className={TABLE.row}>
                    <td className={cx(TABLE.cell, "whitespace-nowrap font-bold")}>{name}</td>
                    <td className={TABLE.cell}>{body}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-mute">
            3段の分け方と1件6項目は当サイトの整理で、Googleが示している基準ではありません。1件ごとの判定そのものは
            <Link href="/tools/page-audit" className={LINK}>
              ページ診断
            </Link>
            と同じ検査を使っており、根拠のある指摘には公式ドキュメントを添えています。
          </p>
        </section>

        <section className="no-print space-y-4">
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

        <p className="no-print text-xs text-mute">
          {SITE_NAME}は診断結果の正確性・完全性を保証しません。判定は公開ドキュメントと論文に基づく一般的な指摘で、順位や引用を約束するものではありません。
        </p>

        <div className="no-print">
          <NextStep links={siblingPages(PATH)} />
        </div>
      </div>
    </>
  );
}
