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

test("第1階層どうしの本文リンクをマス目用に集計する", () => {
  const all = (urls: string[]) => ({ links: urls, bodyLinks: urls });
  const g = buildLinkGraph(
    input([
      page({ url: "https://example.com/", ...all(["https://example.com/blog/1", "https://example.com/about"]) }),
      page({ url: "https://example.com/blog/1", depth: 1, ...all(["https://example.com/blog/2", "https://example.com/"]) }),
      page({ url: "https://example.com/blog/2", depth: 2 }),
      page({ url: "https://example.com/about", depth: 1 }),
    ]),
  );
  assert.deepEqual(g.sections, [
    { name: "blog", pages: 2 },
    { name: "/", pages: 1 },
    { name: "about", pages: 1 },
  ]);
  const find = (from: string, to: string) => g.sectionLinks.find((l) => l.from === from && l.to === to)?.count ?? 0;
  assert.equal(find("/", "blog"), 1);
  assert.equal(find("/", "about"), 1);
  assert.equal(find("blog", "blog"), 1, "同じ階層の中のリンクも数える");
  assert.equal(find("blog", "/"), 1);
  assert.equal(find("about", "blog"), 0, "リンクが無い組は出てこない＝マス目が空になる");
});

test("ナビ・フッターのリンクはマス目に数えない", () => {
  // ナビは全ページから同じ形で出る。数えるとどのマスも埋まり、本文の設計が見えなくなる
  const g = buildLinkGraph(
    input([
      page({ url: "https://example.com/", links: ["https://example.com/about"], bodyLinks: [] }),
      page({ url: "https://example.com/about", depth: 1 }),
    ]),
  );
  assert.deepEqual(g.sectionLinks, [], "ナビからのリンクだけならマス目は空");
});

test("第1階層が多いときは「その他」にまとめる", () => {
  const many = Array.from({ length: 10 }, (_, i) =>
    page({ url: `https://example.com/s${i}/a`, depth: 1, links: ["https://example.com/"], bodyLinks: ["https://example.com/"] }),
  );
  const g = buildLinkGraph(input([page({ url: "https://example.com/" }), ...many]));
  assert.equal(g.sections.length, 9, "上位8つ＋その他");
  assert.equal(g.sections.at(-1)?.name, "その他");
  assert.ok(g.sectionLinks.some((l) => l.from === "その他"));
});
