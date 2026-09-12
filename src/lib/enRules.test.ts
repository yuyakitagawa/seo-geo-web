// 英語版の検査のうち「FAQ節は任意。ただし日英で有無を揃える」だけを固定する。
// 記事のFAQは任意になったので、FAQが無い独自記事を英訳したときに CI が落ちてはいけない。
import assert from "node:assert/strict";
import test from "node:test";
import { enArticleErrors, type MdxDoc } from "./enRules";

const data = { original: true, id: 1, slug: "example", title: "Example", description: "a".repeat(60), date: "2026-09-10", sources: [] };
const doc = (content: string): MdxDoc => ({ data: { ...data }, content });
const JA_BODY = "## 結論\n本文。\n";
const EN_BODY = "## Conclusion\nBody.\n";
const JA_FAQ = "\n## よくある質問\n### 質問\n回答。\n";
const EN_FAQ = "\n## FAQ\n### Question\nAnswer.\n";

/** FAQ以外の指摘（図解の数など）は混ぜずに、FAQの判定だけを見る */
const faqErrors = (ja: string, en: string) => enArticleErrors(doc(ja), doc(en), new Set()).filter((e) => /FAQ|よくある質問/.test(e));

test("日英ともFAQが無いのは通る", () => {
  assert.deepEqual(faqErrors(JA_BODY, EN_BODY), []);
});

test("日英ともFAQがあるのは通る", () => {
  assert.deepEqual(faqErrors(JA_BODY + JA_FAQ, EN_BODY + EN_FAQ), []);
});

test("日本語にFAQがあるのに英語版に無いと落ちる", () => {
  assert.equal(faqErrors(JA_BODY + JA_FAQ, EN_BODY).length, 1);
});

test("日本語にFAQが無いのに英語版にあると落ちる", () => {
  assert.equal(faqErrors(JA_BODY, EN_BODY + EN_FAQ).length, 1);
});

test("英語版のFAQに質問が1問も無いと落ちる", () => {
  assert.equal(faqErrors(JA_BODY + JA_FAQ, EN_BODY + "\n## FAQ\nAnswer without a question.\n").length, 1);
});
