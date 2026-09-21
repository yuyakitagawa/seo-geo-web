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
              <p className={cx(EYEBROW.mute, "mb-1.5 text-2xs")}>この部分だけを引用した場合</p>
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
  const [input, setInput] = useState("");
  const [result, setResult] = useState<QuoteReadinessResult | null>(null);
  const [error, setError] = useState("");

  function run(value = input) {
    const next = diagnoseQuoteReadiness(value);
    if (next.blocks.length === 0) {
      setResult(null);
      setError("H2〜H6の見出しが見つかりません。HTMLの<h2>、またはMarkdownの「## 見出し」を含めてください。");
      return;
    }
    setError("");
    setResult(next);
  }

  function loadSample() {
    setInput(SAMPLE);
    setError("");
    setResult(diagnoseQuoteReadiness(SAMPLE));
  }

  return (
    <div className="space-y-8">
      <form
        className={cx(SURFACE.card, PADDING.card)}
        onSubmit={(event) => {
          event.preventDefault();
          run();
        }}
      >
        <label htmlFor="quote-source" className="font-bold">本文のHTMLまたはMarkdown</label>
        <p id="quote-source-help" className="mt-1 text-sm leading-relaxed text-mute">
          記事の本文を貼り付けてください。入力内容は送信・保存されず、このブラウザ内だけで処理されます。
        </p>
        <textarea
          id="quote-source"
          aria-describedby="quote-source-help"
          className={cx(FIELD.text, "mt-4 min-h-64 w-full font-mono")}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={"## 見出し\n\n見出しに対する本文を入力します。"}
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="submit" className={button("invert")} disabled={!input.trim()}>診断する</button>
          <button type="button" className={button("outline")} onClick={loadSample}>サンプルで試す</button>
        </div>
        {error && <p role="alert" className="mt-4 text-sm font-semibold text-news">{error}</p>}
      </form>

      {result && <Result result={result} />}
    </div>
  );
}
