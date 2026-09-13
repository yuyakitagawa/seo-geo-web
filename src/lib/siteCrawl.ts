// サイト診断書（/tools/site-report）が「どのページを見るか」を決める純関数。
// 取得そのものは api/site-report.ts が持ち、ここはURLの抽出と選び方だけを持つ。
//
// 何ページ取るかは費用に直結する（Vercel Functions の実行時間）。上限はここに1つだけ置き、
// APIとUIの説明が同じ数字を見るようにする。
import { parse } from "node-html-parser";

/** 1回の診断で取得するページ数の上限。増やすと実行時間と費用がそのまま増える */
export const MAX_PAGES = 8;

/** 同時に取りに行く本数。相手のサーバーに並べて当てすぎない */
export const CONCURRENCY = 4;

/** 全体の期限。これを過ぎたら、取れた分だけで提案書を作る（関数のタイムアウトで全部捨てない） */
export const DEADLINE_MS = 40_000;

/**
 * 2階層のパブリックサフィックス。ここに載るものは「1つ上」まで同じなら同じサイトと見る。
 * 完全な一覧（publicsuffix.org）は持たず、日本語圏で実際に出るものに絞る。
 * 載っていないサフィックスでは末尾2ラベルで比較するため、判定はゆるくなる（別サイトを同じと見ることはある）。
 */
const TWO_LEVEL_SUFFIXES = new Set([
  "co.jp", "or.jp", "ne.jp", "ac.jp", "go.jp", "ed.jp", "gr.jp", "lg.jp",
  "co.uk", "org.uk", "ac.uk", "gov.uk", "com.au", "com.cn", "com.br", "co.kr",
]);

/** ホスト名から「同じサイトかを比べる単位」を取り出す。www.tokyo-gas.co.jp → tokyo-gas.co.jp */
export function siteKey(host: string): string {
  const labels = host.toLowerCase().replace(/\.$/, "").split(".");
  if (labels.length <= 2) return labels.join(".");
  const last2 = labels.slice(-2).join(".");
  return TWO_LEVEL_SUFFIXES.has(last2) ? labels.slice(-3).join(".") : last2;
}

/** 同じ登録ドメインか（ホスト名が違っていてもよい） */
export function sameSite(a: string, b: string): boolean {
  return siteKey(a) === siteKey(b);
}

/** sitemap.xml から URL を取り出す。sitemapindex の場合は子サイトマップのURLを返す */
export function parseSitemap(xml: string): { urls: string[]; isIndex: boolean } {
  const isIndex = /<sitemapindex[\s>]/i.test(xml);
  const urls = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) =>
    m[1].replace(/&amp;/g, "&").trim(),
  );
  return { urls, isIndex };
}

/** HTMLから内部リンクと、同じ登録ドメインの別ホストを取り出す */
export function extractLinks(html: string, baseUrl: string): { internal: string[]; relatedHosts: string[] } {
  const base = new URL(baseUrl);
  const internal: string[] = [];
  const related = new Set<string>();
  const seen = new Set<string>();

  for (const a of parse(html).querySelectorAll("a[href]")) {
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || /^(mailto|tel|javascript):/i.test(href)) continue;
    let u: URL;
    try {
      u = new URL(href, base);
    } catch {
      continue;
    }
    if (u.protocol !== "http:" && u.protocol !== "https:") continue;
    u.hash = "";
    if (u.host === base.host) {
      const key = u.toString();
      if (!seen.has(key)) {
        seen.add(key);
        internal.push(key);
      }
    } else if (sameSite(u.host, base.host)) {
      related.add(u.host);
    }
  }
  return { internal, relatedHosts: [...related].sort() };
}

/** 拡張子や明らかに本文でないURLを外す */
function isPageUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return !/\.(pdf|jpe?g|png|gif|webp|svg|zip|docx?|xlsx?|pptx?|csv|mp4|mp3|xml|json|css|js)$/.test(path);
  } catch {
    return false;
  }
}

function firstSegment(url: string): string {
  try {
    return new URL(url).pathname.split("/").filter(Boolean)[0] ?? "";
  } catch {
    return "";
  }
}

/**
 * 検査するページを選ぶ。入口URLとトップページは必ず入れ、残りは第1ディレクトリが散るように取る。
 * 同じ階層から何本も取っても、テンプレートが同じなので同じ指摘しか出ない。
 */
export function pickPages(entryUrl: string, candidates: string[], max = MAX_PAGES): string[] {
  const picked: string[] = [];
  const seen = new Set<string>();
  const add = (url: string) => {
    if (picked.length >= max || seen.has(url) || !isPageUrl(url)) return;
    seen.add(url);
    picked.push(url);
  };

  add(entryUrl);
  try {
    add(new URL("/", entryUrl).toString());
  } catch {
    // entryUrl が URL として壊れている場合は呼び出し側が先に弾く
  }

  const groups = new Map<string, string[]>();
  for (const url of candidates) {
    if (seen.has(url) || !isPageUrl(url)) continue;
    const key = firstSegment(url);
    groups.set(key, [...(groups.get(key) ?? []), url]);
  }

  // 入口URLと同じディレクトリは最後に回す。同じテンプレートからは同じ指摘しか出ないため、
  // 枠は先に別のディレクトリへ使う。
  const entrySegment = firstSegment(entryUrl);
  const lists = [...groups.entries()].sort((a, b) => Number(a[0] === entrySegment) - Number(b[0] === entrySegment)).map(([, list]) => list);

  // 第1ディレクトリごとに1本ずつ、足りなければ2周目・3周目と回す
  for (let round = 0; picked.length < max && round < 4; round++) {
    let addedThisRound = false;
    for (const list of lists) {
      const url = list[round];
      if (!url) continue;
      const before = picked.length;
      add(url);
      if (picked.length > before) addedThisRound = true;
      if (picked.length >= max) break;
    }
    if (!addedThisRound) break;
  }
  return picked;
}
