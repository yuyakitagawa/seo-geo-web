"use client";

import { useState } from "react";
import { AREA_LABEL } from "@/lib/audit";
import type { LinkGraph } from "@/lib/linkGraph";
import { CRAWL_MAX_PAGES, MAX_PAGES } from "@/lib/siteCrawl";
import { STAGES, stageDef, type Proposal, type SiteReportResult, type Stage } from "@/lib/siteReport";
import { DEEP_DEPTH, type SiteStructure } from "@/lib/siteStructure";
import { CODE, EYEBROW, FIELD, HEADING, LINK, PADDING, SURFACE, TABLE, button, cx } from "@/lib/ui";

const STAGE_STYLE: Record<Stage, string> = {
  1: "bg-news text-white",
  2: "bg-accent text-accent-ink",
  3: "bg-fill-strong text-fg",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line pt-3">
      <dt className={cx(EYEBROW.mute, "text-2xs")}>{label}</dt>
      <dd className="mt-1 leading-relaxed">{children}</dd>
    </div>
  );
}

/** 提案1件。/learn#plan の6項目（症状・対象の範囲・原因・直した後の状態・検証指標と時期・優先度）をそろえる */
function ProposalCard({ p, index }: { p: Proposal; index: number }) {
  const stage = stageDef(p.stage);
  return (
    <article className={cx(SURFACE.outline, "print-keep scroll-mt-24 p-6 sm:p-7")}>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-mono font-bold text-mute">{String(index).padStart(2, "0")}</span>
        <span className={cx("rounded-full px-2.5 py-1 font-bold", STAGE_STYLE[p.stage])}>{stage.label}</span>
        <span className="rounded-full border border-line-strong px-2.5 py-1 font-medium text-mute">{AREA_LABEL[p.area]}</span>
      </div>
      <h3 className={cx(HEADING.card, "leading-snug")}>{p.symptom}</h3>
      <p className="mt-2 leading-relaxed text-mute">{p.detail}</p>

      <dl className="mt-5 space-y-3 text-sm">
        <Field label="対象の範囲">
          {p.scope.text}
          {p.scope.urls.length > 0 && (
            <ul className="mt-2 space-y-0.5 font-mono text-xs text-mute">
              {p.scope.urls.slice(0, 5).map((u) => (
                <li key={u} className="break-all">
                  {u}
                </li>
              ))}
              {p.scope.urls.length > 5 && <li>ほか {p.scope.urls.length - 5} ページ</li>}
            </ul>
          )}
        </Field>
        <Field label="原因">{p.cause}</Field>
        <Field label="直した後の状態">
          {p.after}
          {p.afterCode && <pre className={cx(CODE, "mt-2")}>{p.afterCode}</pre>}
        </Field>
        <Field label="検証指標と時期">{p.metric}</Field>
      </dl>

      {p.code && (
        <div className="mt-4">
          <p className={cx(EYEBROW.mute, "mb-1.5 text-2xs")}>現状の該当箇所</p>
          <pre className={CODE}>{p.code}</pre>
        </div>
      )}
      {p.source && (
        <p className="mt-4 text-xs">
          <a href={p.source.url} target="_blank" rel="noopener" className={cx(LINK, "text-mute")}>
            根拠: {p.source.title}
          </a>
        </p>
      )}
    </article>
  );
}

/**
 * URLの構造。サイトマップの一覧を**取得せずに数えた**だけのもの。
 * 合否は出さない（直すべき点は提案側に3段目として出る）。
 */
