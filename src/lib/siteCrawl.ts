// サイト診断書（/tools/site-report）が「どのページを見るか」を決める純関数。
// 取得そのものは api/site-report.ts が持ち、ここはURLの抽出と選び方だけを持つ。
//
// 何ページ取るかは費用に直結する（Vercel Functions の実行時間）。上限はここに1つだけ置き、
// APIとUIの説明が同じ数字を見るようにする。
import { parse, type HTMLElement } from "node-html-parser";

/** 1回の診断で取得するページ数の上限。増やすと実行時間と費用がそのまま増える */
export const MAX_PAGES = 8;

/** 同時に取りに行く本数。相手のサーバーに並べて当てすぎない */
export const CONCURRENCY = 4;

/** 全体の期限。これを過ぎたら、取れた分だけで提案書を作る（関数のタイムアウトで全部捨てない） */
export const DEADLINE_MS = 40_000;

// ---- 「リンク構造も調べる」を選んだときだけ使う上限 ----
// 既定の診断より多くのページを取りに行くので、実行時間がそのまま費用になる。
// 利用者がチェックを入れたときだけ動かし、上限はここ3つで決める。

/** クロールするページ数の上限 */
export const CRAWL_MAX_PAGES = 80;

/** クロール時の同時実行数。相手のサーバーに並べて当てすぎない */
export const CRAWL_CONCURRENCY = 8;

/** クロール全体の期限。vercel.json の maxDuration（60秒）より短くする */
export const CRAWL_DEADLINE_MS = 50_000;

/**
 * リンク構造まで調べるときの、判定用8ページの取得に使う期限。
 * 前半でCRAWL_DEADLINE_MSを使い切るとクロールの時間が残らないので、ここで切る。
 */
export const AUDIT_DEADLINE_WITH_LINKS_MS = 25_000;

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

/** 1つの範囲からリンクを拾う。internal は同一ホスト、related は同じ登録ドメインの別ホスト */
function collectLinks(root: HTMLElement, base: URL): { internal: string[]; related: Set<string> } {
  const internal: string[] = [];
  const related = new Set<string>();
  const seen = new Set<string>();

  for (const a of root.querySelectorAll("a[href]")) {
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
  return { internal, related };
}

/**
 * HTMLから内部リンクと、同じ登録ドメインの別ホストを取り出す。
 * `bodyInternal` は nav / header / footer / aside の**外**にあるリンクだけ。
 * 全ページに同じ形で出るナビとフッターを数に入れると、どのページも「リンクされている」ことになり、
 * 本文から案内されていないページが見えなくなる。
 */
export function extractLinks(html: string, baseUrl: string): { internal: string[]; bodyInternal: string[]; relatedHosts: string[] } {
  const base = new URL(baseUrl);
  const root = parse(html);
  const all = collectLinks(root, base);
  // ナビ・フッターを取り除いてから数え直す（root を壊すので all を先に取る）
  for (const el of root.querySelectorAll("nav, header, footer, aside")) el.remove();
  const body = collectLinks(root, base);
  return { internal: all.internal, bodyInternal: body.internal, relatedHosts: [...all.related].sort() };
}

/**
 * URLを突き合わせるためのキー。ハッシュを外し、末尾のスラッシュを揃える。
 * `/a` と `/a/` を別物として数えると、リンクされているページを「孤立」と誤って出す。
 */
export function normalizeUrlKey(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    u.pathname = u.pathname.replace(/\/+$/, "") || "/";
    return u.toString();
  } catch {
    return url;
  }
}

/** 拡張子や明らかに本文でないURLを外す */
export function isPageUrl(url: string): boolean {
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
