import assert from "node:assert/strict";
import test from "node:test";
import { audit, type AuditInput } from "./audit";

const HEAD = '<meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>テスト記事のタイトル｜サイト名</title><meta name="description" content="説明"><link rel="canonical" href="https://example.com/blog/1">';

function input(over: Partial<AuditInput> & { body?: string; head?: string } = {}): AuditInput {
  const { body = "", head = HEAD, ...rest } = over;
  return {
    url: "https://example.com/blog/1",
    finalUrl: "https://example.com/blog/1",
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
    html: `<!doctype html><html lang="ja"><head>${head}</head><body>${body}</body></html>`,
    robotsTxt: "User-agent: *\nDisallow:\n\nSitemap: https://example.com/sitemap.xml",
    hasLlmsTxt: true,
    sitemap: { url: "https://example.com/sitemap.xml", ok: true },
    bytes: 1000,
    elapsedMs: 300,
    redirects: [],
    ...rest,
  };
}

const ids = (i: AuditInput) => audit(i).findings.map((f) => f.id);

test("sitemap: 取得できなければ指摘し、確認したURLを添える", () => {
  const r = audit(input({ sitemap: { url: "https://example.com/sitemap.xml", ok: false } }));
  const f = r.findings.find((x) => x.id === "sitemap");
  assert.ok(f);
  assert.match(f.code ?? "", /https:\/\/example\.com\/sitemap\.xml/);
  assert.ok(!ids(input()).includes("sitemap"));
});

test("charset: meta にもヘッダーにも無いときだけ指摘する", () => {
  const noMeta = HEAD.replace('<meta charset="utf-8">', "");
  assert.ok(ids(input({ head: noMeta, headers: { "content-type": "text/html" } })).includes("charset"));
  assert.ok(!ids(input({ head: noMeta })).includes("charset"));
  assert.ok(!ids(input({ headers: { "content-type": "text/html" } })).includes("charset"));
});

test("breadcrumb: JSON-LD があって BreadcrumbList が無い下層ページを指摘する", () => {
  const article = '<script type="application/ld+json">{"@type":"Article","headline":"h","datePublished":"2026-01-01","author":{"name":"a"}}</script>';
  assert.ok(ids(input({ head: HEAD + article })).includes("breadcrumb"));
  const withCrumb = article + '<script type="application/ld+json">{"@type":"BreadcrumbList"}</script>';
  assert.ok(!ids(input({ head: HEAD + withCrumb })).includes("breadcrumb"));
  // JSON-LD 自体が無いページは jsonld の指摘に含めるので、breadcrumb は重ねて出さない
  assert.ok(!ids(input()).includes("breadcrumb"));
});

test("article-props: author が無い Article を指摘する", () => {
  const noAuthor = '<script type="application/ld+json">{"@type":"Article","headline":"h","datePublished":"2026-01-01"}</script>';
  const f = audit(input({ head: HEAD + noAuthor })).findings.find((x) => x.id === "article-props");
  assert.ok(f);
  assert.match(f.title, /author/);
});

const LONG = "<p>" + "この段落は本文の量を確保するための文章です。".repeat(40) + "</p>";

test("internal-links: nav のリンクは数えず、本文中の内部リンクが少なければ指摘する", () => {
  const nav = '<nav><a href="/">home</a><a href="/a">a</a><a href="/b">b</a><a href="/c">c</a></nav>';
  const withNavOnly = nav + LONG + '<a href="/about">運営者情報</a>';
  assert.ok(ids(input({ body: withNavOnly })).includes("internal-links"));
  const withBodyLinks = withNavOnly + '<p><a href="/x">x</a><a href="/y">y</a><a href="https://example.com/z">z</a></p>';
  assert.ok(!ids(input({ body: withBodyLinks })).includes("internal-links"));
});

test("operator-link: 運営者情報・連絡先に辿れるリンクが無ければ指摘する", () => {
  assert.ok(ids(input({ body: LONG })).includes("operator-link"));
  assert.ok(!ids(input({ body: LONG + '<footer><a href="/company/">会社概要</a></footer>' })).includes("operator-link"));
  assert.ok(!ids(input({ body: LONG + '<a href="/x">プライバシーポリシー</a>' })).includes("operator-link"));
  // 短いページには出さない
  assert.ok(!ids(input({ body: "<p>短い本文です。</p>" })).includes("operator-link"));
});

