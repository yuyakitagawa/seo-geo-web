import GithubSlugger from "github-slugger";

// 記事の目次。MDX本文から見出しを拾い、rehype-slug が振るのと同じidを再現する。
// 本文をHTMLにしてから走査するのではなく元のMDXを読むのは、記事ページが MDXRemote で
// サーバー側レンダリングしており、描画前に目次を出す必要があるため。

export type TocItem = { id: string; text: string };

/** 目次に載せる見出しレベル。記事の ### はほぼ「## よくある質問」配下の質問文で、
 *  1記事あたり3〜10個ある。全部載せると目次が本文と同じ長さになるので ## だけにする。 */
const TOC_DEPTH = 2;

const FENCE = /^\s*(```|~~~)/;
const HEADING = /^(#{1,6})\s+(.+?)\s*#*\s*$/;

/** 見出しの装飾を落として素のテキストにする。rehype-slug は描画後のテキストを見るため、
 *  `**強調**` や `` `コード` `` や [リンク](url) の記法はidに残らない。 */
function plainText(md: string): string {
  return md
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .trim();
}

/**
 * MDX本文から目次を作る。
 * idの一意化（同じ文言の見出しに -1, -2 が付く）は github-slugger が状態を持って行うので、
 * 目次に載せない見出しも含めて**すべての見出しを出現順にsluggerへ通す**。
 * こうしないと rehype-slug 側と採番がずれてリンクが外れる。
 */
export function extractToc(body: string): TocItem[] {
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];
  let inFence = false;

  for (const line of body.split("\n")) {
    if (FENCE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const m = HEADING.exec(line);
    if (!m) continue;

    const text = plainText(m[2]);
    const id = slugger.slug(text);
    if (m[1].length === TOC_DEPTH) items.push({ id, text });
  }

  // 見出しが1〜2個しかない記事に目次は要らない（本文がそのまま見える）。
  return items.length >= 3 ? items : [];
}
