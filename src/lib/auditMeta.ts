// ページ診断の**表示用の定数**。判定は持たない（判定は `audit.ts` / `headingFit.ts`）。
//
// **ここに置く理由は依存の向き**。`/tools/page-audit` と `/tools/site-report` の画面は、この定数だけのために
// `audit.ts` を読み込んでいた。`audit.ts` は `headingFit.ts` →`promptFit.ts` →BudouX と辿るので、
// **判定用のコード一式が閲覧者のブラウザに配られてしまう**（実測でJSが250KB増えた）。
// 画面はこのファイルだけを読み、判定本体は読まない。`audit.ts` が同じ名前で再エクスポートするので、
// サーバー側の呼び出し元は今までどおり `audit.ts` から取れる。
//
// **このファイルは何もimportしない**（何かを import した時点で意味がなくなる）。

export type Severity = "high" | "mid" | "low" | "ok";
export type Area = "tech" | "seo" | "geo";

export const SEVERITY_LABEL: Record<Severity, string> = { high: "要修正", mid: "直したい", low: "検討", ok: "問題なし" };
export const AREA_LABEL: Record<Area, string> = { tech: "技術", seo: "SEO", geo: "GEO（AI検索）" };

export type CheckItem = {
  id: string;
  area: Area;
  /** 項目名（合格・対象外の一覧に出す） */
  label: string;
  /** この項目が出しうる指摘の id */
  findingIds: string[];
};

export const CHECKLIST: CheckItem[] = [
  // 技術
  { id: "status", area: "tech", label: "HTTPステータスとリダイレクトの連鎖", findingIds: ["status", "redirect"] },
  { id: "noindex", area: "tech", label: "noindex（metaとX-Robots-Tag）", findingIds: ["noindex"] },
  { id: "canonical", area: "tech", label: "canonical の有無・絶対URL・自己参照", findingIds: ["canonical", "canonical-relative", "canonical-other"] },
  { id: "lang", area: "tech", label: "lang 属性", findingIds: ["lang"] },
  { id: "charset", area: "tech", label: "文字コード（charset）", findingIds: ["charset"] },
  { id: "viewport", area: "tech", label: "viewport", findingIds: ["viewport"] },
  { id: "heading-order", area: "tech", label: "見出しの階層の飛び（アクセシビリティ）", findingIds: ["heading-order"] },
  { id: "speed", area: "tech", label: "取得時間とHTMLサイズ", findingIds: ["slow"] },
  { id: "robots", area: "tech", label: "robots.txt によるクロール可否（Googlebot）", findingIds: ["robots-missing", "robots-googlebot"] },
  { id: "robots-sitemap", area: "tech", label: "robots.txt の Sitemap 行", findingIds: ["robots-sitemap"] },
  { id: "sitemap", area: "tech", label: "サイトマップが取得できるか", findingIds: ["sitemap"] },
  // SEO
  { id: "title", area: "seo", label: "title の有無と長さ", findingIds: ["title", "title-length"] },
  { id: "description", area: "seo", label: "meta description の有無と長さ", findingIds: ["description", "description-length"] },
  { id: "title-description", area: "seo", label: "title と description が別の文か", findingIds: ["title-description-same"] },
  { id: "h1", area: "seo", label: "h1 の個数", findingIds: ["h1", "h1-multiple"] },
  { id: "semantic", area: "seo", label: "main / article 要素（本文の範囲）", findingIds: ["semantic"] },
  { id: "img-alt", area: "seo", label: "alt の無い画像", findingIds: ["img-alt"] },
  { id: "ogp", area: "seo", label: "OGP と Twitter Card", findingIds: ["ogp"] },
  { id: "jsonld", area: "seo", label: "JSON-LD の有無・構文", findingIds: ["jsonld", "jsonld-broken"] },
  { id: "article-props", area: "seo", label: "Article の headline / datePublished / author", findingIds: ["article-props"] },
  { id: "breadcrumb", area: "seo", label: "BreadcrumbList（下層ページ）", findingIds: ["breadcrumb"] },
  { id: "internal-links", area: "seo", label: "本文中の内部リンク（nav・footer を除く）", findingIds: ["internal-links"] },
  { id: "anchor-text", area: "seo", label: "曖昧なリンク文言（「こちら」等）", findingIds: ["anchor-text"] },
  { id: "operator-link", area: "seo", label: "運営者情報・著者・連絡先への導線", findingIds: ["operator-link"] },
  // GEO
  { id: "thin-html", area: "geo", label: "サーバーが返すHTMLに本文があるか（JS依存の検出）", findingIds: ["thin-html"] },
  { id: "nosnippet", area: "geo", label: "スニペット制御（nosnippet・max-snippet:0）", findingIds: ["nosnippet"] },
  { id: "lead", area: "geo", label: "冒頭の直答文の長さ", findingIds: ["no-lead", "lead-long"] },
  { id: "snippet-head", area: "geo", label: "本文の先頭200字（AI検索のスニペットの枠）", findingIds: ["snippet-head-boilerplate", "snippet-head-late"] },
  { id: "faq", area: "geo", label: "質問と回答の形式（解説ページのみ）", findingIds: ["faq"] },
  { id: "heading-fit", area: "geo", label: "見出しと、その下の本文が噛み合っているか", findingIds: ["heading-fit"] },
  { id: "heading-answer", area: "geo", label: "見出しが聞いていることの答えが本文にあるか", findingIds: ["heading-answer"] },
  { id: "citation", area: "geo", label: "外部の出典リンク（GEO論文で約28%）", findingIds: ["citation"] },
  { id: "geo-quotation", area: "geo", label: "原文の引用（同 最大41%。出典のあるページのみ）", findingIds: ["geo-quotation"] },
  { id: "geo-statistics", area: "geo", label: "具体的な数値（同 約32%）", findingIds: ["geo-statistics"] },
  { id: "geo-fluency", area: "geo", label: "1文の長さ（同 約29%）", findingIds: ["geo-fluency"] },
  { id: "geo-keyword-stuffing", area: "geo", label: "キーワードの詰め込み（同 効果なし）", findingIds: ["geo-keyword-stuffing"] },
  { id: "date", area: "geo", label: "公開日・更新日の機械可読性（記事ページのみ）", findingIds: ["date"] },
  { id: "organization", area: "geo", label: "運営者の構造化データ（トップ・運営者紹介ページのみ）", findingIds: ["organization"] },
  { id: "robots-ai", area: "geo", label: "AI検索クローラー（OAI-SearchBot等）の許可状況", findingIds: ["robots-ai"] },
];

/** 見出しと本文が噛み合っているかの判定結果（`headingFit.ts`） */
export type HeadingVerdict = "ok" | "weak" | "off";

export const HEADING_VERDICT_LABEL: Record<HeadingVerdict, string> = {
  ok: "噛み合っている",
  weak: "弱い",
  off: "噛み合っていない",
};

/** 見出しが聞いていることの答えとして、その節が適切か（`headingFit.ts`） */
export type AnswerState = "ok" | "late" | "hedge" | "none" | "skip";

export const ANSWER_STATE_LABEL: Record<AnswerState, string> = {
  ok: "答えになっている",
  late: "答えが後ろにある",
  hedge: "言い切っていない",
  none: "答えが無い",
  skip: "判定せず",
};

/** 本文がこれより短いブロックは、見出しとの対応を判定しない（判定の材料が足りない） */
export const MIN_TEXT = 120;
