import assert from "node:assert/strict";
import test from "node:test";
import { audit, type AuditInput, type AuditResult } from "./audit";
import { CHECKLIST_FINDING_IDS, RULE_IDS, siteReport, type SiteReportInput } from "./siteReport";

const HEAD = '<meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>ページのタイトル</title><meta name="description" content="説明">';

function result(over: { url?: string; head?: string; body?: string; redirects?: string[]; status?: number } = {}): AuditResult {
  const { url = "https://example.com/a", head = HEAD, body = "<main><h1>見出し</h1><p>本文</p></main>", redirects = [], status = 200 } = over;
  const input: AuditInput = {
    url,
    finalUrl: url,
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
    html: `<!doctype html><html lang="ja"><head>${head}</head><body>${body}</body></html>`,
    robotsTxt: "User-agent: *\nDisallow:\n\nSitemap: https://example.com/sitemap.xml",
    sitemap: { url: "https://example.com/sitemap.xml", ok: true },
    bytes: 1000,
    elapsedMs: 100,
    redirects,
  };
  return audit(input);
}

function input(pages: { url: string; result: AuditResult | null; error?: string; fromSource?: boolean }[], over: Partial<SiteReportInput> = {}): SiteReportInput {
  return {
    entryUrl: "https://example.com/",
    discovery: "sitemap",
    foundUrls: pages.length,
    sourceUrls: [],
    relatedHosts: [],
    sitemap: { url: "https://example.com/sitemap.xml", ok: true },
    robotsOk: true,
    pages,
    checkedAt: "2026-09-13",
    ...over,
  };
}

test("指摘IDの割り当ては CHECKLIST を網羅する", () => {
  const missing = CHECKLIST_FINDING_IDS.filter((id) => !RULE_IDS.includes(id));
  assert.deepEqual(missing, [], `siteReport.ts の RULES に段・原因・検証指標が無い指摘: ${missing.join(", ")}`);
});

test("割り当て表に、存在しない指摘IDを残さない", () => {
  const stale = RULE_IDS.filter((id) => !CHECKLIST_FINDING_IDS.includes(id));
  assert.deepEqual(stale, [], `audit.ts に無い指摘IDが RULES に残っている: ${stale.join(", ")}`);
});

test("同じ指摘が複数ページに出たら1件に束ね、対象の範囲に件数を書く", () => {
  const pages = [
    { url: "https://example.com/a", result: result({ url: "https://example.com/a" }) },
    { url: "https://example.com/b", result: result({ url: "https://example.com/b", head: HEAD.replace("ページのタイトル", "別のタイトル") }) },
  ];
  const report = siteReport(input(pages));
  const canonical = report.proposals.find((p) => p.id === "canonical");
  assert.ok(canonical, "canonical の指摘が束ねられていること");
  assert.equal(canonical.scope.count, 2);
  assert.equal(canonical.scope.urls.length, 2);
  assert.match(canonical.scope.text, /検査した2ページすべて/);
  assert.equal(canonical.stage, 1);
  assert.ok(canonical.metric.length > 0, "検証指標と時期が入っていること");
  assert.ok(canonical.cause.length > 0, "原因が入っていること");
});

test("段の順に並べる（1段目が先）", () => {
  const pages = [{ url: "https://example.com/a", result: result() }];
  const report = siteReport(input(pages));
  const stages = report.proposals.map((p) => p.stage);
  assert.deepEqual([...stages].sort((a, b) => a - b), stages, "1段目→3段目の順であること");
  assert.equal(report.counts[1] + report.counts[2] + report.counts[3], report.proposals.length);
});

test("同じ title の複数ページを検出する", () => {
  const pages = [
    { url: "https://example.com/a", result: result({ url: "https://example.com/a" }) },
    { url: "https://example.com/b", result: result({ url: "https://example.com/b" }) },
  ];
  const report = siteReport(input(pages));
  const dup = report.proposals.find((p) => p.id === "site-title-duplicate");
  assert.ok(dup, "title の重複を出すこと");
  assert.equal(dup.scope.count, 2);
});

