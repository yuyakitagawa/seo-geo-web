// Vercel Functions（ルート直下の api/）。Next.js は output: "export" で API ルートを持てないためここに置く。
// URL は /api/audit のまま。実行時間の上限は vercel.json の functions に書く。tsconfig の @/ は Vercel の
// ビルダーで解決されない可能性があるので、ここから届く範囲は相対 import にしている。
// api/tsconfig.json（module: commonjs）は消さない。ルートの tsconfig（module: esnext）で変換されると
// 関数が ESM として出力され、拡張子無しの相対 import を Node が読めず FUNCTION_INVOCATION_FAILED になる
// （2026-09-04 の本番で発生。vercel build → node で .vercel/output/functions/api/audit.func/api/audit.js を require して再現できる）。
// URLを1本取得して src/lib/audit.ts で判定するAPI。/tools/page-audit のフォームから呼ばれる。
// 取得（SSRF対策・バイト上限）は src/lib/fetchPage.ts、回数制限は src/lib/rateLimit.ts が持つ。
//
// 判定本体（audit.ts）と取得（fetchPage.ts）は**ハンドラの中で読み込む**。理由は2つ。
//   1. sameOrigin / rateLimited で弾くリクエストでは読み込まない（関数の実行時間がそのまま費用になる）
//   2. **読み込みに失敗したときに理由をJSONで返せる**。モジュールの読み込み時に落ちると Vercel は
//      素のHTMLで 500 を返し、画面には「サーバーがJSONを返しませんでした」としか出ず、
//      本番だけ壊れたときに原因が分からない（2026-09-04・2026-09-14 に実際に困った）
import { clientIp, rateLimited, sameOrigin } from "../src/lib/rateLimit";

async function loadParts() {
  const [auditMod, logMod, fetchMod, robotsMod] = await Promise.all([
    import("../src/lib/audit"),
    import("../src/lib/audit-log"),
    import("../src/lib/fetchPage"),
    import("../src/lib/robots"),
  ]);
  return {
    audit: auditMod.audit,
    logAudit: logMod.logAudit,
    fetchChecked: fetchMod.fetchChecked,
    readCapped: fetchMod.readCapped,
    parseRobots: robotsMod.parseRobots,
  };
}

export async function POST(request: Request) {
  // サイトのフォーム以外からの直接呼び出しは受けない（関数実行を無駄に増やさないため）。
  if (!sameOrigin(request)) {
    return Response.json({ error: "ページ診断のフォームから実行してください" }, { status: 403 });
  }
  if (rateLimited(clientIp(request))) {
    return Response.json({ error: "短時間に検査しすぎです。1分ほど空けてから試してください。" }, { status: 429 });
  }

  let parts: Awaited<ReturnType<typeof loadParts>>;
  try {
    parts = await loadParts();
  } catch (e) {
    // ここが落ちるのは本番の関数だけが壊れている状態。原因をそのまま返す（握りつぶすと調べようがない）
    const detail = e instanceof Error ? `${e.message}` : String(e);
    return Response.json({ error: `検査の読み込みに失敗しました: ${detail}` }, { status: 500 });
  }
  const { audit, logAudit, fetchChecked, readCapped, parseRobots } = parts;

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
    const { text: html, bytes, truncated } = await readCapped(res);
    if (truncated) return Response.json({ error: "ページのHTMLが大きすぎます（上限2MB）" }, { status: 413 });
    const elapsedMs = Date.now() - started;

    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => (headers[k.toLowerCase()] = v));

    const origin = new URL(finalUrl).origin;
    const robotsTxt = await fetchChecked(`${origin}/robots.txt`, "text/plain")
      .then(async ({ res: r }) => (r.ok ? (await readCapped(r)).text : null))
      .catch(() => null);

    // サイトマップは robots.txt の Sitemap 行を優先し、無ければ /sitemap.xml を見る（本文は読まず、200かどうかだけ）
    const sitemapUrl = (robotsTxt ? parseRobots(robotsTxt).sitemaps[0] : undefined) ?? `${origin}/sitemap.xml`;
    const sitemapOk = await fetchChecked(sitemapUrl, "application/xml,text/xml,text/plain")
      .then(({ res: r }) => r.ok)
      .catch(() => false);

    const result = audit({
      url,
      finalUrl,
      status: res.status,
      headers,
      html,
      robotsTxt,
      sitemap: { url: sitemapUrl, ok: sitemapOk },
      bytes,
      elapsedMs,
      redirects,
    });

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
