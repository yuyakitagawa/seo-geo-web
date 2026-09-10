import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import NextStep from "@/components/NextStep";
import { PageDatesJsonLd } from "@/components/PageDates";
import PageHeader from "@/components/PageHeader";
import { APP_TOOLS } from "@/lib/apps";
import { siblingPages } from "@/lib/nav";
import { getTools, latestVerified, TOOL_TYPE_COLOR, TOOL_TYPE_LABEL, type Tool } from "@/lib/tools";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { BADGE, CHIP, CONTAINER, HEADING, LINK, PADDING, SURFACE, button, cx } from "@/lib/ui";
import { Card, CardLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "SEO・GEOツール比較一覧（国内・海外）",
  description: "従来SEOツール（順位計測・キーワード調査・クロール監査）と、AI検索向けGEOツール（ChatGPT・Perplexity・AI Overviewでの可視性計測、AI対応診断）を国内外・料金・対象で比較。運営者が公式ページを確認したものだけを掲載し、新ツールの検知に応じて更新します。",
  alternates: { canonical: "/tools" },
};

// 外部ツールはカードで見せる。押した先が外部サイトだと分かるように、遷移はカード全体ではなく明示したリンクだけにする。
function ExternalIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3H3.8A.8.8 0 0 0 3 3.8v8.4a.8.8 0 0 0 .8.8h8.4a.8.8 0 0 0 .8-.8V10" />
      <path d="M9.5 2.5H13.5V6.5" />
      <path d="M13.5 2.5 7.5 8.5" />
    </svg>
  );
}

function ToolCard({ t }: { t: Tool }) {
  // 海外ツールは日本語ページがあればそちらを主リンクにし、英語ページは補助リンクで残す
  const jaPrimary = t.country === "海外" && t.jaUrl ? t.jaUrl : undefined;
  const primary = jaPrimary ?? t.url;
  const secondary = jaPrimary && jaPrimary !== t.url ? t.url : undefined;
  return (
    <Card as="article" padding="tight" className="flex flex-col">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cx(BADGE.sm, TOOL_TYPE_COLOR[t.type])}>{TOOL_TYPE_LABEL[t.type]}</span>
        {t.free && <span className={cx(BADGE.sm, "bg-accent text-accent-ink")}>無料あり</span>}
      </div>
      <h3 className={cx(HEADING.card, "mt-3 leading-snug")}>{t.name}</h3>
      <p className="mt-0.5 text-xs text-mute">{t.vendor}</p>
      <p className="mt-3 text-sm leading-relaxed">{t.note}</p>
      <dl className="mt-4 space-y-2 border-t border-line pt-4 text-xs">
        <div className="flex gap-3">
          <dt className="w-14 shrink-0 text-mute">料金</dt>
          <dd className="font-semibold">{t.price}</dd>
        </div>
        {t.engines.length > 0 && (
          <div className="flex gap-3">
            <dt className="w-14 shrink-0 text-mute">対象</dt>
            <dd className="flex flex-wrap gap-1">
              {t.engines.map((e) => (
                <span key={e} className="rounded-full border border-line-strong px-2 py-0.5">{e}</span>
              ))}
            </dd>
          </div>
        )}
      </dl>
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-5">
        <a
          href={primary}
          target="_blank"
          rel="noopener"
          aria-label={`${t.name} の公式ページを外部サイトの新しいタブで開く`}
          className={button("invert", "sm")}
        >
          公式ページ{jaPrimary ? "（日本語）" : ""}を開く
          <ExternalIcon />
        </a>
        {secondary && (
          <a href={secondary} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-xs text-mute underline underline-offset-4">
            英語ページ
            <ExternalIcon />
          </a>
        )}
      </div>
    </Card>
  );
}

