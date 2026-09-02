"use client";

import { useState } from "react";
import { DOMAIN_SEVERITY_LABEL, type DomainFinding, type DomainPowerResult, type DomainSeverity } from "@/lib/domainPower";
import { EYEBROW, FIELD, HEADING, LINK, PADDING, SURFACE, button, cx } from "@/lib/ui";

const SEVERITY_STYLE: Record<DomainSeverity, string> = {
  high: "bg-news text-white",
  mid: "bg-accent text-accent-ink",
  low: "bg-fill-strong text-fg",
  ok: "bg-fill-strong text-fg",
};

function FindingCard({ f }: { f: DomainFinding }) {
  return (
    <article className={cx(SURFACE.outline, "p-6 sm:p-7")}>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2.5 py-1 font-bold ${SEVERITY_STYLE[f.severity]}`}>{DOMAIN_SEVERITY_LABEL[f.severity]}</span>
      </div>
      <h3 className={cx(HEADING.card, "leading-snug")}>{f.title}</h3>
      <p className="mt-2 leading-relaxed text-mute">{f.detail}</p>
      {f.fix && (
        <div className="mt-4 rounded-panel border-l-4 border-accent bg-accent/10 p-4">
          <p className={cx(EYEBROW.mute, "text-2xs")}>やること</p>
          <p className="mt-1 leading-relaxed">{f.fix}</p>
        </div>
      )}
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

function Registration({ r }: { r: NonNullable<DomainPowerResult["registration"]> }) {
  const rows: [string, string][] = [
    ["レジストラ", r.registrar ?? "—"],
    ["最終更新", r.updatedAt ? r.updatedAt.slice(0, 10) : "—"],
    ["状態", r.statuses.length > 0 ? r.statuses.join(" / ") : "—"],
    ["DNSSEC", r.dnssec === null ? "—" : r.dnssec ? "署名あり" : "署名なし"],
    ["ネームサーバー", r.nameservers.length > 0 ? r.nameservers.join("\n") : "—"],
    ["情報源", r.source === "RDAP" ? "RDAP（レジストリの公開データ）" : "JPRS WHOIS"],
  ];
  return (
    <section className={cx(SURFACE.outline, PADDING.card)}>
      <h2 className={HEADING.card}>登録情報</h2>
      <dl className="mt-4 divide-y divide-line text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6">
            <dt className="shrink-0 text-mute sm:w-40">{label}</dt>
            <dd className="whitespace-pre-line break-all font-mono text-xs leading-relaxed sm:text-sm">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function DomainPower() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<DomainPowerResult | null>(null);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/domain-power", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      const data = await res.json();
      if (!res.ok) setError(String(data.error ?? "診断に失敗しました"));
      else setResult(data as DomainPowerResult);
    } catch {
      setError("通信に失敗しました。時間を置いて試してください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={run} className={cx(SURFACE.card, PADDING.card)}>
        <label htmlFor="domain" className="text-sm font-bold">
          診断するドメイン
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            id="domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            inputMode="url"
            spellCheck={false}
            className={cx(FIELD.input, "flex-1")}
          />
          <button
            type="submit"
            disabled={loading || !domain.trim()}
            className={cx(button("invert"), "px-7 py-3 disabled:opacity-40")}
          >
            {loading ? "診断中…" : "診断する"}
          </button>
        </div>
        <p className="mt-3 text-xs text-mute">
          URLを貼っても構いません（https://blog.example.co.jp/a/b は example.co.jp として診断します）。
          サブドメインごとの評価は出ません。被リンクとドメイン年齢はどちらも登録ドメイン単位のデータだからです。
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
            <p className={EYEBROW.faint}>診断結果</p>
            <p className="mt-2 break-all text-xl font-bold leading-snug sm:text-2xl">{result.domain}</p>
            <div className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-3">
              {result.metrics.map((m) => (
                <div key={m.label}>
                  <p className="text-xs opacity-70">{m.label}</p>
                  <p className="mt-0.5 font-mono text-lg font-bold">{m.value}</p>
                  <p className="mt-1 text-2xs leading-snug opacity-60">{m.note}</p>
                </div>
              ))}
            </div>
          </div>

          {result.notes.length > 0 && (
            <ul className={cx(SURFACE.outline, PADDING.tight, "space-y-2 text-sm leading-relaxed text-mute")}>
              {result.notes.map((n) => (
                <li key={n}>・{n}</li>
              ))}
            </ul>
          )}

          {result.registration && <Registration r={result.registration} />}

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
