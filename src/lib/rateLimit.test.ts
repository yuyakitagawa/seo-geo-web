import assert from "node:assert/strict";
import test from "node:test";
import { clientIp, rateLimited, resetRateLimit, sameOrigin } from "./rateLimit";

function post(headers: Record<string, string>): Request {
  return new Request("https://seo-geo-lab.com/api/audit", { method: "POST", headers });
}

test("Origin がリクエスト自身のホストと一致するときだけ通す", () => {
  assert.equal(sameOrigin(post({ origin: "https://seo-geo-lab.com", host: "seo-geo-lab.com" })), true);
  // プレビューや localhost でも、比較先がリクエスト自身のホストなので同じ判定で通る
  assert.equal(sameOrigin(post({ origin: "http://localhost:3000", host: "localhost:3000" })), true);
  // Vercel はプロキシの後ろなので x-forwarded-host を優先する
  assert.equal(
    sameOrigin(post({ origin: "https://seo-geo-lab.com", host: "internal.vercel.app", "x-forwarded-host": "seo-geo-lab.com" })),
    true
  );
});

test("Origin が無い・別サイト・壊れているものは落とす", () => {
  assert.equal(sameOrigin(post({ host: "seo-geo-lab.com" })), false, "スクリプトからの直接呼び出し");
  assert.equal(sameOrigin(post({ origin: "https://evil.example", host: "seo-geo-lab.com" })), false, "別サイトのページから");
  assert.equal(sameOrigin(post({ origin: "null", host: "seo-geo-lab.com" })), false, "URLとして壊れている");
  assert.equal(sameOrigin(post({ origin: "https://seo-geo-lab.com" })), false, "ホストが分からない");
  // ポートが違えば別オリジン
  assert.equal(sameOrigin(post({ origin: "http://localhost:3001", host: "localhost:3000" })), false);
});

test("IPごとの上限を超えた回だけ落とす", () => {
  resetRateLimit();
  for (let i = 0; i < 5; i++) assert.equal(rateLimited("1.1.1.1", 5), false, `${i + 1}回目は通る`);
  assert.equal(rateLimited("1.1.1.1", 5), true, "6回目で落ちる");
  // 別のIPは自分の枠を持つ
  assert.equal(rateLimited("2.2.2.2", 5), false);
});

test("落とした回は数えないので、洪水を受けても数え上げが伸びない", () => {
  resetRateLimit();
  for (let i = 0; i < 5; i++) rateLimited("1.1.1.1", 5);
  // 上限に達したあと何回叩かれても落ち続け、他のIPの枠は残っている
  for (let i = 0; i < 500; i++) assert.equal(rateLimited("1.1.1.1", 5), true);
  assert.equal(rateLimited("3.3.3.3", 5), false, "巻き込まれない");
});

test("IPを変えながら叩かれてもインスタンス全体の上限で止まる", () => {
  resetRateLimit();
  // IPごとの上限（既定5）には触れないよう、1IPあたり1回ずつ叩く
  for (let i = 0; i < 60; i++) assert.equal(rateLimited(`10.0.0.${i}`), false, `${i + 1}IP目は通る`);
  assert.equal(rateLimited("10.9.9.9"), true, "61IP目はインスタンス全体の上限で落ちる");
});

test("clientIp は x-forwarded-for の先頭を取る", () => {
  assert.equal(clientIp(post({ "x-forwarded-for": "203.0.113.5, 70.41.3.18" })), "203.0.113.5");
  assert.equal(clientIp(post({ "x-forwarded-for": "  203.0.113.5  " })), "203.0.113.5");
  assert.equal(clientIp(post({})), "unknown");
});
