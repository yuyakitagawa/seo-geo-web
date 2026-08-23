import { Fragment } from "react";
import type { ArticleMeta } from "@/lib/content";
import ArticleCard from "./ArticleCard";
import AdUnit from "./AdUnit";

// 一覧。6件ごとにインフィード広告を挟む（スロット未設定時は何も出ない）。
export default function ArticleList({ articles }: { articles: ArticleMeta[] }) {
  if (articles.length === 0) {
    return <p className="text-neutral-500">まだ記事がありません。</p>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {articles.map((a, i) => (
        <Fragment key={a.slug}>
          <ArticleCard article={a} />
          {(i + 1) % 6 === 0 && i + 1 < articles.length && (
            <div className="sm:col-span-2"><AdUnit placement="infeed" className="my-2" /></div>
          )}
        </Fragment>
      ))}
    </div>
  );
}
