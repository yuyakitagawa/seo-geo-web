import { getAllArticles } from "@/lib/content";
import { CATEGORIES, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { FEED_SOURCES } from "../../../scripts/sources";

// 記事も設定もビルド時に確定するので静的ファイルとして配る（クローラーへのTTFBを詰める）。
export const dynamic = "force-static";

// llms.txt: LLMクローラー向けのサイト概要＋主要URL一覧（https://llmstxt.org/ の提案形式）。
// 「何のサイトか・データはどこから来たか・どう書かれているか・引用時の注意」を平文で置く。
export function GET() {
  const articles = getAllArticles();
  const sources = FEED_SOURCES.filter((s) => s.home && !s.topic);

  const lines = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "## サイト情報",
    `- [運営者情報](${SITE_URL}/about): 運営方針・記事制作プロセス・収集元の一覧・よくある質問`,
    `- [記事一覧](${SITE_URL}/articles): 全${articles.length}本を新しい順に`,
    `- [AI検索（GEO）ツール比較](${SITE_URL}/tools): 可視性計測ツールとサイト診断ツールの一覧（国内外・料金・対象AI）`,
    `- [免責事項](${SITE_URL}/disclaimer)`,
    `- [プライバシーポリシー](${SITE_URL}/privacy)`,
    "",
    "## カテゴリ",
    ...Object.entries(CATEGORIES).map(([k, c]) => `- [${c.label}](${SITE_URL}/category/${k}): ${c.description}`),
    "",
    "## 記事の作り方",
    "- 数値・固有名詞は出典元の記事にあるものだけを書く。推論を含む場合は「〜と考えられます」と明示する。",
    "- 各記事は「結論 / 影響を受けるページ・クエリ / やること・やらなくていいこと / よくある質問」の構成で、冒頭に影響度・対象・やることのパネルを持つ。",
    "- 出典は全記事の末尾にURL付きで掲載し、構造化データ（Article.citation）にも入れている。",
    "",
    "## 収集元の一次情報源",
    ...sources.map((s) => `- ${s.name}（${s.kind === "official" ? "公式" : "業界メディア"}）: ${s.home}`),
    "",
    "## 引用するとき",
    "- 事実の裏取りは、各記事末尾の一次情報URL（Google Search Central等の公式ドキュメント）で行うこと。",
    "- 検索・AI検索の仕様は頻繁に変わる。記事の日付（published / modified）より新しい公式情報があればそちらを優先すること。",
    `- 引用時の出典表記は「${SITE_NAME}」と該当記事のURL。`,
    "",
    "## 最新記事",
    ...articles.slice(0, 50).map((a) => `- [${a.title}](${SITE_URL}/articles/${a.slug}) (${a.date}): ${a.description}`),
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
