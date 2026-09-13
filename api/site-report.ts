// Vercel Functions（ルート直下の api/）。api/audit.ts と同じ制約が効く。
// api/tsconfig.json（module: commonjs）を消さないこと。@/ は使わず相対 import にする。
//
// サイトを数ページ取得して /tools/site-report の提案書を作るAPI。
// 1回で複数ページを取りに行くため、api/audit.ts より費用の効き方が大きい。次の3つを外さない：
//   1. sameOrigin()：サイトのフォーム以外からは実行しない
//   2. rateLimited()：1分あたりの実行回数（ページ診断より厳しくする）
//   3. MAX_PAGES / DEADLINE_MS：取得するページ数と全体の期限
// どれを外しても、関数の実行時間がそのまま費用になる。
import { audit, type AuditResult } from "../src/lib/audit";
import { logAudit } from "../src/lib/audit-log";
import { fetchChecked, readCapped, TIMEOUT_MS } from "../src/lib/fetchPage";
import { clientIp, rateLimited, sameOrigin } from "../src/lib/rateLimit";
import { parseRobots } from "../src/lib/robots";
import { CONCURRENCY, DEADLINE_MS, extractLinks, MAX_PAGES, parseSitemap, pickPages } from "../src/lib/siteCrawl";
import { siteReport, type SiteReportInput } from "../src/lib/siteReport";

const HTML_ACCEPT = "text/html,application/xhtml+xml";

/** 同時実行数を絞って順に処理する。相手のサーバーにも自分の関数時間にも上限を置く */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const index = next++;
      if (index >= items.length) return;
      out[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return out;
}

