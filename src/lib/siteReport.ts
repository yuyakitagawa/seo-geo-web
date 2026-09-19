// サイトを数ページ検査して「修正提案書」にまとめる純関数。取得は api/site-report.ts が担当し、
// ここは受け取った検査結果を束ねて並べるだけにする。
//
// 判定ロジックはここで増やさない。1ページ分の指摘は src/lib/audit.ts が出したものをそのまま使い、
// このファイルは「同じ指摘を横断で束ねる」「着手順を付ける」「6項目に整形する」だけを持つ。
// 判定が2か所に分かれると、片方だけ直って結果が食い違う。
//
// 優先度・書式は /learn#plan「直す候補が大量に出たときの並べ方」と同じ定義を使う。
// 教科書とこのツールで段の意味や期間がずれると、読んだ人がどちらかを信じられなくなる。
// 3段の分け方・1件6項目・「1段目はまとめて入れてよい」は当サイトの整理で、Googleの基準ではない。
import { CHECKLIST, type Area, type AuditResult, type Finding, type Severity } from "./audit";
import { WEAK_INBOUND, type LinkGraph } from "./linkGraph";
import { analyzeStructure, DEEP_DEPTH, MIN_URLS, type SiteStructure } from "./siteStructure";

/** 修正候補の段。下（1）から順に片付ける。基準は「影響の大きさ」ではなく「他の修正の前提になっているか」 */
export type Stage = 1 | 2 | 3;

export type StageDef = {
  stage: Stage;
  label: string;
  /** 目安の期間 */
  span: string;
  /** この段に何が入るか */
  desc: string;
  /** まとめて一度に入れてよいか。検証指標が観測で直接確認できる段だけ true */
  batch: boolean;
  /** 効果の測り方 */
  measure: string;
};

export const STAGES: StageDef[] = [
  {
    stage: 1,
    label: "1段目：クロール資産の一本化",
    span: "〜1か月",
    desc: "重複URL・リダイレクト・noindex・サイトマップ。ここが済むまで、上の段の修正の効果は複数のURLに分散する。",
    batch: true,
    measure: "検証指標が「重複が消えたか」のように観測で直接確認できるため、まとめて一度に入れてよい。",
  },
  {
    stage: 2,
    label: "2段目：見え方",
    span: "1〜3か月",
    desc: "要点ボックス、タイトルと説明文、構造化データ。対象ページ単位で効果を測れる。",
    batch: false,
    measure: "表示回数・クリック数で測るため、1施策ずつ4週間の窓で見る。",
  },
  {
    stage: 3,
    label: "3段目：積み上げ",
    span: "3か月〜",
    desc: "著者・更新日の明示、ホストをまたぐ内部リンク、独自データ。下の2段が済んでから効き始める。",
    batch: false,
    measure: "下の2段が済んでから効き始めるため、3か月以上の幅で見る。",
  },
];

export function stageDef(stage: Stage): StageDef {
  return STAGES[stage - 1];
}

/** 指摘の由来。「対象の範囲」の書き方がこれで変わる */
type Origin = "server" | "template" | "content";

/** audit.ts の指摘1件に、提案書で足りない「原因」「検証指標と時期」「段」を与える表 */
type Rule = { stage: Stage; origin: Origin; cause: string; metric: string };

/**
 * 指摘IDごとの割り当て。CHECKLIST の findingIds を1つ残らず埋める
 * （埋め忘れは src/lib/siteReport.test.ts が落とす）。
 */
