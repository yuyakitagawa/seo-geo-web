import JsonLd from "./JsonLd";
import { SITE_URL } from "@/lib/site";

// 記事以外のページ（一覧・ツール・固定ページ）の公開日・更新日を機械可読にする。
// 可視テキストは <time datetime="YYYY-MM-DD">、同じ値を WebPage の datePublished / dateModified で出す。
// 記事・解説ページ・レッスンは Article JSON-LD 側に日付を持っているのでこれを使わない。
//
// **日付にはビルド時刻を使わない。** そのページが実際に反映しているデータの最終日を渡すこと
// （毎日ビルドしても中身が変わらない日があり、更新していないのに更新日だけ進むと信用を失う。
// サイトマップの lastmod と同じ規律）。追跡できないページには何も出さない（不正確な日付のほうが害が大きい）。

export type PageDatesProps = {
  /** ページのパス（例: "/news"） */
  path: string;
  name: string;
  description?: string;
  /** 公開日 YYYY-MM-DD。省略時は updated と同じ扱い */
  published?: string;
  /** そのページが反映しているデータの最終日 YYYY-MM-DD */
  updated: string;
};

const jp = (d: string) => d.replaceAll("-", ".");

/** JSON-LD だけ（可視の日付を自前で出しているページ用） */
export function PageDatesJsonLd({ path, name, description, published, updated }: PageDatesProps) {
  const url = `${SITE_URL}${path}`;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name,
        ...(description ? { description } : {}),
        inLanguage: "ja",
        datePublished: published ?? updated,
        dateModified: updated,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        publisher: { "@id": `${SITE_URL}/#organization` },
      }}
    />
  );
}

/** 可視の1行＋JSON-LD */
export default function PageDates(props: PageDatesProps) {
  return (
    <>
      <PageDatesJsonLd {...props} />
      <p className="text-xs text-mute">
        {props.published && props.published !== props.updated && (
          <>
            公開 <time dateTime={props.published}>{jp(props.published)}</time>
            <span className="mx-2 opacity-40">/</span>
          </>
        )}
        更新 <time dateTime={props.updated}>{jp(props.updated)}</time>
      </p>
    </>
  );
}