function errorMessage(e: unknown): string {
  const message = e instanceof Error ? e.message : "取得に失敗しました";
  return /timeout|aborted|signal/i.test(message) ? "取得がタイムアウトしました（12秒）" : message;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: "サイト診断のフォームから実行してください" }, { status: 403 });
  }
  // 1回で最大8ページ取りに行くので、ページ診断（5回）より厳しくする
  if (rateLimited(clientIp(request), 2)) {
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
  const deadline = started + DEADLINE_MS;

  try {
    // ---- 入口ページ ----
    const entry = await fetchChecked(url, HTML_ACCEPT);
    const entryBody = await readCapped(entry.res);
    if (entryBody.truncated) return Response.json({ error: "ページのHTMLが大きすぎます（上限2MB）" }, { status: 413 });
    const entryElapsed = Date.now() - started;

    const origin = new URL(entry.finalUrl).origin;

    // ---- サイト共通（robots.txt・サイトマップ）----
    const robotsTxt = await fetchChecked(`${origin}/robots.txt`, "text/plain")
      .then(async ({ res }) => (res.ok ? (await readCapped(res)).text : null))
      .catch(() => null);

    const sitemapUrl = (robotsTxt ? parseRobots(robotsTxt).sitemaps[0] : undefined) ?? `${origin}/sitemap.xml`;
    let sitemapOk = false;
    let sitemapUrls: string[] = [];
    try {
      const { res } = await fetchChecked(sitemapUrl, "application/xml,text/xml,text/plain");
      if (res.ok) {
        sitemapOk = true;
        const parsed = parseSitemap((await readCapped(res)).text);
        if (parsed.isIndex && parsed.urls[0]) {
          // サイトマップの索引なら、子を1本だけ辿る（全部辿ると本数が読めない）
          const child = await fetchChecked(parsed.urls[0], "application/xml,text/xml,text/plain");
          if (child.res.ok) sitemapUrls = parseSitemap((await readCapped(child.res)).text).urls;
        } else {
          sitemapUrls = parsed.urls;
        }
      }
    } catch {
      sitemapOk = false;
    }

    // ---- 検査するページを決める ----
    const links = extractLinks(entryBody.text, entry.finalUrl);
    const sameOriginSitemapUrls = sitemapUrls.filter((u) => {
      try {
        return new URL(u).origin === origin;
      } catch {
        return false;
      }
    });
    const discovery: "sitemap" | "links" = sameOriginSitemapUrls.length > 0 ? "sitemap" : "links";
    const candidates = discovery === "sitemap" ? sameOriginSitemapUrls : links.internal;
    const targets = pickPages(entry.finalUrl, candidates, MAX_PAGES);
    // 入力されたURLとトップページは候補に無くても必ず検査する。「サイトマップや内部リンクに残った旧URL」の
    // 指摘は収集元に載っていたURLだけが対象なので、どちらから来たURLかをここで分けておく。
    const fromSource = new Set(candidates);

    const auditOne = (input: {
      url: string;
      finalUrl: string;
      status: number;
      headers: Record<string, string>;
      html: string;
      bytes: number;
      elapsedMs: number;
      redirects: string[];
    }): AuditResult =>
      audit({ ...input, robotsTxt, sitemap: { url: sitemapUrl, ok: sitemapOk } });

    const headersOf = (res: Response): Record<string, string> => {
      const out: Record<string, string> = {};
      res.headers.forEach((v, k) => (out[k.toLowerCase()] = v));
      return out;
    };

    // 入口ページは取得済みなので取り直さない
    const pages: SiteReportInput["pages"] = [
      {
        url: entry.finalUrl,
        fromSource: fromSource.has(entry.finalUrl),
        result: auditOne({
          url,
          finalUrl: entry.finalUrl,
          status: entry.res.status,
          headers: headersOf(entry.res),
          html: entryBody.text,
          bytes: entryBody.bytes,
          elapsedMs: entryElapsed,
          redirects: entry.redirects,
        }),
      },
    ];

    const rest = targets.filter((t) => t !== entry.finalUrl);
    const fetched = await mapLimit(rest, CONCURRENCY, async (target): Promise<SiteReportInput["pages"][number]> => {
      // 期限を過ぎたら取りに行かない。取れた分だけで提案書を作る
      const left = deadline - Date.now();
      if (left <= 0) return { url: target, fromSource: fromSource.has(target), result: null, error: "時間内に検査できませんでした" };
      const at = Date.now();
      try {
        // 残り時間を渡す。取得1本が期限をまたいで走り続けると、関数ごと落ちて取れた分も返せない
        const { res, finalUrl, redirects } = await fetchChecked(target, HTML_ACCEPT, Math.min(TIMEOUT_MS, left));
        const body = await readCapped(res);
        if (body.truncated) return { url: target, fromSource: fromSource.has(target), result: null, status: res.status, error: "HTMLが大きすぎます（上限2MB）" };
        return {
          url: target,
          fromSource: fromSource.has(target),
          result: auditOne({
            url: target,
            finalUrl,
            status: res.status,
            headers: headersOf(res),
            html: body.text,
            bytes: body.bytes,
            elapsedMs: Date.now() - at,
            redirects,
          }),
        };
      } catch (e) {
        return { url: target, fromSource: fromSource.has(target), result: null, error: errorMessage(e) };
      }
    });
    pages.push(...fetched);

    const report = siteReport({
      entryUrl: entry.finalUrl,
      discovery,
      foundUrls: candidates.length,
      // 取得はしない。文字列を数えてディレクトリ構造を出すだけ（src/lib/siteStructure.ts）
      sourceUrls: candidates,
      relatedHosts: links.relatedHosts,
      sitemap: { url: sitemapUrl, ok: sitemapOk },
      robotsOk: robotsTxt !== null,
      pages,
      checkedAt: new Date().toISOString().slice(0, 10),
    });

    // 記録するのは入口URLのホストとパスだけ（audit-log.ts がクエリ・IP・UAを落とす）
    await logAudit({
      url: entry.finalUrl,
      status: entry.res.status,
      high: report.counts[1],
      mid: report.counts[2],
      low: report.counts[3],
      findingIds: report.proposals.map((p) => p.id),
      elapsedMs: Date.now() - started,
    });

    return Response.json(report);
  } catch (e) {
    const error = errorMessage(e);
    await logAudit({ url, elapsedMs: Date.now() - started, error });
    return Response.json({ error }, { status: 400 });
  }
}