function ToolCards({ rows }: { rows: Tool[] }) {
  if (rows.length === 0) return <p className="text-sm text-mute">確認済みのツールはまだありません。</p>;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((t) => (
        <ToolCard key={t.name} t={t} />
      ))}
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
      {/* 更新日は掲載ツールの最終確認日。掲載内容が実際に変わるのはここだけ。 */}
      <PageDatesJsonLd path="/tools" name="SEO・GEOツール比較一覧（国内・海外）" updated={updated} />
      <PageHeader
        eyebrow={`Tools · ${tools.length}件 · 更新 ${updated}`}
        title="SEO・GEOツール比較"
        crumbs={[{ name: "ツール" }]}
        lead="従来のSEOツールと、AI検索向けのGEOツールを1か所で比較します。GEOツールは「AIの回答に自社が出るか」を測る可視性計測と、「ページがAIに読めるか」を採点する診断に分かれ、両者は別物です。運営者が公式ページを確認したツールだけを載せています。"
      />
      <div className={cx(CONTAINER.page, "space-y-14 pb-16")}>
        <nav aria-label="セクション" className="flex flex-wrap gap-2 text-sm">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className={CHIP}>
              {s.title} <span className="opacity-50">{s.rows.length}</span>
            </a>
          ))}
        </nav>

        {/* 自作ツール。外部ツールの比較表より先に置く */}
        <section>
          <h2 className={HEADING.section}>{SITE_NAME}の無料ツール</h2>
          <p className="mb-4 mt-1 text-sm text-mute">登録不要で使えます。判定の根拠は各ページに公式ドキュメントのリンクを添えています。</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {APP_TOOLS.map((t) => (
              <CardLink key={t.path} href={t.path}>
                <span className={cx(BADGE.sm, "mb-4 bg-accent text-accent-ink")}>無料ツール</span>
                <p className="text-xl font-bold leading-snug tracking-tight">
                  {t.name} <span className="inline-block transition group-hover:translate-x-1">→</span>
                </p>
                <p className="mt-2 text-sm leading-relaxed text-mute">{t.lead}</p>
                <ul className="mt-4 space-y-1 text-xs text-mute">
                  {t.points.map((p) => (
                    <li key={p}>・{p}</li>
                  ))}
                </ul>
              </CardLink>
            ))}
          </div>
        </section>

        {/* 比較表の「種別」バッジの用語解説。カードより前に置き、GEOツールが別物の2種類であることを先に伝える */}
        <section>
          <h2 className={HEADING.section}>GEOツールは別物の2種類</h2>
          <p className="mb-4 mt-1 text-sm text-mute">
            下のカードの「種別」バッジは、この2つ（と両方を持つ「計測＋診断」）で分けています。目的が違うので、どちらが要るかを決めてから読んでください。
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className={cx(SURFACE.outline, PADDING.tight)}>
              <p className={cx(BADGE.sm, "mb-2 bg-geo text-white")}>AI可視性計測</p>
              <p className="text-sm font-semibold">AIの回答に自社が「出るか」を測る</p>
              <p className="mt-2 text-sm leading-relaxed text-mute">決めた質問をAIに定期的に投げ、回答に自社名・自社URLが出た割合と競合比較を出す。測れるのは「ツールが投げた質問への回答」で、実ユーザーの回答ではない。多くは有料・継続契約。</p>
            </div>
            <div className={cx(SURFACE.outline, PADDING.tight)}>
              <p className={cx(BADGE.sm, "mb-2 bg-geo/70 text-white")}>AI対応診断</p>
              <p className="text-sm font-semibold">そのページをAIが「読めるか」を調べる</p>
              <p className="mt-2 text-sm leading-relaxed text-mute">URLを入れると、クロール可否・構造化データ・見出し構造などを採点する。多くは無料で、SEOの技術監査とほぼ同じ項目。上の<Link href="/tools/page-audit" className={LINK}>ページ診断</Link>もこの種別。</p>
            </div>
          </div>
        </section>

        {sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-24">
            <h2 className={HEADING.section}>{s.title}</h2>
            <p className="mb-4 mt-1 text-sm text-mute">{s.lead}</p>
            <ToolCards rows={s.rows} />
          </section>
        ))}

        <section className={cx(SURFACE.invert, PADDING.card, "text-sm")}>
          <h2 className={HEADING.card}>掲載基準</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 opacity-80">
            <li>運営者が公式ページで機能・料金を確認できたものだけを載せています（最終確認 {updated}）。</li>
            <li>新ツールの発表は{SITE_NAME}の収集システムが日次で検知し、確認後に追記します。掲載依頼・誤りの指摘は公式Xまで。</li>
            <li>掲載は推奨ではありません。料金・機能は変わるため、契約前に公式ページを確認してください。</li>
          </ul>
        </section>

        <NextStep links={siblingPages("/tools")} />
      </div>
    </>
  );
}
