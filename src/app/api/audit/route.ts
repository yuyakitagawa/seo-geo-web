// URLを1本取得して src/lib/audit.ts で判定するAPI。/tools/page-audit のフォームから呼ばれる。
// 取得（SSRF対策・バイト上限・回数制限）は src/lib/fetchPage.ts が持つ。
import { audit } from "@/lib/audit";
import { logAudit } from "@/lib/audit-log";
import { clientIp, fetchChecked, rateLimited, readCapped } from "@/lib/fetchPage";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  if (rateLimited(clientIp(request))) {
    return Response.json({ error: "短時間に検査しすぎです。1分ほど空けてから試してください。" }, { status: 429 });
  }

  let url: string;
  try {
    const body = (await request.json()) as { url?: unknown };
    url = String(body.url ?? "").trim();
  } catch {
    return Response.json({ error: "リクエストの形式が不正です" }, { status: 400 });
  }
  if (!url) return Response.json({ error: "URLを入力してください" }, { status: 400 });
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  const started = Date.now();
  try {
    const { res, finalUrl, redirects } = await fetchChecked(url, "text/html,application/xhtml+xml");
    const { text: html, bytes } = await readCapped(res);
    const elapsedMs = Date.now() - started;

    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => (headers[k.toLowerCase()] = v));

    const origin = new URL(finalUrl).origin;
    const [robotsTxt, hasLlmsTxt] = await Promise.all([
      fetchChecked(`${origin}/robots.txt`, "text/plain")
        .then(async ({ res: r }) => (r.ok ? (await readCapped(r)).text : null))
        .catch(() => null),
      fetchChecked(`${origin}/llms.txt`, "text/plain")
        .then(({ res: r }) => r.ok)
        .catch(() => false),
    ]);

    const result = audit({ url, finalUrl, status: res.status, headers, html, robotsTxt, hasLlmsTxt, bytes, elapsedMs, redirects });

    await logAudit({
      url: finalUrl,
      status: res.status,
      high: result.counts.high,
      mid: result.counts.mid,
      low: result.counts.low,
      findingIds: result.findings.map((f) => f.id),
      elapsedMs,
    });

    return Response.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "取得に失敗しました";
    const timedOut = /timeout|aborted|signal/i.test(message);
    const error = timedOut ? "取得がタイムアウトしました（12秒）" : message;
    await logAudit({ url, elapsedMs: Date.now() - started, error });
    return Response.json({ error }, { status: 400 });
  }
}
