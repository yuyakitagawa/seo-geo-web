// 配信されるHTMLは1行に詰まっている（Reactが要素間に空白を出さないため）。読むときだけインデントを付ける。
// 診断や「手本として自分のソースを確認する」用途で、出力はstdoutのみ。ビルド成果物には一切関与しない。
// 実行: npx tsx scripts/format-html.ts [URL または ファイルパス]（既定はローカルの dev サーバー）
import { readFileSync } from "node:fs";

// 閉じタグを持たない要素。ネストの深さを増やしてはいけない。
const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);
// 中身をHTMLとして解釈してはいけない要素（`<` を含むJSでタグ解析が壊れる）。
const RAW = new Set(["script", "style", "textarea", "title"]);
// 空白に意味がある要素。中身は原文のまま出す。
const PRESERVE = new Set(["pre", "textarea"]);

const INDENT = "  ";

// 属性値の中の ">" で切らないよう、引用符の内側を飛ばしながらタグの終端を探す。
function tagEnd(html: string, start: number) {
  let quote = "";
  for (let i = start + 1; i < html.length; i++) {
    const c = html[i];
    if (quote) {
      if (c === quote) quote = "";
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === ">") {
      return i;
    }
  }
  return html.length - 1;
}

// 生テキスト要素の中身を、共通の先頭空白だけ落として現在の深さに寄せる。
function reindent(body: string, pad: string) {
  const lines = body.replace(/\r\n/g, "\n").split("\n").filter((l) => l.trim());
  if (!lines.length) return [];
  const base = Math.min(...lines.map((l) => l.length - l.trimStart().length));
  return lines.map((l) => pad + l.slice(base).trimEnd());
}

function formatHtml(html: string) {
  const out: string[] = [];
  let depth = 0;
  let i = 0;

  while (i < html.length) {
    if (html[i] !== "<") {
      const next = html.indexOf("<", i);
      const text = html.slice(i, next === -1 ? html.length : next);
      if (text.trim()) out.push(...reindent(text, INDENT.repeat(depth)));
      i = next === -1 ? html.length : next;
      continue;
    }

    if (html.startsWith("<!--", i)) {
      const end = html.indexOf("-->", i);
      const stop = end === -1 ? html.length : end + 3;
      out.push(INDENT.repeat(depth) + html.slice(i, stop).trim());
      i = stop;
      continue;
    }

    const end = tagEnd(html, i);
    const tag = html.slice(i, end + 1);
    i = end + 1;

    if (tag.startsWith("<!")) {
      out.push(INDENT.repeat(depth) + tag);
      continue;
    }
    if (tag.startsWith("</")) {
      depth = Math.max(0, depth - 1);
      out.push(INDENT.repeat(depth) + tag);
      continue;
    }

    const name = (tag.match(/^<\s*([a-zA-Z0-9-]+)/)?.[1] ?? "").toLowerCase();
    out.push(INDENT.repeat(depth) + tag);
    if (VOID.has(name) || tag.endsWith("/>")) continue;

    // 閉じタグで深さを戻すので、生テキスト要素でも開いた分だけ深くする。
    depth++;

    if (RAW.has(name) || PRESERVE.has(name)) {
      // 中身は解析せず、対応する閉じタグまでをそのまま取る。
      const close = html.toLowerCase().indexOf(`</${name}`, i);
      const stop = close === -1 ? html.length : close;
      const body = html.slice(i, stop);
      if (body.trim()) {
        out.push(...(PRESERVE.has(name) ? body.replace(/\r\n/g, "\n").split("\n") : reindent(body, INDENT.repeat(depth))));
      }
      i = stop;
    }
  }

  return out.join("\n");
}

async function main() {
  const target = process.argv[2] ?? "http://localhost:3000";
  const html = /^https?:\/\//.test(target)
    ? await fetch(target).then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}: ${target}`);
        return r.text();
      })
    : readFileSync(target, "utf8");
  console.log(formatHtml(html));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
