"use client";

import { useMemo, useState } from "react";
import { CRAWLERS, PRESETS, PURPOSE, PURPOSE_ORDER, type Crawler } from "@/lib/crawlers";
import { check, parseRobots } from "@/lib/robots";

const SAMPLE = `User-agent: *
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php

User-agent: GPTBot
Disallow: /

User-agent: CCBot
Disallow: /

Sitemap: https://example.com/sitemap.xml`;

function Verdict({ allowed }: { allowed: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${
        allowed ? "bg-accent text-accent-ink" : "bg-news text-white"
      }`}
    >
      {allowed ? "許可" : "ブロック"}
    </span>
  );
}

export default function AiCrawlerChecker() {
  const [text, setText] = useState("");
  const [path, setPath] = useState("/");
  const [copied, setCopied] = useState<string | null>(null);

  const robots = useMemo(() => parseRobots(text), [text]);
  const results = useMemo(
    () => CRAWLERS.map((c) => ({ crawler: c, result: check(robots, c.token, path.trim() || "/") })),
    [robots, path]
  );

  const blockedAiSearch = results.filter((r) => r.crawler.purpose === "ai-search" && !r.result.allowed).length;
  const aiSearchTotal = CRAWLERS.filter((c) => c.purpose === "ai-search").length;
  const hasInput = text.trim().length > 0;

  const copy = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-ink/10 bg-white p-6 dark:border-paper/10 dark:bg-white/5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <label htmlFor="robots" className="text-sm font-bold">
            robots.txt の中身を貼り付ける
          </label>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setText(SAMPLE)}
              className="rounded-full border border-ink/15 px-3 py-1.5 font-medium transition hover:bg-ink hover:text-paper dark:border-paper/15 dark:hover:bg-paper dark:hover:text-ink"
            >
              例を入れる
            </button>
            <button
              type="button"
              onClick={() => setText("")}
              className="rounded-full border border-ink/15 px-3 py-1.5 font-medium transition hover:bg-ink hover:text-paper dark:border-paper/15 dark:hover:bg-paper dark:hover:text-ink"
            >
              消す
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-mute">
          自分のサイトの <code className="rounded bg-ink/5 px-1 py-0.5 dark:bg-paper/10">https://（ドメイン）/robots.txt</code> をブラウザで開き、表示された全文をそのまま貼ってください。
          このツールはブラウザの中だけで判定します（入力はどこにも送信されません）。
        </p>
        <textarea
          id="robots"
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          rows={10}
          placeholder={"User-agent: *\nDisallow: /wp-admin/"}
          className="mt-4 w-full resize-y rounded-2xl border border-ink/15 bg-paper p-4 font-mono text-sm leading-relaxed outline-none focus:border-accent dark:border-paper/15 dark:bg-ink"
        />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label htmlFor="path" className="text-sm font-bold">
            判定するパス
          </label>
          <input
            id="path"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            spellCheck={false}
            className="w-64 rounded-full border border-ink/15 bg-paper px-4 py-2 font-mono text-sm outline-none focus:border-accent dark:border-paper/15 dark:bg-ink"
          />
          <span className="text-xs text-mute">例: /articles/12</span>
        </div>
      </div>

      {hasInput && (
        <>
          <div className="rounded-3xl bg-ink p-6 text-paper dark:bg-paper dark:text-ink sm:p-8">
            <p className="text-xs font-bold uppercase tracking-wider opacity-60">判定結果</p>
            <p className="mt-2 text-xl font-bold leading-snug sm:text-2xl">
              {blockedAiSearch === 0
                ? `AI検索のクローラー${aiSearchTotal}種はすべて ${path} を読めます。`
                : `AI検索のクローラー${aiSearchTotal}種のうち${blockedAiSearch}種が ${path} をブロックされています。`}
            </p>
            {robots.sitemaps.length > 0 && (
              <p className="mt-3 text-sm opacity-70">Sitemap 宣言: {robots.sitemaps.join(" / ")}</p>
            )}
            {robots.sitemaps.length === 0 && <p className="mt-3 text-sm opacity-70">Sitemap の宣言がありません。</p>}
          </div>

          {PURPOSE_ORDER.map((purpose) => {
            const rows = results.filter((r) => r.crawler.purpose === purpose);
            return (
              <section key={purpose}>
                <h3 className="text-lg font-bold tracking-tight">{PURPOSE[purpose].label}</h3>
                <p className="mb-4 mt-1 text-sm text-mute">{PURPOSE[purpose].lead}</p>
                <div className="overflow-x-auto rounded-3xl border border-ink/10 dark:border-paper/10">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-ink/5 text-left text-xs uppercase tracking-wider text-mute dark:bg-paper/5">
                      <tr>
                        <th className="px-4 py-3">クローラー</th>
                        <th className="px-4 py-3">判定</th>
                        <th className="px-4 py-3">根拠</th>
                        <th className="px-4 py-3">ブロックすると</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(({ crawler, result }) => (
                        <tr key={crawler.token} className="border-t border-ink/10 align-top dark:border-paper/10">
                          <td className="px-4 py-4">
                            <code className="font-mono text-sm font-semibold">{crawler.token}</code>
                            <div className="mt-1 text-xs text-mute">{crawler.vendor}</div>
                          </td>
                          <td className="px-4 py-4">
                            <Verdict allowed={result.allowed} />
                          </td>
                          <td className="px-4 py-4 text-xs text-mute">
                            {result.reason}
                            {result.token && result.token !== crawler.token.toLowerCase() && (
                              <div className="mt-1">
                                適用グループ: <code className="font-mono">User-agent: {result.token}</code>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-xs text-mute">{crawler.ifBlocked}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </>
      )}

      <section>
        <h3 className="text-lg font-bold tracking-tight">方針からrobots.txtを作る</h3>
        <p className="mb-4 mt-1 text-sm text-mute">
          このツールが載せているクローラーだけを対象にしたひな形です。既存の記述がある場合は、置き換えずに必要な行だけ足してください。
        </p>
        <div className="grid gap-4 lg:grid-cols-3">
          {PRESETS.map((p) => {
            const value = p.build();
            return (
              <div key={p.key} className="flex flex-col rounded-3xl border border-ink/10 p-5 dark:border-paper/10">
                <p className="font-bold">{p.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-mute">{p.lead}</p>
                <pre className="mt-4 max-h-56 flex-1 overflow-auto rounded-2xl bg-ink/5 p-3 font-mono text-[11px] leading-relaxed dark:bg-paper/10">{value}</pre>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => copy(value, p.key)}
                    className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-paper transition hover:opacity-80 dark:bg-paper dark:text-ink"
                  >
                    {copied === p.key ? "コピーしました" : "コピー"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setText(value)}
                    className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold transition hover:bg-ink hover:text-paper dark:border-paper/15 dark:hover:bg-paper dark:hover:text-ink"
                  >
                    上で判定する
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
