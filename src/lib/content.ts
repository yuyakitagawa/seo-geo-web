import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { CATEGORY_KEYS, isCategoryKey, TAG_MIN_ARTICLES, type CategoryKey } from "./site";

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
  tags: string[];
  /** 一次情報。GEO対策として記事末尾と JSON-LD の citation に出す */
  sources: Source[];
  /** 影響度（任意） */
  impact?: Impact;
  /** 誰に影響するか（任意。例: "ECサイト運営者"） */
  audience?: string;
  /** 今すぐやること（任意、1〜4項目） */
  actions: string[];
  /** true の記事は本番ビルドに含めない（AI生成の下書き状態） */
  draft: boolean;
  /** 読了時間（分） */
  readingMinutes: number;
};

export type Article = ArticleMeta & { body: string };

function parseFile(file: string): Article | null {
  const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), "utf8");
  const { data, content } = matter(raw);

  if (typeof data.title !== "string" || typeof data.date !== "string") {
    throw new Error(`content/articles/${file}: frontmatter に title と date が必要です`);
  }
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
    date: data.date,
    updated: typeof data.updated === "string" ? data.updated : data.date,
    category,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    sources: Array.isArray(data.sources)
      ? data.sources.filter((s) => s && typeof s.url === "string").map((s) => ({ title: String(s.title ?? s.url), url: String(s.url) }))
      : [],
    impact: parseImpact(data.impact),
    audience: typeof data.audience === "string" ? data.audience : undefined,
    actions: Array.isArray(data.actions) ? data.actions.map(String).slice(0, 4) : [],
    draft,
    readingMinutes: Math.max(1, Math.round(readingTime(content).minutes)),
    body: content,
  };
}

let cache: Article[] | null = null;

export function getAllArticles(): Article[] {
  if (cache) return cache;
  if (!fs.existsSync(ARTICLES_DIR)) return (cache = []);
  cache = fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => /\.mdx?$/.test(f))
    .map(parseFile)
    .filter((a): a is Article => a !== null);
  const dup = cache.map((a) => a.id).filter((id, i, arr) => arr.indexOf(id) !== i);
  if (dup.length) throw new Error(`記事 id が重複しています: ${[...new Set(dup)].join(", ")}`);
  cache = cache.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id));
  return cache;
}

export function getArticle(slug: string): Article | undefined {
  return getAllArticles().find((a) => a.slug === slug);
}

export function getArticlesByCategory(category: CategoryKey): Article[] {
  return getAllArticles().filter((a) => a.category === category);
}

export function getArticlesByTag(tag: string): Article[] {
  return getAllArticles().filter((a) => a.tags.includes(tag));
}

export function getAllTags(): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const a of getAllArticles()) for (const t of a.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts].map(([tag, count]) => ({ tag, count })).sort((x, y) => y.count - x.count || x.tag.localeCompare(y.tag));
}

// インデックス対象にするタグ（TAG_MIN_ARTICLES 以上の記事を持つもの）。
// sitemap もタグページの robots もこの1つの関数を見るので、
// 「sitemapに載っているのに noindex」というズレが起きない。
export function getIndexableTags(): { tag: string; count: number }[] {
  return getAllTags().filter((t) => t.count >= TAG_MIN_ARTICLES);
}

export function isIndexableTag(tag: string): boolean {
  return getArticlesByTag(tag).length >= TAG_MIN_ARTICLES;
}

/** タグ内の最新記事の更新日（sitemapのlastmod用）。全ページ同じ日付にしないための値 */
export function latestUpdated(articles: ArticleMeta[]): string | undefined {
  return articles.map((a) => a.updated).sort().at(-1);
}

// 関連記事: 同カテゴリ＋タグ一致数が多い順。自分自身は除く。
export function getRelatedArticles(article: Article, limit = 4): Article[] {
  return getAllArticles()
    .filter((a) => a.slug !== article.slug)
    .map((a) => ({
      a,
      score: (a.category === article.category ? 2 : 0) + a.tags.filter((t) => article.tags.includes(t)).length,
    }))
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score || (x.a.date < y.a.date ? 1 : -1))
    .slice(0, limit)
    .map((x) => x.a);
}
