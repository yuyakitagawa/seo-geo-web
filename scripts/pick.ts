// 「候補」からその日に記事化するものを自動で選び「採用」にする。人の選別なしで毎日記事を出すためのステップ。
// generate は「採用」だけを記事化するので、選別基準の変更はこのファイルだけを直せばよい。
// 件数はスコア連動: 基本は[件数]だが、大きなニュース（MUST_SCORE以上）は件数を超えても MAX_LIMIT まで採用し、
// 逆に静かな日は基本件数に満たなくてよい（コストの平均は据え置きで、重要ニュースの取りこぼしだけを無くす）。
// 実行: npx tsx scripts/pick.ts [件数=2]
// 過去記事のバックフィル: npx tsx scripts/pick.ts --since=2026-03-02 --until=2026-07-14 [--per-month=5]
//   窓の中を暦月ごとに区切り、各月からスコア上位を --per-month 件まで採用する（月ごとの本数を揃えるため）。
//   MAX_AGE_DAYS は無視する。日次の自動採用（--since なし）の挙動は変えない。
import { loadCandidates, saveCandidates, type Candidate } from "./candidates";
import { sameTopic, tokens } from "../src/lib/topic";

// これより古いニュースは今さら記事にしない（日次モードのみ。バックフィルは --since/--until で範囲を指定する）
const MAX_AGE_DAYS = 21;
// 単発ソースの小ネタ・テーマから遠い記事を弾く下限（スコアの内訳は collect.ts の rescore を参照）
const MIN_SCORE = 2;
// これ以上のスコアは基本件数を超えても採用する（検索専門の公式発表＝+3や、複数ソースが報じた話題が届く水準）
const MUST_SCORE = 6;
// スコア連動で増やすときの上限（コアアップデート級が重なった日でもこの本数まで）
const MAX_LIMIT = 4;
// バックフィルで「同じ話題」と見なす日数差。半年分を一度に選ぶと、3月と6月のコアアップデートのように
// 別々の出来事が sameTopic で同一視されて後半の月が空になるため、近い日付のときだけ重複扱いにする。
const BACKFILL_DEDUPE_DAYS = 14;

const args = process.argv.slice(2);
const argValue = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];

// 自動採用の対象外にする候補。ツール発表（PR配信）は /tools の更新材料で、記事の題材にはしない。
function selectable(c: Candidate, minScore: number) {
  if (c.status !== "候補") return false;
  if (c.note.startsWith("ツール検知")) return false;
  if (c.score < minScore) return false;
  return Boolean(c.published);
}

function eligible(c: Candidate, now: number) {
  if (!selectable(c, MIN_SCORE)) return false;
  return Date.parse(c.published) >= now - MAX_AGE_DAYS * 86400_000;
}

/** スコア降順・同点なら新しい順 */
const byScore = (a: Candidate, b: Candidate) => b.score - a.score || (a.published < b.published ? 1 : -1);

/** 既に記事化した／これから記事化する話題（話題の語と、その記事の日付） */
type Covered = { t: Set<string>; published: string };

function pickRecent(list: Candidate[], covered: Covered[], toks: Map<Candidate, Set<string>>) {
  const limit = Number(args.find((a) => /^\d+$/.test(a)) ?? 2);
  const now = Date.now();
  const need = limit - list.filter((c) => c.status === "採用").length;
  const maxNeed = MAX_LIMIT - list.filter((c) => c.status === "採用").length;
  const picked: Candidate[] = [];

  for (const c of list.filter((x) => eligible(x, now)).sort(byScore)) {
    // 基本件数を使い切っても、大きなニュース（MUST_SCORE以上）は MAX_LIMIT まで採用する
    if (picked.length >= maxNeed) break;
    if (picked.length >= need && c.score < MUST_SCORE) break;
    const t = toks.get(c)!;
    if (covered.some((x) => sameTopic(t, x.t))) continue;
    c.status = "採用";
    covered.push({ t, published: c.published });
    picked.push(c);
  }
  return picked;
}

/**
 * バックフィル。窓の中を暦月で区切り、各月から上位 perMonth 件を採用する。
 * 新しさの+1点（collect.ts の rescore）は過去記事では誰も取れないため、下限を1つ下げて釣り合わせる。
 */
function pickBackfill(list: Candidate[], covered: Covered[], toks: Map<Candidate, Set<string>>, since: string, until: string) {
  const perMonth = Number(argValue("per-month") ?? 5);
  const byMonth = new Map<string, Candidate[]>();
  for (const c of list.filter((x) => selectable(x, MIN_SCORE - 1) && x.published >= since && x.published <= until).sort(byScore)) {
    const month = c.published.slice(0, 7);
    const bucket = byMonth.get(month) ?? [];
    bucket.push(c);
    byMonth.set(month, bucket);
  }

  const picked: Candidate[] = [];
  for (const month of [...byMonth.keys()].sort()) {
    let n = 0;
    for (const c of byMonth.get(month)!) {
      if (n >= perMonth) break;
      const t = toks.get(c)!;
      if (covered.some((x) => sameTopic(t, x.t) && Math.abs(Date.parse(c.published) - Date.parse(x.published)) <= BACKFILL_DEDUPE_DAYS * 86400_000)) continue;
      c.status = "採用";
      covered.push({ t, published: c.published });
      picked.push(c);
      n++;
    }
    console.log(`[backfill] ${month}: ${n}件`);
  }
  return picked;
}

function main() {
  const since = argValue("since") ?? "";
  const until = argValue("until") ?? new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
  const list = loadCandidates();
  const toks = new Map(list.map((c) => [c, tokens(c.title)] as const));

  // 既に記事化した／これから記事化する話題は二度書かない。転載の重複はURL・タイトルで
  // collect が弾くが、別ソースが同じ発表を報じた場合はここでしか止まらない。
  const covered: Covered[] = list.filter((c) => c.status === "公開" || c.status === "採用").map((c) => ({ t: toks.get(c)!, published: c.published }));

  const picked = since ? pickBackfill(list, covered, toks, since, until) : pickRecent(list, covered, toks);

  saveCandidates(list);
  if (picked.length === 0) {
    console.log(`採用できる候補がありません（候補 ${list.filter((c) => c.status === "候補").length} / 採用済み ${list.filter((c) => c.status === "採用").length}）`);
    return;
  }
  for (const c of picked) console.log(`採用 score=${c.score} ${c.published} ${c.title}`);
}

main();