function StructurePanel({ s }: { s: SiteStructure }) {
  const maxDepth = Math.max(...s.depths.map((d) => d.count), 1);
  const maxSection = Math.max(...s.sections.map((x) => x.count), 1);
  return (
    <section className="print-keep space-y-3">
      <h2 className={HEADING.section}>URLの構造</h2>
      <p className="text-sm leading-relaxed text-mute">
        サイトマップにある {s.total.toLocaleString()} 本のURLを、1本も取得せずに数えたものです。
        <strong className="text-fg">どのページがどこからリンクされているか（リンク構造）は見ていません</strong>
        ので、孤立ページやクリック数はここには出ません。
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={cx(SURFACE.outline, PADDING.tight)}>
          <p className={cx(EYEBROW.mute, "text-2xs")}>階層の深さ</p>
          <ul className="mt-3 space-y-2">
            {s.depths.map((d) => (
              <li key={d.depth} className="flex items-center gap-3 text-sm">
                <span className="w-14 shrink-0 text-xs text-mute">{d.depth === 0 ? "トップ" : `${d.depth}階層`}</span>
                <span className="h-2 min-w-1 rounded-full bg-accent" style={{ width: `${(d.count / maxDepth) * 70}%` }} aria-hidden />
                <span className="font-mono text-xs tabular-nums">{d.count.toLocaleString()}</span>
              </li>
            ))}
          </ul>
          {s.deep.count > 0 && (
            <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-mute">
              {DEEP_DEPTH}階層以上: {s.deep.count.toLocaleString()} 本
            </p>
          )}
        </div>
        <div className={cx(SURFACE.outline, PADDING.tight)}>
          <p className={cx(EYEBROW.mute, "text-2xs")}>第1階層ごとの本数</p>
          <ul className="mt-3 space-y-2">
            {s.sections.map((x) => (
              <li key={x.name} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0 truncate font-mono text-xs">{x.name === "/" ? "/" : `/${x.name}/`}</span>
                <span className="h-2 min-w-1 rounded-full bg-fill-strong" style={{ width: `${(x.count / maxSection) * 55}%` }} aria-hidden />
                <span className="font-mono text-xs tabular-nums">{x.count.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** リンク構造。クロールした範囲の事実だけを出す（直すべき点は提案側に出る） */
function LinkGraphPanel({ g }: { g: LinkGraph }) {
  const max = Math.max(...g.depths.map((d) => d.count), 1);
  return (
    <section className="print-keep space-y-3">
      <h2 className={HEADING.section}>リンク構造</h2>
      <p className="text-sm leading-relaxed text-mute">
        入口のページから内部リンクをたどって {g.crawled.toLocaleString()} ページを調べました
        {g.truncated ? (
          <>
            （<strong className="text-fg">上限{CRAWL_MAX_PAGES}ページで打ち切っています</strong>
            。この先にもページがあるため、ここに出ていないリンクがあります）
          </>
        ) : (
          "（入口から辿れるページはすべて調べました）"
        )}
        。
      </p>
      <div className={cx(SURFACE.outline, PADDING.tight)}>
        <p className={cx(EYEBROW.mute, "text-2xs")}>入口から何クリックで届くか</p>
        <ul className="mt-3 space-y-2">
          {g.depths.map((d) => (
            <li key={d.depth} className="flex items-center gap-3 text-sm">
              <span className="w-24 shrink-0 text-xs text-mute">{d.depth === 0 ? "入口" : `${d.depth}クリック`}</span>
              <span className="h-2 min-w-1 rounded-full bg-accent" style={{ width: `${(d.count / max) * 65}%` }} aria-hidden />
              <span className="font-mono text-xs tabular-nums">{d.count.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Report({ r }: { r: SiteReportResult }) {
  const checked = r.pages.filter((p) => !p.error);
  const failed = r.pages.length - checked.length;
  const hosts = [r.host, ...r.relatedHosts];

  return (
    <div className="space-y-10">
      {/* 表紙 */}
      <div className={cx(SURFACE.card, PADDING.card, "print-keep")}>
        <p className={cx(EYEBROW.accent, "tracking-[0.2em]")}>SEO · GEO REMEDIATION PLAN</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{r.host} 修正提案書</h2>
        <dl className="mt-5 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className={cx(EYEBROW.mute, "text-2xs")}>対象</dt>
            <dd className="mt-1 break-all font-mono">
              {hosts.join(" / ")}
              {r.relatedHosts.length > 0 && <span className="ml-1 font-sans text-mute">（関連ホストを含む）</span>}
            </dd>
          </div>
          <div>
            <dt className={cx(EYEBROW.mute, "text-2xs")}>作成日</dt>
            <dd className="mt-1 font-mono">{r.checkedAt}</dd>
          </div>
          <div>
            <dt className={cx(EYEBROW.mute, "text-2xs")}>検査したページ</dt>
            <dd className="mt-1">
              {checked.length}ページ
              {failed > 0 && <span className="text-mute">（取得できなかったページ {failed}）</span>}
              <span className="text-mute">
                {" "}
                / {r.discovery === "sitemap" ? "サイトマップ" : "入力したページの内部リンク"}から {r.foundUrls.toLocaleString()} 本を検出
              </span>
            </dd>
          </div>
          <div>
            <dt className={cx(EYEBROW.mute, "text-2xs")}>提案件数</dt>
            <dd className="mt-1">
              {r.proposals.length}件
              <span className="text-mute">
                {" "}
                （1段目 {r.counts[1]} / 2段目 {r.counts[2]} / 3段目 {r.counts[3]}）
              </span>
            </dd>
          </div>
        </dl>
        <p className="mt-5 border-t border-line pt-4 text-sm leading-relaxed text-mute">
          {r.host} の {checked.length} ページを取得し、検索エンジンとAI検索が受け取るHTMLだけを見て指摘を出しました。
          同じ指摘が複数のページに出たものは1件に束ね、着手順を3段に分けています。優先度は「影響の大きさ」ではなく
          <strong className="text-fg">「他の修正の前提になっているか」</strong>で決めており、下の段から片付けます。
        </p>
      </div>

      {/* 段ごとの提案 */}
      {STAGES.map((s) => {
        const list = r.proposals.filter((p) => p.stage === s.stage);
        if (list.length === 0) return null;
        const offset = r.proposals.findIndex((p) => p.stage === s.stage);
        return (
          <section key={s.stage} className="space-y-4">
            <div className={cx(SURFACE.outline, PADDING.tight, "print-keep")}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className={HEADING.section}>{s.label}</h2>
                <span className="text-sm text-mute">{s.span}</span>
                <span className="text-sm font-bold">{list.length}件</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-mute">{s.desc}</p>
              <p className="mt-2 text-sm leading-relaxed">
                <strong>{s.batch ? "この段はまとめて一度に入れてよい。" : "この段は1件ずつ入れる。"}</strong>
                {s.measure}
              </p>
            </div>
            {list.map((p, i) => (
              <ProposalCard key={p.id} p={p} index={offset + i + 1} />
            ))}
          </section>
        );
      })}

      {r.proposals.length === 0 && (
        <div className={cx(SURFACE.card, PADDING.card)}>
          <p className="leading-relaxed">検査したページに指摘はありませんでした。判定した項目はすべて満たしています。</p>
        </div>
      )}

      {r.structure && <StructurePanel s={r.structure} />}

      {r.linkGraph && <LinkGraphPanel g={r.linkGraph} />}

      {/* 検査したページ */}
      <section className="print-keep space-y-3">
        <h2 className={HEADING.section}>検査したページ</h2>
        <div className={TABLE.frame}>
          <table className={TABLE.table}>
            <thead className={TABLE.head}>
              <tr>
                <th className={TABLE.headCell}>URL</th>
                <th className={TABLE.headCell}>HTTP</th>
                <th className={TABLE.headCell}>指摘</th>
              </tr>
            </thead>
            <tbody>
              {r.pages.map((p) => (
                <tr key={p.url} className={TABLE.row}>
                  <td className={cx(TABLE.cell, "break-all font-mono text-xs")}>
                    {p.url}
                    {p.redirected && <span className="ml-2 font-sans text-mute">→ {p.finalUrl}</span>}
                  </td>
                  <td className={cx(TABLE.cell, "font-mono")}>{p.error ? "—" : p.status}</td>
                  <td className={TABLE.cell}>{p.error ? <span className="text-mute">{p.error}</span> : `${p.findings}件`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm leading-relaxed text-mute">
          robots.txt {r.robotsOk ? "取得できました" : "取得できませんでした"} / サイトマップ{" "}
          <span className="break-all font-mono text-xs">{r.sitemap.url}</span> {r.sitemap.ok ? "取得できました" : "取得できませんでした"}。
          1回の診断で取得するページは最大{MAX_PAGES}本です。同じテンプレートのページからは同じ指摘しか出ないため、第1階層が散るように選んでいます。
        </p>
      </section>
    </div>
  );
}

export default function SiteReport() {
  const [url, setUrl] = useState("");
  const [withLinks, setWithLinks] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SiteReportResult | null>(null);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/site-report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim(), links: withLinks }),
      });
      const data = await res.json();
      if (!res.ok) setError(String(data.error ?? "検査に失敗しました"));
      else setResult(data as SiteReportResult);
    } catch {
      setError("通信に失敗しました。時間を置いて試してください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={run} className={cx(SURFACE.card, PADDING.card, "no-print")}>
        <label htmlFor="site-url" className="text-sm font-bold">
          診断するサイトのURL
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            id="site-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/"
            inputMode="url"
            spellCheck={false}
            className={cx(FIELD.input, "flex-1")}
          />
          <button type="submit" disabled={loading || !url.trim()} className={cx(button("invert"), "px-7 py-3 disabled:opacity-40")}>
            {loading ? "診断中…" : "提案書を作る"}
          </button>
        </div>
        <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={withLinks}
            onChange={(e) => setWithLinks(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-current"
          />
          <span className="leading-relaxed">
            <strong>リンク構造も調べる</strong>
            <span className="text-mute">
              （入口から内部リンクを最大{CRAWL_MAX_PAGES}ページたどり、どこからもリンクされていないページ・本文から案内されていないページ・リンク切れを出します。
              取得するページが増えるので、結果が出るまで40〜60秒かかります）
            </span>
          </span>
        </label>
        <p className="mt-3 text-xs leading-relaxed text-mute">
          トップページでも下層ページでも構いません。サイトマップ（取得できなければ入力したページの内部リンク）から最大{MAX_PAGES}ページを取得して検査します。
          結果が出るまで{withLinks ? "40〜60" : "20〜40"}秒ほどかかります。
        </p>
        {error && (
          <p className="mt-4 rounded-panel border border-news/40 bg-news/10 p-4 text-sm text-news" role="alert">
            {error}
          </p>
        )}
      </form>

      {result && (
        <>
          <div className="no-print flex flex-wrap gap-3">
            <button type="button" onClick={() => window.print()} className={button("accent")}>
              印刷 / PDFで保存
            </button>
          </div>
          <Report r={result} />
        </>
      )}
    </div>
  );
}
