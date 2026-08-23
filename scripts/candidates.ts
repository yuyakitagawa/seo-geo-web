// 候補リスト content/candidates.csv の読み書き。
// 収集した記事はまずここに「候補」として積み、人が「採用」「却下」を付ける。generate は「採用」だけを記事化する。
// CSVをリポジトリ管理にしているのは、GitHub Actions・ローカル・スプレッドシート書き出しのどこからでも同じ正を見るため。
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

export const CANDIDATES_PATH = path.join(process.cwd(), "content", "candidates.csv");

export type Status = "候補" | "採用" | "却下" | "公開";
export const STATUSES: Status[] = ["候補", "採用", "却下", "公開"];

export type Candidate = {
  status: Status;
  score: number;
  published: string; // YYYY-MM-DD
  source: string;
  kind: "official" | "media";
  title: string;
  url: string;
  summary: string;
  /** 同じ話題を報じたソース数（自分を含む）。スコアの主要因 */
  cluster: number;
  /** 記事化した場合の記事id */
  articleId: string;
  /** 人が書くメモ（切り口など） */
  note: string;
};

const COLUMNS: (keyof Candidate)[] = ["status", "score", "published", "source", "kind", "title", "url", "summary", "cluster", "articleId", "note"];

export function loadCandidates(): Candidate[] {
  if (!fs.existsSync(CANDIDATES_PATH)) return [];
  const rows = parse(fs.readFileSync(CANDIDATES_PATH, "utf8"), { columns: true, skip_empty_lines: true }) as Record<string, string>[];
  return rows.map((r) => ({
    status: (STATUSES.includes(r.status as Status) ? r.status : "候補") as Status,
    score: Number(r.score) || 0,
    published: r.published ?? "",
    source: r.source ?? "",
    kind: r.kind === "official" ? "official" : "media",
    title: r.title ?? "",
    url: r.url ?? "",
    summary: r.summary ?? "",
    cluster: Number(r.cluster) || 1,
    articleId: r.articleId ?? "",
    note: r.note ?? "",
  }));
}

// 並び順: 採用 → 候補（スコア順）→ 公開 → 却下。人が見るときに上から判断できるように。
const STATUS_ORDER: Record<Status, number> = { 採用: 0, 候補: 1, 公開: 2, 却下: 3 };

export function saveCandidates(list: Candidate[]) {
  const sorted = [...list].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.score - a.score || (a.published < b.published ? 1 : -1)
  );
  fs.mkdirSync(path.dirname(CANDIDATES_PATH), { recursive: true });
  fs.writeFileSync(CANDIDATES_PATH, stringify(sorted, { header: true, columns: COLUMNS }));
}
