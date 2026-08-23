import { Fragment } from "react";
import type { ArticleMeta } from "@/lib/content";
import ArticleCard from "./ArticleCard";
import AdUnit from "./AdUnit";

// 一覧。featuredFirst で先頭1件を大きく。6件ごとにインフィード広告（スロット未設定時は非表示）。
export default function ArticleList({ articles, featuredFirst = false }: { articles: ArticleMeta[]; featuredFirst?: boolean }) {
  if (articles.length === 0) {
    return <p className="rounded-3xl border border-dashed border-ink/20 p-10 text-center text-mute dark:border-paper/20">まだ記事がありません。</p>;
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {articles.map((a, i) => (
        <Fragment key={a.slug}>
          <ArticleCard article={a} featured={featuredFirst && i === 0} index={i} />
          {(i + 1) % 6 === 0 && i + 1 < articles.length && (
            <div className="sm:col-span-2"><AdUnit placement="infeed" className="my-2" /></div>
          )}
        </Fragment>
      ))}
    </div>
  );
}
