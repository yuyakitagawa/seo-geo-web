// RSS/Atomを巡回し、新しい候補を content/candidates.csv に「候補」として追記する。
// 既にリストにあるURL（採用・却下・公開を含む）は二度と積まない。
// 実行: npx tsx scripts/collect.ts [日数=7]
// 過去記事のバックフィル: npx tsx scripts/collect.ts --since=2026-03-02 [--until=2026-07-14]
//   通常フィードは最新数十件しか返さないので、--since を渡したときだけ
//   (1) Google News 検索を月ごとの日付窓（after:/before:）で掘る
//   (2) WordPress フィードを ?paged=N で遡る
//   に切り替える。日次の自動収集（--since なし）の挙動は変えない。
import Parser from "rss-parser";
import { BACKFILL_QUERIES, FEED_SOURCES, googleNewsSearch, TOOL_KEYWORDS, TOPIC_KEYWORDS, type FeedSource } from "./sources";
import { loadCandidates, saveCandidates, type Candidate } from "./candidates";
import { isGoogleNewsUrl, resolveGoogleNewsUrl } from "./googleNews";
import { sameTopic, tokens } from "../src/lib/topic";

const DAY = 86400_000;
const args = process.argv.slice(2);
const argValue = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];

// 収集対象の期間（日）。引数で上書き可: npx tsx scripts/collect.ts 60
const MAX_AGE_DAYS = Number(args.find((a) => /^\d+$/.test(a)) ?? 7);
// バックフィルの窓（YYYY-MM-DD）。--since があるときだけバックフィルモードになる。
const SINCE = argValue("since") ?? "";
const UNTIL = argValue("until") ?? new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
// ページ送りの上限。WordPress は範囲外のページでも1ページ目を返すことがあるので、回数でも止める。
const MAX_PAGES = 15;

function shiftDay(date: string, days: number) {
  return new Date(Date.parse(date) + days * DAY).toISOString().slice(0, 10);
}

/**
 * バックフィルの窓を暦月ごとに刻む（from/to はどちらも含む）。
 * Google News 検索は1クエリあたりの返却件数に上限があるため、半年を一度に投げず月単位に割る。
 */
export function monthWindows(since: string, until: string): { from: string; to: string }[] {
  const wins: { from: string; to: string }[] = [];
  let cur = `${since.slice(0, 7)}-01`;
  while (cur <= until) {
    const [y, m] = cur.split("-").map(Number);
    const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const from = cur < since ? since : cur;
    const to = next > until ? until : shiftDay(next, -1);
    if (from <= to) wins.push({ from, to });
    cur = next;
  }
  return wins;
}

/** WordPress フィードの N ページ目のURL（?paged=N）。対応していないソースは1ページ目と同じ結果を返す */
function pagedUrl(feedUrl: string, page: number) {
  const url = new URL(feedUrl);
  url.searchParams.set("paged", String(page));
  return url.toString();
}

function normalizeUrl(u: string) {
  try {
    const url = new URL(u);
    url.hash = "";
    for (const k of [...url.searchParams.keys()]) if (k.startsWith("utm_")) url.searchParams.delete(k);
    return url.toString();
  } catch {
    return u;
  }
}

// 転載記事の重複排除用。PR TIMES配信はInfoseek/Excite/時事等にほぼ同じタイトルで転載されるため、
// 記号・空白・「【画像】… n/5」の類を落としたタイトルで同一視する。
function titleKey(title: string) {
  return title.replace(/【[^】]*】/g, "").replace(/\s*\d+\/\d+\s*$/, "").replace(/[\s\u3000｜|｜\-–—:：,.。、「」『』（）()!?！？]/g, "").toLowerCase();
}

function matchesTopic(text: string, keywords: string[] = TOPIC_KEYWORDS) {
  const t = text.toLowerCase();
  return keywords.some((k) => t.includes(k));
}

