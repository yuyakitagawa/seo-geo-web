// クロールした範囲のリンク関係を数える純関数。/tools/site-report の「リンク構造も調べる」を入れたときだけ動く。
//
// 取得は api/site-report.ts が担当し、ここは受け取った「どのページからどこへリンクしているか」を数えるだけ。
//
// **クロールした範囲でしか言えない**。上限（CRAWL_MAX_PAGES）で打ち切ったときは、そこから先に
// リンクがあったかどうかは分からない。だから「孤立ページ」ではなく「孤立の候補」として返し、
// 打ち切ったかどうか（truncated）を必ず一緒に返す。断定するのは、全ページを取れたときだけ。
import { normalizeUrlKey } from "./siteCrawl";

/** 被リンクがこの本数以下なら「薄い」と数える（入口ページは除く） */
export const WEAK_INBOUND = 1;

/** 一覧に出す最大件数 */
const MAX_LIST = 10;

/** 図に出す第1階層の数。これを超えた分は「その他」にまとめる（マス目が増えすぎると読めない） */
const MAX_SECTIONS = 8;

/** トップページを表す第1階層の名前 */
export const ROOT_SECTION = "/";

/** その他をまとめた行・列の名前 */
export const OTHER_SECTION = "その他";

export type CrawledPage = {
  url: string;
  status: number;
  /** そのページから出ている内部リンク */
  links: string[];
  /** そのうち nav / header / footer / aside の外から出ているもの */
  bodyLinks: string[];
  /** 入口から何クリックで届いたか */
  depth: number;
};

export type LinkGraphInput = {
  entryUrl: string;
  pages: CrawledPage[];
  /** 上限に達して打ち切ったか */
  truncated: boolean;
  /** サイトマップで見つかったURL。孤立の候補を出すのに使う（取得はしない） */
  sitemapUrls: string[];
};

export type LinkGraph = {
  crawled: number;
  truncated: boolean;
  /** 入口から何クリックで届くか */
  depths: { depth: number; count: number }[];
  /** 被リンクが薄いページ */
  weak: { url: string; inbound: number }[];
  /** リンクはされているが、本文からは1本も案内されていないページ */
  navOnly: string[];
  /** サイトマップにあるのに、クロールした範囲のどこからもリンクされていなかったURL */
  orphanCandidates: string[];
  /** クロールで200以外を返したURLと、そこへリンクしていたページ */
  broken: { url: string; status: number; from: string[] }[];
  /** 図に出す第1階層（ページ数の多い順） */
  sections: { name: string; pages: number }[];
  /** 第1階層どうしのリンク本数。sections に出てくる名前だけを使う */
  sectionLinks: { from: string; to: string; count: number }[];
};

/** URLの第1階層。トップページは ROOT_SECTION */
function sectionOf(url: string): string | null {
  try {
    const first = new URL(url).pathname.split("/").filter(Boolean)[0];
    return first ? first.toLowerCase() : ROOT_SECTION;
  } catch {
    return null;
  }
}

export function buildLinkGraph(input: LinkGraphInput): LinkGraph {
  const { pages, entryUrl } = input;
  const entryKey = normalizeUrlKey(entryUrl);

  // 被リンクを数える。自分から自分へのリンクは数えない
  const inbound = new Map<string, Set<string>>();
  const bodyInbound = new Map<string, Set<string>>();
  const add = (map: Map<string, Set<string>>, to: string, from: string) => {
    const key = normalizeUrlKey(to);
    if (key === normalizeUrlKey(from)) return;
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(from);
  };
  for (const page of pages) {
    for (const link of page.links) add(inbound, link, page.url);
    for (const link of page.bodyLinks) add(bodyInbound, link, page.url);
  }

  // 入口からの距離
  const byDepth = new Map<number, number>();
  for (const page of pages) byDepth.set(page.depth, (byDepth.get(page.depth) ?? 0) + 1);
  const depths = [...byDepth.entries()].map(([depth, count]) => ({ depth, count })).sort((a, b) => a.depth - b.depth);

  const ok = pages.filter((p) => p.status >= 200 && p.status < 300);

  const weak = ok
    .filter((p) => normalizeUrlKey(p.url) !== entryKey)
    .map((p) => ({ url: p.url, inbound: inbound.get(normalizeUrlKey(p.url))?.size ?? 0 }))
    .filter((p) => p.inbound <= WEAK_INBOUND)
    .sort((a, b) => a.inbound - b.inbound)
    .slice(0, MAX_LIST);

  const navOnly = ok
    .filter((p) => normalizeUrlKey(p.url) !== entryKey)
    .filter((p) => (inbound.get(normalizeUrlKey(p.url))?.size ?? 0) > 0 && (bodyInbound.get(normalizeUrlKey(p.url))?.size ?? 0) === 0)
    .map((p) => p.url)
    .slice(0, MAX_LIST);

  // どこからもリンクされていないサイトマップURL。クロールが届かなかっただけの可能性が残るので「候補」
  const linked = new Set(inbound.keys());
  const orphanCandidates = input.sitemapUrls
    .filter((u) => {
      const key = normalizeUrlKey(u);
      return key !== entryKey && !linked.has(key);
    })
    .slice(0, MAX_LIST);

  const broken = pages
    .filter((p) => p.status >= 400)
    .map((p) => ({ url: p.url, status: p.status, from: [...(inbound.get(normalizeUrlKey(p.url)) ?? [])].slice(0, 3) }))
    .slice(0, MAX_LIST);

  // ---- 図にする集計: 第1階層どうしのリンク本数 ----
  // 300ページの生のリンク図は人が読めないので、第1階層でまとめてマス目にする。
  // 見たいのは「どこからどこへ繋がっていないか」（空のマス）。
  const pageCount = new Map<string, number>();
  for (const page of ok) {
    const s = sectionOf(page.url);
    if (s) pageCount.set(s, (pageCount.get(s) ?? 0) + 1);
  }
  const top = [...pageCount.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_SECTIONS)
    .map(([name]) => name);
  const shown = new Set(top);
  const hasOther = pageCount.size > shown.size;
  const label = (name: string) => (shown.has(name) ? name : OTHER_SECTION);

  const sections = [
    ...top.map((name) => ({ name, pages: pageCount.get(name) ?? 0 })),
    ...(hasOther
      ? [{ name: OTHER_SECTION, pages: [...pageCount.entries()].filter(([n]) => !shown.has(n)).reduce((sum, [, c]) => sum + c, 0) }]
      : []),
  ];

  const linkCount = new Map<string, number>();
  for (const page of ok) {
    const from = sectionOf(page.url);
    if (!from) continue;
    for (const link of page.links) {
      const to = sectionOf(link);
      if (!to) continue;
      const key = `${label(from)}\u0000${label(to)}`;
      linkCount.set(key, (linkCount.get(key) ?? 0) + 1);
    }
  }
  const sectionLinks = [...linkCount.entries()].map(([key, count]) => {
    const [from, to] = key.split("\u0000");
    return { from, to, count };
  });

  return { crawled: pages.length, truncated: input.truncated, depths, weak, navOnly, orphanCandidates, broken, sections, sectionLinks };
}
