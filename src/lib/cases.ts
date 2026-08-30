// 実例データ。「強いサイトが実際に何をして、何が起きたか」を教科書（/learn）で使う。
//
// 収録の条件は次の3つ。ここを満たさない事例は載せない。
// 1. サイト運営者本人か、Google（検索セントラル / web.dev）が公開している一次情報であること
// 2. 「実施したこと」と「報告された数値」が同じ文書に書かれていること
// 3. 数値は出典の表現をそのまま使い、丸めたり言い換えたりしないこと
//
// 数値は各社の環境での結果であり、同じ施策で同じ結果が出ることを示すものではない。
// この注記は表示側（src/components/lesson.tsx の CaseList）で必ず添える。

export type CaseArea = "technical" | "structured" | "cwv" | "geo";

export const CASE_AREAS: Record<CaseArea, { label: string; tone: "seo" | "geo" | "accent" | "news" }> = {
  technical: { label: "テクニカルの基礎", tone: "accent" },
  structured: { label: "構造化データ", tone: "seo" },
  cwv: { label: "Core Web Vitals", tone: "news" },
  geo: { label: "生成AIでの引用", tone: "geo" },
};

export type Case = {
  id: string;
  /** サイト名。出典の表記に合わせる */
  site: string;
  /** 国・業種。読者が自分に近い事例を選べるようにする */
  sector: string;
  area: CaseArea;
  /** 実施したこと。出典に書かれている施策だけを書く */
  did: string;
  /** 報告された結果。出典の数値をそのまま並べる */
  results: string[];
  source: { title: string; publisher: string; url: string };
};

