import assert from "node:assert/strict";
import test from "node:test";
import { allEntries, byGroupSize, byPosition, citedNotRetrieved, groupShape, listDropCross, parseCapture, totals } from "./fanout";

const ref = (t: number, r: number) => ({ turn_index: t, ref_type: "search", ref_index: r });
const entry = (url: string, t: number, r: number) => ({ type: "search_result", url, ref_id: ref(t, r) });

/**
 * 実ログと同じ形の最小例。
 * 速報版（検索直後）と最終版（回答完成後）の2回、候補一覧が入る。
 * 引用された ref 0:0 と 0:2 は最終版から消えている。
 */
const conversation = {
  messages: [
    { metadata: { search_model_queries: { queries: ["best card 2026 JCB SMBC"] } } },
    {
      metadata: {
        search_result_groups: [
          {
            domain: "[www.jcb.co.jp](https://www.jcb.co.jp)",
            entries: [entry("https://www.jcb.co.jp/w/", 0, 0), entry("https://www.jcb.co.jp/w/?tk=1", 0, 1)],
          },
          { domain: "qa.smbc-card.com", entries: [entry("https://qa.smbc-card.com/faq", 0, 2)] },
        ],
      },
    },
    {
      metadata: {
        search_result_groups: [
          { domain: "jcb.co.jp", entries: [entry("https://www.jcb.co.jp/w/?tk=1", 0, 1), entry("https://www.jcb.co.jp/lineup/", 0, 3)] },
          { domain: "smbc-card.com", entries: [entry("https://www.smbc-card.com/nl", 0, 4)] },
        ],
        content_references: [
          { type: "grouped_webpages", items: [{ url: "https://www.jcb.co.jp/w/?utm_source=chatgpt.com", refs: [ref(0, 0)] }] },
          { type: "url", url: "https://qa.smbc-card.com/faq?utm_source=chatgpt.com", refs: [ref(0, 2)] },
          { type: "url", url: "https://recruit-card.jp/?utm_source=chatgpt.com", refs: [] },
        ],
      },
    },
  ],
};

test("速報版と最終版の候補一覧を ref_id で1件に畳む", () => {
  const c = parseCapture("t", conversation);

  // 0:1 は両方に出るが1件。クエリ違いの 0:0 と 0:1 は別ページとして数える
  assert.equal(c.entries.length, 5);
  assert.equal(c.listSnapshots, 2);
  assert.deepEqual(c.entries.map((e) => e.key).sort(), ["0:0", "0:1", "0:2", "0:3", "0:4"]);
});

test("グループはドメイン単位。サブドメインは登録可能ドメインに寄せる", () => {
  const c = parseCapture("t", conversation);

  assert.deepEqual(c.groups.map((g) => g.domain).sort(), ["jcb.co.jp", "smbc-card.com"]);
  // qa.smbc-card.com の候補が smbc-card.com グループに入る
  const qa = c.entries.find((e) => e.key === "0:2");
  assert.equal(qa?.domain, "smbc-card.com");
  assert.equal(qa?.host, "qa.smbc-card.com");
  assert.equal(groupShape([c]).subdomainFolded, 1);
});

test("グループ内の順位と、同じドメインから入った枚数を数える", () => {
  const entries = allEntries([parseCapture("t", conversation)]);

  assert.deepEqual(
    entries.map((e) => [e.key, e.position, e.groupSize]),
    [
      ["0:0", 1, 3],
      ["0:1", 2, 3],
      ["0:3", 3, 3],
      ["0:2", 1, 2],
      ["0:4", 2, 2],
    ],
  );
  assert.equal(byPosition(entries).find((b) => b.label === "1位")?.cited, 2);
  assert.equal(byGroupSize(entries).find((b) => b.label === "2枚")?.retrieved, 2);
});

test("引用は ref_id で突き合わせる（grouped_webpages の items[] も拾う）", () => {
  const entries = allEntries([parseCapture("t", conversation)]);

  assert.deepEqual(entries.filter((e) => e.cited).map((e) => e.key), ["0:0", "0:2"]);
  // ?utm_source= の有無やクエリ違いでは取り違えない
  assert.equal(entries.find((e) => e.key === "0:1")?.cited, false);
});

test("引用された候補が最終版の一覧から消えることを数える", () => {
  const entries = allEntries([parseCapture("t", conversation)]);

  assert.deepEqual(listDropCross(entries), [
    { label: "引用された・最終一覧にも残っていた", count: 0 },
    { label: "引用された・最終一覧から消えていた", count: 2 },
    { label: "引用されず・最終一覧に残っていた", count: 3 },
    { label: "引用されず・最終一覧からも消えていた", count: 0 },
  ]);
});

test("検索で取りに行っていないのに回答に出したURLを報告する", () => {
  const c = parseCapture("t", conversation);

  assert.deepEqual(citedNotRetrieved([c]).map((x) => x.url), ["https://recruit-card.jp/?utm_source=chatgpt.com"]);
});

test("全体の候補数と引用数を出す", () => {
  const captures = [parseCapture("t", conversation)];
  const t = totals(captures);

  assert.equal(t.retrieved, 5);
  assert.equal(t.cited, 2);
  assert.equal(t.groups, 2);
  assert.equal(t.queries, 1);
});
