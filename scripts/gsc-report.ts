// Search Console のエクスポートCSVを読んで、独自記事（original: true）の材料になる集計を出す。
// 記事パイプラインの片翼「海外翻訳＋解説」に対して、こちらは自サイトの実測から書くための道具。
//
// 使い方:
//   1. Search Console の「検索パフォーマンス」で期間を選び、右上のエクスポート → CSVをダウンロード
//   2. zipを解凍して data/gsc/ に置く（data/ は .gitignore。生データはリポジトリに入れない）
//   3. npm run gsc
//
// UIが日本語でも英語でも読めるようにしてある（ファイル名・列名の両方）。
// 出力は実数と率の両方を出すが、**記事に載せるのは率だけにする**（匿名運営なのでPVの実数は公開しない）。
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import matter from "gray-matter";

const GSC_DIR = path.join(process.cwd(), "data", "gsc");
const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

/** Search Console のエクスポートに入るCSV。日本語UIと英語UIでファイル名が違う */
const FILES = {
  queries: ["クエリ.csv", "Queries.csv"],
  pages: ["ページ.csv", "Pages.csv"],
  dates: ["日付.csv", "Dates.csv"],
  appearance: ["検索での見え方.csv", "Search appearance.csv"],
  devices: ["デバイス.csv", "Devices.csv"],
} as const;

/** 列名も日本語・英語の両方が来る。先頭列（何の切り口か）はファイルごとに名前が変わるので位置で取る */
const COLUMNS = {
  clicks: ["クリック数", "Clicks"],
  impressions: ["表示回数", "Impressions"],
  position: ["掲載順位", "Position"],
} as const;

type Row = { key: string; clicks: number; impressions: number; position: number };

function pick(row: Record<string, string>, names: readonly string[]): string {
  for (const n of names) if (row[n] !== undefined) return row[n];
  return "";
}

/** 1ファイル読む。無ければ null（エクスポートに含まれない切り口があるため、落とさず飛ばす） */
function read(names: readonly string[]): Row[] | null {
  const file = names.map((n) => path.join(GSC_DIR, n)).find((p) => fs.existsSync(p));
  if (!file) return null;
  const rows = parse(fs.readFileSync(file, "utf8"), { columns: true, skip_empty_lines: true, bom: true }) as Record<string, string>[];
  return rows.map((r) => ({
    // 先頭列が切り口（クエリ／ページ／日付…）。名前がファイルごとに違うので位置で取る。
    key: r[Object.keys(r)[0]] ?? "",
    clicks: Number(pick(r, COLUMNS.clicks)) || 0,
    impressions: Number(pick(r, COLUMNS.impressions)) || 0,
    position: Number(pick(r, COLUMNS.position)) || 0,
  }));
}

/** 表示回数で重み付けした平均掲載順位。単純平均だと表示の少ないクエリに引っぱられる */
function avgPosition(rows: Row[]): number {
  const imp = rows.reduce((s, r) => s + r.impressions, 0);
  if (!imp) return 0;
  return rows.reduce((s, r) => s + r.position * r.impressions, 0) / imp;
}

function ctr(clicks: number, impressions: number): string {
  return impressions ? `${((clicks / impressions) * 100).toFixed(2)}%` : "—";
}

/** 端末の表示幅。全角を2としないと日本語ラベルの列がずれる */
function width(s: string): number {
  let w = 0;
  for (const c of s) w += c.codePointAt(0)! < 0x1100 ? 1 : 2;
  return w;
}

function pad(s: string, to: number): string {
  return s + " ".repeat(Math.max(to - width(s), 0));
}

/** 集計結果を1つの表として出す。value は率、参考として実数も併記する */
function table(title: string, groups: { label: string; rows: Row[] }[]): void {
  console.log(`\n## ${title}`);
  const col = Math.max(...groups.map((g) => width(g.label)), 12);
  console.log(`${pad("区分", col)}  ${"CTR".padStart(7)}  平均順位  表示シェア  (クリック/表示)`);
  const total = groups.reduce((s, g) => s + g.rows.reduce((t, r) => t + r.impressions, 0), 0);
  for (const g of groups) {
    const clicks = g.rows.reduce((s, r) => s + r.clicks, 0);
    const impressions = g.rows.reduce((s, r) => s + r.impressions, 0);
    if (!impressions) continue;
    const share = total ? `${((impressions / total) * 100).toFixed(1)}%` : "—";
    console.log(
      `${pad(g.label, col)}  ${ctr(clicks, impressions).padStart(7)}  ${avgPosition(g.rows).toFixed(1).padStart(8)}  ${share.padStart(10)}  (${clicks}/${impressions})`
    );
  }
}

