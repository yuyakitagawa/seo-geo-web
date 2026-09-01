import NextStep from "./NextStep";
import type { Article } from "@/lib/content";
import { getArticlesByTag } from "@/lib/content";
import { LESSONS } from "@/lib/curriculum";
import { isIndexableTag } from "@/lib/indexability";
import type { NavLink } from "@/lib/nav";
import { CATEGORIES, categoryHref } from "@/lib/site";

// 記事の**本文を読み切る前に見える位置**に置く回遊導線。
// kujira-watch は GA4 実測で記事の滞在が16秒（データページの1/5）しかなく、本文下の関連記事に
// 到達していないことが分かったため、本文より前に「次の一手」を置いた。ここも同じ扱いにする。
// 送り先は記事のデータから必ず解決できるものだけにする（推測でレッスンに紐づけたりしない）。
export default function ArticleNextStep({ article }: { article: Article }) {
  const links: NavLink[] = [];

  // 1. 同じタグの記事一覧。薄いタグ（記事1本）は noindex なので出さない。
  const tag = article.tags
    .filter(isIndexableTag)
    .map((t) => ({ tag: t, count: getArticlesByTag(t).length }))
    .sort((a, b) => b.count - a.count)[0];
  if (tag) {
    links.push({
      href: `/tag/${encodeURIComponent(tag.tag)}`,
      label: `#${tag.tag}`,
      note: `同じテーマの記事${tag.count}本。この話題がどう動いてきたかを時系列で追えます。`,
    });
  }

  // 2. その記事のカテゴリの入口。ニュースは解説ページを持たないので教科書へ送る。
  links.push(
    article.category === "news"
      ? { href: "/learn", label: "SEO・GEO教科書", note: `個別のニュースの前提になる仕組みを、${LESSONS.length}レッスンで順番に。` }
      : { href: categoryHref(article.category), label: `${CATEGORIES[article.category].label}とは`, note: `${CATEGORIES[article.category].label}の定義と実務を、一次情報のリンク付きでまとめたページ。` }
  );

  // 3. 読んだ内容を自分のサイトで確かめる。
  links.push({
    href: "/tools/page-audit",
    label: "ページ診断",
    note: "自分のページのURLを入れると、直すべき箇所を該当コードと修正後の書き方つきで指摘します。",
  });

  return <NextStep links={links} title="この記事の次に" className="mb-12" />;
}
