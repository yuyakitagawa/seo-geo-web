// ChatGPTの会話JSONから「候補URL（検索で取得されたもの）」と「引用URL」を取り出し、
// グループ内の順位・同一ドメインの枚数と、引用されたかどうかの関係を集計する。
//
// 元にした調査: Suganthan Mohanadasan "ChatGPT Already Knows Who's In The Running Before It Searches"
// https://suganthan.com/blog/chatgpt-decides-before-it-searches/
// 同記事の Idea 4（57会話・取得3,554ページ・引用110＝3.1%。グループ内1位5.2%→6位以降0.3%、
// 同一ドメイン1枚4.0%／2枚6.2%／6枚以上1.7%）を、自分のログで再現できるかを確かめるための道具。
// 向こうは英語・ドバイの1アカウント・2026年7月24〜25日の観測なので、数字は方向でしかない。
//
// ファイル入出力は scripts/fanout-report.ts が持つ。ここは純関数だけ（DOMにもNode APIにも依存しない）。

/** グループ内の1件。position はそのグループの中で何番目に置かれていたか（1始まり） */
export type Entry = {
  groupIndex: number;
  position: number;
  /** 比較用に正規化したURL（scheme・www・クエリ・ハッシュ・末尾スラッシュを落とす） */
  url: string;
  /** ログにあったままのURL */
  raw: string;
  domain: string;
};

export type Group = {
  index: number;
  /** グループ自身が持つドメイン名（あれば）。グループの単位がドメインなのかクエリなのかの手がかり */
  domain?: string;
  entries: Entry[];
};

/** 引用1件。type は url / grouped_webpages など、ログにあった表示の型をそのまま持つ */
export type Citation = { type: string; url: string; raw: string; domain: string };

export type Capture = {
  name: string;
  /** モデルが自分で書いた検索クエリ */
  queries: string[];
  groups: Group[];
  citations: Citation[];
  /** SSEの差分で同じグループが重複して入っていたぶん。落とした数を報告に出す */
  duplicateGroups: number;
};

/** 集計の1行＝「取得された候補URL 1件」 */
export type Row = {
  capture: string;
  groupIndex: number;
  position: number;
  domain: string;
  url: string;
  /** 同じグループの中に、同じドメインのページが何枚入っていたか */
  sameDomainInGroup: number;
  cited: boolean;
};

export type Bucket = { label: string; retrieved: number; cited: number; rate: number };

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** JSONを丸ごと歩いて、キーと値を全部見る。会話JSONの形（mapping / SSEの配列）が変わっても拾えるようにするため */
function walk(node: unknown, visit: (key: string, value: unknown) => void): void {
  if (Array.isArray(node)) {
    for (const n of node) walk(n, visit);
    return;
  }
  if (!isObj(node)) return;
  for (const [k, v] of Object.entries(node)) {
    visit(k, v);
    walk(v, visit);
  }
}

/** 比較用のURL。パラメータ違い・末尾スラッシュ違いで同じページが別物に見えるのを防ぐ */
export function normalizeUrl(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    const path = u.pathname.replace(/\/+$/, "");
    return host + path;
  } catch {
    return "";
  }
}