test("title が別なら重複の指摘を出さない", () => {
  const pages = [
    { url: "https://example.com/a", result: result({ url: "https://example.com/a" }) },
    { url: "https://example.com/b", result: result({ url: "https://example.com/b", head: HEAD.replace("ページのタイトル", "別のタイトル").replace("説明", "別の説明") }) },
  ];
  const report = siteReport(input(pages));
  assert.equal(report.proposals.find((p) => p.id === "site-title-duplicate"), undefined);
  assert.equal(report.proposals.find((p) => p.id === "site-description-duplicate"), undefined);
});

test("canonical の指すホストが分かれていたら1段目で出す", () => {
  const pages = [
    { url: "https://example.com/a", result: result({ url: "https://example.com/a", head: `${HEAD}<link rel="canonical" href="https://example.com/a">` }) },
    { url: "https://www.example.com/b", result: result({ url: "https://www.example.com/b", head: `${HEAD}<link rel="canonical" href="https://www.example.com/b">` }) },
  ];
  const report = siteReport(input(pages));
  const mixed = report.proposals.find((p) => p.id === "site-canonical-host");
  assert.ok(mixed, "ホストの混在を出すこと");
  assert.equal(mixed.stage, 1);
  assert.match(mixed.symptom, /www\.example\.com/);
});

test("/index.html が正規URLになっていたら出す", () => {
  const pages = [{ url: "https://example.com/dir/index.html", result: result({ url: "https://example.com/dir/index.html" }) }];
  const report = siteReport(input(pages));
  const dup = report.proposals.find((p) => p.id === "site-index-html");
  assert.ok(dup);
  assert.match(dup.detail, /この診断はディレクトリ側を取得していない/, "取得していない事実を断定せずに書くこと");
});

test("canonical がディレクトリURLを指していれば /index.html の指摘は出さない", () => {
  const pages = [
    {
      url: "https://example.com/dir/index.html",
      result: result({ url: "https://example.com/dir/index.html", head: `${HEAD}<link rel="canonical" href="https://example.com/dir/">` }),
    },
  ];
  const report = siteReport(input(pages));
  assert.equal(report.proposals.find((p) => p.id === "site-index-html"), undefined, "既に一本化されているものを指摘しない");
});

test("リダイレクトされるURLが収集元に残っていたら旧URLとして出す", () => {
  const pages = [{ url: "https://example.com/old", fromSource: true, result: result({ url: "https://example.com/new", redirects: ["https://example.com/new"] }) }];
  const report = siteReport(input(pages));
  const legacy = report.proposals.find((p) => p.id === "site-legacy-url");
  assert.ok(legacy);
  assert.match(legacy.symptom, /サイトマップ/);
  assert.equal(report.pages[0].redirected, true);
});

test("入力されたURLがリダイレクトされただけでは、収集元に旧URLがあるとは言わない", () => {
  // 入力URLはサイトマップにも内部リンクにも載っていないことがある（fromSource が付かない）
  const pages = [{ url: "https://example.com/entry", result: result({ url: "https://example.com/new", redirects: ["https://example.com/new"] }) }];
  const report = siteReport(input(pages));
  assert.equal(report.proposals.find((p) => p.id === "site-legacy-url"), undefined);
  assert.equal(report.pages[0].redirected, true, "一覧にはリダイレクトされた事実を出す");
});

test("一部のページだけ noindex なら出し、全ページなら出さない", () => {
  const noindexHead = `${HEAD}<meta name="robots" content="noindex">`;
  const mixed = siteReport(
    input([
      { url: "https://example.com/a", result: result({ url: "https://example.com/a" }) },
      { url: "https://example.com/b", result: result({ url: "https://example.com/b", head: noindexHead }) },
    ]),
  );
  assert.ok(mixed.proposals.find((p) => p.id === "site-noindex-mixed"));

  const all = siteReport(
    input([
      { url: "https://example.com/a", result: result({ url: "https://example.com/a", head: noindexHead }) },
      { url: "https://example.com/b", result: result({ url: "https://example.com/b", head: noindexHead }) },
    ]),
  );
  assert.equal(all.proposals.find((p) => p.id === "site-noindex-mixed"), undefined, "全ページ共通なら1ページ分の指摘（noindex）で足りる");
});

