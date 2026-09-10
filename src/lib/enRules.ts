// 英語版記事（content/articles-en）が日本語の独自記事と対応しているかの検査。純関数。
// src/lib/content-en.test.ts（CI）と scripts/translate-en.ts（英訳の生成直後）の両方が使う。
// 生成時と CI で基準がずれると、生成は通るのに翌朝のビルドで落ちる（その逆も）ので、ここ1か所に置く。

export type MdxDoc = { data: Record<string, unknown>; content: string };

export const EN_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const figureCount = (s: string) => (s.match(/<Figure[A-Za-z]+/g) ?? []).length;
const sourceUrls = (d: MdxDoc) =>
  (Array.isArray(d.data.sources) ? d.data.sources : []).map((s) => String((s as { url?: unknown })?.url ?? "")).sort();

/**
 * @param ja 対応する日本語記事
 * @param en 英語版
 * @param enSlugs 公開される英語版の slug 一覧（本文中の /en/articles/<slug> リンクの行き先確認用）
 */
export function enArticleErrors(ja: MdxDoc, en: MdxDoc, enSlugs: Set<string>): string[] {
  const errors: string[] = [];
  if (ja.data.original !== true) errors.push(`日本語記事 id ${String(ja.data.id)} は独自記事（original: true）ではない`);
  if (Number(en.data.id) !== Number(ja.data.id)) errors.push(`id が日本語記事と違う: ${String(en.data.id)}`);
  if (typeof en.data.slug !== "string" || !EN_SLUG_PATTERN.test(en.data.slug)) errors.push(`slug は英小文字・数字・ハイフン: ${String(en.data.slug)}`);
  if (typeof en.data.title !== "string" || !en.data.title.trim()) errors.push("title がない");
  const description = String(en.data.description ?? "");
  if (description.length < 40 || description.length > 200) errors.push(`description の長さ ${description.length}（40〜200）`);
  if (String(en.data.date) !== String(ja.data.date)) errors.push(`date が日本語記事と違う: ${String(en.data.date)}`);
  // 出典は日本語記事と同じもの。英訳で出典を足したり落としたりしない（事実の裏取り先が変わる）。
  if (sourceUrls(en).join("\n") !== sourceUrls(ja).join("\n")) errors.push("sources のURLが日本語記事と一致しない");

  const h2 = en.content.match(/^## .+$/gm) ?? [];
  if (h2[0]?.trim() !== "## Conclusion") errors.push(`最初の見出しは "## Conclusion"（実際: ${h2[0] ?? "なし"}）`);
  // FAQ節は記事ごとに任意。日本語版に無いのに英語版だけにある（逆も）と、日英で中身が違うページになる。
  const jaHasFaq = ja.content.includes("## よくある質問");
  const faq = en.content.indexOf("\n## FAQ\n");
  if (jaHasFaq && faq === -1) errors.push('日本語記事に「## よくある質問」があるのに "## FAQ" がない');
  else if (!jaHasFaq && faq !== -1) errors.push('日本語記事に「## よくある質問」が無いのに "## FAQ" がある');
  else if (faq !== -1 && !/^### /m.test(en.content.slice(faq))) errors.push("FAQ に質問（###）がない");
  if (figureCount(en.content) !== figureCount(ja.content)) {
    errors.push(`図解の数が日本語記事と違う（${figureCount(en.content)} / ${figureCount(ja.content)}）`);
  }

  // サイト内リンクは英語版の記事どうしだけ。日本語ページへのリンクを英語の本文に残さない。
  for (const m of en.content.matchAll(/\]\((\/[^)\s]*)\)/g)) {
    const target = /^\/en\/articles\/([a-z0-9-]+)(?:#[^)]*)?$/.exec(m[1]);
    if (!target) errors.push(`日本語ページへのリンク: ${m[1]}`);
    else if (!enSlugs.has(target[1])) errors.push(`存在しない英語版へのリンク: ${m[1]}`);
  }
  return errors;
}
