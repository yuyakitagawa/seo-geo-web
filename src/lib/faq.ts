// 記事本文の「## よくある質問」から Q&A を取り出す。
// FAQPage JSON-LD は可視テキストと一言一句一致していることが条件なので、
// 別データを持たず本文そのものから組み立てる（不一致が構造的に起きない）。

export type FaqItem = { question: string; answer: string };

const FAQ_HEADING = "## よくある質問";

/** インライン記法を落として素のテキストにする（JSON-LDに入れるのは可視テキストと同じ文字列） */
function plain(md: string): string {
  return md
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .trim();
}

export function extractFaq(body: string): FaqItem[] {
  const start = body.indexOf(FAQ_HEADING);
  if (start === -1) return [];
  const rest = body.slice(start + FAQ_HEADING.length);
  // 次の h2 までがFAQセクション
  const end = rest.search(/\n## /);
  const section = end === -1 ? rest : rest.slice(0, end);

  const items: FaqItem[] = [];
  let current: FaqItem | null = null;
  for (const line of section.split("\n")) {
    const h3 = /^###\s+(.+?)\s*$/.exec(line);
    if (h3) {
      if (current?.answer) items.push(current);
      current = { question: plain(h3[1]), answer: "" };
      continue;
    }
    if (!current) continue;
    const text = line.trim();
    // 図解コンポーネント・箇条書き記号は回答文に含めない（回答は自己完結した文章だけ）
    if (!text || text.startsWith("<") || text.startsWith("|")) continue;
    current.answer = current.answer ? `${current.answer} ${plain(text)}` : plain(text);
  }
  if (current?.answer) items.push(current);
  return items;
}

export function faqPageJsonLd(url: string, items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}
