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
import { buildLinkGraph, type CrawledPage, type LinkGraph } from "../src/lib/linkGraph";
import {
  AUDIT_DEADLINE_WITH_LINKS_MS,
  CONCURRENCY,
  CRAWL_CONCURRENCY,
  CRAWL_DEADLINE_MS,
  CRAWL_MAX_PAGES,
  DEADLINE_MS,
  extractLinks,
  isPageUrl,
  MAX_PAGES,
  normalizeUrlKey,
  parseSitemap,
  pickPages,
} from "../src/lib/siteCrawl";
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

/**
 * 入口ページから内部リンクを幅優先でたどり、「どのページからどこへリンクしているか」を集める。
 * **判定はしない**（audit() にはかけない）。リンクを取るだけなので1ページあたりの処理は軽い。
 * 上限（ページ数・期限）に達したら打ち切り、打ち切ったことを truncated で返す。
 */
async function crawlLinks(
  entry: { url: string; html: string },
  deadline: number,
): Promise<{ pages: CrawledPage[]; truncated: boolean }> {
  const origin = new URL(entry.url).origin;
  const seen = new Set<string>([normalizeUrlKey(entry.url)]);
  const entryLinks = extractLinks(entry.html, entry.url);
  const pages: CrawledPage[] = [
    { url: entry.url, status: 200, links: entryLinks.internal, bodyLinks: entryLinks.bodyInternal, depth: 0 },
  ];

  const sameOriginPage = (u: string) => {
    try {
      return new URL(u).origin === origin && isPageUrl(u);
    } catch {
      return false;
    }
  };

  let frontier = entryLinks.internal.filter(sameOriginPage);
  let depth = 1;
  let truncated = false;

  while (frontier.length > 0 && depth <= 10) {
    const next = frontier.filter((u) => !seen.has(normalizeUrlKey(u)));
    if (next.length === 0) break;
    const room = CRAWL_MAX_PAGES - pages.length;
    if (room <= 0 || Date.now() > deadline) {
      truncated = true;
      break;
    }
    const batch = next.slice(0, room);
    if (batch.length < next.length) truncated = true;
    for (const u of batch) seen.add(normalizeUrlKey(u));

    const results = await mapLimit(batch, CRAWL_CONCURRENCY, async (target): Promise<CrawledPage | null> => {
      const left = deadline - Date.now();
      if (left <= 0) return null;
      try {
        const { res, finalUrl } = await fetchChecked(target, HTML_ACCEPT, Math.min(TIMEOUT_MS, left));
        if (!res.ok) {
          // 本文は読まない（リンクを取る必要がないので、読む分の時間とメモリを使わない）
          await res.body?.cancel();
          return { url: target, status: res.status, links: [], bodyLinks: [], depth };
        }
        const body = await readCapped(res);
        const links = extractLinks(body.text, finalUrl);
        return { url: target, status: res.status, links: links.internal, bodyLinks: links.bodyInternal, depth };
      } catch {
        return null;
      }
    });

    const got = results.filter((p): p is CrawledPage => p !== null);
    pages.push(...got);
    if (Date.now() > deadline) {
      truncated = true;
      break;
    }
    frontier = got.flatMap((p) => p.links).filter(sameOriginPage);
    depth++;
  }

  return { pages, truncated };
}

function errorMessage(e: unknown): string {
  const message = e instanceof Error ? e.message : "取得に失敗しました";
  return /timeout|aborted|signal/i.test(message) ? "取得がタイムアウトしました（12秒）" : message;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: "サイト診断のフォームから実行してください" }, { status: 403 });
  }
  // 1回で最大8ページ取りに行くので、ページ診断（5回）より厳しくする。
  // リンク構造まで調べる実行は最大80ページ取りに行くため、さらに厳しくする（rateLimited の判定より前に読む必要があるので後述）。
  const ip = clientIp(request);

  let url: string;
  let withLinks = false;
  try {
    const body = (await request.json()) as { url?: unknown; links?: unknown };
    url = String(body.url ?? "").trim();
    withLinks = body.links === true;
  } catch {
    return Response.json({ error: "リクエストの形式が不正です" }, { status: 400 });
  }
  if (!url) return Response.json({ error: "URLを入力してください" }, { status: 400 });
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  // 取りに行くページ数が桁違いなので、リンク構造まで調べる実行は1分1回に絞る
  if (rateLimited(ip, withLinks ? 1 : 2)) {
    return Response.json({ error: "短時間に検査しすぎです。1分ほど空けてから試してください。" }, { status: 429 });
  }

  const started = Date.now();
  // 判定する8ページの取得と、リンク構造のクロールで期限を分ける。
  // リンク構造まで調べるときは、前半（判定）を短く切って後半（クロール）の時間を残す。
  const deadline = started + (withLinks ? AUDIT_DEADLINE_WITH_LINKS_MS : DEADLINE_MS);
  const crawlDeadline = started + CRAWL_DEADLINE_MS;

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

    // リンク構造は選ばれたときだけ。ここで初めて取得ページ数が増える
    const linkGraph: LinkGraph | null = withLinks
      ? buildLinkGraph({
          entryUrl: entry.finalUrl,
          ...(await crawlLinks({ url: entry.finalUrl, html: entryBody.text }, crawlDeadline)),
          sitemapUrls: sameOriginSitemapUrls,
        })
      : null;

    const report = siteReport({
      entryUrl: entry.finalUrl,
      discovery,
      foundUrls: candidates.length,
      // 取得はしない。文字列を数えてディレクトリ構造を出すだけ（src/lib/siteStructure.ts）
      sourceUrls: candidates,
      linkGraph,
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
