import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { CATEGORY_KEYS, isCategoryKey, type CategoryKey } from "./site";

// 記事は content/articles/<slug>.mdx に置く。AI生成パイプライン(scripts/)の出力先もここ。
// CMSを使わずリポジトリ内で完結させることで、生成→PRレビュー→マージ→デプロイがGitだけで回る。
const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

export type Source = { title: string; url: string };

// 影響度。全記事の冒頭パネルに固定表示し、読者が「読むべきか」を3秒で判断できるようにする。
export type Impact = "high" | "mid" | "low";
export const IMPACT_LABEL: Record<Impact, string> = { high: "影響大", mid: "影響中", low: "影響小" };
function parseImpact(v: unknown): Impact | undefined {
  return v === "high" || v === "mid" || v === "low" ? v : undefined;
}

// 記事の型。news=その日の変更を伝えるフロー記事、howto=検索意図に答え続けるストック記事。
// AI検索に引用されるのは手順・定義を持つ howto 側なので、一覧では howto を先に見せる。
export type ArticleType = "news" | "howto";
export const TYPE_LABEL: Record<ArticleType, string> = { news: "ニュース", howto: "解説" };
function parseType(v: unknown): ArticleType {
  return v === "howto" ? "howto" : "news";
}

export type ArticleMeta = {
  /** 記事番号。URLは /articles/<id>。frontmatter の id で固定し、ファイル名を変えてもURLは変わらない */
  id: number;
  /** URL用。id の文字列 */
  slug: string;
  title: string;
  description: string;
  /** 公開日 YYYY-MM-DD */
  date: string;
  /** 更新日 YYYY-MM-DD（未指定なら date） */
  updated: string;
  category: CategoryKey;
  /** 記事の型。news=フロー / howto=ストック */
  type: ArticleType;
  tags: string[];
  /** 一次情報。GEO対策として記事末尾と JSON-LD の citation に出す */
  sources: Source[];
  /** 影響度（任意） */
  impact?: Impact;
  /** 誰に影響するか（任意。例: "ECサイト運営者"） */
  audience?: string;
  /** 今すぐやること（任意、1〜4項目） */
  actions: string[];
  /** この記事が置き換える古い記事の id。指定された記事は noindex + sitemap除外（src/lib/indexability.ts） */
  supersedes: number[];
  /** true の記事は本番ビルドに含めない（AI生成の下書き状態） */
  draft: boolean;
  /** 独自記事。自分で取ったログ・実測値・検証結果が本文の中心にあるものだけ true */
  original: boolean;
  /** 読了時間（分） */
  readingMinutes: number;
};

export type Article = ArticleMeta & { body: string };

function parseDate(value: unknown, field: "date" | "updated", file: string): string {
  const parsed = typeof value === "string" ? new Date(`${value}T00:00:00Z`) : null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !parsed || Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`content/articles/${file}: frontmatter の ${field} は YYYY-MM-DD 形式の有効な日付が必要です`);
  }
  return value;
}

function parseSources(value: unknown, file: string): Source[] {
  if (!Array.isArray(value)) return [];
  return value.map((source, index) => {
    if (!source || typeof source !== "object" || typeof (source as Source).url !== "string") {
      throw new Error(`content/articles/${file}: sources[${index}] の url が必要です`);
    }
    const url = (source as Source).url;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
    } catch {
      throw new Error(`content/articles/${file}: sources[${index}].url は http / https のURLが必要です`);
    }
    return { title: typeof (source as Source).title === "string" ? (source as Source).title : url, url };
  });
}