const RULES: Record<string, Rule> = {
  // ---------- 1段目：クロール資産の一本化 ----------
  status: {
    stage: 1,
    origin: "server",
    cause: "サーバーまたはCDNの応答設定。ルーティングの取りこぼしか、参照元に残った旧URL。",
    metric: "同じURLを取得して 200 が返る。修正後すぐ確認できる。",
  },
  redirect: {
    stage: 1,
    origin: "server",
    cause: "リダイレクトの設定がサーバー・CDN・アプリの複数の層に分かれ、積み重なっている。",
    metric: "入口のURLから1ホップで最終URLに着く。修正後すぐ確認できる。",
  },
  noindex: {
    stage: 1,
    origin: "template",
    cause: "テンプレートの共通 head、またはサーバーの X-Robots-Tag。検証環境の設定が本番に残っていることが多い。",
    metric: "Search Console のURL検査が「インデックス登録可能」。再クロール後（数日〜2週間）。",
  },
  nosnippet: {
    stage: 1,
    origin: "template",
    cause: "テンプレートの robots メタ。転載対策の設定を全ページに広げている。",
    metric: "検索結果にスニペットが出る。再クロール後（数日〜2週間）。",
  },
  canonical: {
    stage: 1,
    origin: "template",
    cause: "テンプレートに canonical を出力する処理が無い。",
    metric: "URL検査の「Googleが選択した正規URL」が自URLと一致する。再クロール後。",
  },
  "canonical-relative": {
    stage: 1,
    origin: "template",
    cause: "テンプレートがパスだけを出力し、ホスト名を付けていない。",
    metric: "URL検査の「Googleが選択した正規URL」が自URLと一致する。再クロール後。",
  },
  "canonical-other": {
    stage: 1,
    origin: "template",
    cause: "複製元のテンプレートを流用したか、パラメータ違いを1本に寄せる設定が広すぎる。",
    metric: "URL検査の「Googleが選択した正規URL」が意図したURLと一致する。再クロール後。",
  },
  lang: {
    stage: 1,
    origin: "template",
    cause: "テンプレートの html 要素。",
    metric: "取得したHTMLの html 要素に lang がある。修正後すぐ確認できる。",
  },
  charset: {
    stage: 1,
    origin: "template",
    cause: "テンプレートの head 先頭、またはサーバーの Content-Type ヘッダー。",
    metric: "取得したHTMLの先頭1KB以内に charset がある。修正後すぐ確認できる。",
  },
  viewport: {
    stage: 1,
    origin: "template",
    cause: "テンプレートの head。",
    metric: "モバイル表示で横スクロールが出ない。修正後すぐ確認できる。",
  },
  "robots-missing": {
    stage: 1,
    origin: "server",
    cause: "ホスト直下に robots.txt を置いていない。サブドメインを増やしたときに漏れやすい。",
    metric: "https://ホスト名/robots.txt が 200 で返る。修正後すぐ確認できる。",
  },
  "robots-googlebot": {
    stage: 1,
    origin: "server",
    cause: "robots.txt の Disallow 行。検証環境の全面拒否が本番に残っているか、対象範囲が広すぎる。",
    metric: "robots.txt テスターで対象URLが「許可」。修正後すぐ確認できる。",
  },
  "robots-sitemap": {
    stage: 1,
    origin: "server",
    cause: "robots.txt に Sitemap 行を書いていない。",
    metric: "robots.txt に Sitemap 行があり、そのURLが 200 で返る。修正後すぐ確認できる。",
  },
  sitemap: {
    stage: 1,
    origin: "server",
    cause: "サイトマップを生成していないか、置き場所を robots.txt と揃えていない。",
    metric: "Search Console のサイトマップが「成功」で、検出URL数がページ数と合う。送信後数日。",
  },
  "robots-ai": {
    stage: 1,
    origin: "server",
    cause: "robots.txt の User-agent 行。商用クローラー対策の設定を流用し、AI検索のクローラーまで止めている。",
    metric: "robots.txt で対象のクローラーが許可されている。修正後すぐ確認できる。",
  },
  "thin-html": {
    stage: 1,
    origin: "template",
    cause: "本文をブラウザ側のJavaScriptで描画している。サーバーが返すHTMLに本文が入っていない。",
    metric: "curl で取得したHTMLに本文の文字が含まれる。修正後すぐ確認できる。",
  },
  slow: {
    stage: 1,
    origin: "server",
    cause: "サーバーの応答時間、または1ページあたりのHTML生成量。",
    metric: "同じURLの取得時間とHTMLサイズ。修正後すぐ確認できる。",
  },

  // ---------- 2段目：見え方 ----------
  title: {
    stage: 2,
    origin: "template",
    cause: "テンプレートの title 出力、またはページ個別の設定漏れ。",
    metric: "検索結果で title が書き換えられずに出る。4週間。",
  },
  "title-length": {
    stage: 2,
    origin: "template",
    cause: "テンプレートが付ける接尾辞（サイト名・カテゴリ名）が長い。",
    metric: "検索結果で末尾が切られずに出る。4週間。",
  },
  description: {
    stage: 2,
    origin: "template",
    cause: "テンプレートに description の出力が無いか、ページ個別の設定漏れ。",
    metric: "スニペットが意図した要約になる。4週間。",
  },
  "description-length": {
    stage: 2,
    origin: "content",
    cause: "本文の冒頭をそのまま流し込んでいる。",
    metric: "スニペットが途中で切れずに出る。4週間。",
  },
  "title-description-same": {
    stage: 2,
    origin: "template",
    cause: "title と description に同じ変数を入れている。",
    metric: "検索結果でタイトルと説明文が別の情報を伝えている。4週間。",
  },
  h1: {
    stage: 2,
    origin: "template",
    cause: "見出しをCSSの見た目だけで作り、h1 を使っていない。",
    metric: "HTMLに h1 が1つある。修正後すぐ確認できる（表示回数の変化は4週間）。",
  },
  "h1-multiple": {
    stage: 2,
    origin: "template",
    cause: "ロゴやセクション見出しに h1 を使っている。",
    metric: "HTMLの h1 が1つに収まる。修正後すぐ確認できる。",
  },
  "heading-order": {
    stage: 2,
    origin: "content",
    cause: "見出しレベルを意味ではなく文字の大きさで選んでいる。",
    metric: "見出しの階層が飛ばずに連続する。修正後すぐ確認できる。",
  },
  semantic: {
    stage: 2,
    origin: "template",
    cause: "レイアウトを div だけで組み、本文の範囲を示す要素を使っていない。",
    metric: "本文が main / article の中に入る。修正後すぐ確認できる。",
  },
  "img-alt": {
    stage: 2,
    origin: "content",
    cause: "画像の登録時に代替テキストを入れる手順が無い。",
    metric: "alt の無い画像が0件。修正後すぐ確認できる。",
  },
  ogp: {
    stage: 2,
    origin: "template",
    cause: "テンプレートの head に OGP の出力が無い。",
    metric: "SNSとAIのプレビューに意図した画像と文が出る。修正後すぐ確認できる。",
  },
  jsonld: {
    stage: 2,
    origin: "template",
    cause: "構造化データを入れていない。",
    metric: "リッチリザルトテストで型が認識される。修正後すぐ確認できる（表示の変化は4週間）。",
  },
  "jsonld-broken": {
    stage: 2,
    origin: "template",
    cause: "テンプレートで文字列を連結して生成し、本文中の引用符や改行でJSONが壊れている。",
    metric: "リッチリザルトテストが構文エラーを出さない。修正後すぐ確認できる。",
  },
  "article-props": {
    stage: 2,
    origin: "template",
    cause: "JSON-LD のひな形から必須プロパティを落としている。",
    metric: "リッチリザルトテストで必須項目の警告が消える。修正後すぐ確認できる。",
  },
  breadcrumb: {
    stage: 2,
    origin: "template",
    cause: "パンくずを画面にだけ出し、構造化データにしていない。",
    metric: "検索結果にパンくずが出る。4週間。",
  },
  "no-lead": {
    stage: 2,
    origin: "content",
    cause: "本文が背景説明から始まる構成になっている。",
    metric: "冒頭に1〜2文の直答がある。修正後すぐ確認できる（引用の変化は4週間以上）。",
  },
  "lead-long": {
    stage: 2,
    origin: "content",
    cause: "1文に条件と例外を詰め込んでいる。",
    metric: "冒頭の1文が抜き出せる長さに収まる。修正後すぐ確認できる。",
  },
  "snippet-head-boilerplate": {
    stage: 2,
    origin: "template",
    cause: "本文の前に共通の定型文（キャンペーン・注意書き・パンくず）が入るテンプレート。",
    metric: "本文の先頭200字が、そのページの内容で始まる。修正後すぐ確認できる。",
  },
  "snippet-head-late": {
    stage: 2,
    origin: "content",
    cause: "最初の見出しの前に前置きが長い。",
    metric: "本文の先頭200字に最初の見出しが入る。修正後すぐ確認できる。",
  },
  faq: {
    stage: 2,
    origin: "content",
    cause: "質問と回答を地の文で書いている。",
    metric: "質問の形の見出しと、その直下の回答がある。修正後すぐ確認できる。",
  },
  "anchor-text": {
    stage: 2,
    origin: "template",
    cause: "リンク文言を「こちら」などで統一しているテンプレートか、本文の書き方。",
    metric: "曖昧なリンク文言が0件。修正後すぐ確認できる。",
  },

  // ---------- 3段目：積み上げ ----------
  "internal-links": {
    stage: 3,
    origin: "content",
    cause: "本文から関連ページへ送る導線を置いていない。ナビとフッターだけで回遊を作っている。",
    metric: "本文中の内部リンク数と、そこからの遷移数。3か月。",
  },
  "operator-link": {
    stage: 3,
    origin: "template",
    cause: "運営者情報・著者・連絡先への導線がフッターにも無い。",
    metric: "全ページから運営者情報へ1クリックで届く。修正後すぐ確認できる（評価への反映は3か月）。",
  },
  citation: {
    stage: 3,
    origin: "content",
    cause: "一次情報を参照せずに書いている。",
    metric: "AI検索の回答で引用元に挙がるか。3か月。",
  },
  "geo-quotation": {
    stage: 3,
    origin: "content",
    cause: "出典を挙げているが、原文を引かず要約だけにしている。",
    metric: "AI検索の回答で引用元に挙がるか。3か月。",
  },
  "geo-statistics": {
    stage: 3,
    origin: "content",
    cause: "自社で持っている数値を本文に出していない。",
    metric: "AI検索の回答で引用元に挙がるか。3か月。",
  },
  "geo-fluency": {
    stage: 3,
    origin: "content",
    cause: "1文に複数の主語と条件を入れている。",
    metric: "1文の平均文字数。修正後すぐ確認できる（引用の変化は3か月）。",
  },
  "heading-generic": {
    stage: 2,
    origin: "content",
    cause: "節の結論ではなく、章の役割（導入・まとめ）を見出しにしている。",
    metric: "見出しが節の結論の文になっている。修正後すぐ確認できる（引用の変化は3か月）。",
  },
  "heading-orphan": {
    stage: 3,
    origin: "content",
    cause: "見出しの直後に図・表・箇条書きを置き、文の説明を省いている。",
    metric: "すべての見出しの直下に段落がある。修正後すぐ確認できる（引用の変化は3か月）。",
  },
  "section-lead": {
    stage: 3,
    origin: "content",
    cause: "節をつなげて読ませる前提で書き、1文目を指示語や予告で始めている。",
    metric: "節の1文目が単体で意味が通る。修正後すぐ確認できる（引用の変化は3か月）。",
  },
  "section-long": {
    stage: 3,
    origin: "content",
    cause: "話題が変わっても見出しを足さず、1つの節に詰めている。",
    metric: "1節あたりの文字数。修正後すぐ確認できる（引用の変化は3か月）。",
  },
  "geo-keyword-stuffing": {
    stage: 3,
    origin: "content",
    cause: "同じ語を繰り返して密度を上げている。",
    metric: "同じ語の出現回数。修正後すぐ確認できる。",
  },
  date: {
    stage: 3,
    origin: "template",
    cause: "公開日・更新日を画面の文字だけで出し、機械が読める形にしていない。",
    metric: "構造化データに datePublished がある。修正後すぐ確認できる（評価への反映は3か月）。",
  },
  organization: {
    stage: 3,
    origin: "template",
    cause: "運営者の構造化データを置いていない。",
    metric: "AI検索の回答で、社名と事業内容が正しく結び付く。3か月。",
  },
};

