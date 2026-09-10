import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLinkRules, insertInternalLinks, maskedPositions, type LinkRule } from "./internalLinks";

const RULES: LinkRule[] = [
  { phrases: ["内部リンク", "サイト構造"], href: "/learn/structure", kind: "lesson" },
  { phrases: ["AIクローラー"], href: "/learn/geo-implementation", kind: "lesson" },
  { phrases: ["llms.txt"], href: "/glossary#llms-txt", kind: "glossary" },
  { phrases: ["canonical"], href: "/glossary#canonical", kind: "glossary" },
];

test("本文にある語をリンクで包む。文言は変えない", () => {
  const { body, inserted } = insertInternalLinks("内部リンクを見直します。\n", RULES);
  assert.equal(body, "[内部リンク](/learn/structure)を見直します。\n");
  assert.deepEqual(inserted, [{ phrase: "内部リンク", href: "/learn/structure" }]);
  // リンク記法を取り除くと元の文字列に戻る（=文言を1字も変えていない）
  assert.equal(body.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1"), "内部リンクを見直します。\n");
});

test("最初の出現だけをリンクにする", () => {
  const { body } = insertInternalLinks("内部リンクの話。\n\n内部リンクの続き。\n", RULES);
  assert.equal(body.match(/\/learn\/structure/g)?.length, 1);
});

test("コードフェンス・インラインコード・見出し・JSX・既存リンク・URLの中は触らない", () => {
  const cases = [
    "```\n内部リンク\n```\n",
    "`内部リンク` \n",
    "## 内部リンクの話\n",
    '<FigureDoDont title="内部リンク" dos={["a"]} />\n',
    "[内部リンク](/somewhere)\n",
    "https://example.com/内部リンク\n",
  ];
  for (const body of cases) {
    const r = insertInternalLinks(body, RULES);
    assert.equal(r.inserted.length, 0, `触ってはいけない位置に差し込んだ: ${body}`);
    assert.equal(r.body, body);
  }
});

test("複数行のJSXブロックの中は触らない", () => {
  const body = '<FigureCompare\n  title="a"\n  cols={[{ label: "内部リンク", points: ["サイト構造"] }]}\n/>\n';
  assert.equal(insertInternalLinks(body, RULES).inserted.length, 0);
});

test("「## 結論」の最初の段落には差し込まない", () => {
  const body = "## 結論\n\n内部リンクを見直します。\n\n次の段落でも内部リンクに触れます。\n";
  const { inserted, body: out } = insertInternalLinks(body, RULES);
  assert.equal(inserted.length, 1);
  assert.ok(out.startsWith("## 結論\n\n内部リンクを見直します。"), out);
});

test("1段落に2本以上入れない", () => {
  const body = "llms.txtはAIクローラーにサイト構造を伝えます。\n";
  assert.equal(insertInternalLinks(body, RULES).inserted.length, 1);
});

test("用語集へのリンクは既定で1記事1本まで", () => {
  const body = "llms.txt の話。\n\ncanonical の話。\n\n内部リンク の話。\n";
  const { inserted } = insertInternalLinks(body, RULES);
  assert.equal(inserted.filter((i) => i.href.startsWith("/glossary")).length, 1);
  assert.equal(inserted.filter((i) => i.href.startsWith("/learn")).length, 1);
});

test("maxLinks と skipHrefs を守る", () => {
  const body = "内部リンク の話。\n\nAIクローラー の話。\n\nllms.txt の話。\n";
  assert.equal(insertInternalLinks(body, RULES, { maxLinks: 1 }).inserted.length, 1);
  const skipped = insertInternalLinks(body, RULES, { skipHrefs: ["/learn/structure"] });
  assert.ok(!skipped.inserted.some((i) => i.href === "/learn/structure"));
  assert.equal(insertInternalLinks(body, RULES, { maxLinks: 0 }).inserted.length, 0);
});

test("既に本文にあるリンク先は二重に張らない", () => {
  const body = "[構造の話](/learn/structure)。\n\n内部リンク の話。\n";
  assert.equal(insertInternalLinks(body, RULES).inserted.filter((i) => i.href === "/learn/structure").length, 0);
});

test("ASCIIの語は部分一致で拾わない", () => {
  const rules: LinkRule[] = [{ phrases: ["search"], href: "/glossary#x", kind: "glossary" }];
  assert.equal(insertInternalLinks("research の話。\n", rules).inserted.length, 0);
  assert.equal(insertInternalLinks("search の話。\n", rules).inserted.length, 1);
});

test("maskedPositions は本文と同じ長さを返す", () => {
  const body = "## 見出し\n\n本文です。\n";
  assert.equal(maskedPositions(body).length, body.length);
});

test("buildLinkRules は汎用語を用語集リンクにしない", () => {
  const rules = buildLinkRules([{ slug: "structure" }], [
    { slug: "seo", term: "SEO", aliases: ["SEO対策"] },
    { slug: "canonical", term: "canonical" },
  ]);
  assert.ok(rules.some((r) => r.href === "/learn/structure"));
  assert.ok(!rules.some((r) => r.href === "/glossary#seo"));
  assert.ok(rules.some((r) => r.href === "/glossary#canonical"));
});
