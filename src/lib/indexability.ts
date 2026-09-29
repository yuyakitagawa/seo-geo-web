import { getAllArticles, getArticlesByTag, getAllTags, type Article } from "./content";
import { TAG_MIN_ARTICLES } from "./site";

// 「そのURLをインデックスさせるか」の判定を集めたファイル。
//
// **判定は必ずここに集約すること。** ページ側（robots メタ）・sitemap 側・内部リンク側で条件がずれると、
// 「サイトマップに載っているのに noindex」「リンクを踏むと404」という矛盾をGoogleと読者に送ることになる。
// kujira-watch では pageIndexability.ts / articleIndexability.ts がこの役割を担っている。

// ---------------------------------------------------------------------------
// タグページ
// ---------------------------------------------------------------------------

// 数えるのはインデックス対象の記事だけ。noindex の要約記事ばかりのタグページは、
// インデックスさせても「noindex の記事へのリンク集」にしかならない。

/** インデックス対象のタグ（インデックス対象の記事を TAG_MIN_ARTICLES 本以上持つもの） */
export function indexableTags(): { tag: string; count: number }[] {
  return getAllTags()
    .map(({ tag }) => ({ tag, count: getArticlesByTag(tag).filter(isIndexableArticle).length }))
    .filter((t) => t.count >= TAG_MIN_ARTICLES);
}

export function isIndexableTag(tag: string): boolean {
  return getArticlesByTag(tag).filter(isIndexableArticle).length >= TAG_MIN_ARTICLES;
}

// ---------------------------------------------------------------------------
// 記事のカニバリゼーション対策
// ---------------------------------------------------------------------------
//
// 同じ話題を続報で書き直したとき、旧記事と新記事が同じクエリに並ぶと評価が分散してどちらも上がらない。
// 置き換えが起きた記事は frontmatter に `supersedes: <置き換えられる記事のid>` を書く。
// 指定された側は noindex, follow ＋ sitemap 除外にし、本文の冒頭から最新版へ送る（情報は失われない）。
//
// **判定にタイトルの類似度は使わない。** collect/pick が使う sameTopic() を公開中の news 記事24本に
// 当てたところ、「Google画像検索25周年」と「トップページのボタンをAI Modeに置き換えるテスト」が
// 同一話題と判定された（共有語が google / ai / mode / 検索 だけ）。あれはRSSの見出し重複を弾く基準で、
// 記事タイトルに当てると別の出来事を同一視して実在の記事を消す。指定漏れの検知は `npm run dupes`
// （報告のみ）で行い、インデックス判定は明示された指定だけで動かす。

/** 置き換えられた記事の slug → 置き換えた（最新の）記事 */
function supersessions(): Map<string, Article> {
  const map = new Map<string, Article>();
  const bySlug = new Map(getAllArticles().map((a) => [a.slug, a]));
  for (const article of getAllArticles()) {
    for (const id of article.supersedes) {
      const old = bySlug.get(String(id));
      // 存在しないidの指定は無視する（下書き記事を指したまま公開されることがある）。
      if (!old || old.slug === article.slug) continue;
      // 同じ記事が二重に置き換えられた場合は新しい方を採用する。
      const current = map.get(old.slug);
      if (!current || current.date < article.date) map.set(old.slug, article);
    }
  }
  return map;
}

let cache: Map<string, Article> | null = null;
function supersessionMap(): Map<string, Article> {
  return (cache ??= supersessions());
}

/** この記事を置き換えた最新記事。無ければ undefined（＝この記事が最新） */
export function supersededBy(article: Article): Article | undefined {
  return supersessionMap().get(article.slug);
}

/** 置き換えられていない（＝その話題の最新版の）記事か */
export function isCurrentArticle(article: Article): boolean {
  return !supersessionMap().has(article.slug);
}

/** 置き換えられた記事を除いた一覧。内部リンク・教科書の参照先はこちら（要約記事も読者には有用なので残す） */
export function currentArticles(): Article[] {
  return getAllArticles().filter(isCurrentArticle);
}

// ---------------------------------------------------------------------------
// 要約記事（2026-09-29〜）
// ---------------------------------------------------------------------------
//
// 英語ニュースをAIで日本語に要約した記事（type: news かつ original でない）は noindex, follow にし、
// sitemap からも外す。ページは残すので読者・内部リンク・RSSは壊れない。
//
// 理由: 公開85本のうち59本がこの型（Search Engine Journal だけで23本）。GSC3か月で記事84本の表示85回に対し
// ハブ2枚で139回と、検索にはほぼ寄与していない。一方でGoogleはこの型（他サイトの要約を大量に生成したもの）を
// サイト全体の評価を下げる対象にしている。インデックスを独自記事・HOW TO・ハブに絞る。経緯は docs/progress_seo-recovery.md。
// 要約を一次情報との照合・加筆で独自記事にしたら `original: true` を付ければインデックス対象に戻る。

/** AI要約のニュース記事か（インデックスさせない） */
export function isSummaryArticle(article: Pick<Article, "type" | "original">): boolean {
  return article.type === "news" && !article.original;
}

/** インデックス対象の記事か。置き換えられた記事と要約記事が false になる */
export function isIndexableArticle(article: Article): boolean {
  return isCurrentArticle(article) && !isSummaryArticle(article);
}

/** sitemap に載せる記事 */
export function indexableArticles(): Article[] {
  return getAllArticles().filter(isIndexableArticle);
}
