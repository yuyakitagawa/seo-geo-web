"use client";

import { useState } from "react";
import { AREA_LABEL, SEVERITY_LABEL, type AuditResult, type Finding, type Severity } from "@/lib/audit";

const SEVERITY_STYLE: Record<Severity, string> = {
  high: "bg-news text-white",
  mid: "bg-accent text-accent-ink",
  low: "bg-ink/10 text-ink dark:bg-paper/15 dark:text-paper",
  ok: "bg-ink/10 text-ink dark:bg-paper/15 dark:text-paper",
};

function Code({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-mute">{label}</p>
      <pre className="overflow-x-auto rounded-2xl bg-ink/5 p-4 font-mono text-xs leading-relaxed dark:bg-paper/10">{value}</pre>
    </div>
  );
}

function FindingCard({ f }: { f: Finding }) {
  return (
    <article className="rounded-3xl border border-ink/10 p-6 dark:border-paper/10 sm:p-7">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2.5 py-1 font-bold ${SEVERITY_STYLE[f.severity]}`}>{SEVERITY_LABEL[f.severity]}</span>
        <span className="rounded-full border border-ink/15 px-2.5 py-1 font-medium text-mute dark:border-paper/15">{AREA_LABEL[f.area]}</span>
      </div>
      <h3 className="text-lg font-bold leading-snug tracking-tight">{f.title}</h3>
      <p className="mt-2 leading-relaxed text-mute">{f.detail}</p>
      {f.code && <Code label="該当箇所" value={f.code} />}
      {f.fix && (
        <div className="mt-4 rounded-2xl border-l-4 border-accent bg-accent/10 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-mute">修正方針</p>
          <p className="mt-1 leading-relaxed">{f.fix}</p>
        </div>
      )}
      {f.where && (
        <div className="mt-4">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-mute">入れる場所</p>
          <p className="leading-relaxed">{f.where.note}</p>
          {f.where.code && (
            <pre className="mt-2 overflow-x-auto rounded-2xl bg-ink/5 p-4 font-mono text-xs leading-relaxed dark:bg-paper/10">{f.where.code}</pre>
          )}
        </div>
      )}
      {f.fixCode && <Code label="修正後のコード例" value={f.fixCode} />}
      {f.source && (
        <p className="mt-4 text-xs">
          <a href={f.source.url} target="_blank" rel="noopener" className="text-mute underline decoration-accent decoration-2 underline-offset-4">
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
      <form onSubmit={run} className="rounded-3xl border border-ink/10 bg-white p-6 dark:border-paper/10 dark:bg-white/5 sm:p-8">
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
            className="flex-1 rounded-full border border-ink/15 bg-paper px-5 py-3 font-mono text-sm outline-none focus:border-accent dark:border-paper/15 dark:bg-ink"
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="rounded-full bg-ink px-7 py-3 text-sm font-bold text-paper transition hover:opacity-80 disabled:opacity-40 dark:bg-paper dark:text-ink"
          >
            {loading ? "検査中…" : "検査する"}
          </button>
        </div>
        <p className="mt-3 text-xs text-mute">
          公開されているページだけ検査できます。サーバーが返すHTMLをそのまま読むため、JavaScriptで後から描画される内容は「本文が無い」と判定されます（AI検索のクローラーと同じ見え方です）。
        </p>
        {error && (
          <p className="mt-4 rounded-2xl border border-news/40 bg-news/10 p-4 text-sm text-news" role="alert">
            {error}
          </p>
        )}
      </form>

      {result && (
        <>
          <div className="rounded-3xl bg-ink p-6 text-paper dark:bg-paper dark:text-ink sm:p-8">
            <p className="text-xs font-bold uppercase tracking-wider opacity-60">検査結果</p>
            <p className="mt-2 text-xl font-bold leading-snug sm:text-2xl">
              {result.findings.length === 0
                ? "指摘はありません。主要な項目はすべて満たしています。"
                : `要修正 ${result.counts.high} 件 / 直したい ${result.counts.mid} 件 / 検討 ${result.counts.low} 件`}
            </p>
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
        </>
      )}
    </div>
  );
}
