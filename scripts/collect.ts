// RSS/Atomを巡回し、未処理の候補を content/queue.json に積む。
// 実行: npx tsx scripts/collect.ts
import fs from "node:fs";
import path from "node:path";
import Parser from "rss-parser";
import { FEED_SOURCES, TOPIC_KEYWORDS } from "./sources";

export type Candidate = {
  url: string;
  title: string;
  summary: string;
  publishedAt: string;
  source: string;
  kind: "official" | "media";
  lang: "en" | "ja";
};

const CONTENT_DIR = path.join(process.cwd(), "content");
const QUEUE_PATH = path.join(CONTENT_DIR, "queue.json");
const PROCESSED_PATH = path.join(CONTENT_DIR, "processed.json");
const MAX_AGE_DAYS = 7;

function readJson<T>(p: string, fallback: T): T {
  return fs.existsSync(p) ? (JSON.parse(fs.readFileSync(p, "utf8")) as T) : fallback;
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

function matchesTopic(text: string, keywords: string[] = TOPIC_KEYWORDS) {
  const t = text.toLowerCase();
  return keywords.some((k) => t.includes(k));
}

async function main() {
  const parser = new Parser();
  const processed = new Set(readJson<string[]>(PROCESSED_PATH, []));
  const queue = readJson<Candidate[]>(QUEUE_PATH, []);
  const queued = new Set(queue.map((c) => c.url));
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
      if (processed.has(url) || queued.has(url)) continue;
      const summary = (item.contentSnippet ?? item.summary ?? "").slice(0, 500);
      if (!src.alwaysInclude && !matchesTopic(`${item.title} ${summary}`, src.keywords)) continue;

      queue.push({ url, title: item.title.trim(), summary, publishedAt, source: src.name, kind: src.kind, lang: src.lang });
      queued.add(url);
      added++;
    }
  }

  // 公式→新しい順
  queue.sort((a, b) => (a.kind === b.kind ? Date.parse(b.publishedAt) - Date.parse(a.publishedAt) : a.kind === "official" ? -1 : 1));
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2) + "\n");
  console.log(`queue: +${added} (total ${queue.length})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