// 同じ話題を報じた「異なるソース」の数を cluster に入れ、スコアを再計算する。
// 却下済み・公開済みも話題の大きさの証拠になるので、全行を対象にする。
export function rescore(list: Candidate[], today: Date) {
  const toks = list.map((c) => tokens(c.title));
  for (let i = 0; i < list.length; i++) {
    const sources = new Set([list[i].source]);
    for (let j = 0; j < list.length; j++) {
      if (i !== j && sameTopic(toks[i], toks[j])) sources.add(list[j].source);
    }
    const c = list[i];
    c.cluster = sources.size;
    const ageDays = (today.getTime() - Date.parse(c.published)) / 86400_000;
    const text = `${c.title} ${c.summary}`.toLowerCase();
    const keywordHits = TOPIC_KEYWORDS.filter((k) => text.includes(k)).length;
    // ツール発表（検知ソース経由、または通常ソースでもツール語＋AI検索語を含む）は /tools の更新材料なので底上げする
    const isTool = c.note.startsWith("ツール検知") || (TOOL_KEYWORDS.some((k) => text.includes(k.toLowerCase())) && /llmo|geo|aio|ai検索|ai visibility|ai overview|chatgpt/.test(text));
    if (isTool && !c.note.startsWith("ツール検知")) c.note = c.note ? `ツール検知; ${c.note}` : "ツール検知";
    // 公式ボーナスは検索専門の公式ソース（Search Central / ステータス / Bing）だけ+3。
    // OpenAIやThe Keywordは検索以外の話題も多いので+1に留め、企業PRが上位に来ないようにする。
    const searchOfficial = FEED_SOURCES.find((s) => s.name === c.source)?.alwaysInclude === true;
    c.score =
      (c.kind === "official" ? (searchOfficial ? 3 : 1) : 0) + // 公式発表
      Math.min(c.cluster - 1, 3) * 2 + // 他ソースも報じた話題（上限3ソース=+6）
      (ageDays <= 3 ? 1 : 0) + // 新しさ
      Math.min(keywordHits, 3) + // 検索テーマとの近さ（上限3）
      (isTool ? 2 : 0); // ツール発表
  }
}

type Ctx = { list: Candidate[]; known: Set<string>; knownTitles: Set<string> };
/** 拾う対象の期間（エポックms、両端を含む） */
type Window = { since: number; until: number };

/** 1本のフィードURLを読み、窓に入る新しい記事を候補に積む。返り値はページ送りの停止判定に使う */
async function collectFrom(parser: Parser, src: FeedSource, url: string, win: Window, ctx: Ctx) {
  const empty = { added: 0, items: 0, oldest: Infinity, firstUrl: "" };
  let feed;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { "User-Agent": "Mozilla/5.0 (compatible; seo-geo-web-collector)" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    feed = await parser.parseString(await res.text());
  } catch (e) {
    console.warn(`[skip] ${src.name}: ${(e as Error).message}`);
    return empty;
  }
  let added = 0;
  let oldest = Infinity;
  let firstUrl = "";
  for (const item of feed.items) {
    if (!item.link || !item.title) continue;
    const itemUrl = normalizeUrl(item.link);
    if (!firstUrl) firstUrl = itemUrl;
    const publishedAt = item.isoDate ?? item.pubDate ?? "";
    if (publishedAt) {
      const at = Date.parse(publishedAt);
      if (Number.isFinite(at)) {
        oldest = Math.min(oldest, at);
        if (at < win.since || at > win.until) continue;
      }
    }
    if (ctx.known.has(itemUrl)) continue;
    const summary = (item.contentSnippet ?? item.summary ?? "").replace(/\s+/g, " ").slice(0, 300);
    if (!src.alwaysInclude && !matchesTopic(`${item.title} ${summary}`, src.keywords)) continue;

    // Google News はタイトル末尾に「 - 媒体名」が付くので、媒体名を source に移す。
    let title = item.title.replace(/\s*via @\w+(, @\w+)*\s*$/i, "").trim();
    let source = src.name;
    if (url.startsWith("https://news.google.com/")) {
      const m = title.match(/^(.*) - ([^-]+)$/);
      if (m) {
        title = m[1].trim();
        source = `${m[2].trim()}（${src.name}）`;
      }
    }
    if (ctx.knownTitles.has(titleKey(title))) continue; // 転載の重複（同一タイトル）
    // Google News の暗号化URLは元記事URLに戻す（generate の web_fetch と、人がリストを見るときのため）
    const resolved = isGoogleNewsUrl(itemUrl) ? normalizeUrl(await resolveGoogleNewsUrl(itemUrl)) : itemUrl;
    if (resolved !== itemUrl && ctx.known.has(resolved)) continue;
    ctx.list.push({
      status: "候補",
      score: 0,
      published: publishedAt ? new Date(publishedAt).toISOString().slice(0, 10) : "",
      source,
      kind: src.kind,
      title,
      url: resolved,
      summary,
      cluster: 1,
      articleId: "",
      note: src.topic === "tools" ? "ツール検知" : src.name.startsWith("Backfill:") ? "バックフィル" : "",
    });
    ctx.known.add(itemUrl);
    ctx.known.add(resolved);
    ctx.knownTitles.add(titleKey(title));
    added++;
  }
  return { added, items: feed.items.length, oldest, firstUrl };
}