test("別ホストへのリンクがあれば、エンティティを束ねる提案を3段目で出す", () => {
  const report = siteReport(input([{ url: "https://example.com/a", result: result() }], { relatedHosts: ["home.example.com"] }));
  const hosts = report.proposals.find((p) => p.id === "site-hosts");
  assert.ok(hosts);
  assert.equal(hosts.stage, 3);
  assert.match(hosts.afterCode ?? "", /sameAs/);
});

test("取得できなかったページは一覧に残し、提案の分母に入れない", () => {
  const report = siteReport(
    input([
      { url: "https://example.com/a", result: result({ url: "https://example.com/a" }) },
      { url: "https://example.com/x", result: null, error: "取得がタイムアウトしました（12秒）" },
    ]),
  );
  assert.equal(report.pages.length, 2);
  assert.equal(report.pages[1].error, "取得がタイムアウトしました（12秒）");
  const canonical = report.proposals.find((p) => p.id === "canonical");
  assert.ok(canonical);
  assert.match(canonical.scope.text, /1ページ/, "分母は検査できた1ページ");
});

test("1ページも取得できなくても落ちない", () => {
  const report = siteReport(input([{ url: "https://example.com/a", result: null, error: "取得に失敗しました" }]));
  assert.equal(report.proposals.length, 0);
  assert.equal(report.pages[0].status, 0);
});

/** 構造を数えるのに要る本数（MIN_URLS）を満たすURL一覧を作る */
function manyUrls(paths: string[]): string[] {
  const filler = Array.from({ length: 25 }, (_, i) => `https://example.com/news/${i}`);
  return [...paths, ...filler];
}

test("サイトマップから十分な本数が取れたらディレクトリ構造を数える", () => {
  const report = siteReport(
    input([{ url: "https://example.com/a", result: result() }], { sourceUrls: manyUrls(["https://example.com/"]) }),
  );
  assert.ok(report.structure, "構造を返すこと");
  assert.equal(report.structure.total, 26);
});

test("内部リンク由来のときは構造を数えない", () => {
  const report = siteReport(
    input([{ url: "https://example.com/a", result: result() }], { discovery: "links", sourceUrls: manyUrls([]) }),
  );
  assert.equal(report.structure, null, "数十本の内部リンクでは形が出ないので数えない");
});

test("URLが少なすぎるときは構造を数えない", () => {
  const report = siteReport(
    input([{ url: "https://example.com/a", result: result() }], { sourceUrls: ["https://example.com/", "https://example.com/a"] }),
  );
  assert.equal(report.structure, null);
});

test("分類として働いていない中間ディレクトリを3段目の提案に出す", () => {
  const paths = Array.from({ length: 25 }, (_, i) => `https://example.com/support/faq/${i}`);
  const report = siteReport(input([{ url: "https://example.com/a", result: result() }], { sourceUrls: paths }));
  const dir = report.proposals.find((p) => p.id === "site-redundant-dir");
  assert.ok(dir);
  assert.equal(dir.stage, 3);
  assert.match(dir.symptom, /\/support\/ の下は faq\/ だけ/);
});

test("深い枝が少なければ深さの提案は出さない", () => {
  const report = siteReport(
    input([{ url: "https://example.com/a", result: result() }], { sourceUrls: manyUrls(["https://example.com/a/b/c/d"]) }),
  );
  assert.equal(report.proposals.find((p) => p.id === "site-deep-path"), undefined, "1本だけなら形の問題ではない");
});

test("役割が重なりそうな第1階層を提案に出す", () => {
  const urls = [
    ...Array.from({ length: 15 }, (_, i) => `https://example.com/blog/${i}`),
    ...Array.from({ length: 15 }, (_, i) => `https://example.com/column/${i}`),
  ];
  const report = siteReport(input([{ url: "https://example.com/a", result: result() }], { sourceUrls: urls }));
  const overlap = report.proposals.find((p) => p.id === "site-overlapping-section");
  assert.ok(overlap);
  assert.match(overlap.detail, /中身が別物のこともある/, "断定しないこと");
});
