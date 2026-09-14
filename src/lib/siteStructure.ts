// サイトマップで見つけたURLの一覧から、ディレクトリ構造を数える純関数。
//
// **1本も追加で取得しない**。/tools/site-report は robots.txt の Sitemap 行からURL一覧を既に取得しているので、
// その文字列を数えるだけで階層の形が分かる。ページを取りに行かないので、本数が何千あっても費用は増えない。
//
// ここは**事実を数えるだけ**で、提案文は作らない（siteReport.ts が3段の優先度と6項目に整形する）。
// リンク構造（どのページがどこからリンクされているか・孤立ページ・クリック深度）は**数えていない**。
// 全ページのHTMLが要るため、最大8ページという取得の上限とは両立しない。
// 分かるのは「URLがどう並んでいるか」だけで、「どうリンクされているか」ではない。

/** これ以上の深さを「深い」と数える。/a/b/c/d = 4 */
export const DEEP_DEPTH = 4;

/** 構造を数えるのに要る最低の本数。少なすぎるとどんな形でも意味が出ない */
export const MIN_URLS = 20;

/** 第1階層に出す最大件数 */
const MAX_SECTIONS = 12;

/** 例として添えるURLの本数 */
const MAX_EXAMPLES = 5;

/**
 * 役割が重なりやすい第1階層の語。同じ組から2つ以上出てきたら、同じ役割のディレクトリが並んでいる可能性がある。
 * **断定はしない**（実際に中身が違うことはある）。提案側で「寄せるか確かめる」と書く。
 */
const SYNONYM_GROUPS: string[][] = [
  ["blog", "blogs", "article", "articles", "news", "column", "columns", "post", "posts", "topics", "magazine", "media"],
  ["product", "products", "item", "items", "goods", "lineup"],
  ["service", "services", "solution", "solutions"],
  ["company", "about", "corporate", "profile", "aboutus"],
  ["contact", "inquiry", "form", "otoiawase"],
  ["faq", "qa", "question", "questions", "help", "support"],
  ["case", "cases", "works", "voice", "jirei", "casestudy"],
  ["category", "categories", "cat", "tag", "tags", "archive", "archives"],
  ["recruit", "career", "careers", "job", "jobs"],
];

export type DepthRow = { depth: number; count: number };
export type SectionRow = { name: string; count: number };
/** 直下に1種類しか子を持たない中間ディレクトリ。階層を1つ減らせる */
export type RedundantDir = { path: string; only: string; urls: number };

export type SiteStructure = {
  /** 数えたURLの本数 */
  total: number;
  /** 深さごとの本数。0 はトップページ */
  depths: DepthRow[];
  /** 第1階層ごとの本数（多い順） */
  sections: SectionRow[];
  /** 深さ DEEP_DEPTH 以上のURL */
  deep: { count: number; examples: string[] };
  redundant: RedundantDir[];
  /** 役割が重なりそうな第1階層の組 */
  overlapping: string[][];
};

function segments(url: string): string[] | null {
  try {
    return new URL(url).pathname.split("/").filter(Boolean).map((s) => s.toLowerCase());
  } catch {
    return null;
  }
}

export function analyzeStructure(urls: string[]): SiteStructure {
  const paths = urls.map(segments).filter((s): s is string[] => s !== null);
  const total = paths.length;

  // 深さの分布
  const byDepth = new Map<number, number>();
  for (const p of paths) byDepth.set(p.length, (byDepth.get(p.length) ?? 0) + 1);
  const depths = [...byDepth.entries()].map(([depth, count]) => ({ depth, count })).sort((a, b) => a.depth - b.depth);

  // 第1階層ごとの本数。トップページは "/"
  const bySection = new Map<string, number>();
  for (const p of paths) {
    const name = p[0] ?? "/";
    bySection.set(name, (bySection.get(name) ?? 0) + 1);
  }
  const sections = [...bySection.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, MAX_SECTIONS);

  // 深いURL
  const deepUrls = urls.filter((u) => (segments(u)?.length ?? 0) >= DEEP_DEPTH);

  // 直下に1種類しか子を持たない中間ディレクトリ。
  // 親プレフィックスごとに「直下の子の種類」と「配下のURL数」を数える。
  const children = new Map<string, Set<string>>();
  const under = new Map<string, number>();
  for (const p of paths) {
    for (let i = 0; i < p.length - 1; i++) {
      const prefix = `/${p.slice(0, i + 1).join("/")}`;
      if (!children.has(prefix)) children.set(prefix, new Set());
      children.get(prefix)!.add(p[i + 1]);
      under.set(prefix, (under.get(prefix) ?? 0) + 1);
    }
  }
  const redundant: RedundantDir[] = [...children.entries()]
    .filter(([, set]) => set.size === 1)
    .map(([path, set]) => ({ path, only: [...set][0], urls: under.get(path) ?? 0 }))
    // 配下が1本だけなら、階層というより単独ページなので数えない
    .filter((r) => r.urls >= 2)
    .sort((a, b) => b.urls - a.urls)
    .slice(0, MAX_EXAMPLES);

  // 役割が重なりそうな第1階層
  const names = new Set(sections.map((s) => s.name));
  const overlapping = SYNONYM_GROUPS.map((group) => group.filter((g) => names.has(g))).filter((hit) => hit.length >= 2);

  return {
    total,
    depths,
    sections,
    deep: { count: deepUrls.length, examples: deepUrls.slice(0, MAX_EXAMPLES) },
    redundant,
    overlapping,
  };
}
