// 用語集は語数が増えるほど1件ずつ目視できなくなる（2026-09-13に41語→80語）。
// 崩れやすい約束をここで機械的に見張る。
// - 定義は「その1文だけ読んで意味が通る」（AI検索がそのまま抜き出す単位）
// - 出典はサイトが一次情報として確認済みのドメインだけ
// - 可視テキストと DefinedTerm の description は同じ文字列
import assert from "node:assert/strict";
import test from "node:test";
import { GLOSSARY, GLOSSARY_CATEGORY_KEYS, glossaryJsonLd } from "./glossary";

const ALLOWED_SOURCE_HOSTS = new Set([
  "developers.google.com",
  "support.google.com",
  "web.dev",
  "arxiv.org",
  "llmstxt.org",
  "developers.openai.com",
  "docs.perplexity.ai",
  "support.claude.com",
  "www.bing.com",
]);

test("slug と term が重複しない", () => {
  assert.equal(new Set(GLOSSARY.map((t) => t.slug)).size, GLOSSARY.length, "slugが重複している");
  assert.equal(new Set(GLOSSARY.map((t) => t.term)).size, GLOSSARY.length, "termが重複している");
});

test("slug はアンカーに使えるASCIIだけ", () => {
  for (const t of GLOSSARY) assert.match(t.slug, /^[a-z0-9-]+$/, `${t.term} の slug`);
});

test("category は定義済みのキー", () => {
  for (const t of GLOSSARY) assert.ok(GLOSSARY_CATEGORY_KEYS.includes(t.category), `${t.term} の category`);
});

test("定義は1文で、その語自身を含む", () => {
  for (const t of GLOSSARY) {
    assert.ok(t.definition.endsWith("。"), `${t.term}: 定義が句点で終わっていない`);
    assert.ok(!t.definition.slice(0, -1).includes("。"), `${t.term}: 定義が2文以上ある`);
    assert.ok(t.definition.includes(t.term), `${t.term}: 定義文の中にその語がない（単体で読めない）`);
  }
});

test("出典は確認済みドメインのhttps", () => {
  for (const t of GLOSSARY) {
    const url = new URL(t.source.url);
    assert.equal(url.protocol, "https:", `${t.term} の出典がhttpsでない`);
    assert.ok(ALLOWED_SOURCE_HOSTS.has(url.hostname), `${t.term} の出典 ${url.hostname} は確認済みドメインにない`);
    assert.ok(t.source.title.length > 0 && t.source.publisher.length > 0, `${t.term} の出典に題名か発行元がない`);
  }
});

test("seeAlso はサイト内の絶対パス", () => {
  for (const t of GLOSSARY) {
    for (const s of t.seeAlso ?? []) assert.match(s.href, /^\//, `${t.term} の seeAlso`);
  }
});

test("DefinedTerm の description は可視テキストの定義と同じ", () => {
  const terms = glossaryJsonLd().hasDefinedTerm;
  assert.equal(terms.length, GLOSSARY.length);
  terms.forEach((term, i) => {
    assert.equal(term.description, GLOSSARY[i].definition, `${GLOSSARY[i].term} の description がずれている`);
    assert.equal(term.name, GLOSSARY[i].term);
  });
});
