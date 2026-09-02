import assert from "node:assert/strict";
import test from "node:test";
import { evaluateDomain, type DomainPowerInput } from "./domainPower";
import type { Registration } from "./rdap";

const NOW = Date.parse("2026-09-02T00:00:00Z");
const DAY = 86_400_000;

const registration = (over: Partial<Registration> = {}): Registration => ({
  domain: "example.com",
  registeredAt: new Date(NOW - 3650 * DAY).toISOString(),
  updatedAt: null,
  expiresAt: new Date(NOW + 400 * DAY).toISOString(),
  registrar: "Example Registrar",
  statuses: ["client transfer prohibited"],
  dnssec: true,
  nameservers: ["ns1.example.com"],
  source: "RDAP",
  ...over,
});

const input = (over: Partial<DomainPowerInput> = {}): DomainPowerInput => ({
  host: "example.com",
  domain: "example.com",
  suffix: "com",
  registration: registration(),
  registrationError: null,
  links: { openPageRank: 5.2, worldRank: 12345, referringDomains: 1200, asOf: "2026-08-01" },
  linksError: null,
  linksConfigured: true,
  now: NOW,
  ...over,
});

const ids = (over?: Partial<DomainPowerInput>) => evaluateDomain(input(over)).findings.map((f) => f.id);

test("十分な被リンクと正常な登録情報なら指摘が出ない", () => {
  assert.deepEqual(ids(), ["links-ok"]);
});

test("被リンク元ドメイン数で重大度が変わる", () => {
  const rd = (referringDomains: number) => ({ links: { openPageRank: 0, worldRank: null, referringDomains, asOf: null } });
  assert.equal(evaluateDomain(input(rd(3))).counts.high, 1);
  assert.ok(ids(rd(3)).includes("links-isolated"));
  assert.ok(ids(rd(30)).includes("links-few"));
  assert.ok(ids(rd(300)).includes("links-growing"));
  assert.ok(ids(rd(3000)).includes("links-ok"));
});

test("有効期限が近いと指摘し、60日を切ると要対処になる", () => {
  const expires = (days: number) => ({ registration: registration({ expiresAt: new Date(NOW + days * DAY).toISOString() }) });
  assert.ok(!ids(expires(400)).includes("expiry-soon"));
  assert.equal(evaluateDomain(input(expires(100))).findings.find((f) => f.id === "expiry-soon")?.severity, "mid");
  assert.equal(evaluateDomain(input(expires(30))).findings.find((f) => f.id === "expiry-soon")?.severity, "high");
});

test("移管ロックは書式が違っても検出する", () => {
  assert.ok(!ids({ registration: registration({ statuses: ["clientTransferProhibited"] }) }).includes("transfer-unlocked"));
  assert.ok(ids({ registration: registration({ statuses: ["ok"] }) }).includes("transfer-unlocked"));
  // WHOIS（.jp）は EPP ステータスを返さないので、この判定はしない
  assert.ok(!ids({ registration: registration({ statuses: ["connected"], source: "WHOIS" }) }).includes("transfer-unlocked"));
});

test("保留・削除待ちは要対処", () => {
  const r = evaluateDomain(input({ registration: registration({ statuses: ["redemption period"] }) }));
  assert.equal(r.findings.find((f) => f.id === "status-hold")?.severity, "high");
  // 重大度の高い順に並ぶ
  assert.equal(r.findings[0].severity, "high");
});

test("登録1年未満は中古ドメインの注意つきで知らせる", () => {
  const r = evaluateDomain(input({ registration: registration({ registeredAt: new Date(NOW - 90 * DAY).toISOString() }) }));
  const age = r.findings.find((f) => f.id === "age-new");
  assert.equal(age?.severity, "low");
  assert.match(age?.fix ?? "", /期限切れドメイン/);
});

test("キー未設定なら被リンクは未計測になり、指摘は出ない", () => {
  const r = evaluateDomain(input({ links: null, linksConfigured: false }));
  assert.ok(r.findings.every((f) => !f.id.startsWith("links-")));
  assert.equal(r.metrics.find((m) => m.label === "被リンク元ドメイン数")?.value, "未計測");
  assert.match(r.notes.join(""), /未設定/);
});

test("登録情報が取れない .jp は理由を note に出す", () => {
  const r = evaluateDomain(input({ domain: "example.co.jp", suffix: "co.jp", registration: null }));
  assert.equal(r.registration, null);
  assert.match(r.notes.join(""), /RDAP/);
});
