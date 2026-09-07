// /about（運営者情報）が出す固有の中身。ページ本文・sitemapのlastmod・整合性テストが同じ定義を見る。
//
// このページは「クロール済み - インデックス未登録」になっていた（2026-09-07 Search Console）。
// 技術面（canonical・robots・sitemap・構造化データ）は揃っていたので、原因は中身の側にある:
//   1. FAQの前半3問（GEOとは / AIO・LLMOとの違い / SEOとの関係）が /geo の FAQ とほぼ同じ回答だった。
//      同じサイト内で同じ問いに二重に答えるページは、専用ページの劣化コピーにしか見えない。
//   2. 残りが「方針の文章」だけで、このページにしか無い事実（何を何本、いつから、どこから集めたか）が
//      1つも無かった。
// そこで定義の説明は /geo /seo /glossary に寄せ、ここは**このサイトの実態**だけを書く。
// 数字は content から数える（手で書くと必ず古くなり、書いてあることが嘘になる）。
import { APP_TOOLS } from "./apps";
import { getAllArticles, getArticlesByType, earliestPublished, latestPublished } from "./content";
import type { FaqItem } from "./faq";
import { POLICY_UPDATED } from "./site";
import { FEED_SOURCES } from "../../scripts/sources";

/** 収集元の開示。RSSのURLではなく人が読めるトップページを出す。
 *  Google News検索の枠（topic: "tools"）は媒体ではないので出さない。 */
export const ABOUT_FEEDS = FEED_SOURCES.filter((s) => s.home && !s.topic);

export type AboutFacts = {
  articles: number;
  news: number;
  howto: number;
  original: number;
  feeds: number;
  official: number;
  tools: number;
  /** 最初の記事の公開日 */
  since?: string;
  /** 最新記事の公開日 */
  latest?: string;
  /** このページが反映しているデータの最終日（記事の最新公開日と方針の改定日の新しい方） */
  updated: string;
};

export function aboutFacts(): AboutFacts {
  const all = getAllArticles();
  const latest = latestPublished(all);
  return {
    articles: all.length,
    news: getArticlesByType("news").length,
    howto: getArticlesByType("howto").length,
    original: all.filter((a) => a.original).length,
    feeds: ABOUT_FEEDS.length,
    official: ABOUT_FEEDS.filter((s) => s.kind === "official").length,
    tools: APP_TOOLS.length,
    since: earliestPublished(all),
    latest,
    updated: [POLICY_UPDATED, latest ?? POLICY_UPDATED].sort().at(-1)!,
  };
}

// FAQ。可視テキストとFAQPage JSON-LDを同じ配列から出すので不一致が起きない。
// 回答は質問文を読まなくても意味が通る形にする（AI検索は回答だけを抜き出す）。
//
// **用語の定義を聞く質問はここに置かない。** GEO・AIO・LLMO・SEOの定義は /geo /seo /glossary が担当し、
// このページは運営の実態（誰が・どうやって・どの情報源で・どう直すか）だけに答える。
// 重複は src/lib/about.test.ts が落とす。
export const ABOUT_FAQ: FaqItem[] = [
  {
    question: "SEO GEO Lab は誰が運営していますか",
    answer:
      "ネット企業でプロダクトマネージャーとしてサービス運営に関わってきた個人が、1人で運営しています。実名と所属は公開していませんが、記事の誤りの指摘や権利関係の連絡には公式X（@seogeolab）とお問い合わせ窓口で対応します。検索エンジンやAI検索サービスの関係者ではなく、記事で取り上げる企業から対価は受け取っていません。",
  },
  {
    question: "記事は誰が書いていますか。AIが生成しているのですか",
    answer:
      "記事の下書きは、公式発表や業界メディアの一次情報をAIに読ませて作成し、公開前に自動検査を通しています。検査では、出典URLの記載、一次情報に無い数値や固有名詞が入っていないこと、記事の構成が基準を満たすことを確認し、外れた原稿は公開せず破棄します。公開後に誤りの指摘を受けた記事は、一次情報と突き合わせて確認し、訂正または削除します。",
  },
  {
    question: "記事は毎日更新されますか",
    answer:
      "毎朝7時（日本時間）に自動生成のバッチが動きます。その日に基準を満たす話題が無かった場合や、自動検査で落ちた場合は公開されないため、更新が無い日もあります。",
  },
  {
    question: "「独自」と表示されている記事は何が違いますか",
    answer:
      "独自記事は、運営者が自分で取ったログ・計測値・検証の結果を中心に書いた記事です。取得した期間・対象・除外したものといった取得条件を必ず添え、観測した事実と解釈を段落で分けています。それ以外の記事は、公式発表や業界メディアの一次情報を読んで要点を整理した要約記事で、出典を記事末尾に置いています。",
  },
  {
    question: "情報源は何を見ていますか",
    answer:
      "検索エンジンとAI各社の公式ブログ・公式ドキュメント・ステータスページを最優先で巡回し、業界メディアは速報の補完として扱います。巡回している媒体はSEO GEO Labの運営者情報ページに全件を一覧で公開しています。記事の数値や仕様は各社の公式ドキュメントを一次情報とし、記事末尾にリンクを置いています。",
  },
  {
    question: "記事の誤りを見つけたときはどうすればよいですか",
    answer:
      "お問い合わせの窓口か公式X（@seogeolab）からご指摘ください。内容を一次情報と突き合わせて確認し、誤りがあった場合は該当箇所を訂正するか、記事を削除します。訂正した記事には更新日を表示します。",
  },
  {
    question: "記事の内容を引用できますか",
    answer:
      "出典として当サイトのURLを明記すれば、引用は自由です。記事内の数値や仕様は各社の公式ドキュメントを一次情報としているため、重要な判断の前には記事末尾に記載した一次情報のリンク先で最新の内容を確認してください。",
  },
  {
    question: "サイトの運営費用はどうまかなっていますか。記事広告はありますか",
    answer:
      "収益源はGoogle AdSenseによる広告表示だけです。記事広告（対価を受け取って特定の製品を取り上げる記事）は掲載しておらず、ツールや製品を取り上げる基準は公式ドキュメントで内容を確認できるかどうかだけです。診断ツールも無料で、利用に会員登録は必要ありません。",
  },
];
