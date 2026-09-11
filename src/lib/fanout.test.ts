import assert from "node:assert/strict";
import test from "node:test";
import { byDomainPages, byPosition, citedNotRetrieved, groupShape, parseCapture, toRows, totals } from "./fanout";

/** 会話JSONの最小形。mapping の入れ子でも拾えるかを一緒に見る */
const conversation = {
  mapping: {
    a: {
      message: {
        metadata: {
          search_model_queries: { queries: ["best ai note taking apps 2026 Granola Notion AI"] },
          search_result_groups: [
            {
              domain: "granola.ai",
              entries: [
                { url: "https://www.granola.ai/pricing?utm_source=chatgpt.com", title: "Pricing" },
                { url: "https://granola.ai/features/", title: "Features" },
              ],
            },
            {
              entries: [
                { url: "https://otter.ai/pricing", title: "Otter" },
                { url: "https://fathom.video/pricing", title: "Fathom" },
                { url: "ftp://example.com/x", title: "対象外のスキーム" },
              ],
            },
          ],
        },
      },
    },
    b: {
      message: {
        metadata: {
          content_references: [
            { type: "grouped_webpages", items: [{ url: "https://granola.ai/pricing" }] },
            { type: "url", url: "https://otter.ai/pricing" },
            { type: "url", url: "https://example.com/never-fetched" },
          ],
        },
      },
    },
  },
};

test("会話JSONから候補URL・引用URL・検索クエリを取り出す", () => {
  const c = parseCapture("test", conversation);

  assert.equal(c.queries.length, 1);
  assert.equal(c.groups.length, 2);
  // http/https 以外のURLは候補に数えない
  assert.deepEqual(c.groups[1].entries.map((e) => e.domain), ["otter.ai", "fathom.video"]);
  // grouped_webpages の items[] も引用として拾う
  assert.deepEqual(c.citations.map((x) => x.url).sort(), [
    "example.com/never-fetched",
    "granola.ai/pricing",
    "otter.ai/pricing",
  ]);
});

test("クエリ・www・末尾スラッシュの違いを畳んで引用と突き合わせる", () => {
  const rows = toRows([parseCapture("test", conversation)]);

  // ?utm_source= 付きの候補と、パラメータ無しの引用が同じページとして一致する
  const granola = rows.find((r) => r.url === "granola.ai/pricing");
  assert.equal(granola?.cited, true);
  assert.equal(rows.find((r) => r.url === "granola.ai/features")?.cited, false);
  assert.equal(rows.find((r) => r.url === "fathom.video/pricing")?.cited, false);
});

test("グループ内の順位と、同一ドメインの枚数を数える", () => {
  const rows = toRows([parseCapture("test", conversation)]);

  assert.deepEqual(
    rows.map((r) => [r.position, r.sameDomainInGroup]),
    [
      [1, 2],
      [2, 2],
      [1, 1],
      [2, 1],
    ],
  );
  assert.equal(byPosition(rows).find((b) => b.label === "1位")?.retrieved, 2);
  assert.equal(byDomainPages(rows).find((b) => b.label === "2枚")?.cited, 1);
});

test("同じグループが重複して入っていても1回だけ数える", () => {
  const sse = [
    { metadata: { search_result_groups: [{ entries: [{ url: "https://a.example/1" }] }] } },
    { metadata: { search_result_groups: [{ entries: [{ url: "https://a.example/1" }] }] } },
  ];
  const c = parseCapture("sse", sse);

  assert.equal(c.groups.length, 1);
  assert.equal(c.duplicateGroups, 1);
});

test("候補一覧に無いのに引用されたURLを報告する", () => {
  const c = parseCapture("test", conversation);

  assert.deepEqual(citedNotRetrieved([c]).map((x) => x.url), ["example.com/never-fetched"]);
});

test("グループの単位（ドメインかクエリか）を数で示す", () => {
  const shape = groupShape([parseCapture("test", conversation)]);

  assert.equal(shape.groups, 2);
  assert.equal(shape.singleDomain, 1);
  assert.equal(shape.withDomainField, 1);
  assert.equal(shape.avgDomains, 1.5);
});

test("全体の取得数と引用率を出す", () => {
  const captures = [parseCapture("test", conversation)];
  const t = totals(captures, toRows(captures));

  assert.equal(t.retrieved, 4);
  assert.equal(t.cited, 2);
  assert.equal(t.rate, 50);
});
