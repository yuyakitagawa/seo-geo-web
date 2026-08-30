export type NavLink = { href: string; label: string; note: string };

// 一覧・ハブページ同士の横移動。ヘッダーのタブには主要ページが並んでいるが、
// 「読み終えたページから次のページへ」の導線はページ側に無いと、いったんヘッダーへ戻る往復になる。
// kujira-watch は GA4 実測（データ/一覧ページは95%が内部到達なのに入口はわずか、
// カテゴリ・日付ページは入口の直帰率100%）を受けて各ページの末尾に兄弟ページを3件置いた。
const HUB_PAGES: NavLink[] = [
  { href: "/news", label: "ニュース", note: "検索とAI検索のアップデートを新しい順に。全記事に一次情報のURL付き。" },
  { href: "/seo", label: "SEO対策とは", note: "定義・3つの領域・最初の90日でやることを一次情報のリンク付きで。" },
  { href: "/geo", label: "GEOとは", note: "生成AI検索最適化の定義と、AIに引用されるための実務。" },
  { href: "/learn", label: "SEO・GEO教科書", note: "仕組み→実装→運用の3レベル10レッスン。到達チェックリスト付き。" },
  { href: "/tools", label: "ツール比較", note: "国内・海外のSEO/GEOツールを料金と対象で比較。公式ページ確認済みのみ。" },
  { href: "/tools/page-audit", label: "ページ診断", note: "URLを入れると、検索エンジンとAI検索がそのページをどう読むかを検査。" },
  { href: "/tools/ai-crawlers", label: "robots.txt チェッカー", note: "AI検索クローラー14種の許可・ブロックを判定。" },
];

/**
 * 現在のページを除いた兄弟ページを、HUB_PAGES の並び順で指定件数だけ返す。
 * **自分の次のページから順に拾う**ので、どのページの末尾も同じ顔にならない。
 * 並び自体は固定にしてある（開くたびに候補が変わると「前に見たあれ」を辿れなくなる）。
 * リストに無いページ（-1）から呼ばれたときは先頭から拾う。
 */
export function siblingPages(currentHref: string, limit = 3): NavLink[] {
  const others = HUB_PAGES.filter((p) => p.href !== currentHref);
  const start = Math.max(0, HUB_PAGES.findIndex((p) => p.href === currentHref));
  return Array.from({ length: Math.min(limit, others.length) }, (_, i) => others[(start + i) % others.length]);
}
