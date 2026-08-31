"use client";

import { useState } from "react";
import { PRESETS } from "@/lib/crawlers";

/**
 * 方針から robots.txt のひな形を出し、コピーできるようにする。
 * 中身は `crawlers.ts` の PRESETS（公式ドキュメントで確認したトークンだけで組み立てる）。
 */
export default function RobotsPresets() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="not-prose my-10 grid gap-4 lg:grid-cols-3">
      {PRESETS.map((p) => {
        const value = p.build();
        return (
          <div key={p.key} className="flex flex-col rounded-3xl border border-ink/10 p-5 dark:border-paper/10">
            <p className="font-bold leading-snug">{p.label}</p>
            <p className="mt-1 text-xs leading-relaxed text-mute">{p.lead}</p>
            <pre className="mt-4 max-h-56 flex-1 overflow-auto rounded-2xl bg-ink/5 p-3 font-mono text-[11px] leading-relaxed dark:bg-paper/10">{value}</pre>
            <button
              type="button"
              onClick={() => copy(value, p.key)}
              className="mt-3 self-start rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-paper transition hover:opacity-80 dark:bg-paper dark:text-ink"
            >
              {copied === p.key ? "コピーしました" : "コピー"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
