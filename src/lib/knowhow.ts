import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { LESSONS } from "./curriculum";

// 記事から取り出したノウハウの採否台帳（content/knowhow.csv）。
//
// 記事は毎朝自動で増えるが、**そのほとんどは教科書に組み込む価値がない**
// （単発の障害報告、「テストを開始」だけの記事、既に教科書に書いてあることの言い換え）。
// どれを組み込むかは scripts/knowhow.ts が Claude に1本ずつ判定させ、この表に書く。
// 採用された行だけがレッスンページに出る。判定していない記事は何も起こさない。
//
// status:
//   採用   … 教科書に組み込む価値がある。レッスンページの「この記事から取り入れたこと」に出る
//   反映済 … レッスン本文そのものに書き込んだ。二重に出さないので表示からは外れる
//   却下   … 何もしない（理由を残す。同じ判断を繰り返さないため）

const KNOWHOW_PATH = path.join(process.cwd(), "content", "knowhow.csv");

export type KnowhowStatus = "採用" | "却下" | "反映済";
export const KNOWHOW_STATUSES: KnowhowStatus[] = ["採用", "却下", "反映済"];

/** 反映先。lesson:<レッスンのslug> / tool:page-audit（診断の判定を足す）/ tool:list（/tools に載せる）*/
export type KnowhowTarget = `lesson:${string}` | "tool:page-audit" | "tool:list" | "-";

export type Knowhow = {
  status: KnowhowStatus;
  /** 出典になる記事の id */
  articleId: number;
  target: KnowhowTarget;
  /** 教科書に組み込む1文。読者が自分のサイトで実行できる形にする */
  knowhow: string;
  /** レッスンのどこに入れるか（checklist / body）。ツール向けは空 */
  where: string;
  /** 判定の理由。却下でも必ず書く */
  reason: string;
  /** 判定した日 YYYY-MM-DD */
  judged: string;
};

export const KNOWHOW_COLUMNS: (keyof Knowhow)[] = ["status", "articleId", "target", "knowhow", "where", "reason", "judged"];

const LESSON_SLUGS = new Set(LESSONS.map((l) => l.slug));

/** 反映先として書ける文字列か。存在しないレッスンを指した行を静かに無視しないための検査 */
export function isKnowhowTarget(v: string): v is KnowhowTarget {
  if (v === "tool:page-audit" || v === "tool:list" || v === "-") return true;
  return v.startsWith("lesson:") && LESSON_SLUGS.has(v.slice("lesson:".length));
}

export function getKnowhow(): Knowhow[] {
  if (!fs.existsSync(KNOWHOW_PATH)) return [];
  const rows = parse(fs.readFileSync(KNOWHOW_PATH, "utf8"), { columns: true, skip_empty_lines: true }) as Record<string, string>[];
  return rows.map((r) => ({
    status: (KNOWHOW_STATUSES.includes(r.status as KnowhowStatus) ? r.status : "却下") as KnowhowStatus,
    articleId: Number(r.articleId) || 0,
    target: (isKnowhowTarget(r.target ?? "") ? r.target : "-") as KnowhowTarget,
    knowhow: r.knowhow ?? "",
    where: r.where ?? "",
    reason: r.reason ?? "",
    judged: r.judged ?? "",
  }));
}

/** 判定済みの記事id。scripts/knowhow.ts が二重に判定しないために使う */
export function judgedArticleIds(): Set<number> {
  return new Set(getKnowhow().map((k) => k.articleId));
}

/** そのレッスンに組み込むと決めたノウハウ。反映済（本文に書いた）は二重に出さない */
export function adoptedForLesson(slug: string): Knowhow[] {
  return getKnowhow().filter((k) => k.status === "採用" && k.target === `lesson:${slug}` && k.knowhow !== "");
}

/** ツール側への反映待ち。ページ診断の判定追加・/tools への掲載候補 */
export function adoptedForTools(): Knowhow[] {
  return getKnowhow().filter((k) => k.status === "採用" && k.target.startsWith("tool:"));
}