/** 日次の収集。ツール検知ソース（Google News）は件数が多いので直近14日に固定。通常ソースは引数の日数 */
async function collectRecent(parser: Parser, ctx: Ctx) {
  let added = 0;
  for (const src of FEED_SOURCES) {
    const days = src.topic === "tools" ? Math.min(MAX_AGE_DAYS, 14) : MAX_AGE_DAYS;
    const win = { since: Date.now() - days * DAY, until: Infinity };
    added += (await collectFrom(parser, src, src.url, win, ctx)).added;
  }
  return added;
}

/** バックフィル。月ごとの Google News 検索 ＋ WordPress フィードのページ送りで過去を掘る */
async function collectBackfill(parser: Parser, ctx: Ctx) {
  let added = 0;
  for (const w of monthWindows(SINCE, UNTIL)) {
    const win = { since: Date.parse(w.from), until: Date.parse(w.to) + DAY - 1 };
    for (const q of BACKFILL_QUERIES) {
      // after:/before: は境界日を落とすことがあるので窓を1日ずつ広げ、実際の絞り込みは win に任せる
      const url = googleNewsSearch(`${q.query} after:${shiftDay(w.from, -1)} before:${shiftDay(w.to, 1)}`, q.lang);
      added += (await collectFrom(parser, { name: q.name, url, kind: "media", lang: q.lang }, url, win, ctx)).added;
    }
    console.log(`[backfill] ${w.from}〜${w.to} 累計 +${added}`);
  }

  const win = { since: Date.parse(SINCE), until: Date.parse(UNTIL) + DAY - 1 };
  for (const src of FEED_SOURCES.filter((s) => s.paged)) {
    let prevFirstUrl = "";
    for (let page = 1; page <= MAX_PAGES; page++) {
      const r = await collectFrom(parser, src, page === 1 ? src.url : pagedUrl(src.url, page), win, ctx);
      added += r.added;
      // 記事が無い／ページ送りに非対応で同じページが返る／窓より古い記事まで到達した、のどれかで打ち切る
      if (r.items === 0 || r.firstUrl === prevFirstUrl || r.oldest < win.since) break;
      prevFirstUrl = r.firstUrl;
    }
    console.log(`[backfill] ${src.name} 累計 +${added}`);
  }
  return added;
}

async function main() {
  const parser = new Parser();
  const list = loadCandidates();
  const ctx: Ctx = { list, known: new Set(list.map((c) => c.url)), knownTitles: new Set(list.map((c) => titleKey(c.title))) };

  const added = SINCE ? await collectBackfill(parser, ctx) : await collectRecent(parser, ctx);

  rescore(list, new Date());
  saveCandidates(list);
  const pending = list.filter((c) => c.status === "候補").length;
  console.log(`candidates: +${added} (候補 ${pending} / 全 ${list.length})${SINCE ? ` [backfill ${SINCE}〜${UNTIL}]` : ""}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
