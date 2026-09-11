// ChatGPTの会話JSONを読んで、ドメイングループ内の順位・グループの大きさと引用の関係を集計する。
// Suganthan Mohanadasan の調査（https://suganthan.com/blog/chatgpt-decides-before-it-searches/ の Idea 4）を
// 自分のログで再現できるか確かめるための道具。判定は src/lib/fanout.ts（純関数）にある。
//
// 使い方:
//   1. ChatGPTをChromeで開き、DevTools → Network タブを開く
//   2. 質問を投げ、回答が完走してから conversation のレスポンスを保存する
//      （右クリック → Copy → Copy response、または該当レスポンスを .json で保存）
//   3. data/fanout/ に置く（data/ は .gitignore。会話の生データはリポジトリに入れない）
//   4. npm run fanout
//
// 出力はターミナルの表と、data/fanout/rows.csv（候補URL1件＝1行）。
// 標本が小さいうちは率を書かない。1,000行に届くまでは「この観測ではこうだった」で止める。
import fs from "node:fs";
import path from "node:path";
import {
  allEntries,
  byDomain,
  byGroupSize,
  byPosition,
  citedNotRetrieved,
  groupShape,
  listDropCross,
  parseCapture,
  totals,
  type Bucket,
  type Capture,
} from "../src/lib/fanout";

const DIR = path.join(process.cwd(), "data", "fanout");
/** これを下回るうちは率として読まない（Suganthanの調査は57会話・3,554行） */
const MIN_ROWS = 1000;

function read(): Capture[] {
  if (!fs.existsSync(DIR)) {
    console.error(`${DIR} がありません。会話JSONを置いてから実行してください。`);
    process.exit(1);
  }
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).sort();
  if (!files.length) {
    console.error(`${DIR} に .json がありません。`);
    process.exit(1);
  }
  return files.map((f) => {
    const raw = fs.readFileSync(path.join(DIR, f), "utf8");
    const name = path.basename(f, ".json");
    try {
      return parseCapture(name, JSON.parse(raw));
    } catch {
      // DevTools の Copy response は SSE（data: {...} の行の連なり）になることがある
      const events = raw
        .split(/\r?\n/)
        .filter((l) => l.startsWith("data: ") && l !== "data: [DONE]")
        .map((l) => {
          try {
            return JSON.parse(l.slice(6));
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      if (!events.length) {
        console.error(`${f} をJSONとして読めませんでした。`);
        process.exit(1);
      }
      return parseCapture(name, events);
    }
  });
}

function table(title: string, buckets: Bucket[], showRate: boolean): void {
  console.log(`\n## ${title}`);
  console.log(showRate ? "| 区分 | 候補 | 引用 | 引用率 |" : "| 区分 | 候補 | 引用 |");
  console.log(showRate ? "| --- | ---: | ---: | ---: |" : "| --- | ---: | ---: |");
  for (const b of buckets) {
    if (!b.retrieved) continue;
    console.log(
      showRate
        ? `| ${b.label} | ${b.retrieved} | ${b.cited} | ${b.rate.toFixed(1)}% |`
        : `| ${b.label} | ${b.retrieved} | ${b.cited} |`,
    );
  }
}

function main(): void {
  const captures = read();
  const entries = allEntries(captures);
  const t = totals(captures);
  const showRate = entries.length >= MIN_ROWS;

  console.log(`# fan-outの候補と引用（${t.captures}会話）`);
  console.log(`\n- 検索クエリ: ${t.queries}本`);
  console.log(`- ドメイングループ: ${t.groups}`);
  console.log(`- 候補URL: ${t.retrieved}件`);
  console.log(`- 引用: ${t.cited}件${showRate ? `（${t.rate.toFixed(1)}%）` : ""}`);
  for (const c of captures) {
    const cited = c.entries.filter((e) => e.cited).length;
    console.log(`  - ${c.name}: 候補${c.entries.length} / 引用${cited} / グループ${c.groups.length} / クエリ${c.queries.length}`);
  }

  const shape = groupShape(captures);
  console.log("\n## グループの単位");
  console.log(`- ログの domain を持っていたグループ: ${shape.withDomainField}/${shape.groups}`);
  console.log(`- グループ名と違うホストの候補（例 qa.smbc-card.com → smbc-card.com）: ${shape.subdomainFolded}件`);
  console.log(`- 候補一覧がログに入っていた回数（速報＋最終）: ${shape.listSnapshots}`);

  table("ドメイングループ内の順位別", byPosition(entries), showRate);
  table("同じドメインから何枚入ったか別", byGroupSize(entries), showRate);

  console.log("\n## 引用された候補は最終の一覧に残るか");
  for (const r of listDropCross(entries)) console.log(`- ${r.label}: ${r.count}`);

  console.log("\n## ドメイン別（候補 vs 引用）");
  console.log("| ドメイン | 候補 | 引用 |");
  console.log("| --- | ---: | ---: |");
  for (const d of byDomain(entries).slice(0, 25)) console.log(`| ${d.domain} | ${d.retrieved} | ${d.cited} |`);

  const orphan = citedNotRetrieved(captures);
  if (orphan.length) {
    console.log(`\n## 候補一覧に無いのに引用されたURL（${orphan.length}件）`);
    for (const o of orphan.slice(0, 20)) console.log(`- ${o.url}（${o.type || "型不明"}・${o.capture}）`);
  }

  const csv = path.join(DIR, "rows.csv");
  fs.writeFileSync(
    csv,
    ["capture,turn,domain,position,group_size,in_last_list,cited,url"]
      .concat(
        captures.flatMap((c) =>
          c.entries.map((e) =>
            [c.name, e.turnIndex, e.domain, e.position, e.groupSize, e.inLastList ? 1 : 0, e.cited ? 1 : 0, e.url].join(","),
          ),
        ),
      )
      .join("\n") + "\n",
  );
  console.log(`\n${csv} に ${entries.length}行 を書きました。`);

  if (!showRate) {
    console.log(
      `\n**${entries.length}行では率を出しません**（${MIN_ROWS}行から）。` +
        "記事には「この観測ではこうだった」の形で、実数のまま書いてください。",
    );
  }
}

main();