/** ドメイン。www だけ落とす（eTLD+1 までは畳まない。co.jp 等の一覧を持たないので畳むと間違える） */
export function domainOf(raw: string): string {
  try {
    return new URL(raw).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** content_references の要素から、引用されたURLを全部拾う（grouped_webpages は items[] の中にある） */
function collectCitations(node: unknown, type: string, out: Citation[]): void {
  if (Array.isArray(node)) {
    for (const n of node) collectCitations(n, type, out);
    return;
  }
  if (!isObj(node)) return;
  const t = typeof node.type === "string" ? node.type : type;
  if (typeof node.url === "string") {
    const url = normalizeUrl(node.url);
    if (url) out.push({ type: t, url, raw: node.url, domain: domainOf(node.url) });
  }
  for (const v of Object.values(node)) collectCitations(v, t, out);
}

/**
 * 会話JSON 1件を読む。
 * 検索クエリのキーは `search_model_queries`（従来）と `search_queries`（2026年8月初旬に改名との報告）の両方を見る。
 */
export function parseCapture(name: string, json: unknown): Capture {
  const groups: Group[] = [];
  const queries: string[] = [];
  const citations: Citation[] = [];
  const seenGroups = new Set<string>();
  let duplicateGroups = 0;

  walk(json, (key, value) => {
    if (key === "search_result_groups" && Array.isArray(value)) {
      for (const g of value) {
        if (!isObj(g)) continue;
        const raw = Array.isArray(g.entries) ? g.entries : [];
        const entries: Entry[] = [];
        for (const e of raw) {
          if (!isObj(e) || typeof e.url !== "string") continue;
          const url = normalizeUrl(e.url);
          if (!url) continue;
          entries.push({ groupIndex: groups.length, position: entries.length + 1, url, raw: e.url, domain: domainOf(e.url) });
        }
        if (!entries.length) continue;
        // SSEの差分で同じグループが何度も入ることがある。中身が同じものは1つだけ数える。
        const sig = entries.map((e) => e.url).join("|");
        if (seenGroups.has(sig)) {
          duplicateGroups++;
          continue;
        }
        seenGroups.add(sig);
        const index = groups.length;
        groups.push({
          index,
          domain: typeof g.domain === "string" ? g.domain : undefined,
          entries: entries.map((e) => ({ ...e, groupIndex: index })),
        });
      }
    }

    if (key === "search_model_queries" || key === "search_queries") {
      const list = Array.isArray(value) ? value : isObj(value) && Array.isArray(value.queries) ? value.queries : [];
      for (const q of list) if (typeof q === "string" && !queries.includes(q)) queries.push(q);
    }

    if (key === "content_references" && Array.isArray(value)) collectCitations(value, "", citations);
  });

  // 同じURLが複数の型で載ることがある。URL単位で1件に畳む（型は最初に出たものを残す）
  const seenCite = new Set<string>();
  const unique = citations.filter((c) => (seenCite.has(c.url) ? false : (seenCite.add(c.url), true)));

  return { name, queries, groups, citations: unique, duplicateGroups };
}

/** 候補URL 1件＝1行に展開する。引用されたかどうかは同じ会話の中で突き合わせる */
export function toRows(captures: Capture[]): Row[] {
  const rows: Row[] = [];
  for (const c of captures) {
    const cited = new Set(c.citations.map((x) => x.url));
    for (const g of c.groups) {
      const perDomain = new Map<string, number>();
      for (const e of g.entries) perDomain.set(e.domain, (perDomain.get(e.domain) ?? 0) + 1);
      for (const e of g.entries) {
        rows.push({
          capture: c.name,
          groupIndex: g.index,
          position: e.position,
          domain: e.domain,
          url: e.url,
          sameDomainInGroup: perDomain.get(e.domain) ?? 1,
          cited: cited.has(e.url),
        });
      }
    }
  }
  return rows;
}

function bucket(rows: Row[], label: string, match: (r: Row) => boolean): Bucket {
  const hit = rows.filter(match);
  const cited = hit.filter((r) => r.cited).length;
  return { label, retrieved: hit.length, cited, rate: hit.length ? (cited / hit.length) * 100 : 0 };
}

/** グループ内の順位別の引用率（Suganthan調査の1つめの表と同じ切り口） */
export function byPosition(rows: Row[]): Bucket[] {
  return [
    bucket(rows, "1位", (r) => r.position === 1),
    bucket(rows, "2位", (r) => r.position === 2),
    bucket(rows, "3位", (r) => r.position === 3),
    bucket(rows, "4位", (r) => r.position === 4),
    bucket(rows, "5位", (r) => r.position === 5),
    bucket(rows, "6位以降", (r) => r.position >= 6),
  ];
}

/** 同一ドメインが同じグループに何枚入っていたか別の、1ページあたりの引用率（2つめの表） */
export function byDomainPages(rows: Row[]): Bucket[] {
  return [
    bucket(rows, "1枚", (r) => r.sameDomainInGroup === 1),
    bucket(rows, "2枚", (r) => r.sameDomainInGroup === 2),
    bucket(rows, "3〜4枚", (r) => r.sameDomainInGroup >= 3 && r.sameDomainInGroup <= 4),
    bucket(rows, "5枚", (r) => r.sameDomainInGroup === 5),
    bucket(rows, "6枚以上", (r) => r.sameDomainInGroup >= 6),
  ];
}

/** ドメイン別の「取得された回数 vs 引用された回数」。何度取得されても引用されないドメインを見つける */
export function byDomain(rows: Row[]): { domain: string; retrieved: number; cited: number; rate: number }[] {
  const map = new Map<string, { retrieved: number; cited: number }>();
  for (const r of rows) {
    const cur = map.get(r.domain) ?? { retrieved: 0, cited: 0 };
    cur.retrieved++;
    if (r.cited) cur.cited++;
    map.set(r.domain, cur);
  }
  return [...map.entries()]
    .map(([domain, v]) => ({ domain, ...v, rate: (v.cited / v.retrieved) * 100 }))
    .sort((a, b) => b.retrieved - a.retrieved || a.domain.localeCompare(b.domain));
}

/**
 * グループの単位がドメインなのかクエリなのかを確かめるための数。
 * Suganthanは「ChatGPT groups results by domain」と書いているが、当サイトの記事30は
 * クエリ単位として読んでいる。1グループに何ドメイン入っているかで判断する。
 */
export function groupShape(captures: Capture[]): {
  groups: number;
  singleDomain: number;
  withDomainField: number;
  avgEntries: number;
  avgDomains: number;
} {
  const groups = captures.flatMap((c) => c.groups);
  const domainCounts = groups.map((g) => new Set(g.entries.map((e) => e.domain)).size);
  const entries = groups.reduce((s, g) => s + g.entries.length, 0);
  return {
    groups: groups.length,
    singleDomain: domainCounts.filter((n) => n === 1).length,
    withDomainField: groups.filter((g) => g.domain).length,
    avgEntries: groups.length ? entries / groups.length : 0,
    avgDomains: groups.length ? domainCounts.reduce((s, n) => s + n, 0) / groups.length : 0,
  };
}

/** 候補一覧に無いのに引用されたURL（記事30・記事75で見た「リンク先と中身を渡したページが別」の型） */
export function citedNotRetrieved(captures: Capture[]): { capture: string; url: string; type: string }[] {
  const out: { capture: string; url: string; type: string }[] = [];
  for (const c of captures) {
    const retrieved = new Set(c.groups.flatMap((g) => g.entries.map((e) => e.url)));
    for (const cite of c.citations) if (!retrieved.has(cite.url)) out.push({ capture: c.name, url: cite.url, type: cite.type });
  }
  return out;
}

export function totals(captures: Capture[], rows: Row[]): {
  captures: number;
  groups: number;
  retrieved: number;
  uniqueUrls: number;
  cited: number;
  rate: number;
  queries: number;
} {
  const cited = rows.filter((r) => r.cited).length;
  return {
    captures: captures.length,
    groups: captures.reduce((s, c) => s + c.groups.length, 0),
    retrieved: rows.length,
    uniqueUrls: new Set(rows.map((r) => r.url)).size,
    cited,
    rate: rows.length ? (cited / rows.length) * 100 : 0,
    queries: captures.reduce((s, c) => s + c.queries.length, 0),
  };
}
