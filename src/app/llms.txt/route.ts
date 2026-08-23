import { getAllArticles } from "@/lib/content";
import { CATEGORIES, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

// llms.txt: LLMクローラー向けのサイト概要＋主要URL一覧（https://llmstxt.org/ の提案形式）。
export function GET() {
  const articles = getAllArticles();
  const lines = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "## サイト情報",
    `- [運営者情報](${SITE_URL}/about): 運営者の経歴と記事制作プロセス`,
    `- [免責事項](${SITE_URL}/disclaimer)`,
    "",
    "## カテゴリ",
    ...Object.entries(CATEGORIES).map(([k, c]) => `- [${c.label}](${SITE_URL}/category/${k}): ${c.description}`),
    "",
    "## 最新記事",
    ...articles.slice(0, 50).map((a) => `- [${a.title}](${SITE_URL}/articles/${a.slug}): ${a.description}`),
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
