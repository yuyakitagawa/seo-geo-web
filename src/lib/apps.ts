// 自作ツール（/tools 配下）の一覧。/tools のカード・sitemap・相互リンクが同じ定義を見る。
export type AppTool = {
  path: string;
  name: string;
  /** カードの1行説明 */
  lead: string;
  /** 何が分かるか（3点） */
  points: string[];
  updated: string;
};

export const APP_TOOLS: AppTool[] = [
  {
    path: "/tools/page-audit",
    name: "SEO/GEO ページ診断",
    lead: "URLを入れると、検索エンジンとAI検索がそのページをどう読むかを検査し、直すべき箇所を該当コードと修正後の書き方つきで指摘します。",
    points: ["title・構造化データ・見出しの不備", "サーバーが返すHTMLに本文があるか", "robots.txt とAI検索クローラーの許可状況"],
    updated: "2026-08-31",
  },
  {
    path: "/tools/prompt-fit",
    name: "プロンプト適合度チェッカー",
    lead: "狙っているプロンプトを並べると、ページのどの見出しがその質問に答えているか、どの語が足りないかを判定し、書き足す文の型を返します。",
    points: ["プロンプトごとの適合度と担当ブロック", "本文に無いプロンプトの語", "意図（定義・手順・比較・費用）に合った形式の不足"],
    updated: "2026-08-31",
  },
];
