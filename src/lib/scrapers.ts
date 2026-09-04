// robots.txt で拒否する商用クローラーの一覧。src/app/robots.ts が参照する。
//
// AI検索・AI学習・検索エンジンのクローラー（src/lib/crawlers.ts）とは目的が違う。
// あちらは「読者に届くために通したい相手」の資料で、こちらは「通しても読者が増えないのに
// 帯域と関数実行だけを消費する相手」。混ぜない。
//
// 各行の token は提供元の公式ページに書かれている表記をそのまま使う（robots.txt の user-agent 照合は
// RFC 9309 で大文字小文字を区別しないため、表記ゆれは問題にならない）。
//
// robots.txt は「お願い」なので、実際に止めているのは Vercel Firewall のカスタムルール
// 「Deny commercial SEO crawlers」（User-Agent の部分一致で 403。2026-09-04 に CLI で作成）。
// この一覧を変えたら `vercel firewall rules edit "Deny commercial SEO crawlers"` で同期する。
// 経緯は docs/progress_vercel-cost.md。

export type BlockedScraper = {
  /** robots.txt に書く user-agent トークン */
  token: string;
  vendor: string;
  /** 何をするクローラーか */
  role: string;
  source: string;
  verified: string;
};

const V = "2026-09-03";

export const BLOCKED_SCRAPERS: BlockedScraper[] = [
  {
    token: "AhrefsBot",
    vendor: "Ahrefs",
    role: "被リンク調査ツールのインデックスを作るためのクローラー。",
    source: "https://ahrefs.com/robot",
    verified: V,
  },
  {
    token: "SemrushBot",
    vendor: "Semrush",
    role: "SEO分析ツールのインデックスを作るためのクローラー。",
    source: "https://www.semrush.com/bot/",
    verified: V,
  },
  {
    token: "DotBot",
    vendor: "Moz",
    role: "MozのリンクインデックスDotBot。",
    source: "https://moz.com/help/moz-procedures/crawlers/dotbot",
    verified: V,
  },
  {
    token: "rogerbot",
    vendor: "Moz",
    role: "Moz Pro のサイト診断用クローラー。",
    source: "https://moz.com/help/moz-procedures/crawlers/rogerbot",
    verified: V,
  },
  {
    token: "MJ12bot",
    vendor: "Majestic",
    role: "Majestic の被リンクインデックスを作るためのクローラー。",
    source: "https://mj12bot.com/",
    verified: V,
  },
  {
    token: "DataForSeoBot",
    vendor: "DataForSEO",
    role: "SEOデータをAPIで再販するためのクローラー。",
    source: "https://dataforseo.com/dataforseo-bot",
    verified: V,
  },
  {
    token: "barkrowler",
    vendor: "Babbar",
    role: "Babbar のリンクグラフを作るためのクローラー。",
    source: "https://babbar.tech/crawler",
    verified: V,
  },
  {
    token: "serpstatbot",
    vendor: "Serpstat",
    role: "Serpstat の被リンクインデックスを作るためのクローラー。",
    source: "https://serpstatbot.com/",
    verified: V,
  },
];
