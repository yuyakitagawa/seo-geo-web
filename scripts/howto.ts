// HOW TO記事のテーマ表 content/howto-topics.csv の読み書き。
// ニュース候補（candidates.csv）はRSSから機械的に積まれるが、HOW TOのテーマは人が決める。
// 「採用」の行だけを generate-howto が記事化し、記事化できたら「公開」にして記事idを書き戻す。
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { isCategoryKey, type CategoryKey } from "../src/lib/site";

export const TOPICS_PATH = path.join(process.cwd(), "content", "howto-topics.csv");

export type TopicStatus = "候補" | "採用" | "却下" | "公開";
const STATUSES: TopicStatus[] = ["候補", "採用", "却下", "公開"];

export type Topic = {
  status: TopicStatus;
  category: CategoryKey;
  /** 記事タイトルの案。生成側はこれを踏まえて最終タイトルを決める */
  title: string;
  /** 読者がこの記事に来るときの検索意図。「## 結論」の1文目はこれに直答する */
  intent: string;
  /** 一次情報URL。`|` 区切り。ここに無いことは書かせない */
  sources: string[];
  articleId: string;
  note: string;
};

const COLUMNS: (keyof Topic)[] = ["status", "category", "title", "intent", "sources", "articleId", "note"];

export function loadTopics(): Topic[] {
  if (!fs.existsSync(TOPICS_PATH)) return [];
  const rows = parse(fs.readFileSync(TOPICS_PATH, "utf8"), { columns: true, skip_empty_lines: true }) as Record<string, string>[];
  return rows.map((r) => ({
    status: (STATUSES.includes(r.status as TopicStatus) ? r.status : "候補") as TopicStatus,
    category: isCategoryKey(r.category) ? r.category : "seo",
    title: r.title ?? "",
    intent: r.intent ?? "",
    sources: (r.sources ?? "").split("|").map((s) => s.trim()).filter(Boolean),
    articleId: r.articleId ?? "",
    note: r.note ?? "",
  }));
}

const STATUS_ORDER: Record<TopicStatus, number> = { 採用: 0, 候補: 1, 公開: 2, 却下: 3 };

export function saveTopics(list: Topic[]) {
  const sorted = [...list].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.category.localeCompare(b.category));
  fs.writeFileSync(
    TOPICS_PATH,
    stringify(sorted.map((t) => ({ ...t, sources: t.sources.join("|") })), { header: true, columns: COLUMNS })
  );
}
