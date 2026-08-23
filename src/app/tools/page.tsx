import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import PageHeader from "@/components/PageHeader";
import { getTools, latestVerified, TOOL_TYPE_LABEL } from "@/lib/tools";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "AI検索（GEO）ツール比較一覧",
  description: "ChatGPT・Perplexity・Google AI Overviewでの自社の表示を測る「可視性計測ツール」と、ページのAI対応度を採点する「サイト診断ツール」を、国内外・料金・対象AIで比較。運営者が公式ページを確認したものだけを掲載し、新ツールの検知に応じて更新します。",
  alternates: { canonical: "/tools" },
};

export default function ToolsPage() {
  const tools = getTools();
  const updated = latestVerified(tools);
  const jp = tools.filter((t) => t.country === "日本");
  const global = tools.filter((t) => t.country === "海外");

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "AI検索（GEO）ツール一覧",
    url: `${SITE_URL}/tools`,
    numberOfItems: tools.length,
    itemListElement: tools.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: { "@type": "SoftwareApplication", name: t.name, applicationCategory: "BusinessApplication", url: t.url, offers: { "@type": "Offer", price: t.free ? "0" : undefined, description: t.price }, publisher: { "@type": "Organization", name: t.vendor } },
    })),
  };

  const Table = ({ rows }: { rows: typeof tools }) => (
    <div className="overflow-x-auto rounded-3xl border border-ink/10 dark:border-paper/10">
      <table className="w-full min-w-[880px] text-sm">
        <thead className="bg-ink/5 text-left text-xs uppercase tracking-wider text-mute dark:bg-paper/5">
          <tr>
            <th className="px-4 py-3">ツール</th>
            <th className="px-4 py-3">種別</th>
            <th className="px-4 py-3">対象AI</th>
            <th className="px-4 py-3">料金</th>
            <th className="px-4 py-3">特徴</th>
            <th className="px-4 py-3">確認日</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.name} className="border-t border-ink/10 align-top dark:border-paper/10">
              <td className="px-4 py-4">
                <a href={t.url} target="_blank" rel="noopener" className="font-semibold underline decoration-accent decoration-2 underline-offset-4">{t.name}</a>
                <div className="mt-1 text-xs text-mute">{t.vendor}</div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${t.type === "audit" ? "bg-seo text-white" : t.type === "visibility" ? "bg-geo text-white" : "bg-accent text-accent-ink"}`}>{TOOL_TYPE_LABEL[t.type]}</span>
              </td>
              <td className="px-4 py-4 text-xs">{t.engines.join("、")}</td>
              <td className="px-4 py-4 whitespace-nowrap">{t.free && <span className="mr-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-ink">無料</span>}{t.price}</td>
              <td className="px-4 py-4 text-xs text-mute">{t.note}</td>
              <td className="px-4 py-4 whitespace-nowrap text-xs text-mute">{t.verified}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <JsonLd data={itemListJsonLd} />
      <PageHeader
        eyebrow={`Tools · ${tools.length}件 · 更新 ${updated}`}
        title="AI検索（GEO）ツール比較"
        lead="ChatGPT・Perplexity・Google AI Overviewで自社がどう出ているかを測る「可視性計測」と、ページがAIに読まれやすいかを採点する「サイト診断」は別物です。運営者が公式ページを確認したツールだけを載せています。"
      />
      <div className="mx-auto max-w-6xl space-y-12 px-5 pb-16">
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-ink/10 p-6 dark:border-paper/10">
            <p className="mb-2 inline-block rounded-full bg-geo px-2.5 py-1 text-[11px] font-bold text-white">可視性計測</p>
            <p className="text-sm leading-relaxed">決めた質問をAIに定期的に投げ、回答に自社名・自社URLが出た割合と競合比較を出す。測れるのは「ツールが投げた質問への回答」で、実ユーザーの回答ではない。</p>
          </div>
          <div className="rounded-3xl border border-ink/10 p-6 dark:border-paper/10">
            <p className="mb-2 inline-block rounded-full bg-seo px-2.5 py-1 text-[11px] font-bold text-white">サイト診断</p>
            <p className="text-sm leading-relaxed">URLを入れると、クロール可否・構造化データ・見出し構造などを採点する。AIに「出るか」ではなく「読めるか」のチェック。多くは無料で、SEOの技術監査とほぼ同じ項目。</p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold tracking-tight">国内ツール</h2>
          <Table rows={jp} />
        </section>
        <section>
          <h2 className="mb-4 text-2xl font-bold tracking-tight">海外ツール（日本語対応あり）</h2>
          <Table rows={global} />
        </section>

        <section className="rounded-3xl bg-ink p-6 text-sm text-paper dark:bg-paper dark:text-ink sm:p-8">
          <h2 className="text-lg font-bold">掲載基準</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 opacity-80">
            <li>運営者が公式ページで機能・料金を確認できたものだけを載せています（確認日を表示）。</li>
            <li>新ツールの発表は{SITE_NAME}の収集システムが日次で検知し、確認後に追記します。掲載依頼・誤りの指摘は公式Xまで。</li>
            <li>掲載は推奨ではありません。料金・機能は変わるため、契約前に公式ページを確認してください。</li>
          </ul>
        </section>
      </div>
    </>
  );
}
