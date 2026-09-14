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

// --- 見出しを「問い」として読み、答えの形が本文にあるかを見る ---

test("費用を聞く見出しに金額が無ければ、答えの形が無いと見る", () => {
  const { blocks } = blocksFromHtml(
    `<main><h2>GEO対策の費用はいくらですか</h2><p>${body(
      "GEO対策の費用は会社によって様々です。費用はいくらか気になるところですが、一概には言えません。",
    )}</p></main>`,
  );
  const { fits, unanswered } = headingFit(blocks);
  assert.equal(fits[0].intent, "price");
  assert.equal(fits[0].answer?.ok, false, "金額が無いので答えの形が無い");
  assert.equal(unanswered.length, 1);
  // 見出しの語は本文に出ているので、噛み合い（語の一致）とは別の指摘になる
  assert.equal(fits[0].verdict, "ok");
});

test("費用を聞く見出しに金額があれば、答えの形があると見る", () => {
  const { blocks } = blocksFromHtml(
    `<main><h2>GEO対策の費用はいくらですか</h2><p>${body(
      "GEO対策の費用は月額30万円からです。内訳は記事制作と計測で、いくらかかるかは本数で決まります。",
    )}</p></main>`,
  );
  const { fits, unanswered } = headingFit(blocks);
  assert.equal(fits[0].answer?.ok, true);
  assert.deepEqual(unanswered, []);
});

test("理由を聞く見出しに理由の文が無ければ、答えの形が無いと見る", () => {
  const { blocks } = blocksFromHtml(
    `<main><h2>なぜAI検索に引用されないのか</h2><p>${body(
      "AI検索に引用されないという相談は増えています。引用されない状況は多くのサイトで起きています。",
    )}</p></main>`,
  );
  const { fits } = headingFit(blocks);
  assert.equal(fits[0].intent, "reason", "「なぜ」は理由を聞いている");
  assert.equal(fits[0].answer?.ok, false);
});

test("「なぜ費用が高いのか」は費用ではなく理由を聞いていると見る", () => {
  const { blocks } = blocksFromHtml(
    `<main><h2>なぜGEOの費用は高いのか</h2><p>${body(
      "GEOの費用が高いのは、記事1本ごとに一次情報の裏取りが要るためです。",
    )}</p></main>`,
  );
  const { fits } = headingFit(blocks);
  assert.equal(fits[0].intent, "reason");
  assert.equal(fits[0].answer?.ok, true, "「〜ためです」があるので答えの形がある");
});

test("手順を聞く見出しは番号付きの手順があるかを見る", () => {
  const { blocks } = blocksFromHtml(
    `<main><h2>robots.txtの書き方</h2><ol><li>ファイルを作る</li><li>User-agentを書く</li></ol><p>${body(
      "robots.txtの書き方をまとめました。",
    )}</p></main>`,
  );
  const { fits } = headingFit(blocks);
  assert.equal(fits[0].intent, "howto");
  assert.equal(fits[0].answer?.ok, true);
});

test("何を聞いているか分からない見出しは、答えの形を判定しない", () => {
  const { blocks } = blocksFromHtml(
    `<main><h2>AI検索の現在地</h2><p>${body("AI検索の現在地について、いま起きていることを並べます。")}</p></main>`,
  );
  const { fits, unanswered } = headingFit(blocks);
  assert.equal(fits[0].intent, "other");
  assert.equal(fits[0].answer, null, "判定しない（null）。誤検知を出さない");
  assert.deepEqual(unanswered, []);
});

test("体言止めでも費用の語があれば、金額があるかを見る", () => {
  // 「〜はいくら？」の形でなくても、料金の節に金額が1つも無いのは指摘に値する
  const { blocks } = blocksFromHtml(
    `<main><h2>ガス料金の基本</h2><p>${body("ガス料金の基本について、基本的な考え方をまとめます。")}</p></main>`,
  );
  const { fits } = headingFit(blocks);
  assert.equal(fits[0].intent, "price");
  assert.equal(fits[0].answer?.ok, false);
});



test("本文の大文字小文字を問わずに語を探す", () => {
  // keyTerms は小文字に正規化した語を返すので、本文側も正規化しないと「GEO対策」が見つからない
  const { blocks } = blocksFromHtml(
    `<main><h2>GEO対策の費用</h2><p>${body("GEO対策の費用は月額30万円からです。")}</p></main>`,
  );
  const { fits } = headingFit(blocks);
  assert.deepEqual(
    fits[0].terms.filter((t) => t.hit === "none"),
    [],
    "本文にある語が「本文に無い」と出ないこと",
  );
});


// --- 答えとして適切か（答えが無い／言い切っていない／答えが後ろ） ---

test("「会社によって様々です」は答えになっていないと見る", () => {
  // 埋め込みベクトルなら見出しと同じ話題として高く出てしまう文。語句でなら捕まえられる
  const { blocks } = blocksFromHtml(
    `<main><h2>GEO対策の費用はいくらですか</h2><p>${body(
      "GEO対策の費用は会社によって様々です。相場が知りたいところですが一概には言えません。",
    )}</p></main>`,
  );
  const { fits, unanswered } = headingFit(blocks);
  assert.equal(fits[0].answerState, "hedge");
  assert.equal(unanswered.length, 1);
});

test("答えが節の書き出しにあれば適切と見る", () => {
  const { blocks } = blocksFromHtml(
    `<main><h2>GEO対策の費用はいくらですか</h2><p>${body("GEO対策の費用は月額30万円からです。内訳は記事制作と計測です。")}</p></main>`,
  );
  const { fits, unanswered } = headingFit(blocks);
  assert.equal(fits[0].answerState, "ok");
  assert.deepEqual(unanswered, []);
});

test("答えが節の末尾にしかなければ「後ろにある」と見る", () => {
  // AI検索は見出しの直後から抜き出すので、答えが後ろだと拾われない
  const { blocks } = blocksFromHtml(
    `<main><h2>GEO対策の費用はいくらですか</h2><p>${body(
      "まず前提を整理します。市場の状況を踏まえる必要があります。細かい条件を見ていきましょう。結論として月額30万円からです。",
    )}</p></main>`,
  );
  const { fits } = headingFit(blocks);
  assert.equal(fits[0].answerState, "late");
});

test("手順・比較の見出しでは答えの位置を判定しない", () => {
  // ブロックからは「リストや表があるか」しか分からず、どこにあるかは分からない。断定しない
  const { blocks } = blocksFromHtml(
    `<main><h2>robots.txtの書き方</h2><p>${body("前置きを書きます。")}</p><ol><li>作る</li><li>書く</li></ol></main>`,
  );
  const { fits } = headingFit(blocks);
  assert.equal(fits[0].answerState, "ok", "位置を見ないので late にはしない");
});