test("passed / skipped: 指摘の無い項目は passed、前提が揃わない項目は skipped に入る", () => {
  const r = audit(input({ body: "<main><h1>見出し</h1><p>短い本文です。</p></main>" }));
  assert.ok(r.passed.includes("title"));
  assert.ok(r.passed.includes("h1"));
  assert.ok(r.passed.includes("semantic"));
  // 本文が短いので内部リンク・出典・引用は判定しない
  for (const id of ["internal-links", "citation", "geo-quotation", "geo-statistics", "operator-link"]) {
    assert.ok(r.skipped.includes(id), id);
    assert.ok(!r.passed.includes(id), id);
  }
  // thin-html は指摘に出るので passed に入らない
  assert.ok(r.findings.some((f) => f.id === "thin-html"));
  assert.ok(!r.passed.includes("thin-html"));
});

test("nosnippet: meta robots か X-Robots-Tag に nosnippet / max-snippet:0 があれば指摘する", () => {
  assert.ok(ids(input({ head: HEAD + '<meta name="robots" content="nosnippet">' })).includes("nosnippet"));
  assert.ok(ids(input({ headers: { "x-robots-tag": "max-snippet:0" } })).includes("nosnippet"));
  assert.ok(!ids(input({ head: HEAD + '<meta name="robots" content="max-snippet:160, max-image-preview:large">' })).includes("nosnippet"));
});

test("canonical-other: 別URLを指す canonical を指摘し、末尾スラッシュ違いは同一とみなす", () => {
  const other = HEAD.replace('href="https://example.com/blog/1"', 'href="https://example.com/blog/2"');
  assert.ok(ids(input({ head: other })).includes("canonical-other"));
  const slash = HEAD.replace('href="https://example.com/blog/1"', 'href="https://example.com/blog/1/"');
  assert.ok(!ids(input({ head: slash })).includes("canonical-other"));
});

test("title-description-same: title と description が同一文なら指摘する", () => {
  const same = HEAD.replace('content="説明"', 'content="テスト記事のタイトル｜サイト名"');
  assert.ok(ids(input({ head: same })).includes("title-description-same"));
  assert.ok(!ids(input()).includes("title-description-same"));
});

test("ogp: 足りない項目名を列挙し、4つ揃えば出さない", () => {
  const f = audit(input()).findings.find((x) => x.id === "ogp");
  assert.ok(f);
  assert.match(f.title, /og:title/);
  assert.match(f.title, /twitter:card/);
  const full =
    HEAD +
    '<meta property="og:title" content="t"><meta property="og:description" content="d"><meta property="og:image" content="https://example.com/i.png"><meta name="twitter:card" content="summary_large_image">';
  assert.ok(!ids(input({ head: full })).includes("ogp"));
});

test("semantic: main / article が無ければ指摘する", () => {
  assert.ok(ids(input({ body: "<div><p>本文</p></div>" })).includes("semantic"));
  assert.ok(!ids(input({ body: "<article><p>本文</p></article>" })).includes("semantic"));
});

test("organization: JSON-LD に Organization / Person / publisher が無ければ指摘し、JSON-LD 自体が無ければ判定しない", () => {
  const article = '<script type="application/ld+json">{"@type":"Article","headline":"h","datePublished":"2026-01-01","author":{"name":"a"}}</script>';
  assert.ok(ids(input({ head: HEAD + article })).includes("organization"));
  const withPublisher = article.replace('"author"', '"publisher":{"@id":"https://example.com/#organization"},"author"');
  assert.ok(!ids(input({ head: HEAD + withPublisher })).includes("organization"));
  const r = audit(input());
  assert.ok(!ids(input()).includes("organization"));
  assert.ok(r.skipped.includes("organization"));
});

test("anchor-text: 「こちら」等が全リンクの1割を超えれば指摘する", () => {
  const vague = '<p><a href="/a">こちら</a><a href="/b">詳しくはこちら</a><a href="/c">料金プランの比較表</a></p>';
  assert.ok(ids(input({ body: LONG + vague })).includes("anchor-text"));
  const named = '<p><a href="/a">料金</a><a href="/b">導入手順</a><a href="/c">こちら</a>' + '<a href="/d">x</a>'.repeat(10) + "</p>";
  assert.ok(!ids(input({ body: LONG + named })).includes("anchor-text"));
});
