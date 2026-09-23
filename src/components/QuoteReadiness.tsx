"use client";

import { useState } from "react";
import { diagnoseQuoteReadiness, type QuoteBlockResult, type QuoteCheckStatus, type QuoteReadinessResult } from "@/lib/quoteReadiness";
import { BADGE, CODE, EYEBROW, FIELD, HEADING, PADDING, SURFACE, button, cx } from "@/lib/ui";

const SAMPLE = `## GEOで引用しやすい文章とは

引用しやすい文章とは、対象と結論が一つの段落で完結している文章です。前後の文脈から切り離しても意味が変わらないため、回答の根拠として扱いやすくなります。

## 書き方のポイント

この記事では、具体的な書き方を詳しく解説します。

## 数値を書くときの注意点

そのため、調査条件も一緒に書くことが重要です。`;

const VERDICT: Record<QuoteBlockResult["verdict"], { label: string; className: string }> = {
  ready: { label: "切り出せる", className: "bg-geo text-white" },
  review: { label: "要確認", className: "bg-accent text-accent-ink" },
  weak: { label: "切り出しにくい", className: "bg-news text-white" },
};

const CHECK_MARK: Record<QuoteCheckStatus, string> = { pass: "○", warn: "△", fail: "×" };
const CHECK_STYLE: Record<QuoteCheckStatus, string> = {
  pass: "text-geo",
  warn: "text-mute",
  fail: "text-news",
};

function Result({ result }: { result: QuoteReadinessResult }) {
  return (
    <section className="space-y-5" aria-live="polite">
      <div className={cx(SURFACE.invert, PADDING.card)}>
        <p className={EYEBROW.faint}>診断結果</p>
        <p className="mt-3 text-2xl font-bold">{result.blocks.length}個の見出しブロック</p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <span>切り出せる <strong>{result.counts.ready}</strong></span>
          <span>要確認 <strong>{result.counts.review}</strong></span>
          <span>切り出しにくい <strong>{result.counts.weak}</strong></span>
        </div>
      </div>

      {result.blocks.map((block, index) => {
        const verdict = VERDICT[block.verdict];
        return (
          <article key={`${block.heading}-${index}`} className={cx(SURFACE.outline, PADDING.card)}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-mute">H{block.level}</span>
              <span className={cx(BADGE.sm, verdict.className)}>{verdict.label}</span>
            </div>
            <h3 className={cx(HEADING.card, "mt-3 leading-snug")}>{block.heading}</h3>

            <div className="mt-5">
              <p className={cx(EYEBROW.mute, "mb-1.5 text-2xs")}>見出し直後の本文（最初の1〜3文）</p>
              {block.candidate ? <blockquote className={CODE}>{block.candidate}</blockquote> : <p className="text-sm text-news">引用候補がありません。</p>}
            </div>

            <ul className="mt-5 space-y-3">
              {block.checks.map((check) => (
                <li key={check.id} className="flex gap-3 text-sm">
                  <span className={cx("font-bold", CHECK_STYLE[check.status])} aria-label={check.status}>{CHECK_MARK[check.status]}</span>
                  <span>
                    <strong>{check.label}</strong>
                    <span className="mt-0.5 block leading-relaxed text-mute">{check.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </article>
        );
      })}
    </section>
  );
}

export default function QuoteReadiness() {
  const [url, setUrl] = useState("");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<QuoteReadinessResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [diagnosedUrl, setDiagnosedUrl] = useState("");

  async function runUrl(event: React.FormEvent) {
    event.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    setDiagnosedUrl("");
    try {
      const response = await fetch("/api/quote-readiness", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await response.json();
      if (!response.ok) setError(String(data.error ?? "診断に失敗しました"));
      else {
        setResult(data as QuoteReadinessResult);
        setDiagnosedUrl(String(data.finalUrl ?? url.trim()));
      }
    } catch {
      setError("通信に失敗しました。時間を置いて試してください。");
    } finally {
      setLoading(false);
    }
  }

  function run(value = input) {
    const next = diagnoseQuoteReadiness(value);
    if (next.blocks.length === 0) {
      setResult(null);
      setError("H1〜H4の見出しが見つかりません。HTMLの<h1>〜<h4>、またはMarkdownの「# 見出し」〜「#### 見出し」を含めてください。");
      return;
    }
    setError("");
    setDiagnosedUrl("");
    setResult(next);
  }

  function loadSample() {
    setInput(SAMPLE);
    setError("");
    setDiagnosedUrl("");
    setResult(diagnoseQuoteReadiness(SAMPLE));
  }

  return (
    <div className="space-y-8">
      <form className={cx(SURFACE.card, PADDING.card)} onSubmit={runUrl}>
        <label htmlFor="quote-url" className="font-bold">診断するページのURL</label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            id="quote-url"
            className={cx(FIELD.input, "flex-1")}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/article"
            inputMode="url"
            spellCheck={false}
          />
          <button type="submit" className={cx(button("invert"), "px-7 py-3 disabled:opacity-40")} disabled={!url.trim() || loading}>
            {loading ? "取得・診断中…" : "URLを診断する"}
          </button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-mute">
          公開ページのHTMLをサーバーから取得し、記事本文内にあるH1〜H4と、その直後の本文を診断します。JavaScriptで後から表示される本文は取得できません。
        </p>
        {error && <p role="alert" className="mt-4 rounded-panel border border-news/40 bg-news/10 p-4 text-sm font-semibold text-news">{error}</p>}
      </form>

      <details className={cx(SURFACE.outline, PADDING.tight)}>
        <summary className="cursor-pointer font-bold">HTML・Markdownを直接貼り付けて診断する</summary>
        <form
          className="mt-5 border-t border-line pt-5"
          onSubmit={(event) => {
            event.preventDefault();
            run();
          }}
        >
          <label htmlFor="quote-source" className="font-bold">本文のHTMLまたはMarkdown</label>
          <p id="quote-source-help" className="mt-1 text-sm leading-relaxed text-mute">
            下書きなど、まだ公開URLがない文章に使えます。入力内容は送信・保存されず、このブラウザ内だけで処理されます。
          </p>
          <textarea
            id="quote-source"
            aria-describedby="quote-source-help"
            className={cx(FIELD.text, "mt-4 min-h-64 w-full font-mono")}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={"# 見出し\n\n見出しに対する本文を入力します。"}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="submit" className={button("invert")} disabled={!input.trim()}>貼り付けた内容を診断する</button>
            <button type="button" className={button("outline")} onClick={loadSample}>サンプルで試す</button>
          </div>
        </form>
      </details>

      {result && (
        <div className="space-y-4">
          {diagnosedUrl && <p className="break-all text-xs text-mute">診断したページ: {diagnosedUrl}</p>}
          <Result result={result} />
        </div>
      )}
    </div>
  );
}
