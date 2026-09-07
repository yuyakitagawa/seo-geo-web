// robots.txt の商用SEOクローラー一覧を固定する。
//
// この一覧は robots.txt（お願い）と Vercel Firewall のカスタムルール
// 「Deny commercial SEO crawlers」（実際に 403 で止めている側）の2か所で使う。Firewall は
// ダッシュボード／CLI にあってリポジトリの外にあるため、この一覧を変えても勝手には追従しない。
// CLAUDE.md に「同期する」と書いてあるだけでは守られないので、変更したらここで落として気づかせる。
//
// 一覧を意図して変えたときは、次を実行してから期待値を更新する:
//   vercel firewall rules edit "Deny commercial SEO crawlers"
//   vercel firewall rules list --expand   # 反映を確認
import assert from "node:assert/strict";
import test from "node:test";
import { BLOCKED_SCRAPERS } from "./scrapers";
import { CRAWLERS } from "./crawlers";

// 2026-09-04 に Vercel Firewall へ登録した8種。増減させたら Firewall 側も同じ手で直すこと
const SYNCED_WITH_FIREWALL = [
  "AhrefsBot",
  "SemrushBot",
  "DotBot",
  "rogerbot",
  "MJ12bot",
  "DataForSeoBot",
  "barkrowler",
  "serpstatbot",
];

test("拒否する一覧が Vercel Firewall のルールと同じ", () => {
  assert.deepEqual(
    BLOCKED_SCRAPERS.map((s) => s.token),
    SYNCED_WITH_FIREWALL,
    "一覧を変えたら `vercel firewall rules edit \"Deny commercial SEO crawlers\"` で Firewall も直してから、この期待値を更新する"
  );
});

test("AI検索・AI学習クローラーを1つも拒否していない", () => {
  // 読者（とAIの引用）が届かなくなる事故を防ぐ。scrapers.ts と crawlers.ts は目的が違う
  const blocked = new Set(BLOCKED_SCRAPERS.map((s) => s.token.toLowerCase()));
  const wrong = CRAWLERS.filter((c) => blocked.has(c.token.toLowerCase()));
  assert.deepEqual(wrong.map((c) => c.token), []);
});

test("各行に出典と確認日がある", () => {
  const bad = BLOCKED_SCRAPERS.filter((s) => !/^https?:\/\//.test(s.source) || !/^\d{4}-\d{2}-\d{2}$/.test(s.verified));
  assert.deepEqual(bad.map((s) => s.token), []);
});
