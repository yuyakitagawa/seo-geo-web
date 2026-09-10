// /tools の一覧が、収集した「ツール検知」候補に追いついているかを報告する（変更はしない）。
//
// content/tools.json は公式ページを人が確認したツールだけを載せる決まりなので、自動追記はしない。
// このスクリプトが出すのは「まだ載っていない可能性のあるツール」と「確認から時間が経ったツール」の
// 候補だけで、公式ページを見て verified を打ち直すのは人の作業。
//
// 使い方: npm run tools-gap [日数]（既定90日。候補の公開日で絞る）
import { loadCandidates } from "./candidates";
import { APP_TOOLS } from "../src/lib/apps";
import { getTools } from "../src/lib/tools";

/** 確認から何日で「再確認したい」とみなすか。価格・対応エンジンが動きやすいので短めにする */
const STALE_DAYS = 180;

const days = Number(process.argv[2]) || 90;
const today = new Date();
const since = new Date(today.getTime() - days * 86400_000).toISOString().slice(0, 10);

const tools = getTools();

/**
 * ベンダー名として持っているが、収録の証拠に使えない語。SEOニュースの見出しにほぼ必ず出るため、
 * これで照合すると未収録のツールまで「収録済み」に見えてしまう。
 * この2社のツールはツール名の完全一致だけで拾う。
 */
const TOO_COMMON = new Set(["google", "microsoft"]);

/** 法人格・「（旧◯◯）」を落とす。"株式会社Ascent Networks" → "ascent networks" */
function normalizeVendor(v: string): string {
  return v
    .toLowerCase()
    .replace(/（[^）]*）|\([^)]*\)/g, "")
    .replace(/株式会社|合同会社|有限会社|\b(inc|llc|ltd|gmbh|b\.v|co)\b\.?/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 収録済みの手がかり語。**ツール名・ベンダー名の完全な識別子だけ**を入れる。
 * 以前は4文字以上の語に分割していたが、"google" "brand" "insight" "tracker" のような
 * 一般語が生まれ、それを含むだけの候補が全部「収録済み」に落ちていた（未収録の「AI検索くん」が消えた）。
 */
const known = new Set<string>();
for (const t of tools) {
  known.add(t.name.toLowerCase());
  for (const v of [t.vendor.toLowerCase(), normalizeVendor(t.vendor)]) {
    if (v.length >= 3 && !TOO_COMMON.has(v)) known.add(v);
  }
}

const detected = loadCandidates().filter((c) => c.note.startsWith("ツール検知") && c.published >= since);
const unknown = detected.filter((c) => {
  const text = `${c.title} ${c.summary}`.toLowerCase();
  return ![...known].some((k) => text.includes(k));
});

console.log(`収録 ${tools.length}件 / ツール検知の候補（直近${days}日）${detected.length}件 / 収録名が出てこない ${unknown.length}件`);

if (unknown.length > 0) {
  console.log("\n■ /tools に無いツールかもしれない候補（公式ページを見てから content/tools.json に追記する）");
  for (const c of unknown.slice(0, 30)) console.log(`  ${c.published} ${c.title}\n     ${c.url}`);
  if (unknown.length > 30) console.log(`  …ほか${unknown.length - 30}件`);
}

const staleBefore = new Date(today.getTime() - STALE_DAYS * 86400_000).toISOString().slice(0, 10);
const stale = tools.filter((t) => t.verified < staleBefore).sort((a, b) => a.verified.localeCompare(b.verified));
if (stale.length > 0) {
  console.log(`\n■ 確認から${STALE_DAYS}日以上たったツール（価格・対応エンジンを見直す）`);
  for (const t of stale) console.log(`  ${t.verified} ${t.name}（${t.vendor}） ${t.url}`);
}

const staleApps = APP_TOOLS.filter((a) => a.updated < staleBefore);
if (staleApps.length > 0) {
  console.log(`\n■ ${STALE_DAYS}日以上さわっていない自作ツール（判定の前提が変わっていないか確認する）`);
  for (const a of staleApps) console.log(`  ${a.updated} ${a.path} ${a.name}`);
}

if (unknown.length === 0 && stale.length === 0 && staleApps.length === 0) console.log("\n更新が要りそうなものはありません。");
