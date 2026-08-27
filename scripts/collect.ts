// RSS/Atomを巡回し、新しい候補を content/candidates.csv に「候補」として追記する。
// 既にリストにあるURL（採用・却下・公開を含む）は二度と積まない。
// 実行: npx tsx scripts/collect.ts [日数=7]
import Parser from "rss-parser";
import { FEED_SOURCES, TOOL_KEYWORDS, TOPIC_KEYWORDS } from "./sources";
import { loadCandidates, saveCandidates, type Candidate } from "./candidates";
import { isGoogleNewsUrl, resolveGoogleNewsUrl } from "./googleNews";
import { sameTopic, tokens } from "./topic";

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

async function main() {
  const parser = new Parser();
  const list = loadCandidates();
  const known = new Set(list.map((c) => c.url));
  const knownTitles = new Set(list.map((c) => titleKey(c.title)));
  // ツール検知ソース（Google News）は件数が多いので直近14日に固定。通常ソースは引数の日数。
  const sinceFor = (topic?: string) => Date.now() - (topic === "tools" ? Math.min(MAX_AGE_DAYS, 14) : MAX_AGE_DAYS) * 86400_000;
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
      if (publishedAt && Date.parse(publishedAt) < sinceFor(src.topic)) continue;
      if (known.has(url)) continue;
      const summary = (item.contentSnippet ?? item.summary ?? "").replace(/\s+/g, " ").slice(0, 300);
      if (!src.alwaysInclude && !matchesTopic(`${item.title} ${summary}`, src.keywords)) continue;

      // Google News はタイトル末尾に「 - 媒体名」が付くので、媒体名を source に移す。
      let title = item.title.replace(/\s*via @\w+(, @\w+)*\s*$/i, "").trim();
      let source = src.name;
      if (src.url.startsWith("https://news.google.com/")) {
        const m = title.match(/^(.*) - ([^-]+)$/);
        if (m) {
          title = m[1].trim();
          source = `${m[2].trim()}（${src.name}）`;
        }
      }
      if (knownTitles.has(titleKey(title))) continue; // 転載の重複（同一タイトル）
      // Google News の暗号化URLは元記事URLに戻す（generate の web_fetch と、人がリストを見るときのため）
      const resolved = isGoogleNewsUrl(url) ? normalizeUrl(await resolveGoogleNewsUrl(url)) : url;
      if (resolved !== url && known.has(resolved)) continue;
      list.push({
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
        note: src.topic === "tools" ? "ツール検知" : "",
      });
      known.add(url);
      known.add(resolved);
      knownTitles.add(titleKey(title));
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
