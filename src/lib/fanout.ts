// ChatGPTの会話JSONから「候補URL（検索で取得されたもの）」と「引用URL」を取り出し、
// ドメイングループ内の順位・グループの大きさと、引用されたかどうかの関係を集計する。
//
// 元にした調査: Suganthan Mohanadasan "ChatGPT Already Knows Who's In The Running Before It Searches"
// https://suganthan.com/blog/chatgpt-decides-before-it-searches/
// 同記事の Idea 4（57会話・取得3,554ページ・引用110＝3.1%。グループ内1位5.2%→6位以降0.3%、
// 同一ドメイン1枚4.0%／2枚6.2%／6枚以上1.7%）を、自分のログで再現できるかを確かめるための道具。
// 向こうは英語・ドバイの1アカウント・2026年7月24〜25日の観測なので、数字は方向でしかない。
//
// 実ログ（2026-09-11・gpt-5-6・日本語）で確かめた前提:
// - グループは `domain` を持つ。`qa.smbc-card.com` が `smbc-card.com` に畳まれるので**登録可能ドメイン単位**
// - 候補一覧は1会話に複数回入る（検索直後の速報と、回答完成後の最終版）。**引用されたURLは最終版から消える**
// - 同じページがクエリ違いで別URLとして載る。突き合わせは `ref_id`（turn_index + ref_index）で行う
//
// ファイル入出力は scripts/fanout-report.ts が持つ。ここは純関数だけ（DOMにもNode APIにも依存しない）。

/** 候補1件。position は同じ検索回（turn）・同じドメインの中で何番目に返ってきたか（1始まり） */
export type Entry = {
  /** turn_index:ref_index。ログ内で一意 */
  key: string;
  turnIndex: number;
  refIndex: number;
  /** グループのドメイン（ログの `domain`。無ければURLのホスト） */
  domain: string;
  /** URLのホスト。グループのドメインと違うことがある（qa.smbc-card.com → smbc-card.com） */
  host: string;
  url: string;
  position: number;
  /** 同じ検索回・同じドメインで返ってきた件数 */
  groupSize: number;
  /** 最終版の候補一覧に残っていたか。引用されたURLはここが false になる */
  inLastList: boolean;
  cited: boolean;
};

export type Group = { turnIndex: number; domain: string; entries: Entry[] };

/** 引用1件。type は url（見出し直下のリンク）/ grouped_webpages（小さいピル）/ sources_footnote */
export type Citation = { type: string; url: string; keys: string[] };

export type Capture = {
  name: string;
  queries: string[];
  groups: Group[];
  entries: Entry[];
  citations: Citation[];
  /** 候補一覧が何回入っていたか（速報＋最終） */
  listSnapshots: number;
};

export type Bucket = { label: string; retrieved: number; cited: number; rate: number };

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** JSONを丸ごと歩く。会話JSONの形（messages配列 / mapping / SSE）が変わっても拾えるようにするため */
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

/** ログの domain は素の文字列のときとMarkdownリンクのときがある。表示名だけ取り出して www を落とす */
export function cleanDomain(raw: string): string {
  const text = raw.match(/^\[([^\]]+)\]\(/)?.[1] ?? raw;
  return text.trim().toLowerCase().replace(/^www\./, "");
}

/** 比較用のURL。クエリ・ハッシュ・末尾スラッシュの違いを畳む（ref_id が無い引用の照合に使う） */
export function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    return u.hostname.toLowerCase().replace(/^www\./, "") + u.pathname.replace(/\/+$/, "");
  } catch {
    return "";
  }
}

