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
    updated: "2026-08-30",
  },
  {
    path: "/tools/ai-crawlers",
    name: "AI検索クローラー robots.txt チェッカー",
    lead: "robots.txt を貼ると、AI検索に引用されるためのクローラーと、AIの学習に使われるクローラーを分けて判定します。",
    points: ["14種のクローラーごとの許可・ブロック", "ブロックすると何が起きるか", "方針からrobots.txtを作る"],
    updated: "2026-08-30",
  },
];
