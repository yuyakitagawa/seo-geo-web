"use client";

import { useState } from "react";
import { AREA_LABEL, CHECKLIST, SEVERITY_LABEL, type Area, type AuditResult, type Finding, type Severity } from "@/lib/audit";
import { CODE, EYEBROW, FIELD, HEADING, LINK, PADDING, SURFACE, button, cx } from "@/lib/ui";

const SEVERITY_STYLE: Record<Severity, string> = {
  high: "bg-news text-white",
  mid: "bg-accent text-accent-ink",
  low: "bg-fill-strong text-fg",
  ok: "bg-fill-strong text-fg",
};

function Code({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4">
      <p className={cx(EYEBROW.mute, "mb-1.5 text-2xs")}>{label}</p>
      <pre className={CODE}>{value}</pre>
    </div>
  );
}

const AREAS: Area[] = ["tech", "seo", "geo"];

/** エリアごとの「指摘なし n / 判定した m 項目」。対象外（skipped）は分母に入れない */
function areaSummary(result: AuditResult) {
  const passed = new Set(result.passed);
  const skipped = new Set(result.skipped);
  return AREAS.map((area) => {
    const items = CHECKLIST.filter((c) => c.area === area && !skipped.has(c.id));
    return { area, ok: items.filter((c) => passed.has(c.id)).length, total: items.length };
  });
}

