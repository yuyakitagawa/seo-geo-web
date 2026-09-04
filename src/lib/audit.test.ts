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