function parseFile(file: string): Article | null {
  const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), "utf8");
  const { data, content } = matter(raw);

  if (typeof data.title !== "string" || typeof data.date !== "string") {
    throw new Error(`content/articles/${file}: frontmatter に title と date が必要です`);
  }
  const date = parseDate(data.date, "date", file);
  const updated = data.updated === undefined ? date : parseDate(data.updated, "updated", file);
  if (!Number.isInteger(data.id) || data.id <= 0) {
    throw new Error(`content/articles/${file}: frontmatter に正の整数の id が必要です（URLになる番号）`);
  }
  const category = String(data.category ?? "news");
  if (!isCategoryKey(category)) {
    throw new Error(`content/articles/${file}: category は ${CATEGORY_KEYS.join("|")} のいずれか`);
  }
  const draft = Boolean(data.draft);
  if (draft && process.env.NODE_ENV === "production") return null;

  return {
    id: data.id,
    slug: String(data.id),
    title: data.title,
    description: typeof data.description === "string" ? data.description : "",
    date,
    updated,
    category,
    type: parseType(data.type),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    sources: parseSources(data.sources, file),
    impact: parseImpact(data.impact),
    audience: typeof data.audience === "string" ? data.audience : undefined,
    actions: Array.isArray(data.actions) ? data.actions.map(String).slice(0, 4) : [],
    // 数値1つでも配列でも書ける（続報が複数の旧記事をまとめて置き換えることがある）。
    supersedes: [data.supersedes ?? []].flat().map(Number).filter((n) => Number.isInteger(n) && n > 0),
    draft,
    original: Boolean(data.original),
    readingMinutes: Math.max(1, Math.round(readingTime(content).minutes)),
    body: content,
  };
}

type ArticleIndex = {
  all: Article[];
  bySlug: Map<string, Article>;
  tags: { tag: string; count: number }[];
};

let cache: ArticleIndex | null = null;

function compareArticlesByDate(a: ArticleMeta, b: ArticleMeta): number {
  return b.date.localeCompare(a.date) || b.id - a.id;
}

function buildArticleIndex(): ArticleIndex {
  if (!fs.existsSync(ARTICLES_DIR)) return { all: [], bySlug: new Map(), tags: [] };

  const all = fs
    .readdirSync(ARTICLES_DIR)
    .filter((file) => /\.mdx?$/.test(file))
    .map(parseFile)
    .filter((article): article is Article => article !== null)
    .sort(compareArticlesByDate);

  const bySlug = new Map<string, Article>();
  for (const article of all) {
    if (bySlug.has(article.slug)) throw new Error(`記事 id が重複しています: ${article.id}`);
    bySlug.set(article.slug, article);
  }

  const tagCounts = new Map<string, number>();
  for (const article of all) {
    for (const tag of article.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }
  const tags = [...tagCounts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

  return { all, bySlug, tags };
}

function articleIndex(): ArticleIndex {
  return (cache ??= buildArticleIndex());
}

export function getAllArticles(): Article[] {
  return articleIndex().all;
}

export function getArticle(slug: string): Article | undefined {
  return articleIndex().bySlug.get(slug);
}

export function getArticlesByCategory(category: CategoryKey): Article[] {
  return getAllArticles().filter((a) => a.category === category);
}

export function getArticlesByType(type: ArticleType, category?: CategoryKey): Article[] {
  return getAllArticles().filter((a) => a.type === type && (!category || a.category === category));
}

export function getArticlesByTag(tag: string): Article[] {
  return getAllArticles().filter((a) => a.tags.includes(tag));
}

export function getAllTags(): { tag: string; count: number }[] {
  return articleIndex().tags;
}

/** 一覧内で最も古い公開日。記事一覧の構造化データ・表示日付で共用する。 */
export function earliestPublished(articles: ArticleMeta[]): string | undefined {
  return articles.reduce<string | undefined>((earliest, article) => (!earliest || article.date < earliest ? article.date : earliest), undefined);
}

/** 一覧内で最も新しい公開日。並び順に依存しない期間表示用。 */
export function latestPublished(articles: ArticleMeta[]): string | undefined {
  return articles.reduce<string | undefined>((latest, article) => (!latest || article.date > latest ? article.date : latest), undefined);
}

/** タグ内の最新記事の更新日（sitemapのlastmod用）。全ページ同じ日付にしないための値 */
export function latestUpdated(articles: ArticleMeta[]): string | undefined {
  return articles.reduce<string | undefined>((latest, article) => (!latest || article.updated > latest ? article.updated : latest), undefined);
}

// 関連記事: 同カテゴリ＋タグ一致数が多い順。自分自身は除く。
export function getRelatedArticles(article: Article, limit = 4): Article[] {
  return getAllArticles()
    .filter((a) => a.slug !== article.slug)
    .map((a) => ({
      a,
      score:
        (a.category === article.category ? 2 : 0) +
        (a.type === article.type ? 1 : 0) +
        a.tags.filter((t) => article.tags.includes(t)).length,
    }))
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score || compareArticlesByDate(x.a, y.a))
    .slice(0, limit)
    .map((x) => x.a);
}
