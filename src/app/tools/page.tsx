import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import PageHeader from "@/components/PageHeader";
import { APP_TOOLS } from "@/lib/apps";
import { getTools, latestVerified, TOOL_TYPE_COLOR, TOOL_TYPE_LABEL, type Tool } from "@/lib/tools";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "SEO・GEOツール比較一覧（国内・海外）",
  description: "従来SEOツール（順位計測・キーワード調査・クロール監査）と、AI検索向けGEOツール（ChatGPT・Perplexity・AI Overviewでの可視性計測、AI対応診断）を国内外・料金・対象で比較。運営者が公式ページを確認したものだけを掲載し、新ツールの検知に応じて更新します。",
  alternates: { canonical: "/tools" },
};

function ToolTable({ rows }: { rows: Tool[] }) {
  if (rows.length === 0) return <p className="text-sm text-mute">確認済みのツールはまだありません。</p>;
  return (
    <div className="overflow-x-auto rounded-3xl border border-ink/10 dark:border-paper/10">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="bg-ink/5 text-left text-xs uppercase tracking-wider text-mute dark:bg-paper/5">
          <tr>
            <th className="px-4 py-3">ツール</th>
            <th className="px-4 py-3">種別</th>
            <th className="px-4 py-3">対象</th>
            <th className="px-4 py-3">料金</th>
            <th className="px-4 py-3">特徴</th>
            <th className="px-4 py-3">確認日</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.name} className="border-t border-ink/10 align-top dark:border-paper/10">
              <td className="px-4 py-4">
                <a href={t.jaUrl ?? t.url} target="_blank" rel="noopener" className="font-semibold underline decoration-accent decoration-2 underline-offset-4">{t.name}</a>
                <div className="mt-1 text-xs text-mute">{t.vendor}{t.jaUrl && t.country === "海外" ? " · 日本語ページあり" : ""}</div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${TOOL_TYPE_COLOR[t.type]}`}>{TOOL_TYPE_LABEL[t.type]}</span>
              </td>
              <td className="px-4 py-4 text-xs">{t.engines.join("、")}</td>
              <td className="px-4 py-4 whitespace-nowrap">{t.free && <span className="mr-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-ink">無料あり</span>}{t.price}</td>
              <td className="px-4 py-4 text-xs text-mute">{t.note}</td>
              <td className="px-4 py-4 whitespace-nowrap text-xs text-mute">{t.verified}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ToolsPage() {
  const tools = getTools();
  const updated = latestVerified(tools);
  const by = (category: Tool["category"], country: Tool["country"]) => tools.filter((t) => t.category === category && t.country === country);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "SEO・GEOツール一覧",
    url: `${SITE_URL}/tools`,
    numberOfItems: tools.length,
    itemListElement: tools.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "SoftwareApplication",
        name: t.name,
        applicationCategory: "BusinessApplication",
        url: t.url,
        offers: { "@type": "Offer", description: t.price, ...(t.free ? { price: "0", priceCurrency: "JPY" } : {}) },
        publisher: { "@type": "Organization", name: t.vendor },
      },
    })),
  };

  const sections: { id: string; title: string; lead: string; rows: Tool[] }[] = [
    { id: "geo-jp", title: "GEO（AI検索）ツール · 国内", lead: "ChatGPT・Gemini・AI Overviewでの言及を測る、またはページのAI対応度を診断する国産ツール。", rows: by("geo", "日本") },
    { id: "geo-global", title: "GEO（AI検索）ツール · 海外", lead: "海外大手のAI可視性ツール。日本語ページがあるものは表示しています。", rows: by("geo", "海外") },
    { id: "seo-jp", title: "SEOツール · 国内", lead: "順位計測・キーワード調査・コンテンツ分析の国産ツール。", rows: by("seo", "日本") },
    { id: "seo-global", title: "SEOツール · 海外", lead: "総合SEOプラットフォームとクローラー、公式の無料ツール。", rows: by("seo", "海外") },
  ];

  return (
    <>
      <JsonLd data={itemListJsonLd} />
      <PageHeader
        eyebrow={`Tools · ${tools.length}件 · 更新 ${updated}`}
        title="SEO・GEOツール比較"
        lead="従来のSEOツールと、AI検索向けのGEOツールを1か所で比較します。GEOツールは「AIの回答に自社が出るか」を測る可視性計測と、「ページがAIに読めるか」を採点する診断に分かれ、両者は別物です。運営者が公式ページを確認したツールだけを載せています。"
      />
      <div className="mx-auto max-w-6xl space-y-14 px-5 pb-16">
        <nav aria-label="セクション" className="flex flex-wrap gap-2 text-sm">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="rounded-full border border-ink/15 px-3 py-1.5 transition hover:bg-ink hover:text-paper dark:border-paper/15 dark:hover:bg-paper dark:hover:text-ink">
              {s.title} <span className="opacity-50">{s.rows.length}</span>
            </a>
          ))}
        </nav>

        {/* 自作ツール。外部ツールの比較表より先に置く */}
        <section>
          <h2 className="text-2xl font-bold tracking-tight">{SITE_NAME}の無料ツール</h2>
          <p className="mb-4 mt-1 text-sm text-mute">登録不要で使えます。判定の根拠は各ページに公式ドキュメントのリンクを添えています。</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {APP_TOOLS.map((t) => (
              <Link
                key={t.path}
                href={t.path}
                className="group rounded-3xl border border-ink/10 p-7 transition hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)] dark:border-paper/10"
              >
                <span className="mb-4 inline-block rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-accent-ink">無料ツール</span>
                <p className="text-xl font-bold leading-snug tracking-tight">
                  {t.name} <span className="inline-block transition group-hover:translate-x-1">→</span>
                </p>
                <p className="mt-2 text-sm leading-relaxed text-mute">{t.lead}</p>
                <ul className="mt-4 space-y-1 text-xs text-mute">
                  {t.points.map((p) => (
                    <li key={p}>・{p}</li>
                  ))}
                </ul>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-ink/10 p-6 dark:border-paper/10">
            <p className="mb-2 inline-block rounded-full bg-geo px-2.5 py-1 text-[11px] font-bold text-white">AI可視性計測</p>
            <p className="text-sm leading-relaxed">決めた質問をAIに定期的に投げ、回答に自社名・自社URLが出た割合と競合比較を出す。測れるのは「ツールが投げた質問への回答」で、実ユーザーの回答ではない。</p>
          </div>
          <div className="rounded-3xl border border-ink/10 p-6 dark:border-paper/10">
            <p className="mb-2 inline-block rounded-full bg-geo/70 px-2.5 py-1 text-[11px] font-bold text-white">AI対応診断</p>
            <p className="text-sm leading-relaxed">URLを入れると、クロール可否・構造化データ・見出し構造などを採点する。AIに「出るか」ではなく「読めるか」のチェック。多くは無料で、SEOの技術監査とほぼ同じ項目。</p>
          </div>
        </section>

        {sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-24">
            <h2 className="text-2xl font-bold tracking-tight">{s.title}</h2>
            <p className="mb-4 mt-1 text-sm text-mute">{s.lead}</p>
            <ToolTable rows={s.rows} />
          </section>
        ))}

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
