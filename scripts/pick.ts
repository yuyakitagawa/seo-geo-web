// 「候補」からその日に記事化するものを自動で選び「採用」にする。人の選別なしで毎日記事を出すためのステップ。
// generate は「採用」だけを記事化するので、選別基準の変更はこのファイルだけを直せばよい。
// 件数はスコア連動: 基本は[件数]だが、大きなニュース（MUST_SCORE以上）は件数を超えても MAX_LIMIT まで採用し、
// 逆に静かな日は基本件数に満たなくてよい（コストの平均は据え置きで、重要ニュースの取りこぼしだけを無くす）。
// 実行: npx tsx scripts/pick.ts [件数=2]
import { loadCandidates, saveCandidates, type Candidate } from "./candidates";
import { sameTopic, tokens } from "./topic";

// これより古いニュースは今さら記事にしない
const MAX_AGE_DAYS = 21;
// 単発ソースの小ネタ・テーマから遠い記事を弾く下限（スコアの内訳は collect.ts の rescore を参照）
const MIN_SCORE = 2;
// これ以上のスコアは基本件数を超えても採用する（検索専門の公式発表＝+3や、複数ソースが報じた話題が届く水準）
const MUST_SCORE = 6;
// スコア連動で増やすときの上限（コアアップデート級が重なった日でもこの本数まで）
const MAX_LIMIT = 4;

// 自動採用の対象外にする候補。ツール発表（PR配信）は /tools の更新材料で、記事の題材にはしない。
function eligible(c: Candidate, now: number) {
  if (c.status !== "候補") return false;
  if (c.note.startsWith("ツール検知")) return false;
  if (c.score < MIN_SCORE) return false;
  if (!c.published) return false;
  return Date.parse(c.published) >= now - MAX_AGE_DAYS * 86400_000;
}

function main() {
  const limit = Number(process.argv[2] ?? 2);
  const now = Date.now();
  const list = loadCandidates();
  const toks = new Map(list.map((c) => [c, tokens(c.title)] as const));

  // 既に記事化した／これから記事化する話題は二度書かない。転載の重複はURL・タイトルで
  // collect が弾くが、別ソースが同じ発表を報じた場合はここでしか止まらない。
  const covered = list.filter((c) => c.status === "公開" || c.status === "採用").map((c) => toks.get(c)!);
  const need = limit - list.filter((c) => c.status === "採用").length;
  const picked: Candidate[] = [];

  const maxNeed = MAX_LIMIT - list.filter((c) => c.status === "採用").length;
  for (const c of list.filter((x) => eligible(x, now)).sort((a, b) => b.score - a.score || (a.published < b.published ? 1 : -1))) {
    // 基本件数を使い切っても、大きなニュース（MUST_SCORE以上）は MAX_LIMIT まで採用する
    if (picked.length >= maxNeed) break;
    if (picked.length >= need && c.score < MUST_SCORE) break;
    const t = toks.get(c)!;
    if (covered.some((x) => sameTopic(t, x))) continue;
    c.status = "採用";
    covered.push(t);
    picked.push(c);
  }

  saveCandidates(list);
  if (picked.length === 0) {
    console.log(`採用できる候補がありません（候補 ${list.filter((c) => c.status === "候補").length} / 採用済み ${list.filter((c) => c.status === "採用").length}）`);
    return;
  }
  for (const c of picked) console.log(`採用 score=${c.score} ${c.published} ${c.title}`);
}

main();
