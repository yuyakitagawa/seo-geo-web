"use client";

import { useState } from "react";
import { INTENT_LABEL, VERDICT_LABEL, type PromptFit, type PromptFitResult, type TermHit, type Verdict } from "@/lib/promptFit";
import { CODE, EYEBROW, FIELD, HEADING, PADDING, SURFACE, button, cx } from "@/lib/ui";

const VERDICT_STYLE: Record<Verdict, string> = {
  covered: "bg-fill-strong text-fg",
  weak: "bg-accent text-accent-ink",
  missing: "bg-news text-white",
};

const HIT_STYLE: Record<TermHit["hit"], string> = {
  full: "border-line-strong text-mute",
  partial: "border-accent bg-accent/15 text-fg",
  none: "border-news bg-news/10 text-news",
};

const HIT_LABEL: Record<TermHit["hit"], string> = { full: "本文にある", partial: "近い語だけある", none: "本文に無い" };

function Bar({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-bold">{label}</span>
        <span className="font-mono text-mute">{value}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-fill-strong">
        <div className="h-full rounded-full bg-invert" style={{ width: `${Math.max(2, value)}%` }} />
      </div>
      <p className="mt-1 text-2xs leading-snug text-mute">{note}</p>
    </div>
  );
}

function FitCard({ f }: { f: PromptFit }) {
  return (
    <article className={cx(SURFACE.outline, "p-6 sm:p-7")}>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2.5 py-1 font-bold ${VERDICT_STYLE[f.verdict]}`}>{VERDICT_LABEL[f.verdict]}</span>
        <span className="rounded-full border border-line-strong px-2.5 py-1 font-medium text-mute">{INTENT_LABEL[f.intent]}</span>
        <span className="ml-auto font-mono text-lg font-bold">{f.fit}</span>
      </div>
      <h3 className={cx(HEADING.card, "leading-snug")}>{f.prompt}</h3>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Bar label="語の一致" value={f.coverage} note="プロンプトの語が本文にどれだけ出てくるか" />
        <Bar label="近さ" value={f.nearness} note="最も近い見出しブロックとの距離（文字bigramのTF-IDF）" />
        <Bar label="直答" value={f.answer ? 100 : 0} note="そのブロックの先頭に結論の1文があるか" />
      </div>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {f.terms.map((t) => (
          <span key={t.term} className={`rounded-full border px-2.5 py-1 text-xs ${HIT_STYLE[t.hit]}`} title={HIT_LABEL[t.hit]}>
            {t.term}
            <span className="ml-1 opacity-60">{t.hit === "full" ? "✓" : t.hit === "partial" ? "△" : "✕"}</span>
          </span>
        ))}
      </div>

      {f.best && (
        <div className="mt-5">
          <p className={cx(EYEBROW.mute, "mb-1.5 text-2xs")}>このプロンプトを担当しているブロック</p>
          <p className="font-bold leading-snug">{f.best.heading}</p>
          <p className="mt-1 text-sm leading-relaxed text-mute">{f.best.excerpt}…</p>
        </div>
      )}

      {f.answer ? (
        <div className="mt-4">
          <p className={cx(EYEBROW.mute, "mb-1.5 text-2xs")}>引用されうる直答</p>
          <p className="rounded-panel bg-fill p-4 text-sm leading-relaxed">{f.answer}</p>
        </div>
      ) : (
        <p className="mt-4 rounded-panel bg-fill p-4 text-sm leading-relaxed">
          担当ブロックの先頭に、このプロンプトへの直答が見つかりません。AI検索は先頭の1〜2文を引用します。
        </p>
      )}

      {f.formats.map((c) => (
        <p key={c.label} className="mt-3 text-sm leading-relaxed">
          <span className={`mr-2 font-bold ${c.ok ? "text-mute" : "text-news"}`}>{c.ok ? "OK" : "不足"}</span>
          <span className="font-bold">{c.label}</span>
          <span className="text-mute">: {c.detail}</span>
        </p>
      ))}

      {f.verdict !== "covered" && (
        <div className="mt-5 rounded-panel border-l-4 border-accent bg-accent/10 p-4">
          <p className={cx(EYEBROW.mute, "text-2xs")}>修正方針</p>
          <p className="mt-1 leading-relaxed">{f.fix.note}</p>
          <p className="mt-2 text-sm leading-relaxed text-mute">入れる場所: {f.fix.where}</p>
          {f.fix.add.length > 0 && (
            <p className="mt-2 text-sm leading-relaxed text-mute">本文に入れる語: {f.fix.add.join("、")}</p>
          )}
          <pre className={cx(CODE, "mt-3 whitespace-pre-wrap bg-canvas")}>
            {`${f.fix.heading}\n\n${f.fix.template}`}
          </pre>
        </div>
      )}
    </article>
  );
}

export default function PromptFit() {
  const [mode, setMode] = useState<"url" | "text">("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [prompts, setPrompts] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PromptFitResult | null>(null);

  const filled = prompts.trim() && (mode === "url" ? url.trim() : text.trim());

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filled || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/prompt-fit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url: mode === "url" ? url.trim() : "",
          text: mode === "text" ? text : "",
          prompts: prompts.split("\n"),
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(String(data.error ?? "判定に失敗しました"));
      else setResult(data as PromptFitResult);
    } catch {
      setError("通信に失敗しました。時間を置いて試してください。");
    } finally {
      setLoading(false);
    }
  };

  const tab = (value: "url" | "text", label: string) => (
    <button
      type="button"
      onClick={() => setMode(value)}
      className={`rounded-full px-4 py-2 text-sm font-bold transition ${
        mode === value ? "bg-invert text-invert-fg" : "border border-line-strong text-mute"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-8">
      <form onSubmit={run} className={cx(SURFACE.card, PADDING.card)}>
        <div className="flex gap-2">
          {tab("url", "公開中のURL")}
          {tab("text", "原稿を貼り付け")}
        </div>

        {mode === "url" ? (
          <div className="mt-5">
            <label htmlFor="pf-url" className="text-sm font-bold">
              確認するページのURL
            </label>
            <input
              id="pf-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article/1"
              inputMode="url"
              spellCheck={false}
              className={cx(FIELD.input, "mt-3 w-full")}
            />
          </div>
        ) : (
          <div className="mt-5">
            <label htmlFor="pf-text" className="text-sm font-bold">
              ページの原稿（見出しは # や ## を付けたまま貼れます）
            </label>
            <textarea
              id="pf-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder={"# 見出し\n本文…"}
              className={cx(FIELD.text, "mt-3 w-full")}
            />
          </div>
        )}

        <div className="mt-5">
          <label htmlFor="pf-prompts" className="text-sm font-bold">
            狙っているプロンプト（1行に1本・5本まで）
          </label>
          <textarea
            id="pf-prompts"
            value={prompts}
            onChange={(e) => setPrompts(e.target.value)}
            rows={5}
            placeholder={"GEOとSEOの違いは？\nAI検索に引用されるにはどうすればいい？\n中小企業のGEO対策の費用は？"}
            className={cx(FIELD.text, "mt-3 w-full")}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !filled}
          className={cx(button("invert"), "mt-5 px-7 py-3 disabled:opacity-40")}
        >
          {loading ? "判定中…" : "適合度を見る"}
        </button>
        <p className="mt-3 text-xs text-mute">
          計算はすべてサーバー内で完結します。外部のAIや埋め込みAPIには送りません。入力したURL・原稿・プロンプトは保存しません。
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
            <p className={EYEBROW.faint}>判定結果</p>
            <p className="mt-2 text-xl font-bold leading-snug sm:text-2xl">
              答えている {result.counts.covered} 本 / 弱い {result.counts.weak} 本 / 答えていない {result.counts.missing} 本
            </p>
            {result.title && <p className="mt-3 leading-snug opacity-80">{result.title}</p>}
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 text-sm opacity-80">
              <div>
                <dt className="text-xs opacity-70">本文</dt>
                <dd className="font-mono">{result.textLength.toLocaleString()} 字</dd>
              </div>
              <div>
                <dt className="text-xs opacity-70">見出しブロック</dt>
                <dd className="font-mono">{result.blocks.length}</dd>
              </div>
            </dl>
            <p className="mt-4 break-all font-mono text-xs opacity-60">{result.source}</p>
          </div>

          {result.textLength < 400 && (
            <p className="rounded-panel border border-news/40 bg-news/10 p-4 text-sm leading-relaxed text-news">
              本文がほとんど取れていません。JavaScriptで本文を描画している場合、AI検索のクローラーにも同じように見えていません。
            </p>
          )}

          <div className="space-y-4">
            {result.fits.map((f) => (
              <FitCard key={f.prompt} f={f} />
            ))}
          </div>

          <section className={cx(SURFACE.outline, "p-6 sm:p-7")}>
            <h3 className={HEADING.card}>ページが実際に多く語っている語</h3>
            <p className="mt-2 text-sm leading-relaxed text-mute">
              赤い語は、狙ったプロンプトのどれにも出てこない語です。ここに紙面を使っているほど、ページの中身は狙いから離れています。
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {result.focus.map((t) => (
                <span
                  key={t.term}
                  className={`rounded-full border px-2.5 py-1 text-xs ${t.targeted ? "border-line-strong text-mute" : "border-news bg-news/10 text-news"}`}
                >
                  {t.term}
                  <span className="ml-1 opacity-60">{t.count}</span>
                </span>
              ))}
            </div>
          </section>

          {result.overlaps.length > 0 && (
            <section className={cx(SURFACE.outline, "p-6 sm:p-7")}>
              <h3 className={HEADING.card}>1つのブロックが複数のプロンプトを兼任しています</h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">
                同じブロックが複数のプロンプトの受け皿になっています。プロンプトごとに見出しを分けると、AIがどちらの質問にも引用しやすくなります。
              </p>
              <ul className="mt-4 space-y-3 text-sm">
                {result.overlaps.map((o) => (
                  <li key={o.heading}>
                    <span className="font-bold">{o.heading || "（見出しなしの冒頭）"}</span>
                    <span className="text-mute">: {o.prompts.join(" / ")}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
