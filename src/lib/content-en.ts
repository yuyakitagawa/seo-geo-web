import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { getArticle, parseDate, parseImpact, parseSources, parseType, type ArticleMeta, type Source } from "./content";
import type { CategoryKey } from "./site";

// 英語版の記事。**独自記事（original: true）だけ**を英訳して content/articles-en/ に置き、/en/articles/<slug> で配る。
// 要約記事は元記事（多くが英語）の劣化コピーになるだけなので英訳しない。
//
// 日本語記事との対応は frontmatter の id（日本語記事と同じ番号）で取る。URLは id ではなく英語の slug。
// 対応が壊れていないか（独自記事に英語版があるか・出典が同じか・日本語ページへのリンクが残っていないか）は
// src/lib/content-en.test.ts が検査する。英訳は `npm run translate:en -- <id>`（scripts/translate-en.ts）。
const EN_ARTICLES_DIR = path.join(process.cwd(), "content", "articles-en");

export const EN_FAQ_HEADING = "## FAQ";

export type EnArticle = {
  /** 対応する日本語記事の id */
  id: number;
  /** URL用。/en/articles/<slug> */
  slug: string;
  title: string;
  description: string;
  date: string;
  updated: string;
  /** 日本語記事から引き継ぐ（英語版で別の値を持たない） */
  category: CategoryKey;
  type: ArticleMeta["type"];
  tags: string[];
  sources: Source[];
  impact?: ArticleMeta["impact"];
  audience?: string;
  actions: string[];
  body: string;
};

function parseFile(file: string): EnArticle | null {
  const label = `articles-en/${file}`;
  const { data, content } = matter(fs.readFileSync(path.join(EN_ARTICLES_DIR, file), "utf8"));
  if (typeof data.title !== "string" || typeof data.slug !== "string") {
    throw new Error(`content/${label}: frontmatter に title と slug が必要です`);
  }
  // 日本語記事が下書き（本番ビルドで除外）なら英語版も出さない。片方だけ公開されると hreflang が404を指す。
  const ja = getArticle(String(data.id));
  if (!ja) return null;
  const date = parseDate(data.date, "date", label);
  return {
    id: ja.id,
    slug: data.slug,
    title: data.title,
    description: typeof data.description === "string" ? data.description : "",
    date,
    updated: data.updated === undefined ? date : parseDate(data.updated, "updated", label),
    category: ja.category,
    type: parseType(data.type),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    sources: parseSources(data.sources, label),
    impact: parseImpact(data.impact),
    audience: typeof data.audience === "string" ? data.audience : undefined,
    actions: Array.isArray(data.actions) ? data.actions.map(String).slice(0, 4) : [],
    body: content,
  };
}

type EnIndex = { all: EnArticle[]; bySlug: Map<string, EnArticle>; byId: Map<number, EnArticle> };
let cache: EnIndex | null = null;

function buildIndex(): EnIndex {
  const all = fs.existsSync(EN_ARTICLES_DIR)
    ? fs
        .readdirSync(EN_ARTICLES_DIR)
        .filter((f) => /\.mdx?$/.test(f))
        .map(parseFile)
        .filter((a): a is EnArticle => a !== null)
        .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
    : [];
  return {
    all,
    bySlug: new Map(all.map((a) => [a.slug, a])),
    byId: new Map(all.map((a) => [a.id, a])),
  };
}

function index(): EnIndex {
  return (cache ??= buildIndex());
}

export function getAllEnArticles(): EnArticle[] {
  return index().all;
}

export function getEnArticle(slug: string): EnArticle | undefined {
  return index().bySlug.get(slug);
}

/** 日本語記事の英語版（無ければ undefined）。日本語ページの hreflang と「English version」リンクに使う */
export function getEnArticleById(id: number): EnArticle | undefined {
  return index().byId.get(id);
}

export function enArticlePath(slug: string): string {
  return `/en/articles/${slug}`;
}