/** RULES に無いIDが来たときの既定。audit.ts に指摘が増えても提案書が落ちないようにする */
const DEFAULT_RULE: Rule = {
  stage: 2,
  origin: "content",
  cause: "該当ページの実装。",
  metric: "指摘された箇所が解消しているか。4週間。",
};

export type Proposal = {
  id: string;
  stage: Stage;
  area: Area;
  severity: Severity;
  /** 症状（結論を先に） */
  symptom: string;
  /** なぜ直すか */
  detail: string;
  /** 対象の範囲 */
  scope: { text: string; urls: string[]; count: number };
  cause: string;
  /** 直した後の状態 */
  after: string;
  afterCode?: string;
  /** 実物から抜いた該当コード（最初に見つかったページのもの） */
  code?: string;
  /** 検証指標と時期 */
  metric: string;
  source?: { title: string; url: string };
};

export type PageResult = {
  url: string;
  finalUrl: string;
  status: number;
  /** リダイレクトされて別URLに着いたか（サイトマップや内部リンクに残った旧URL） */
  redirected: boolean;
  findings: number;
  error?: string;
};

export type SiteReportInput = {
  /** 入力されたURL */
  entryUrl: string;
  /** ページの見つけ方 */
  discovery: "sitemap" | "links";
  /** 見つけたURLの総数（検査した数ではない） */
  foundUrls: number;
  /**
   * 収集元で見つけたURLの一覧。**取得はしない**（文字列を数えてディレクトリ構造を出すだけ）。
   * サイトマップから取れたときだけ構造を数える。内部リンク由来の数十本では形が出ないため。
   */
  sourceUrls: string[];
  /** リンク構造。「リンク構造も調べる」を選んだときだけ入る（既定は null） */
  linkGraph: LinkGraph | null;
  /** 内部リンクに出てくる同じ登録ドメインの別ホスト */
  relatedHosts: string[];
  sitemap: { url: string; ok: boolean };
  robotsOk: boolean;
  /**
   * 検査したページ。`fromSource` は「サイトマップ／内部リンクで見つけたURLか」。
   * 入力されたURLとトップページは収集元に無くても検査するので、収集元そのものへの指摘には数えない。
   */
  pages: { url: string; result: AuditResult | null; status?: number; error?: string; fromSource?: boolean }[];
  /** 作成日（YYYY-MM-DD）。テストで固定できるように受け取る */
  checkedAt: string;
};

