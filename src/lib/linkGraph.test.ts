import assert from "node:assert/strict";
import test from "node:test";
import { buildLinkGraph, type CrawledPage, type LinkGraphInput } from "./linkGraph";

function page(over: Partial<CrawledPage> & { url: string }): CrawledPage {
  return { status: 200, links: [], bodyLinks: [], depth: 0, ...over };
}

function input(pages: CrawledPage[], over: Partial<LinkGraphInput> = {}): LinkGraphInput {
  return { entryUrl: "https://example.com/", pages, truncated: false, sitemapUrls: [], ...over };
}

test("入口からの距離を数える", () => {
  const g = buildLinkGraph(
    input([
      page({ url: "https://example.com/", depth: 0 }),
      page({ url: "https://example.com/a", depth: 1 }),
      page({ url: "https://example.com/b", depth: 1 }),
      page({ url: "https://example.com/a/1", depth: 2 }),
    ]),
  );
  assert.deepEqual(g.depths, [
    { depth: 0, count: 1 },
    { depth: 1, count: 2 },
    { depth: 2, count: 1 },
  ]);
  assert.equal(g.crawled, 4);
});

test("被リンクが薄いページを出す（入口は除く）", () => {
  const g = buildLinkGraph(
    input([
      page({ url: "https://example.com/", links: ["https://example.com/a"], bodyLinks: ["https://example.com/a"] }),
      page({ url: "https://example.com/a", depth: 1, links: ["https://example.com/b"], bodyLinks: ["https://example.com/b"] }),
      page({ url: "https://example.com/b", depth: 2 }),
    ]),
  );
  assert.deepEqual(
    g.weak.map((w) => w.url),
    ["https://example.com/a", "https://example.com/b"],
  );
  assert.equal(g.weak.every((w) => w.inbound === 1), true);
});

test("末尾スラッシュの違いで被リンクを数え落とさない", () => {
  const g = buildLinkGraph(
    input([
      page({ url: "https://example.com/", links: ["https://example.com/a/", "https://example.com/a/"] }),
      page({ url: "https://example.com/b", links: ["https://example.com/a"] }),
      page({ url: "https://example.com/a", depth: 1 }),
    ]),
  );
  const a = g.weak.find((w) => w.url === "https://example.com/a");
  assert.equal(a, undefined, "2ページからリンクされているので薄くない");
});

test("ナビ・フッターからしかリンクされていないページを出す", () => {
  const g = buildLinkGraph(
    input([
      page({ url: "https://example.com/", links: ["https://example.com/x", "https://example.com/y"], bodyLinks: ["https://example.com/y"] }),
      page({ url: "https://example.com/x", depth: 1 }),
      page({ url: "https://example.com/y", depth: 1 }),
    ]),
  );
  assert.deepEqual(g.navOnly, ["https://example.com/x"]);
});

test("サイトマップにあるのにリンクされていないURLを候補として出す", () => {
  const g = buildLinkGraph(
    input([page({ url: "https://example.com/", links: ["https://example.com/a"] }), page({ url: "https://example.com/a", depth: 1 })], {
      sitemapUrls: ["https://example.com/", "https://example.com/a", "https://example.com/lonely"],
    }),
  );
  assert.deepEqual(g.orphanCandidates, ["https://example.com/lonely"]);
});

test("打ち切ったかどうかをそのまま返す（断定させないため）", () => {
  const g = buildLinkGraph(input([page({ url: "https://example.com/" })], { truncated: true }));
  assert.equal(g.truncated, true);
});

test("200以外を返したURLと、そこへのリンク元を出す", () => {
  const g = buildLinkGraph(
    input([
      page({ url: "https://example.com/", links: ["https://example.com/gone"] }),
      page({ url: "https://example.com/gone", status: 404, depth: 1 }),
    ]),
  );
  assert.deepEqual(g.broken, [{ url: "https://example.com/gone", status: 404, from: ["https://example.com/"] }]);
});

test("自分から自分へのリンクは被リンクに数えない", () => {
  const g = buildLinkGraph(
    input([
      page({ url: "https://example.com/", links: ["https://example.com/"] }),
      page({ url: "https://example.com/a", depth: 1, links: ["https://example.com/a/"] }),
    ]),
  );
  const a = g.weak.find((w) => w.url === "https://example.com/a");
  assert.equal(a?.inbound, 0);
});
