import assert from "node:assert/strict";
import test from "node:test";
import { extractLinks, parseSitemap, pickPages, sameSite, siteKey } from "./siteCrawl";

test("siteKey は2階層のサフィックスを1つの登録ドメインとして扱う", () => {
  assert.equal(siteKey("www.tokyo-gas.co.jp"), "tokyo-gas.co.jp");
  assert.equal(siteKey("home.tokyo-gas.co.jp"), "tokyo-gas.co.jp");
  assert.equal(siteKey("example.com"), "example.com");
  assert.equal(siteKey("blog.example.com"), "example.com");
  assert.equal(sameSite("www.tokyo-gas.co.jp", "home.tokyo-gas.co.jp"), true);
  assert.equal(sameSite("example.com", "example.net"), false);
});

test("sitemapindex と urlset を見分ける", () => {
  const index = '<?xml version="1.0"?><sitemapindex><sitemap><loc>https://example.com/sitemap-1.xml</loc></sitemap></sitemapindex>';
  assert.deepEqual(parseSitemap(index), { urls: ["https://example.com/sitemap-1.xml"], isIndex: true });

  const set = "<urlset><url><loc>https://example.com/a</loc></url><url><loc>https://example.com/b?x=1&amp;y=2</loc></url></urlset>";
  const parsed = parseSitemap(set);
  assert.equal(parsed.isIndex, false);
  assert.deepEqual(parsed.urls, ["https://example.com/a", "https://example.com/b?x=1&y=2"]);
});

test("内部リンクと、同じ登録ドメインの別ホストを分けて取る", () => {
  const html = `<a href="/a">A</a><a href="/a#top">同じURL</a><a href="https://home.example.co.jp/b">別ホスト</a><a href="https://other.com/c">外部</a><a href="mailto:x@example.co.jp">メール</a>`;
  const { internal, relatedHosts } = extractLinks(html, "https://www.example.co.jp/");
  assert.deepEqual(internal, ["https://www.example.co.jp/a"]);
  assert.deepEqual(relatedHosts, ["home.example.co.jp"]);
});

test("入口URLとトップページを必ず入れ、ディレクトリが散るように選ぶ", () => {
  const candidates = [
    "https://example.com/news/1",
    "https://example.com/news/2",
    "https://example.com/news/3",
    "https://example.com/support/faq",
    "https://example.com/company/about",
  ];
  const picked = pickPages("https://example.com/news/1", candidates, 4);
  assert.equal(picked[0], "https://example.com/news/1");
  assert.equal(picked[1], "https://example.com/");
  assert.ok(picked.includes("https://example.com/support/faq"), "別のディレクトリを先に取ること");
  assert.ok(picked.includes("https://example.com/company/about"));
  assert.equal(picked.length, 4);
});

test("画像やPDFのURLは選ばない", () => {
  const picked = pickPages("https://example.com/", ["https://example.com/a.pdf", "https://example.com/b.png", "https://example.com/c"], 8);
  assert.deepEqual(picked, ["https://example.com/", "https://example.com/c"]);
});

test("候補が少なくても上限より多く返さない", () => {
  const picked = pickPages("https://example.com/", [], 8);
  assert.deepEqual(picked, ["https://example.com/"]);
});
