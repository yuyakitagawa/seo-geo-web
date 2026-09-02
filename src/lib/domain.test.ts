import assert from "node:assert/strict";
import test from "node:test";
import { parseDomain, topLevelDomain } from "./domain";

test("URLでもホスト名でも同じ登録ドメインになる", () => {
  for (const input of ["example.com", "EXAMPLE.com", "https://example.com", "https://blog.example.com/a/b?q=1"]) {
    assert.equal(parseDomain(input).domain, "example.com", input);
  }
});

test("複数ラベルの接尾辞は2ラベル分を接尾辞として扱う", () => {
  assert.deepEqual(
    { ...parseDomain("https://blog.example.co.jp/a") },
    { host: "blog.example.co.jp", domain: "example.co.jp", suffix: "co.jp" },
  );
  // 一覧に無いTLDは最後の1ラベルで扱う（粗くなるだけで壊れない）
  assert.equal(parseDomain("example.dev").suffix, "dev");
});

test("登録できない入力は弾く", () => {
  for (const input of ["", "localhost", "co.jp", "203.0.113.10", "https://example.com:8080@evil"]) {
    assert.throws(() => parseDomain(input), Error, input);
  }
});

test("日本語ドメインは Punycode に揃える", () => {
  assert.equal(parseDomain("日本語.jp").domain, "xn--wgv71a119e.jp");
});

test("topLevelDomain は最後の1ラベルを返す", () => {
  assert.equal(topLevelDomain("example.co.jp"), "jp");
  assert.equal(topLevelDomain("example.com"), "com");
});
