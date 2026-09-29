// 自サイトの robots.txt の約束。RSC ペイロード（*.txt）だけを止め、本物のテキストファイルとページは通す。
// 判定はツール側と同じ src/lib/robots.ts（Google の最長一致）で行う。
import assert from "node:assert/strict";
import test from "node:test";
import robots from "../app/robots";
import { check, parseRobots } from "./robots";

function render(): string {
  const { rules } = robots();
  return (Array.isArray(rules) ? rules : [rules])
    .map((r) => {
      const agents = Array.isArray(r.userAgent) ? r.userAgent : [r.userAgent ?? "*"];
      const list = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
      return [
        ...agents.map((a) => `User-Agent: ${a}`),
        ...list(r.allow).map((p) => `Allow: ${p}`),
        ...list(r.disallow).map((p) => `Disallow: ${p}`),
      ].join("\n");
    })
    .join("\n\n");
}

const parsed = parseRobots(render());

for (const ua of ["Googlebot", "Bingbot", "OAI-SearchBot", "SomeUnknownBot"]) {
  test(`${ua}: ページと llms.txt / ads.txt は許可、RSC ペイロードと /api/ は拒否`, () => {
    for (const path of ["/", "/articles/30", "/glossary", "/llms.txt", "/ads.txt"]) {
      assert.equal(check(parsed, ua, path).allowed, true, path);
    }
    for (const path of ["/about.txt", "/articles/30.txt", "/articles/30/__next._full.txt", "/api/audit"]) {
      assert.equal(check(parsed, ua, path).allowed, false, path);
    }
  });
}

test("商用SEOクローラーは全面拒否のまま", () => {
  assert.equal(check(parsed, "AhrefsBot", "/").allowed, false);
});
