"use client";

import { useState } from "react";
import type { AiView, AiViewRow } from "@/lib/aiView";
import { AREA_LABEL, CHECKLIST, SEVERITY_LABEL, type Area, type AuditResult, type Finding, type Severity } from "@/lib/audit";
import { HEADING_VERDICT_LABEL, MIN_TEXT, type HeadingFit, type HeadingFitResult, type HeadingVerdict } from "@/lib/headingFit";
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

/** 検査項目の合否。○=指摘なし ×=指摘あり −=判定対象外 */
type Mark = "ok" | "ng" | "na";

const MARK_SIGN: Record<Mark, string> = { ok: "○", ng: "×", na: "−" };
const MARK_STYLE: Record<Mark, string> = { ok: "text-accent", ng: "text-news", na: "text-mute opacity-60" };
const MARK_LABEL: Record<Mark, string> = { ok: "指摘なし", ng: "指摘あり", na: "判定対象外" };

function Checklist({ result }: { result: AuditResult }) {
  const passed = new Set(result.passed);
  const skipped = new Set(result.skipped);
  const found = new Set(result.findings.map((f) => f.id));
  const naCount = CHECKLIST.filter((c) => skipped.has(c.id)).length;
  const ngCount = CHECKLIST.filter((c) => !skipped.has(c.id) && !passed.has(c.id)).length;
  return (
    <div className={cx(SURFACE.card, PADDING.card)}>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className={HEADING.card}>検査した項目</h2>
        <p className="text-sm text-mute">
          <span className="font-bold text-accent">○</span> 指摘なし {result.passed.length}
          <span className="mx-2 opacity-40">/</span>
          <span className="font-bold text-news">×</span> 指摘あり {ngCount}
          <span className="mx-2 opacity-40">/</span>
          <span className="font-bold opacity-60">−</span> 判定対象外 {naCount}
        </p>
      </div>
      <div className="mt-5 grid gap-6 sm:grid-cols-3">
        {AREAS.map((area) => (
          <div key={area}>
            <p className={cx(EYEBROW.mute, "text-2xs")}>{AREA_LABEL[area]}</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {CHECKLIST.filter((c) => c.area === area).map((c) => {
                const mark: Mark = skipped.has(c.id) ? "na" : passed.has(c.id) ? "ok" : "ng";
                const target = c.findingIds.find((id) => found.has(id));
                return (
                  <li key={c.id} className="flex gap-2">
                    <span className={cx("shrink-0 font-bold", MARK_STYLE[mark])} aria-hidden>
                      {MARK_SIGN[mark]}
                    </span>
                    <span className="sr-only">{MARK_LABEL[mark]}:</span>
                    {mark === "ng" && target ? (
                      <a href={`#f-${target}`} className={cx(LINK, "font-medium")}>
                        {c.label}
                      </a>
                    ) : (
                      <span className={mark === "na" ? "text-mute" : undefined}>{c.label}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      {naCount > 0 && (
        <p className="mt-5 border-t border-line pt-4 text-sm text-mute">
          −（判定対象外）は、前提が揃わないため合格にも不合格にも数えていない項目です。本文が短いページ、robots.txt が取れないサイトのほか、
          一覧・規約・フォームのように「そもそも入れるべきでない」ページでは、質問と回答・原文の引用・公開日を判定しません。
        </p>
      )}
    </div>
  );
}

const KIND_CHIP: Record<AiViewRow["kind"], { style: string; label: string }> = {
  gap: { style: "bg-news text-white", label: "AIには届かない" },
  extra: { style: "bg-accent text-accent-ink", label: "画面に出ないがAIには届く" },
  same: { style: "bg-fill-strong text-fg", label: "同じものが届く" },
};

/** 人が見る画面とAIクローラーが受け取るHTMLの差。同じURLでも中身が違うことを左右で見せる */
function AiViewPanel({ view }: { view: AiView }) {
  const gaps = view.rows.filter((r) => r.kind === "gap").length;
  return (
    <div className={cx(SURFACE.card, PADDING.card)}>
      <h2 className={HEADING.card}>人が見るページと、AIが受け取るページ</h2>
      <p className="mt-2 text-sm leading-relaxed text-mute">
        AI検索のクローラーの多くはJavaScriptを実行せず、画面も見ません。サーバーが返したHTMLの文字だけを読みます。
        同じURLでも、人が見ているものとAIが受け取るものはこれだけ違います
        {gaps > 0 ? `（AIに届いていないもの ${gaps}件）` : "（AIに届いていないものはありません）"}。
      </p>
      <ul className="mt-5 space-y-3">
        {view.rows.map((r) => (
          <li key={r.label} className={cx("rounded-panel border p-4", r.kind === "gap" ? "border-news/40 bg-news/5" : "border-line")}>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold">{r.label}</p>
              <span className={cx("rounded-full px-2 py-0.5 text-2xs font-bold", KIND_CHIP[r.kind].style)}>{KIND_CHIP[r.kind].label}</span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-panel bg-fill p-3">
                <p className={cx(EYEBROW.mute, "text-2xs")}>ブラウザ（人が見るもの）</p>
                <p className="mt-1 text-sm leading-relaxed">{r.human}</p>
              </div>
              <div className="rounded-panel bg-fill p-3">
                <p className={cx(EYEBROW.mute, "text-2xs")}>AIクローラー（受け取るもの）</p>
                <p className="mt-1 text-sm leading-relaxed">{r.ai}</p>
              </div>
            </div>
            {r.code && <pre className={cx(CODE, "mt-3")}>{r.code}</pre>}
          </li>
        ))}
      </ul>
    </div>
  );
}

const VERDICT_STYLE: Record<HeadingVerdict, string> = {
  ok: "bg-fill-strong text-fg",
  weak: "bg-accent text-accent-ink",
  off: "bg-news text-white",
};

/** 語が本文に出てくるか。○=そのまま出てくる △=一部だけ ×=出てこない */
const HIT_SIGN = { full: "○", partial: "△", none: "×" } as const;
const HIT_STYLE = { full: "text-accent", partial: "text-mute", none: "text-news" } as const;
const HIT_LABEL = { full: "本文にある", partial: "一部だけある", none: "本文に無い" } as const;

function HeadingRow({ f }: { f: HeadingFit }) {
  return (
    <li className={cx("rounded-panel border p-4", f.verdict === "off" ? "border-news/40 bg-news/5" : "border-line")}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-sm bg-fill px-1.5 py-0.5 font-mono text-2xs text-mute">H{f.level}</span>
        <p className="text-sm font-bold leading-snug">{f.heading}</p>
        <span className={cx("rounded-full px-2 py-0.5 text-2xs font-bold", VERDICT_STYLE[f.verdict])}>
          {HEADING_VERDICT_LABEL[f.verdict]}
        </span>
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {f.terms.map((t) => (
          <li key={t.term} className="flex items-center gap-1.5">
            <span className={cx("font-bold", HIT_STYLE[t.hit])} aria-hidden>
              {HIT_SIGN[t.hit]}
            </span>
            <span className="sr-only">{HIT_LABEL[t.hit]}:</span>
            <span className="font-mono text-xs">{t.term}</span>
          </li>
        ))}
      </ul>
      {f.lead && (
        <p className="mt-2.5 text-xs leading-relaxed text-mute">
          <span className="font-medium">見出しの直後</span>: {f.lead.slice(0, 90)}
          {f.lead.length > 90 && "…"}
        </p>
      )}
      <p className="mt-1.5 text-2xs text-mute">
        近さ <span className="font-mono">{f.closeness.toFixed(2)}</span>（参考。判定には使っていません）
      </p>
    </li>
  );
}

/**
 * 見出しと本文の対応。**測り方をそのまま画面に出す**（何を見て判定したかが分からないと直せない）。
 * 指摘は「噛み合っていない」ものだけだが、ここでは判定した見出しを全部並べる。
 */
function HeadingFitPanel({ r }: { r: HeadingFitResult }) {
  const off = r.fits.filter((f) => f.verdict === "off").length;
  const weak = r.fits.filter((f) => f.verdict === "weak").length;
  return (
    <div className={cx(SURFACE.card, PADDING.card)}>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className={HEADING.card}>見出しと本文の対応</h2>
        <p className="text-sm text-mute">
          判定した見出し {r.fits.length}
          {off > 0 && (
            <>
              <span className="mx-2 opacity-40">/</span>
              <span className="font-bold text-news">噛み合っていない {off}</span>
            </>
          )}
          {weak > 0 && (
            <>
              <span className="mx-2 opacity-40">/</span>
              弱い {weak}
            </>
          )}
        </p>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-mute">
        h1〜h4 の見出しごとに、<strong className="text-fg">見出しから取り出した語が、その下の本文に出てくるか</strong>
        を見ています（○ そのまま出てくる／△ 一部だけ／× 出てこない）。
        <strong className="text-fg">1つも出てこない見出しだけを指摘</strong>しています。
        見出しと本文の「近さ」（文字bigramのTF-IDFのコサイン類似度）も出しますが、
        <strong className="text-fg">判定には使っていません</strong>
        。近さの数値を見せられても直しようがないためです。
        AI検索は見出しごとのまとまりを抜き出して回答に使うので、見出しが中身を言い当てていないと、その見出しで拾われても答えになりません。
      </p>
      <ul className="mt-5 space-y-3">
        {r.fits.map((f) => (
          <HeadingRow key={`${f.level}-${f.heading}`} f={f} />
        ))}
      </ul>
      {r.skipped > 0 && (
        <p className="mt-5 border-t border-line pt-4 text-sm leading-relaxed text-mute">
          {r.skipped}個の見出しは判定していません。「まとめ」「はじめに」のような定型の見出しと、本文が{MIN_TEXT}字未満の節です。
          どちらも見出しの語が本文に出てこないのが当たり前で、判定すると直す必要のない指摘が並ぶためです。
        </p>
      )}
    </div>
  );
}

function FindingCard({ f }: { f: Finding }) {
  return (
    <article id={`f-${f.id}`} className={cx(SURFACE.outline, "scroll-mt-24 p-6 sm:p-7")}>
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

          <Checklist result={result} />

          <AiViewPanel view={result.aiView} />

          {result.headings.fits.length > 0 && <HeadingFitPanel r={result.headings} />}

          {result.head200 && (
            <div className={cx(SURFACE.outline, PADDING.tight)}>
              <p className={cx(EYEBROW.mute, "text-2xs")}>AI検索に渡る先頭200字</p>
              <p className="mt-2 text-sm leading-relaxed opacity-80">
                AI検索のスニペットは、本文を抽出したうえでその先頭を一定字数で切ったものです。ここに何が入っているかで、AIが書く紹介文が変わります。ヘッダー・ナビ・フッターを除いて先頭200字を切り出しています。
                {result.h1Offset === null
                  ? "このページは、最初の見出しがこの範囲に入っていません。"
                  : `このページは、最初の見出しまでに ${result.h1Offset} 字使っています。`}
              </p>
              <p className={cx(CODE, "mt-3 whitespace-pre-wrap break-words")}>
                {result.head200}
                <span className="opacity-40">…</span>
              </p>
            </div>
          )}

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
