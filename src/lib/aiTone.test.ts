import assert from "node:assert/strict";
import test from "node:test";
import { MAX_BOLD, aiToneErrors, countBold, soloBoldParagraphs } from "./aiTone";

test("上限以内の太字は通す", () => {
  const body = "## 結論\n\n" + Array.from({ length: MAX_BOLD }, (_, i) => `**要点${i}** の説明です。`).join("\n\n");
  assert.equal(countBold(body), MAX_BOLD);
  assert.deepEqual(aiToneErrors(body), []);
});

test("太字が上限を超えたら落とす", () => {
  const body = Array.from({ length: MAX_BOLD + 1 }, (_, i) => `**要点${i}** の説明です。`).join("\n\n");
  const errors = aiToneErrors(body);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /太字が11箇所/);
});

test("コードフェンスと図解のprops内は数えない", () => {
  const body = [
    "本文です。",
    "```text\n**a** **b** **c** **d** **e** **f** **g** **h** **i** **j** **k** **l**\n```",
    '<FigureFlow title="図" steps={[{ label: "**a** **b** **c** **d** **e** **f** **g** **h** **i** **j** **k**" }]} />',
  ].join("\n\n");
  assert.equal(countBold(body), 0);
  assert.deepEqual(aiToneErrors(body), []);
});

test("段落全体が太字の決め台詞を落とす", () => {
  const body = "検索は5本から始まりました。\n\n**これは記憶から出ているということです。**\n\n次の段落です。";
  assert.deepEqual(soloBoldParagraphs(body), ["**これは記憶から出ているということです。**"]);
  assert.match(aiToneErrors(body)[0], /決め台詞/);
});

test("太字の小見出しラベルは決め台詞として数えない", () => {
  // 「**1. ドメインが4年古い**」のように、直後の段落に本文が続く形は構造なので通す
  const body = "**1. ドメインが4年古い**\n\n`d-card.jp` は移転前のドメインです。\n\n**2. 検索前に回答の骨組みができていた**\n\n軸が3つ出ていました。";
  assert.deepEqual(soloBoldParagraphs(body), []);
  assert.deepEqual(aiToneErrors(body), []);
});
