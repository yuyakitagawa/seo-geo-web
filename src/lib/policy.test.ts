// 公開ページに書いてある「取り扱い」と、実装の一致を検査する。
//
// CLAUDE.md には「audit-log.ts の記録内容を変えたら /tools/page-audit の FAQ と /privacy も同時に直す」と
// 書いてあるが、破っても何も落ちない。実際に /privacy は「Vercel Analytics および Vercel Speed Insights を
// 利用しています」と書いたままだった（@vercel/analytics は 2026-09-04 に依存ごと削除済み）。
// プライバシーポリシーの記述と実装のずれは、そのまま虚偽の説明になる。ここで機械的に見張る。
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { AUDIT_LOG_RETENTION_DAYS } from "./audit-log";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

const PRIVACY = read("src/app/(ja)/privacy/page.tsx");
const PAGE_AUDIT = read("src/app/(ja)/tools/page-audit/page.tsx");
const LAYOUT = read("src/app/(ja)/layout.tsx");
const AUDIT_LOG = read("src/lib/audit-log.ts");
const PACKAGE = JSON.parse(read("package.json")) as { dependencies: Record<string, string> };

test("保持日数をページに直書きしていない", () => {
  // 直書きすると audit-log.ts 側を変えたときに説明だけ古いまま残る
  for (const [name, source] of [["/privacy", PRIVACY], ["/tools/page-audit", PAGE_AUDIT]] as const) {
    const hardcoded = source.match(/\d+日/g) ?? [];
    assert.deepEqual(hardcoded, [], `${name} は AUDIT_LOG_RETENTION_DAYS を参照すること（見つかった: ${hardcoded.join(", ")}）`);
  }
});

test("保持日数の説明が両方のページに載っている", () => {
  assert.ok(PRIVACY.includes("AUDIT_LOG_RETENTION_DAYS"), "/privacy に保持日数の説明が無い");
  assert.ok(PAGE_AUDIT.includes("AUDIT_LOG_RETENTION_DAYS"), "/tools/page-audit に保持日数の説明が無い");
  assert.ok(AUDIT_LOG_RETENTION_DAYS > 0);
});

test("/privacy が挙げる計測ツールを実際に使っている", () => {
  // 「使っていないものを書いている」と「使っているのに書いていない」の両方を落とす
  const tools: { name: string; mentioned: boolean; used: boolean }[] = [
    {
      name: "Vercel Analytics",
      mentioned: /Vercel Analytics/.test(PRIVACY),
      used: "@vercel/analytics" in PACKAGE.dependencies,
    },
    {
      name: "Vercel Speed Insights",
      mentioned: /Speed Insights/.test(PRIVACY),
      used: LAYOUT.includes("SpeedInsights"),
    },
    {
      name: "Google アナリティクス",
      mentioned: /Google アナリティクス/.test(PRIVACY),
      used: LAYOUT.includes("GoogleAnalytics"),
    },
  ];
  const wrong = tools.filter((t) => t.mentioned !== t.used);
  assert.deepEqual(
    wrong.map((t) => `${t.name}: ${t.mentioned ? "/privacy に書いてあるが使っていない" : "使っているが /privacy に書いていない"}`),
    []
  );
});

test("「クエリ文字列は保存しない」の説明どおりに実装されている", () => {
  assert.ok(PRIVACY.includes("クエリ文字列"), "/privacy にクエリ文字列の記載が無い");
  assert.ok(PAGE_AUDIT.includes("クエリ文字列"), "/tools/page-audit にクエリ文字列の記載が無い");
  // 送信しているのは hostname と pathname だけ。search / href を渡すと説明が虚偽になる
  assert.ok(/u\.pathname/.test(AUDIT_LOG), "audit-log.ts が pathname を使っていない");
  assert.ok(!/u\.search|u\.href|u\.toString\(\)/.test(AUDIT_LOG), "audit-log.ts がクエリ文字列を含むURLを送っている");
});
