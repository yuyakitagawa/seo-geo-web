import assert from "node:assert/strict";
import test from "node:test";
import { analyzeStructure, DEEP_DEPTH } from "./siteStructure";

test("深さごとの本数と第1階層ごとの本数を数える", () => {
  const s = analyzeStructure([
    "https://example.com/",
    "https://example.com/blog/1",
    "https://example.com/blog/2",
    "https://example.com/company/about",
  ]);
  assert.equal(s.total, 4);
  assert.deepEqual(s.depths, [
    { depth: 0, count: 1 },
    { depth: 2, count: 3 },
  ]);
  assert.deepEqual(s.sections, [
    { name: "blog", count: 2 },
    { name: "/", count: 1 },
    { name: "company", count: 1 },
  ]);
});

test("深いURLを数え、例を添える", () => {
  const deep = "https://example.com/a/b/c/d";
  const s = analyzeStructure(["https://example.com/a", deep]);
  assert.equal(s.deep.count, 1);
  assert.deepEqual(s.deep.examples, [deep]);
  assert.equal(DEEP_DEPTH, 4);
});

test("直下に1種類しか子を持たない中間ディレクトリを出す", () => {
  const s = analyzeStructure([
    "https://example.com/support/faq/1",
    "https://example.com/support/faq/2",
    "https://example.com/support/faq/3",
  ]);
  assert.deepEqual(s.redundant, [{ path: "/support", only: "faq", urls: 3 }]);
});

test("子が複数あるディレクトリは冗長と見なさない", () => {
  const s = analyzeStructure(["https://example.com/support/faq/1", "https://example.com/support/contact/1"]);
  assert.deepEqual(s.redundant, []);
});

test("配下が1本だけの階層は数えない（階層ではなく単独ページ）", () => {
  const s = analyzeStructure(["https://example.com/support/faq"]);
  assert.deepEqual(s.redundant, []);
});

test("役割が重なりそうな第1階層の組を出す", () => {
  const s = analyzeStructure([
    "https://example.com/blog/1",
    "https://example.com/news/1",
    "https://example.com/company/about",
  ]);
  assert.deepEqual(s.overlapping, [["blog", "news"]]);
});

test("重なりが無ければ空", () => {
  const s = analyzeStructure(["https://example.com/blog/1", "https://example.com/company/about"]);
  assert.deepEqual(s.overlapping, []);
});

test("URLとして壊れているものは数えない", () => {
  const s = analyzeStructure(["https://example.com/a", "not a url", ""]);
  assert.equal(s.total, 1);
});