export type SiteReportResult = {
  entryUrl: string;
  host: string;
  relatedHosts: string[];
  discovery: "sitemap" | "links";
  foundUrls: number;
  checkedAt: string;
  pages: PageResult[];
  proposals: Proposal[];
  counts: Record<Stage, number>;
  sitemap: { url: string; ok: boolean };
  robotsOk: boolean;
  /** URLの構造。サイトマップから十分な本数が取れたときだけ。リンク構造は含まない */
  structure: SiteStructure | null;
  /** リンク構造。選ばれたときだけ */
  linkGraph: LinkGraph | null;
};

const SEVERITY_ORDER: Record<Severity, number> = { high: 0, mid: 1, low: 2, ok: 3 };

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function pathOf(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname + u.search;
  } catch {
    return url;
  }
}

/** ディレクトリのURLと重複しうる、ファイル名付きのパスか */
function isIndexFile(path: string): boolean {
  return /\/index\.(html?|php)$/i.test(path);
}

/** 「対象の範囲」の文。1本のURLか、テンプレート単位か、ホスト全体かを書き分ける */
function scopeText(origin: Origin, count: number, total: number, host: string): string {
  if (origin === "server") return `ホスト全体（${host}）。1か所の設定で全ページに効く`;
  if (count >= total && total > 1) return `検査した${total}ページすべて。テンプレート単位で直す`;
  if (origin === "template" && count > 1) return `${total}ページ中${count}ページ。テンプレートの分岐か、ページ個別の設定`;
  if (count === 1) return `${total}ページ中1ページ。このURLだけ直す`;
  return `${total}ページ中${count}ページ。ページごとに直す`;
}