/** 記事のfrontmatterを id 引きできる形にする。ページ別の成績を記事の型と結合するため */
function articleMeta(): Map<string, { type: string; category: string; original: boolean }> {
  const map = new Map<string, { type: string; category: string; original: boolean }>();
  for (const f of fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".mdx"))) {
    const { data } = matter(fs.readFileSync(path.join(ARTICLES_DIR, f), "utf8"));
    if (data.id === undefined) continue;
    map.set(String(data.id), {
      type: String(data.type ?? "news"),
      category: String(data.category ?? ""),
      original: data.original === true,
    });
  }
  return map;
}

function bucket<T>(rows: Row[], of: (r: Row) => T, labels: { label: string; match: T }[]) {
  return labels.map((l) => ({ label: l.label, rows: rows.filter((r) => of(r) === l.match) }));
}

function main() {
  if (!fs.existsSync(GSC_DIR) || !fs.readdirSync(GSC_DIR).some((f) => f.endsWith(".csv"))) {
    console.error(`${GSC_DIR} にCSVがありません。Search Consoleの検索パフォーマンスからエクスポートし、zipを解凍して置いてください。`);
    process.exitCode = 1;
    return;
  }

  const queries = read(FILES.queries);
  const pages = read(FILES.pages);
  const appearance = read(FILES.appearance);
  const devices = read(FILES.devices);

  if (queries) {
    const clicks = queries.reduce((s, r) => s + r.clicks, 0);
    const impressions = queries.reduce((s, r) => s + r.impressions, 0);
    console.log(`\n## 概況（クエリ${queries.length}件）`);
    console.log(`クリック ${clicks} / 表示 ${impressions} / CTR ${ctr(clicks, impressions)} / 平均順位 ${avgPosition(queries).toFixed(1)}`);

    // 掲載順位帯ごとの実測CTR。「順位が上がると何%取れるのか」を自サイトの数字で言える。
    table("掲載順位帯別のCTR", [
      { label: "1〜3位", rows: queries.filter((r) => r.position < 3.5) },
      { label: "4〜10位", rows: queries.filter((r) => r.position >= 3.5 && r.position < 10.5) },
      { label: "11〜20位", rows: queries.filter((r) => r.position >= 10.5 && r.position < 20.5) },
      { label: "21位以下", rows: queries.filter((r) => r.position >= 20.5) },
    ]);

    // クエリの長さ別。ロングテールが実際に効いているかを見る。
    table("クエリの文字数別", [
      { label: "〜10字", rows: queries.filter((r) => [...r.key].length <= 10) },
      { label: "11〜20字", rows: queries.filter((r) => [...r.key].length > 10 && [...r.key].length <= 20) },
      { label: "21字〜", rows: queries.filter((r) => [...r.key].length > 20) },
    ]);
  }

  // 「検索での見え方」に生成AIパフォーマンス等が入る。AI検索の実測はここから取る。
  if (appearance) table("検索での見え方別", appearance.map((r) => ({ label: r.key, rows: [r] })));
  if (devices) table("デバイス別", devices.map((r) => ({ label: r.key, rows: [r] })));

  if (pages) {
    const meta = articleMeta();
    const idOf = (url: string) => url.match(/\/articles\/(\d+)/)?.[1] ?? "";
    const metaOf = (r: Row) => meta.get(idOf(r.key));
    const articles = pages.filter((r) => metaOf(r));

    // 独自記事と要約記事のどちらが実際に読まれているか。2本立ての効果検証はこの表を見る。
    table("記事の型別", [
      ...bucket(articles, (r) => metaOf(r)!.original, [
        { label: "独自記事", match: true },
        { label: "要約・解説", match: false },
      ]),
    ]);
    table("記事タイプ別", [
      ...bucket(articles, (r) => metaOf(r)!.type, [
        { label: "news（フロー）", match: "news" },
        { label: "howto（ストック）", match: "howto" },
      ]),
    ]);
    table("カテゴリ別", [
      ...bucket(articles, (r) => metaOf(r)!.category, [
        { label: "seo", match: "seo" },
        { label: "geo", match: "geo" },
      ]),
    ]);

    const other = pages.length - articles.length;
    if (other) console.log(`\n（記事以外のページ${other}件は集計から除外しました）`);
  }

  console.log("\n記事に載せるのは率だけにする（クリック・表示の実数は匿名運営の方針で公開しない）。");
}

main();
