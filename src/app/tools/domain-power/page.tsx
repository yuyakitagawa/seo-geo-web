import type { Metadata } from "next";
import Link from "next/link";
import DomainPower from "@/components/DomainPower";
import JsonLd from "@/components/JsonLd";
import NextStep from "@/components/NextStep";
import PageHeader from "@/components/PageHeader";
import { faqPageJsonLd, type FaqItem } from "@/lib/faq";
import { siblingPages } from "@/lib/nav";
import { SITE_URL } from "@/lib/site";
import { CONTAINER, HEADING, LINK, PADDING, SURFACE, cx } from "@/lib/ui";

const PATH = "/tools/domain-power";
const url = `${SITE_URL}${PATH}`;
const TITLE = "ドメインパワー診断（被リンク元ドメイン数とドメイン年齢）";
const DESCRIPTION =
  "ドメインを入れると、被リンク元ドメイン数・Open PageRank・登録からの年数・有効期限・移管ロックの状態を返します。合成スコアは出さず、公開データの素の数値と、その値に対して何をすべきかだけを表示します。無料・登録不要。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
};

const STEPS = [
  {
    title: "入力から登録ドメインを取り出す",
    body: "URLでもホスト名でも受け取り、登録の単位になるドメイン（blog.example.co.jp なら example.co.jp）に揃えます。被リンクもドメイン年齢も、サブドメインではなく登録ドメイン単位のデータだからです。",
  },
  {
    title: "被リンクの規模を引く",
    body: "Open PageRank から、被リンク元ドメイン数・Open PageRank（0〜10）・世界順位を取ります。元データは Common Crawl のリンクグラフで、Googleが使っている指標ではありません。順位そのものではなく、外部からの入口がどれだけあるかを見るために使います。",
  },
  {
    title: "登録情報を引く",
    body: "RDAP（レジストリが公開している登録データ）で、登録日・有効期限・レジストラ・状態コード・DNSSEC・ネームサーバーを取ります。.jp は RDAP に対応していないため、JPRS の WHOIS から登録年月日と状態を取ります。",
  },
  {
    title: "数値に対してやることを出す",
    body: "被リンクの水準、有効期限までの残り、移管ロックの有無、登録からの年数を見て、それぞれに対する対処を返します。重み付けの根拠が出せないため、これらを1つの点数にまとめることはしません。",
  },
];

const FAQ: FaqItem[] = [
  {
    question: "「ドメインパワー」の点数は出ないのですか",
    answer:
      "出しません。被リンク元ドメイン数と登録年数をどんな重みで足すと妥当なのか、根拠のある配分が存在しないためです。このツールは公開データの素の数値（被リンク元ドメイン数・Open PageRank・登録からの年数）をそのまま出します。他社ツールの独自スコアと数字が合わないのは、各社が別々の重み付けをしているからで、どれかが正解というものではありません。",
  },
  {
    question: "Open PageRank は Google のPageRankですか",
    answer:
      "違います。Common Crawl が公開しているウェブのリンクグラフに対して、PageRankと同じ計算を第三者が回した結果です。Googleが内部で使っている値ではありません。絶対値より、同じテーマの他ドメインと並べたときの差を見るために使ってください。",
  },
  {
    question: "ドメイン年齢が古いほど順位が上がりますか",
    answer:
      "登録日そのものが順位を押し上げるという根拠はありません。古いドメインが強く見えるのは、その間に被リンクと更新の履歴が積み上がったからです。逆に、過去の評価を引き継ぐ目的で期限切れドメインを買い、以前のサイトと関係のない内容を載せる行為は、Googleのスパムポリシーで「期限切れドメインの不正使用」として明記されています。",
  },
  {
    question: ".jp や .co.jp でも使えますか",
    answer:
      "使えます。ただし .jp は IANA の RDAP 一覧に登録されていないため、レジストラ・EPPステータス・DNSSEC は取得できません。登録年月日と状態は JPRS の WHOIS から取ります。被リンクのデータは .jp でも同じように取得できます。",
  },
  {
    question: "入力したドメインは保存されますか",
    answer:
      "保存していません。診断のあいだメモリ上で処理するだけで、サーバーには残しません。連続実行を防ぐための一時的な回数制限だけを行っています。",
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

export default function DomainPowerToolPage() {
  return (
    <>
      <JsonLd data={softwareJsonLd} />
      <JsonLd data={faqPageJsonLd(url, FAQ)} />
      <PageHeader
        eyebrow="Tool · 無料・登録不要"
        title={TITLE}
        lead="ドメインを入れると、外部からの入口がどれだけあるか（被リンク）と、ドメインそのものが安全に持てているか（登録情報）を返します。"
        crumbs={[{ name: "ツール", href: "/tools" }, { name: "ドメインパワー" }]}
      />

      <div className={cx(CONTAINER.wide, "space-y-14 py-14 sm:py-20")}>
        <p className="leading-relaxed text-mute">
          ドメイン単位で効くのは2つだけです。ひとつは外部からの入口の数、つまり別のドメインからどれだけリンクされているか。
          もうひとつはドメインを失わないこと——有効期限切れや移管による喪失は、それまで積み上げた被リンクの評価をまとめて失います。
          このツールはその2つを公開データから出します。点数化はしません。
        </p>

        <DomainPower />

        <section>
          <h2 className={HEADING.section}>診断の手順</h2>
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
            ドメイン単位の話はここまでです。個々のページが読める状態かどうかは
            <Link href="/tools/page-audit" className={LINK}>
              SEO/GEO ページ診断
            </Link>
            、狙った質問に答えているかは
            <Link href="/tools/prompt-fit" className={LINK}>
              プロンプト適合度チェッカー
            </Link>
            が担当します。
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

        <NextStep links={siblingPages(PATH)} />
      </div>
    </>
  );
}