/** 同じ指摘を横断で束ねる。1件ごとに6項目（症状・対象の範囲・原因・直した後・検証指標と時期・優先度）をそろえる */
function bundle(pages: { url: string; result: AuditResult | null }[], host: string): Proposal[] {
  const checked = pages.filter((p) => p.result !== null);
  const total = checked.length;
  const byId = new Map<string, { finding: Finding; urls: string[] }>();

  for (const page of checked) {
    for (const f of page.result!.findings) {
      const hit = byId.get(f.id);
      if (hit) hit.urls.push(page.url);
      else byId.set(f.id, { finding: f, urls: [page.url] });
    }
  }

  return [...byId.values()].map(({ finding, urls }) => {
    const rule = RULES[finding.id] ?? DEFAULT_RULE;
    return {
      id: finding.id,
      stage: rule.stage,
      area: finding.area,
      severity: finding.severity,
      symptom: finding.title,
      detail: finding.detail,
      scope: { text: scopeText(rule.origin, urls.length, total, host), urls, count: urls.length },
      cause: rule.cause,
      after: finding.fix ?? "指摘された箇所を解消する。",
      afterCode: finding.fixCode,
      code: finding.code,
      metric: rule.metric,
      source: finding.source,
    };
  });
}

/** 1ページずつの検査では出せない指摘。複数ページを突き合わせて初めて分かるものだけをここで出す */
function crossPageProposals(input: SiteReportInput, host: string): Proposal[] {
  const out: Proposal[] = [];
  const checked = input.pages.filter((p) => p.result !== null) as { url: string; result: AuditResult; fromSource?: boolean }[];
  const total = checked.length;
  if (total === 0) return out;

  // 同じ title が複数ページに出ている
  const byTitle = new Map<string, string[]>();
  for (const p of checked) {
    const t = p.result.meta.title;
    if (!t) continue;
    byTitle.set(t, [...(byTitle.get(t) ?? []), p.url]);
  }
  const dupTitles = [...byTitle.entries()].filter(([, urls]) => urls.length > 1);
  if (dupTitles.length > 0) {
    const urls = dupTitles.flatMap(([, u]) => u);
    out.push({
      id: "site-title-duplicate",
      stage: 2,
      area: "seo",
      severity: "mid",
      symptom: "複数のページが同じ title を出している",
      detail: "検索結果でどのページも同じ見出しに見え、検索エンジン側でどれを代表にするかが決まらない。",
      scope: { text: scopeText("template", urls.length, total, host), urls, count: urls.length },
      cause: "テンプレートが固定文字列かサイト名だけを title に入れ、ページごとの値を差し込んでいない。",
      after: "title にそのページだけの語（商品名・地域・手続き名）を先頭に入れ、サイト名は接尾辞に回す。",
      afterCode: `<title>（そのページだけの語） | ${host}</title>`,
      metric: `同じ title のページが0件。Search Console の「重複したタイトル」も見る。修正後すぐ確認できる。`,
    });
  }

  // 同じ description が複数ページに出ている
  const byDesc = new Map<string, string[]>();
  for (const p of checked) {
    const d = p.result.meta.description;
    if (!d) continue;
    byDesc.set(d, [...(byDesc.get(d) ?? []), p.url]);
  }
  const dupDescs = [...byDesc.entries()].filter(([, urls]) => urls.length > 1);
  if (dupDescs.length > 0) {
    const urls = dupDescs.flatMap(([, u]) => u);
    out.push({
      id: "site-description-duplicate",
      stage: 2,
      area: "seo",
      severity: "low",
      symptom: "複数のページが同じ meta description を出している",
      detail: "スニペットが本文から自動生成に切り替わり、意図した要約が出せない。",
      scope: { text: scopeText("template", urls.length, total, host), urls, count: urls.length },
      cause: "テンプレートがサイト共通の紹介文を全ページに出している。",
      after: "description をページごとに90〜120字で書き分ける。書き分けられないページは出力しない（自動生成に任せる）。",
      metric: "同じ description のページが0件。修正後すぐ確認できる。",
    });
  }

  // canonical の指すホストが分かれている
  const canonicalHosts = [...new Set(checked.map((p) => (p.result.meta.canonical ? hostOf(p.result.meta.canonical) : null)).filter((h): h is string => !!h))];
  if (canonicalHosts.length > 1) {
    out.push({
      id: "site-canonical-host",
      stage: 1,
      area: "tech",
      severity: "high",
      symptom: `canonical の指すホストが${canonicalHosts.length}つに分かれている（${canonicalHosts.join(" / ")}）`,
      detail: "同じ内容が複数のホストで別々に評価され、リンクと評価がホストの数だけ分散する。",
      scope: { text: `ホスト全体（${canonicalHosts.join(" / ")}）。テンプレート1か所の設定で全ページに効く`, urls: checked.map((p) => p.url), count: checked.length },
      cause: "テンプレートが canonical のホスト名をリクエストのホストから組み立てているか、ホストごとに別のテンプレートを使っている。",
      after: "公開するホストを1つに決め、canonical は全ページでそのホストの絶対URLを出す。他のホストは301でそこへ寄せる。",
      afterCode: `<link rel="canonical" href="https://${canonicalHosts[0]}/（パス）">`,
      metric: "URL検査の「Googleが選択した正規URL」が全ページで同じホストになる。再クロール後。",
    });
  }

  // ファイル名付きのURL（/index.html）。ディレクトリURL側は取得していないので「両方が200で返る」とは断定しない
  // （取得本数を増やさないため）。canonical がディレクトリURLを指していれば一本化済みなので出さない。
  const indexPages = checked.filter((p) => {
    if (!isIndexFile(pathOf(p.result.finalUrl))) return false;
    const canonical = p.result.meta.canonical;
    return canonical === null || isIndexFile(pathOf(canonical));
  });
  if (indexPages.length > 0) {
    const urls = indexPages.map((p) => p.url);
    out.push({
      id: "site-index-html",
      stage: 1,
      area: "tech",
      severity: "mid",
      symptom: "ファイル名付きのURL（/index.html）が、そのページの正規URLになっている",
      detail:
        "多くのサーバーは、ディレクトリのURL（末尾スラッシュ）とファイル名付きのURLの両方を200で返す。両方が返るなら同じ内容が2つのURLに分かれる。この診断はディレクトリ側を取得していないので、まず両方を開いて同じ内容かを確かめる。",
      scope: { text: scopeText("server", urls.length, total, host), urls, count: urls.length },
      cause: "ファイル名付きのURLが内部リンクやサイトマップに残っている。ディレクトリと index ファイルの両方をサーバーが返す設定のことが多い。",
      after: "ディレクトリのURLを正と決め、canonical をそちらに向ける。ファイル名付きのURLは301で寄せ、内部リンクとサイトマップからも消す。",
      afterCode: "RewriteRule ^(.*)index\\.html$ /$1 [R=301,L]",
      metric: "ディレクトリURLとファイル名付きURLの両方を取得して、後者が301を返す（または canonical がディレクトリURLを指す）。修正後すぐ確認できる。",
    });
  }

  // 収集元に残っている旧URL（取得したらリダイレクトされた）。
  // 入力されたURLは収集元に載っていたとは限らないので、ここでは数えない（数えると「サイトマップに旧URLがある」が嘘になる）。
  const redirected = checked.filter((p) => p.fromSource && p.result.redirects.length > 0);
  if (redirected.length > 0) {
    const where = input.discovery === "sitemap" ? "サイトマップ" : "内部リンク";
    out.push({
      id: "site-legacy-url",
      stage: 1,
      area: "tech",
      severity: "mid",
      symptom: `${where}に、リダイレクトされるURLが残っている`,
      detail: "クローラーが毎回リダイレクトを1回余分にたどる。移転していないサイトでも、URLの整理のたびに溜まる。",
      scope: { text: `${where}（${redirected.length}本）`, urls: redirected.map((p) => p.url), count: redirected.length },
      cause: `${where}を生成する処理が、リダイレクト前のURLを出力している。`,
      after: `${where}には最終的なURLだけを載せる。リダイレクト自体は残したまま、参照側を直す。`,
      metric: `${where}のURLを取得して、すべて200が返る。修正後すぐ確認できる。`,
    });
  }

  // 一部のページだけ noindex
  const noindexPages = checked.filter((p) => p.result.meta.noindex);
  if (noindexPages.length > 0 && noindexPages.length < total) {
    out.push({
      id: "site-noindex-mixed",
      stage: 1,
      area: "tech",
      severity: "high",
      symptom: "一部のページだけ noindex が付いている",
      detail: "そのページは検索にもAI検索にも出ない。テンプレートの分岐で意図せず付いていることがある。",
      scope: { text: scopeText("template", noindexPages.length, total, host), urls: noindexPages.map((p) => p.url), count: noindexPages.length },
      cause: "テンプレートの条件分岐、または検証環境の設定が本番に残っている。",
      after: "検索に載せたいページから noindex を外す。意図的な除外なら、その一覧を運用側で持つ。",
      metric: "対象ページのURL検査が「インデックス登録可能」。再クロール後。",
    });
  }

  // 同じ登録ドメインの別ホストへリンクしている
  if (input.relatedHosts.length > 0) {
    out.push({
      id: "site-hosts",
      stage: 3,
      area: "geo",
      severity: "low",
      symptom: `同じサイトの実体が${input.relatedHosts.length + 1}つのホストに分かれている（${[host, ...input.relatedHosts].join(" / ")}）`,
      detail: "AI検索は回答に載せる候補を、ページを読むより前にエンティティ単位で決める。ホストが分かれたままだと、同じ運営者の情報として束ねられない。",
      scope: { text: `ホスト全体（${[host, ...input.relatedHosts].join(" / ")}）`, urls: [], count: input.relatedHosts.length + 1 },
      cause: "サービスや事業部ごとにホストを分けて運用し、運営者の宣言をホストごとに閉じている。",
      after: "各ホストの Organization に同じ @id と sameAs を書き、代表ホストを1つ決めて相互に内部リンクする。",
      afterCode: `{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "@id": "https://${host}/#organization",\n  "url": "https://${host}/",\n  "sameAs": [${input.relatedHosts.map((h) => `"https://${h}/"`).join(", ")}]\n}`,
      metric: "AI検索で社名を尋ねたときに、各ホストの情報が同じ運営者のものとして扱われる。3か月。",
    });
  }

  return out;
}

