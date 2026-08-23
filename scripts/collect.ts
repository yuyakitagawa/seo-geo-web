// RSS/Atomを巡回し、新しい候補を content/candidates.csv に「候補」として追記する。
// 既にリストにあるURL（採用・却下・公開を含む）は二度と積まない。
// 実行: npx tsx scripts/collect.ts [日数=7]
import Parser from "rss-parser";
import { FEED_SOURCES, TOPIC_KEYWORDS } from "./sources";
import { loadCandidates, saveCandidates, type Candidate } from "./candidates";

// 収集対象の期間（日）。引数で上書き可: npx tsx scripts/collect.ts 60
const MAX_AGE_DAYS = Number(process.argv[2] ?? 7);

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

function matchesTopic(text: string, keywords: string[] = TOPIC_KEYWORDS) {
  const t = text.toLowerCase();
  return keywords.some((k) => t.includes(k));
}

// --- 話題の大きさ ---
// タイトルを意味のある語に分解し、語の重なりで「同じ話題」をまとめる。
// 英語はストップワード除去＋3文字以上、日本語はカタカナ語・英字・漢字2字以上の連続を語として扱う。
const STOP = new Set("the a an of to in on for and or with is are at by from as how why what your you new via about into vs over up out more its it this that these those".split(" "));
function tokens(title: string): Set<string> {
  const t = title.toLowerCase().replace(/via @\w+/g, "").replace(/[【】\[\]「」『』（）()：:,.!?？！–—-]/g, " ");
  const words = new Set<string>();
  for (const w of t.match(/[a-z0-9][a-z0-9.+-]{2,}/g) ?? []) if (!STOP.has(w)) words.add(w);
  for (const w of t.match(/[ァ-ヶー]{2,}|[一-龠]{2,}/g) ?? []) words.add(w);
  return words;
}
function sameTopic(a: Set<string>, b: Set<string>) {
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  const jaccard = shared / (a.size + b.size - shared || 1);
  return shared >= 3 || jaccard >= 0.34;
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
    const keywordHits = TOPIC_KEYWORDS.filter((k) => `${c.title} ${c.summary}`.toLowerCase().includes(k)).length;
    // 公式ボーナスは検索専門の公式ソース（Search Central / ステータス / Bing）だけ+3。
    // OpenAIやThe Keywordは検索以外の話題も多いので+1に留め、企業PRが上位に来ないようにする。
    const searchOfficial = FEED_SOURCES.find((s) => s.name === c.source)?.alwaysInclude === true;
    c.score =
      (c.kind === "official" ? (searchOfficial ? 3 : 1) : 0) + // 公式発表
      (c.cluster - 1) * 2 + // 他ソースも報じた話題
      (ageDays <= 3 ? 1 : 0) + // 新しさ
      Math.min(keywordHits, 3); // 検索テーマとの近さ（上限3）
  }
}

async function main() {
  const parser = new Parser();
  const list = loadCandidates();
  const known = new Set(list.map((c) => c.url));
  const since = Date.now() - MAX_AGE_DAYS * 86400_000;
  let added = 0;

  for (const src of FEED_SOURCES) {
    let feed;
    try {
      const res = await fetch(src.url, { signal: AbortSignal.timeout(15000), headers: { "User-Agent": "Mozilla/5.0 (compatible; seo-geo-web-collector)" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      feed = await parser.parseString(await res.text());
    } catch (e) {
      console.warn(`[skip] ${src.name}: ${(e as Error).message}`);
      continue;
    }
    for (const item of feed.items) {
      if (!item.link || !item.title) continue;
      const url = normalizeUrl(item.link);
      const publishedAt = item.isoDate ?? item.pubDate ?? "";
      if (publishedAt && Date.parse(publishedAt) < since) continue;
      if (known.has(url)) continue;
      const summary = (item.contentSnippet ?? item.summary ?? "").replace(/\s+/g, " ").slice(0, 300);
      if (!src.alwaysInclude && !matchesTopic(`${item.title} ${summary}`, src.keywords)) continue;

      list.push({
        status: "候補",
        score: 0,
        published: publishedAt ? new Date(publishedAt).toISOString().slice(0, 10) : "",
        source: src.name,
        kind: src.kind,
        title: item.title.replace(/\s*via @\w+(, @\w+)*\s*$/i, "").trim(),
        url,
        summary,
        cluster: 1,
        articleId: "",
        note: "",
      });
      known.add(url);
      added++;
    }
  }

  rescore(list, new Date());
  saveCandidates(list);
  const pending = list.filter((c) => c.status === "候補").length;
  console.log(`candidates: +${added} (候補 ${pending} / 全 ${list.length})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
