// モデルの応答から記事MDXを取り出す（純関数。ファイル入出力とAPI呼び出しは scripts/article.ts が持つ）。
//
// 2026-09-17〜19、HOW TO生成が3日連続で失敗した。3件とも同じ
// 「草稿の本文が0字で改稿できない: frontmatter missing title/date」で、原因は2種類あった。
//   1. 最後のtextブロックの中で、frontmatter の前に前置きが付く
//      （例: `すべて確認できました。最終版を出力します。\n\n---\ntitle: ...`）。
//      gray-matter は先頭の `---` しか見ないので frontmatter を読み落とす。
//   2. 最後のtextブロックが独り言だけで、MDX本体は手前のブロックにある
//      （例: `Now fix the remaining long sentences.`）。
// どちらも「frontmatter を持つ最後のブロックを選び、その `---` から先を返す」で拾える。

/** 全体を囲むコードフェンス（```mdx ... ```）を外す */
function stripFence(text: string): string {
  const m = /^```(?:mdx|md|markdown|yaml)?[ \t]*\n([\s\S]*?)\n```[ \t]*$/.exec(text);
  return m ? m[1] : text;
}

/**
 * frontmatter（`---` で囲まれたブロック）の開始位置。
 * 前置きに水平線の `---` が混ざることがあるので、候補を順に試して
 * title と date を持つものを採る。
 */
function frontmatterStart(text: string): number | null {
  const fence = /^---[ \t]*$/gm;
  for (let open = fence.exec(text); open; open = fence.exec(text)) {
    const bodyStart = open.index + open[0].length + 1;
    const close = /^---[ \t]*$/m.exec(text.slice(bodyStart));
    if (!close) return null;
    const body = text.slice(bodyStart, bodyStart + close.index);
    if (/^title:/m.test(body) && /^date:/m.test(body)) return open.index;
  }
  return null;
}

/**
 * textブロック群から記事MDXを取り出す。
 * frontmatter を持つ最後のブロック（＝改稿後）を選び、その前の前置きを捨てる。
 * 1つも持たないときは最後の非空ブロックをそのまま返す（FETCH_FAILED や空応答の判定を後段に残す）。
 */
export function extractMdx(texts: string[]): string {
  const candidates = texts
    .map((t) => stripFence(t.replace(/\r\n/g, "\n").trim()).trim())
    .filter((t) => t.length > 0);
  for (let i = candidates.length - 1; i >= 0; i--) {
    const start = frontmatterStart(candidates[i]);
    if (start !== null) return candidates[i].slice(start);
  }
  return candidates.at(-1) ?? "";
}
