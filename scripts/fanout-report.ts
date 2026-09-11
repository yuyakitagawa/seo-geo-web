// ChatGPTの会話JSONを読んで、候補URLの「グループ内順位」「同一ドメインの枚数」と引用の関係を集計する。
// Suganthan Mohanadasan の調査（https://suganthan.com/blog/chatgpt-decides-before-it-searches/ の Idea 4）を
// 自分のログで再現できるか確かめるための道具。判定は src/lib/fanout.ts（純関数）にある。
//
// 使い方:
//   1. ChatGPTをChromeで開き、DevTools → Network タブを開く
//   2. 質問を投げ、回答が完走してから conversation のレスポンスを保存する
//      （右クリック → Copy → Copy response、または Save all as HAR は使わず個別に .json で保存）
//   3. data/fanout/ に置く（data/ は .gitignore。会話の生データはリポジトリに入れない）
//   4. npm run fanout
//
// 出力はターミナルの表と、data/fanout/rows.csv（候補URL1件＝1行）。
// 標本が小さいうちは率を書かない。20会話・1,000行に届くまでは「この観測ではこうだった」で止める。
import fs from "node:fs";
import path from "node:path";
import {
  byDomain,
  byDomainPages,
  byPosition,
  citedNotRetrieved,
  groupShape,
  parseCapture,
  toRows,
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
    try {
      return parseCapture(path.basename(f, ".json"), JSON.parse(raw));
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
      return parseCapture(path.basename(f, ".json"), events);
    }
  });
}

function table(title: string, buckets: Bucket[], showRate: boolean): void {
  console.log(`\n## ${title}`);
  const head = showRate ? "| 区分 | 取得 | 引用 | 引用率 |" : "| 区分 | 取得 | 引用 |";
  console.log(head);
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
  const rows = toRows(captures);
  const t = totals(captures, rows);
  const showRate = rows.length >= MIN_ROWS;

  console.log(`# fan-outの候補と引用（${t.captures}会話）`);
  console.log(`\n- 検索クエリ: ${t.queries}本`);
  console.log(`- グループ: ${t.groups}`);
  console.log(`- 候補URL: ${t.retrieved}件（ユニーク ${t.uniqueUrls}件）`);
  console.log(`- 引用: ${t.cited}件${showRate ? `（${t.rate.toFixed(1)}%）` : ""}`);
  const dup = captures.reduce((s, c) => s + c.duplicateGroups, 0);
  if (dup) console.log(`- 重複していたグループ ${dup}件は除外しました`);

  // グループの単位がドメインかクエリかで、順位の表の意味が変わる。先にここを見る。
  const shape = groupShape(captures);
  console.log("\n## グループの単位");
  console.log(`- 1グループあたり 候補${shape.avgEntries.toFixed(1)}件・${shape.avgDomains.toFixed(1)}ドメイン`);
  console.log(`- 1ドメインだけのグループ: ${shape.singleDomain}/${shape.groups}`);
  console.log(`- グループ自身が domain を持っていた: ${shape.withDomainField}/${shape.groups}`);
  console.log(
    shape.singleDomain / Math.max(shape.groups, 1) > 0.9
      ? "→ ドメイン単位のグループに見えます（Suganthanの読みと同じ）"
      : "→ ドメイン単位ではなくクエリ単位のグループに見えます（記事30の読みと同じ）",
  );

  table("グループ内の順位別", byPosition(rows), showRate);
  table("同一ドメインが同じグループに入れた枚数別", byDomainPages(rows), showRate);

  console.log("\n## ドメイン別（取得 vs 引用）");
  console.log("| ドメイン | 取得 | 引用 |");
  console.log("| --- | ---: | ---: |");
  for (const d of byDomain(rows).slice(0, 20)) console.log(`| ${d.domain} | ${d.retrieved} | ${d.cited} |`);

  const orphan = citedNotRetrieved(captures);
  if (orphan.length) {
    console.log(`\n## 候補一覧に無いのに引用されたURL（${orphan.length}件）`);
    for (const o of orphan.slice(0, 20)) console.log(`- ${o.url}（${o.type || "型不明"}・${o.capture}）`);
  }

  const csv = path.join(DIR, "rows.csv");
  fs.writeFileSync(
    csv,
    ["capture,group,position,same_domain_in_group,domain,url,cited"]
      .concat(rows.map((r) => [r.capture, r.groupIndex, r.position, r.sameDomainInGroup, r.domain, r.url, r.cited ? 1 : 0].join(",")))
      .join("\n") + "\n",
  );
  console.log(`\n${csv} に ${rows.length}行 を書きました。`);

  if (!showRate) {
    console.log(
      `\n**${rows.length}行では率を出しません**（${MIN_ROWS}行から）。` +
        "記事には「この観測ではこうだった」の形で、実数のまま書いてください。",
    );
  }
}

main();