/** ホスト名。www だけ落とす */
export function hostOf(raw: string): string {
  try {
    return new URL(raw).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function refKey(ref: unknown): string | null {
  if (!isObj(ref)) return null;
  const t = typeof ref.turn_index === "number" ? ref.turn_index : null;
  const i = typeof ref.ref_index === "number" ? ref.ref_index : null;
  return t === null || i === null ? null : `${t}:${i}`;
}

type Draft = { key: string; turnIndex: number; refIndex: number; domain: string; host: string; url: string; lastSnapshot: number };

/** content_references の中から、引用されたURLと参照先（ref_id）を拾う */
function collectCitations(node: unknown, type: string, out: Citation[]): void {
  if (Array.isArray(node)) {
    for (const n of node) collectCitations(n, type, out);
    return;
  }
  if (!isObj(node)) return;
  const t = typeof node.type === "string" ? node.type : type;
  if (typeof node.url === "string") {
    const keys = Array.isArray(node.refs) ? node.refs.map(refKey).filter((k): k is string => !!k) : [];
    out.push({ type: t, url: node.url, keys });
  }
  for (const [k, v] of Object.entries(node)) {
    if (k === "refs") continue;
    collectCitations(v, t, out);
  }
}

/**
 * 会話JSON 1件を読む。
 * 検索クエリのキーは `search_model_queries`（従来）と `search_queries`（改名の報告あり）の両方を見る。
 */
export function parseCapture(name: string, json: unknown): Capture {
  const drafts = new Map<string, Draft>();
  const queries: string[] = [];
  const rawCitations: Citation[] = [];
  let snapshot = 0;
  let seq = 0;

  walk(json, (key, value) => {
    if (key === "search_result_groups" && Array.isArray(value) && value.length) {
      snapshot++;
      for (const g of value) {
        if (!isObj(g)) continue;
        const groupDomain = typeof g.domain === "string" ? cleanDomain(g.domain) : "";
        const entries = Array.isArray(g.entries) ? g.entries : [];
        for (const e of entries) {
          if (!isObj(e) || typeof e.url !== "string") continue;
          const host = hostOf(e.url);
          if (!host) continue;
          const rk = refKey(e.ref_id);
          const key = rk ?? `u:${e.url}`;
          const [turnIndex, refIndex] = rk ? rk.split(":").map(Number) : [0, seq];
          const prev = drafts.get(key);
          // 同じ候補が速報版と最終版の両方に出る。**後に出たグループの所属を採る**
          // （速報では qa.smbc-card.com、最終では smbc-card.com に畳まれる）
          drafts.set(key, {
            key,
            turnIndex,
            refIndex,
            host,
            url: e.url,
            domain: groupDomain || prev?.domain || host,
            lastSnapshot: snapshot,
          });
          if (!prev) seq++;
        }
      }
    }

    if (key === "search_model_queries" || key === "search_queries") {
      const list = Array.isArray(value) ? value : isObj(value) && Array.isArray(value.queries) ? value.queries : [];
      for (const q of list) if (typeof q === "string" && !queries.includes(q)) queries.push(q);
    }

    if (key === "content_references" && Array.isArray(value)) collectCitations(value, "", rawCitations);
  });

  // 同じURLが複数の型で載る。URL単位で1件に畳み、ref_id は全部残す
  const byUrl = new Map<string, Citation>();
  for (const c of rawCitations) {
    const cur = byUrl.get(c.url);
    if (cur) {
      for (const k of c.keys) if (!cur.keys.includes(k)) cur.keys.push(k);
    } else {
      byUrl.set(c.url, { ...c, keys: [...c.keys] });
    }
  }
  const citations = [...byUrl.values()];
  const citedKeys = new Set(citations.flatMap((c) => c.keys));

  // 速報では `dcard.docomo.ne.jp`、最終では `docomo.ne.jp` のように、グループ名が畳まれることがある。
  // 同じ検索回に短いほうのドメインがあれば、そちらに寄せる。
  const shortDomains = new Map<number, Set<string>>();
  for (const d of drafts.values()) {
    const set = shortDomains.get(d.turnIndex) ?? new Set<string>();
    set.add(d.domain);
    shortDomains.set(d.turnIndex, set);
  }
  for (const d of drafts.values()) {
    const candidates = [...(shortDomains.get(d.turnIndex) ?? [])].filter((s) => d.domain.endsWith(`.${s}`));
    if (candidates.length) d.domain = candidates.sort((a, b) => a.length - b.length)[0];
  }

  // 同じ検索回（turn）・同じドメインでまとめる。順番は ref_index（＝返ってきた順）
  const groupMap = new Map<string, Draft[]>();
  for (const d of drafts.values()) {
    const k = `${d.turnIndex}|${d.domain}`;
    const list = groupMap.get(k) ?? [];
    list.push(d);
    groupMap.set(k, list);
  }

  const groups: Group[] = [];
  const entries: Entry[] = [];
  for (const [k, list] of groupMap) {
    list.sort((a, b) => a.refIndex - b.refIndex);
    const lastSnapshot = Math.max(...list.map((d) => d.lastSnapshot));
    const built = list.map((d, i) => ({
      key: d.key,
      turnIndex: d.turnIndex,
      refIndex: d.refIndex,
      domain: d.domain,
      host: d.host,
      url: d.url,
      position: i + 1,
      groupSize: list.length,
      inLastList: d.lastSnapshot === lastSnapshot,
      cited: citedKeys.has(d.key),
    }));
    groups.push({ turnIndex: Number(k.split("|")[0]), domain: list[0].domain, entries: built });
    entries.push(...built);
  }
  groups.sort((a, b) => a.turnIndex - b.turnIndex || a.domain.localeCompare(b.domain));

  return { name, queries, groups, entries, citations, listSnapshots: snapshot };
}

function bucket(entries: Entry[], label: string, match: (e: Entry) => boolean): Bucket {
  const hit = entries.filter(match);
  const cited = hit.filter((e) => e.cited).length;
  return { label, retrieved: hit.length, cited, rate: hit.length ? (cited / hit.length) * 100 : 0 };
}

export function allEntries(captures: Capture[]): Entry[] {
  return captures.flatMap((c) => c.entries);
}

/** ドメイングループ内の順位別の引用率（Suganthan調査の1つめの表と同じ切り口） */
export function byPosition(entries: Entry[]): Bucket[] {
  return [
    bucket(entries, "1位", (e) => e.position === 1),
    bucket(entries, "2位", (e) => e.position === 2),
    bucket(entries, "3位", (e) => e.position === 3),
    bucket(entries, "4位", (e) => e.position === 4),
    bucket(entries, "5位", (e) => e.position === 5),
    bucket(entries, "6位以降", (e) => e.position >= 6),
  ];
}

/** 同じドメインから何枚が同じグループに入ったか別の、1ページあたりの引用率（2つめの表） */
export function byGroupSize(entries: Entry[]): Bucket[] {
  return [
    bucket(entries, "1枚", (e) => e.groupSize === 1),
    bucket(entries, "2枚", (e) => e.groupSize === 2),
    bucket(entries, "3〜4枚", (e) => e.groupSize >= 3 && e.groupSize <= 4),
    bucket(entries, "5枚", (e) => e.groupSize === 5),
    bucket(entries, "6枚以上", (e) => e.groupSize >= 6),
  ];
}

/** ドメイン別の「取得された件数 vs 引用された件数」。何度取得されても引用されないドメインを見つける */
export function byDomain(entries: Entry[]): { domain: string; retrieved: number; cited: number }[] {
  const map = new Map<string, { retrieved: number; cited: number }>();
  for (const e of entries) {
    const cur = map.get(e.domain) ?? { retrieved: 0, cited: 0 };
    cur.retrieved++;
    if (e.cited) cur.cited++;
    map.set(e.domain, cur);
  }
  return [...map.entries()]
    .map(([domain, v]) => ({ domain, ...v }))
    .sort((a, b) => b.retrieved - a.retrieved || a.domain.localeCompare(b.domain));
}

/**
 * グループがドメイン単位かどうかの根拠になる数。
 * ログの `domain` を持つグループ数と、グループのドメインと違うホストが中に入っていた件数
 * （qa.smbc-card.com が smbc-card.com グループに入る＝登録可能ドメイン単位）。
 */
export function groupShape(captures: Capture[]): {
  groups: number;
  withDomainField: number;
  subdomainFolded: number;
  listSnapshots: number;
} {
  const entries = allEntries(captures);
  return {
    groups: captures.reduce((s, c) => s + c.groups.length, 0),
    withDomainField: captures.reduce((s, c) => s + c.groups.filter((g) => g.domain).length, 0),
    subdomainFolded: entries.filter((e) => e.host !== e.domain).length,
    listSnapshots: captures.reduce((s, c) => s + c.listSnapshots, 0),
  };
}

/** 引用されたか × 最終版の候補一覧に残っていたか。引用されたURLが一覧から消える現象を数で出す */
export function listDropCross(entries: Entry[]): { label: string; count: number }[] {
  const n = (cited: boolean, inList: boolean) => entries.filter((e) => e.cited === cited && e.inLastList === inList).length;
  return [
    { label: "引用された・最終一覧にも残っていた", count: n(true, true) },
    { label: "引用された・最終一覧から消えていた", count: n(true, false) },
    { label: "引用されず・最終一覧に残っていた", count: n(false, true) },
    { label: "引用されず・最終一覧からも消えていた", count: n(false, false) },
  ];
}

/** 候補一覧に無いのに引用されたURL（ref_id が候補のどれとも一致しないもの） */
export function citedNotRetrieved(captures: Capture[]): { capture: string; url: string; type: string }[] {
  const out: { capture: string; url: string; type: string }[] = [];
  for (const c of captures) {
    const keys = new Set(c.entries.map((e) => e.key));
    const urls = new Set(c.entries.map((e) => normalizeUrl(e.url)));
    for (const cite of c.citations) {
      // ref_id があればそれで、無ければURLで照合する。
      // どちらにも当たらないものが「検索で取りに行っていないのに回答に出したページ」
      if (cite.keys.some((k) => keys.has(k))) continue;
      if (urls.has(normalizeUrl(cite.url))) continue;
      out.push({ capture: c.name, url: cite.url, type: cite.type });
    }
  }
  return out;
}

export function totals(captures: Capture[]): {
  captures: number;
  groups: number;
  retrieved: number;
  cited: number;
  rate: number;
  queries: number;
} {
  const entries = allEntries(captures);
  const cited = entries.filter((e) => e.cited).length;
  return {
    captures: captures.length,
    groups: captures.reduce((s, c) => s + c.groups.length, 0),
    retrieved: entries.length,
    cited,
    rate: entries.length ? (cited / entries.length) * 100 : 0,
    queries: captures.reduce((s, c) => s + c.queries.length, 0),
  };
}
