// 出典ページの本文をテキストで取り出す。web_fetch サーバーツールを持たないプロバイダ
// （Moonshot）で記事を書くときに、元記事をプロンプトへ添付するために使う。
// 診断系の src/lib/fetchPage.ts とは別に置く。あちらは読者が入力した任意のURLを扱うため
// SSRF対策が要るが、こちらが読むのは candidates.csv / howto-topics.csv に自分で入れた出典だけ。
import { parse } from "node-html-parser";

const TIMEOUT_MS = 20_000;
// 1ページあたりの上限。長い公式ドキュメントでも冒頭〜中盤で記事に必要な事実は揃う。
const MAX_CHARS = 40_000;
const UA = "SeoGeoLabBot/1.0 (+https://seo-geo-lab.com)";

/** 出典1ページ分の本文。取得できない・本文が薄すぎる場合は throw（記事を書かせない） */
export async function fetchSourceText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml" },
    redirect: "follow",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`出典の取得に失敗 (${res.status}): ${url}`);

  const root = parse(await res.text());
  root.querySelectorAll("script, style, noscript, template, svg, iframe, nav, header, footer, aside, form").forEach((n) => n.remove());
  const title = root.querySelector("title")?.text.replace(/\s+/g, " ").trim() ?? "";
  const body = root.querySelector("main") ?? root.querySelector("article") ?? root.querySelector("body") ?? root;

  // structuredText はブロック要素の切れ目に改行を入れる（.text は連結してしまい、
  // 箇条書きの項目や見出しが1行に潰れる）。
  const text = body.structuredText
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
  if (text.length < 200) throw new Error(`出典の本文が取得できません: ${url}`);

  const head = title ? `タイトル: ${title}\n\n` : "";
  return head + (text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}\n（以下省略）` : text);
}

/** 複数の出典をまとめて、プロンプトに貼れる形にする。1つでも取れなければ throw */
export async function fetchSources(urls: string[]): Promise<string> {
  const parts: string[] = [];
  for (const url of urls) parts.push(`<出典 url="${url}">\n${await fetchSourceText(url)}\n</出典>`);
  return parts.join("\n\n");
}