function PassedList({ result }: { result: AuditResult }) {
  const passed = new Set(result.passed);
  const skipped = new Set(result.skipped);
  const groups = AREAS.map((area) => ({
    area,
    items: CHECKLIST.filter((c) => c.area === area && passed.has(c.id)),
  })).filter((g) => g.items.length > 0);
  const skippedItems = CHECKLIST.filter((c) => skipped.has(c.id));
  if (groups.length === 0 && skippedItems.length === 0) return null;
  return (
    <details className={cx(SURFACE.outline, "p-6 sm:p-7")}>
      <summary className="cursor-pointer font-bold">
        指摘の無かった項目（{result.passed.length}）
        {skippedItems.length > 0 && <span className="ml-2 text-sm font-normal text-mute">／ 判定対象外 {skippedItems.length}</span>}
      </summary>
      <div className="mt-5 grid gap-6 sm:grid-cols-3">
        {groups.map((g) => (
          <div key={g.area}>
            <p className={cx(EYEBROW.mute, "text-2xs")}>{AREA_LABEL[g.area]}</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {g.items.map((c) => (
                <li key={c.id} className="flex gap-2">
                  <span className="shrink-0 font-bold text-accent" aria-hidden>
                    ◎
                  </span>
                  <span>{c.label}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {skippedItems.length > 0 && (
        <div className="mt-6 border-t border-line pt-4">
          <p className={cx(EYEBROW.mute, "text-2xs")}>判定対象外（前提が揃わないため合格にも不合格にも数えていません）</p>
          <p className="mt-2 text-sm text-mute">{skippedItems.map((c) => c.label).join(" ／ ")}</p>
        </div>
      )}
    </details>
  );
}

function FindingCard({ f }: { f: Finding }) {
  return (
    <article className={cx(SURFACE.outline, "p-6 sm:p-7")}>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2.5 py-1 font-bold ${SEVERITY_STYLE[f.severity]}`}>{SEVERITY_LABEL[f.severity]}</span>
        <span className="rounded-full border border-line-strong px-2.5 py-1 font-medium text-mute">{AREA_LABEL[f.area]}</span>
      </div>
      <h3 className={cx(HEADING.card, "leading-snug")}>{f.title}</h3>
      <p className="mt-2 leading-relaxed text-mute">{f.detail}</p>
      {f.code && <Code label="該当箇所" value={f.code} />}
      {f.fix && (
        <div className="mt-4 rounded-panel border-l-4 border-accent bg-accent/10 p-4">
          <p className={cx(EYEBROW.mute, "text-2xs")}>修正方針</p>
          <p className="mt-1 leading-relaxed">{f.fix}</p>
        </div>
      )}
      {f.where && (
        <div className="mt-4">
          <p className={cx(EYEBROW.mute, "mb-1.5 text-2xs")}>入れる場所</p>
          <p className="leading-relaxed">{f.where.note}</p>
          {f.where.code && (
            <pre className={cx(CODE, "mt-2")}>{f.where.code}</pre>
          )}
        </div>
      )}
      {f.fixCode && <Code label="修正後のコード例" value={f.fixCode} />}
      {f.source && (
        <p className="mt-4 text-xs">
          <a href={f.source.url} target="_blank" rel="noopener" className={cx(LINK, "text-mute")}>
            根拠: {f.source.title}
          </a>
        </p>
      )}
    </article>
  );
}

export default function PageAudit() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) setError(String(data.error ?? "検査に失敗しました"));
      else setResult(data as AuditResult);
    } catch {
      setError("通信に失敗しました。時間を置いて試してください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={run} className={cx(SURFACE.card, PADDING.card)}>
        <label htmlFor="url" className="text-sm font-bold">
          検査するページのURL
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article/1"
            inputMode="url"
            spellCheck={false}
            className={cx(FIELD.input, "flex-1")}
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className={cx(button("invert"), "px-7 py-3 disabled:opacity-40")}
          >
            {loading ? "検査中…" : "検査する"}
          </button>
        </div>
        <p className="mt-3 text-xs text-mute">
          公開されているページだけ検査できます。サーバーが返すHTMLをそのまま読むため、JavaScriptで後から描画される内容は「本文が無い」と判定されます（AI検索のクローラーと同じ見え方です）。
        </p>
        {error && (
          <p className="mt-4 rounded-panel border border-news/40 bg-news/10 p-4 text-sm text-news" role="alert">
            {error}
          </p>
        )}
      </form>

      {result && (
        <>
          <div className={cx(SURFACE.invert, PADDING.card)}>
            <p className={EYEBROW.faint}>検査結果</p>
            <p className="mt-2 text-xl font-bold leading-snug sm:text-2xl">
              {result.findings.length === 0
                ? "指摘はありません。判定した項目はすべて満たしています。"
                : `要修正 ${result.counts.high} 件 / 直したい ${result.counts.mid} 件 / 検討 ${result.counts.low} 件`}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2 text-sm">
              {areaSummary(result).map((a) => (
                <li key={a.area} className="rounded-full border border-current/30 px-3 py-1">
                  {AREA_LABEL[a.area]}{" "}
                  <span className="font-mono font-bold">
                    {a.ok}/{a.total}
                  </span>{" "}
                  <span className="opacity-70">項目に指摘なし</span>
                </li>
              ))}
            </ul>
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 text-sm opacity-80 sm:grid-cols-4">
              <div>
                <dt className="text-xs opacity-70">HTTP</dt>
                <dd className="font-mono">{result.status}</dd>
              </div>
              <div>
                <dt className="text-xs opacity-70">HTML本文</dt>
                <dd className="font-mono">{result.textLength.toLocaleString()} 字</dd>
              </div>
              <div>
                <dt className="text-xs opacity-70">サイズ</dt>
                <dd className="font-mono">{(result.bytes / 1024).toFixed(0)} KB</dd>
              </div>
              <div>
                <dt className="text-xs opacity-70">取得時間</dt>
                <dd className="font-mono">{(result.elapsedMs / 1000).toFixed(1)} 秒</dd>
              </div>
            </dl>
            <p className="mt-4 break-all font-mono text-xs opacity-60">{result.finalUrl}</p>
          </div>

          <div className="space-y-4">
            {result.findings.map((f) => (
              <FindingCard key={f.id} f={f} />
            ))}
          </div>

          <PassedList result={result} />
        </>
      )}
    </div>
  );
}