export const CASES: Case[] = [
  {
    id: "saramin",
    site: "Saramin",
    sector: "韓国・求人サイト",
    area: "technical",
    did: "不要なキーワードを並べたmetaタグを削除し、canonicalで重複ページを1本化。そのうえでJobPosting（求人）・パンくず・想定年収の構造化データを追加した。構造化データテストツール、モバイルフレンドリーテスト、PageSpeed Insightsで継続的に監査している。",
    results: [
      "2019年9月の採用シーズンで、Google検索からの自然流入が前年同月比102%増",
      "自然検索経由の新規会員登録が93%増",
      "自然検索からのコンバージョン率が前年比9%増",
      "2015年にクロールエラーを解消しただけの段階で、流入が15%増",
    ],
    source: {
      title: "Saramin increases organic Search traffic 2X by investing in SEO",
      publisher: "Google 検索セントラル 成功事例",
      url: "https://developers.google.com/search/case-studies/saramin-case-study",
    },
  },
  {
    id: "rakuten-recipe",
    site: "楽天レシピ",
    sector: "日本・レシピ投稿（月間アクティブ1,500万人）",
    area: "structured",
    did: "レシピの構造化データを2012年から導入し、2014年に対象を広げた。2017年にはGoogle検索チームと共同でマークアップを見直し、CMS側で対応して2週間で全ページに反映。構造化データテストツールで検証している。",
    results: ["検索エンジンからの全ページへの流入が2.7倍", "平均セッション時間が従来の1.5倍"],
    source: {
      title: "Rakuten Recipe increases time on site 1.5X with structured data",
      publisher: "Google 検索セントラル 成功事例",
      url: "https://developers.google.com/search/case-studies/rakuten-case-study",
    },
  },
  {
    id: "eventbrite",
    site: "Eventbrite",
    sector: "米国・イベントチケット",
    area: "structured",
    did: "Googleのイベント向けドキュメントに沿って、公開している全イベントページにEvent構造化データを実装した。基本テンプレートを1つ作り、以降は微調整だけで運用している。実装後は構造化データテストツールで正しさを確認。",
    results: ["実装翌月、イベントページへのGoogle検索流入が、例年の前年比成長率に対しておよそ100%増（Google Analytics計測）"],
    source: {
      title: "Eventbrite boosts traffic 100% with event structured data",
      publisher: "Google 検索セントラル 成功事例",
      url: "https://developers.google.com/search/case-studies/eventbrite-case-study",
    },
  },
  {
    id: "mx-player",
    site: "MX Player",
    sector: "インド・動画配信",
    area: "structured",
    did: "動画ページに構造化データを付け、動画サイトマップを高い頻度で送信するようにした。Googleが公開している動画のベストプラクティスに合わせ、ウェブ検索・動画タブ・Discoverの各面に載る条件を満たした。",
    results: ["6か月でGoogleからの自然流入が3倍", "自然検索セッションあたりの動画ページビューが100%増"],
    source: {
      title: "MX Player boosts organic traffic 3X by maximizing video discoverability",
      publisher: "Google 検索セントラル 成功事例",
      url: "https://developers.google.com/search/case-studies/mx-case-study",
    },
  },
  {
    id: "yahoo-japan-news",
    site: "Yahoo! JAPAN ニュース",
    sector: "日本・ニュースメディア",
    area: "cwv",
    did: "CLS（読み込み中のレイアウトのずれ）を改善し、ラボデータで約0.2から0にした。",
    results: [
      "Search Consoleで「不良」と判定されたURLが98%減",
      "セッションあたりのページビューが15.1%増",
      "セッション時間が13.3%長くなった",
      "直帰率が1.72ポイント減",
    ],
    source: {
      title: "Yahoo! JAPAN News improved CLS by 0.2 and increased page views per session by 15%",
      publisher: "web.dev（Google）ケーススタディ",
      url: "https://web.dev/case-studies/yahoo-japan-news",
    },
  },
  {
    id: "rakuten24",
    site: "Rakuten 24",
    sector: "日本・日用品EC",
    area: "cwv",
    did: "Core Web Vitalsに投資し、CLSを92.72%、TTFBを18.03%、FCPを8.45%、FIDを7.95%改善した。改善版と従来ページでA/Bテストを行い、事業指標の差を測った。",
    results: [
      "訪問者あたりの収益が53.37%増",
      "コンバージョン率が33.13%増",
      "平均注文額が15.20%増",
      "離脱率が35.12%減",
    ],
    source: {
      title: "How Rakuten 24's investment in Core Web Vitals increased revenue per visitor by 53.37% and conversion rate by 33.13%",
      publisher: "web.dev（Google）ケーススタディ",
      url: "https://web.dev/case-studies/rakuten",
    },
  },
  {
    id: "nuvemshop",
    site: "Nuvemshop",
    sector: "ブラジル・ECプラットフォーム（18万店舗超）",
    area: "cwv",
    did: "ブラウザがLCP要素を取り違えていた原因を3つ潰した。ファーストビューの画像から loading=\"lazy\" を外し、LCP画像に fetchpriority=\"high\" を付け、先頭セクションのCSSトランジションを削除した。",
    results: [
      "LCPが「良好」の割合が57%から96%へ（68%改善）",
      "Core Web Vitalsの合格率が48%から72%へ",
      "Google自然検索のモバイルで、コンバージョン率（セッション→購入）が8.9%増",
      "カート到達率（セッション→カート）が8.4%増",
    ],
    source: {
      title: "How Nuvemshop's image prioritization strategy led to a 68% improvement in LCP and 8.9% more conversions",
      publisher: "web.dev（Google）ケーススタディ",
      url: "https://web.dev/case-studies/nuvemshop",
    },
  },
  {
    id: "redbus",
    site: "redBus",
    sector: "インド・バス予約",
    area: "cwv",
    did: "検索結果の1リクエストあたりの取得件数を30件から10件に減らし、入力欄の状態をコンポーネント内で持ってblur時だけ全体に同期するようにした。INP（操作への応答性）に絞って改善している。",
    results: [
      "検索結果ページのINPが870〜900msから350〜370msへ",
      "入力欄の操作でINPが72%改善",
      "全体の売上が7%増",
    ],
    source: {
      title: "How redBus improved their INP by 72% and increased sales by 7%",
      publisher: "web.dev（Google）ケーススタディ",
      url: "https://web.dev/case-studies/redbus-inp",
    },
  },
  {
    id: "vodafone-it",
    site: "Vodafone（イタリア）",
    sector: "イタリア・通信",
    area: "cwv",
    did: "LCP（主要なコンテンツが表示されるまでの時間）を31%改善した。",
    results: ["売上が8%増"],
    source: {
      title: "The business impact of Core Web Vitals",
      publisher: "web.dev（Google）",
      url: "https://web.dev/case-studies/vitals-business-impact",
    },
  },
  {
    id: "nykaa",
    site: "Nykaa",
    sector: "インド・化粧品EC",
    area: "cwv",
    did: "LCPを40%改善した。",
    results: ["tier2・tier3都市からの自然検索流入が28%増"],
    source: {
      title: "The business impact of Core Web Vitals",
      publisher: "web.dev（Google）",
      url: "https://web.dev/case-studies/vitals-business-impact",
    },
  },
  {
    id: "geo-bench",
    site: "GEO論文（GEO-bench）",
    sector: "研究・生成AI検索の可視性",
    area: "geo",
    did: "10,000件のクエリ（学習8,000・検証1,000・テスト1,000）からなるベンチマークGEO-benchを作り、9通りの書き換えが生成AIの回答内での可視性をどう変えるかを測定した。KDD 2024採録。",
    results: [
      "引用の追加（Quotation Addition）で可視性が最大41%向上",
      "統計の追加（Statistics Addition）で約32%向上",
      "文章の読みやすさの改善（Fluency Optimization）で約29%向上",
      "出典の明示（Cite Sources）で約28%向上",
      "キーワードの詰め込み（Keyword Stuffing）はほとんど効果がない",
    ],
    source: {
      title: "GEO: Generative Engine Optimization（arXiv:2311.09735）",
      publisher: "Aggarwal ほか（KDD 2024）",
      url: "https://arxiv.org/abs/2311.09735",
    },
  },
];

const BY_ID = new Map(CASES.map((c) => [c.id, c]));

/** id を並べた順で引く。存在しないidはビルド時に落として気づけるようにする */
export function getCases(...ids: string[]): Case[] {
  return ids.map((id) => {
    const c = BY_ID.get(id);
    if (!c) throw new Error(`cases.ts: unknown case id "${id}"`);
    return c;
  });
}

export function casesByArea(area: CaseArea): Case[] {
  return CASES.filter((c) => c.area === area);
}