/**
 * ディレクトリ構造からの提案。**URLの並びだけ**から言えることに限る
 * （どのページがどこからリンクされているかは数えていないので、孤立ページやクリック深度は出さない）。
 * 3段目に置く。他の修正の前提ではなく、下の2段が済んでから効くため。
 */
function structureProposals(structure: SiteStructure, host: string): Proposal[] {
  const out: Proposal[] = [];
  const { total, deep, redundant, overlapping } = structure;

  // 深い枝。少数なら形の問題ではないので、本数と割合の両方で見る
  if (deep.count >= 5 && deep.count / total >= 0.2) {
    out.push({
      id: "site-deep-path",
      stage: 3,
      area: "seo",
      severity: "low",
      symptom: `トップから${DEEP_DEPTH}階層以上のURLが${deep.count}本ある（数えた${total}本のうち${Math.round((deep.count / total) * 100)}%）`,
      detail:
        "階層が深いほど、そこへ届く内部リンクは薄くなりやすい。深さそのものが順位を決めるわけではないが、深い枝ほど「どこからも案内されていないページ」が生まれやすい。",
      scope: { text: `ホスト全体（${host}）。サイトマップで数えた${total}本のURL`, urls: deep.examples, count: deep.count },
      cause: "カテゴリを入れ子にしている、日付や連番をパスに入れている、といったURLの設計。",
      after: "同じテーマのページを1枚の一覧（ハブ）に束ね、そこから2クリックで届く形にする。パスを浅くするなら、旧URLは301で新URLへ寄せる。",
      metric: `${DEEP_DEPTH}階層以上のURLの本数と、そこへの内部リンクの本数。3か月。`,
    });
  }

  // 分類として働いていない中間ディレクトリ
  if (redundant.length > 0) {
    const first = redundant[0];
    out.push({
      id: "site-redundant-dir",
      stage: 3,
      area: "seo",
      severity: "mid",
      symptom: `中間ディレクトリの下に1種類しかぶら下がっていない（${first.path}/ の下は ${first.only}/ だけ）`,
      detail: "その階層はURLを1つ長くしているだけで、分類として働いていない。読者にもクローラーにも区別を伝えていない。",
      scope: {
        text: `${redundant.length}か所のディレクトリ`,
        urls: redundant.map((r) => `${r.path}/${r.only}/ … 配下 ${r.urls} 本`),
        count: redundant.length,
      },
      cause: "将来の拡張を見込んで階層を先に作ったまま、増えていない。日付や年をパスに挟んでいる場合もここに出る。",
      after:
        "中間ディレクトリを外して1階層浅くする。URLを変えるなら旧URLは301で寄せ、内部リンクとサイトマップも同じ変更で直す。変えない判断でもよいが、その場合は他の階層と粒度を揃える。",
      metric: "そのディレクトリ配下のURLが1階層浅くなり、旧URLがすべて301を返す。修正後すぐ確認できる。",
    });
  }

  // 役割が重なりそうな第1階層。中身までは見ていないので断定しない
  if (overlapping.length > 0) {
    const pairs = overlapping.map((g) => g.map((name) => `/${name}/`).join(" と ")).join("、");
    out.push({
      id: "site-overlapping-section",
      stage: 3,
      area: "seo",
      severity: "low",
      symptom: `同じ役割に見える第1階層が並んでいる（${pairs}）`,
      detail:
        "同じテーマのページが2か所に分かれると、内部リンクも評価も分散する。読者にもどちらを見ればよいか伝わらない。ただしこの診断はURLの語だけを見ているので、中身が別物のこともある。",
      scope: { text: `ホスト全体（${host}）`, urls: overlapping.flat().map((name) => `/${name}/`), count: overlapping.flat().length },
      cause: "運用の途中でディレクトリを足し、古いほうを残している。CMSの既定のパスと自分で決めたパスが併存していることもある。",
      after:
        "中身を確かめて、同じ役割なら片方に寄せる（旧URLは301）。役割が違うなら、それぞれの一覧ページの冒頭で違いを1文で書き分ける。",
      metric: "同じテーマのページが1つの階層に集まっている。寄せた側の旧URLがすべて301を返す。3か月。",
    });
  }

  return out;
}

