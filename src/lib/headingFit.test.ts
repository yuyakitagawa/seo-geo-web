import assert from "node:assert/strict";
import test from "node:test";
import { headingFit, MIN_TEXT } from "./headingFit";
import { blocksFromHtml } from "./promptFit";

/** MIN_TEXT を超える長さの本文を作る */
function body(core: string): string {
  return core + "この段落は判定の材料を満たすために長さを確保しています。".repeat(Math.ceil(MIN_TEXT / 28));
}

test("見出しの語が本文に出てくれば噛み合っていると見る", () => {
  const { blocks } = blocksFromHtml(
    `<main><h2>ガス料金の計算方法</h2><p>${body("ガス料金は基本料金と従量料金の合計で計算します。計算方法は料金表に載っています。")}</p></main>`,
  );
  const { fits } = headingFit(blocks);
  assert.equal(fits.length, 1);
  assert.equal(fits[0].verdict, "ok");
  assert.ok(fits[0].terms.some((t) => t.hit === "full"));
});

test("見出しの語が本文に1つも無ければ噛み合っていないと出す", () => {
  const { blocks } = blocksFromHtml(
    `<main><h2>ガス料金の計算方法</h2><p>${body("弊社は創業から地域の暮らしを支えてまいりました。社員一同、皆さまのご愛顧に感謝しております。")}</p></main>`,
  );
  const { fits } = headingFit(blocks);
  assert.equal(fits[0].verdict, "off");
  assert.match(fits[0].reason, /本文に1つも出てきません/);
});

test("定型の見出しは判定しない", () => {
  const { blocks } = blocksFromHtml(`<main><h2>まとめ</h2><p>${body("本記事の要点を振り返ります。")}</p></main>`);
  const { fits, skipped } = headingFit(blocks);
  assert.deepEqual(fits, [], "「まとめ」は本文と語が重ならないのが当たり前なので指摘しない");
  assert.equal(skipped, 1);
});

test("本文が短いブロックは判定しない", () => {
  const { blocks } = blocksFromHtml("<main><h2>ガス料金の計算方法</h2><p>短い。</p></main>");
  const { fits, skipped } = headingFit(blocks);
  assert.deepEqual(fits, []);
  assert.equal(skipped, 1);
});

test("近さは参考値として返すが、判定には使わない", () => {
  const { blocks } = blocksFromHtml(
    `<main><h2>ガス料金の計算方法</h2><p>${body("ガス料金の計算方法を説明します。")}</p></main>`,
  );
  const { fits } = headingFit(blocks);
  assert.ok(fits[0].closeness >= 0 && fits[0].closeness <= 1, "0〜1に収まること");
  assert.equal(fits[0].verdict, "ok", "判定は語のカバレッジで決まる");
});

test("見出し直後の1文を返す（見出しへの答えの候補）", () => {
  const { blocks } = blocksFromHtml(
    `<main><h2>ガス料金の計算方法</h2><p>${body("ガス料金は基本料金と従量料金の合計です。")}</p></main>`,
  );
  const { fits } = headingFit(blocks);
  assert.match(fits[0].lead, /ガス料金は基本料金と従量料金の合計です/);
});

test("見出しが無いページでは何も返さない", () => {
  const { blocks } = blocksFromHtml(`<main><p>${body("見出しのない本文です。")}</p></main>`);
  const { fits, skipped } = headingFit(blocks);
  assert.deepEqual(fits, []);
  assert.equal(skipped, 0);
});