/**
 * リンク構造からの提案。**クロールした範囲でしか言えない**ので、
 * 上限で打ち切ったとき（truncated）は「候補」と書き、断定しない。
 */
function linkGraphProposals(graph: LinkGraph): Proposal[] {
  const out: Proposal[] = [];
  const range = graph.truncated
    ? `入口から${graph.crawled}ページまで辿った範囲（上限で打ち切り）`
    : `入口から辿れた${graph.crawled}ページすべて`;

  // 行き止まり。クローラーにも読者にも実害があるので1段目
  if (graph.broken.length > 0) {
    out.push({
      id: "site-broken-link",
      stage: 1,
      area: "tech",
      severity: "high",
      symptom: `内部リンクの先が${graph.broken.length}本、200以外を返している`,
      detail: "読者はそこで行き止まりになり、クローラーはリンクをたどるたびに無駄なリクエストを1回する。",
      scope: {
        text: `${range}で見つかったもの`,
        urls: graph.broken.map((b) => `${b.url}（${b.status}）${b.from[0] ? ` ← ${b.from[0]}` : ""}`),
        count: graph.broken.length,
      },
      cause: "リンク先を消したか、URLを変えたあとに参照側を直していない。",
      after: "リンク先が生きているなら正しいURLに直す。消したページなら、リンク自体を消すか、後継ページへ301で寄せる。",
      metric: "同じURLを取得して200が返る（またはリンクが残っていない）。修正後すぐ確認できる。",
    });
  }

  // どこからもリンクされていないページ
  if (graph.orphanCandidates.length > 0) {
    out.push({
      id: "site-orphan",
      stage: 3,
      area: "seo",
      severity: "mid",
      symptom: graph.truncated
        ? `サイトマップにあるが、辿った範囲ではどこからもリンクされていないURLが${graph.orphanCandidates.length}本ある`
        : `どこからもリンクされていないページが${graph.orphanCandidates.length}本ある`,
      detail: graph.truncated
        ? "クロールを上限で打ち切っているので、辿らなかったページからリンクされている可能性が残る。まず実際にリンク元があるかを確かめる。"
        : "サイトマップに載っているだけで、サイトの中から案内されていない。読者が辿り着けず、リンクによる評価も渡らない。",
      scope: { text: `${range}での突き合わせ`, urls: graph.orphanCandidates, count: graph.orphanCandidates.length },
      cause: "一覧やハブページに載せないままページを増やした。または、一覧の表示件数から溢れて載らなくなった。",
      after: "同じテーマの一覧ページから案内する。載せる場所が無いページは、内容を既存のページに統合するか、公開をやめる。",
      metric: "そのURLへの内部リンクが1本以上ある。修正後すぐ確認できる（評価への反映は3か月）。",
    });
  }

  // ナビ・フッターからしか案内されていない
  if (graph.navOnly.length > 0) {
    out.push({
      id: "site-nav-only",
      stage: 3,
      area: "seo",
      severity: "low",
      symptom: `本文から1本も案内されていないページが${graph.navOnly.length}本ある（ナビ・フッターからのリンクだけ）`,
      detail:
        "全ページに同じ形で出るナビとフッターのリンクは、どのページからも等しく張られる。本文からのリンクが無いページは、内容の関係で選ばれた導線を持っていない。",
      scope: { text: `${range}`, urls: graph.navOnly, count: graph.navOnly.length },
      cause: "関連ページへの導線を、テンプレートのナビだけに任せている。",
      after: "関係する記事の本文から、そのページの内容を指す文言でリンクする。",
      metric: "本文中の内部リンクからの流入。3か月。",
    });
  }

  // 被リンクが薄いページ
  if (graph.weak.length > 0) {
    out.push({
      id: "site-weak-inbound",
      stage: 3,
      area: "seo",
      severity: "low",
      symptom: `サイト内から${WEAK_INBOUND}本以下しかリンクされていないページが${graph.weak.length}本ある`,
      detail: "内部リンクが少ないページは、クローラーが再訪する手がかりも、読者が辿り着く道も細い。",
      scope: { text: `${range}`, urls: graph.weak.map((w) => `${w.url}（被リンク ${w.inbound}）`), count: graph.weak.length },
      cause: "そのページを案内する一覧や関連リンクが無い。",
      after: "同じテーマの一覧（ハブ）と、関係する記事の本文の2か所以上から案内する。",
      metric: "そのページへの内部リンクの本数。3か月。",
    });
  }

  return out;
}

export function siteReport(input: SiteReportInput): SiteReportResult {
  const host = hostOf(input.entryUrl);
  // 構造はサイトマップから十分な本数が取れたときだけ数える（内部リンク由来の数十本では形が出ない）
  const structure =
    input.discovery === "sitemap" && input.sourceUrls.length >= MIN_URLS ? analyzeStructure(input.sourceUrls) : null;
  const proposals = [
    ...bundle(input.pages, host),
    ...crossPageProposals(input, host),
    ...(structure ? structureProposals(structure, host) : []),
    ...(input.linkGraph ? linkGraphProposals(input.linkGraph) : []),
  ].sort(
    (a, b) => a.stage - b.stage || SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.scope.count - a.scope.count,
  );

  const counts: Record<Stage, number> = { 1: 0, 2: 0, 3: 0 };
  for (const p of proposals) counts[p.stage]++;

  const pages: PageResult[] = input.pages.map((p) => ({
    url: p.url,
    finalUrl: p.result?.finalUrl ?? p.url,
    status: p.result?.status ?? p.status ?? 0,
    redirected: (p.result?.redirects.length ?? 0) > 0,
    findings: p.result?.findings.length ?? 0,
    error: p.error,
  }));

  return {
    entryUrl: input.entryUrl,
    host,
    relatedHosts: input.relatedHosts,
    discovery: input.discovery,
    foundUrls: input.foundUrls,
    checkedAt: input.checkedAt,
    pages,
    proposals,
    counts,
    sitemap: input.sitemap,
    robotsOk: input.robotsOk,
    structure,
    linkGraph: input.linkGraph,
  };
}

/** RULES の網羅をテストから確認するために公開する（本番の経路からは使わない） */
export const RULE_IDS = Object.keys(RULES);
export const CHECKLIST_FINDING_IDS = CHECKLIST.flatMap((c) => c.findingIds);
