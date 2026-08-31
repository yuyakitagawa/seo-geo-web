import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import PageHeader from "@/components/PageHeader";
import { faqPageJsonLd, type FaqItem } from "@/lib/faq";
import { HAS_CONTACT, SITE_NAME, SITE_URL, X_HANDLE, X_PROFILE_URL } from "@/lib/site";
import { FEED_SOURCES } from "../../../scripts/sources";
import { PROSE } from "@/lib/ui";

export const metadata: Metadata = {
  title: "運営者情報",
  description: `${SITE_NAME}の運営方針と、収集元にしている一次情報源の一覧。`,
  alternates: { canonical: "/about" },
};

// 収集元の開示。RSSのURLではなく人が読めるトップページを出す。
// Google News検索の枠（topic: "tools"）は媒体ではないので出さない。
const FEEDS = FEED_SOURCES.filter((s) => s.home && !s.topic);

// FAQ。可視テキストとFAQPage JSON-LDを同じ配列から出すので不一致が起きない。
// 回答は質問文を読まなくても意味が通る形にする（AI検索は回答だけを抜き出す）。
const FAQ: FaqItem[] = [
  {
    question: "GEO（生成AI検索最適化）とは何ですか",
    answer:
      "GEOはGenerative Engine Optimizationの略で、ChatGPT・Perplexity・Google AI Overview/AI Modeなどの生成AIの回答に、自社の情報が引用・言及されるようにする取り組みです。順位を上げる従来のSEOと違い、AIが回答を組み立てるときの参照元に選ばれることを目標にします。",
  },
  {
    question: "AIOやLLMOはGEOと違うものですか",
    answer:
      "AIO（AI Optimization）とLLMO（Large Language Model Optimization）は、生成AI検索で引用されるための取り組みを指す別の呼び名です。実務上の中身はほぼ同じなので、当サイトでは用語をGEOに統一して表記します。",
  },
  {
    question: "SEOの施策はGEOでも通用しますか",
    answer:
      "クロールとインデックスの土台、構造化データ、一次情報の明示といった技術的な基盤は共通で、そのまま効きます。一方で、質問にそのまま答える短い段落を置く、数値を定義リストで構造化するといった「抜き出されやすい書き方」はGEO特有の追加作業になります。",
  },
  {
    question: "記事は毎日更新されますか",
    answer:
      "毎朝7時（日本時間）に自動生成のバッチが動きます。その日に基準を満たす話題が無かった場合や、自動検査で落ちた場合は公開されないため、更新が無い日もあります。",
  },
  {
    question: "記事は誰が書いていますか。AIが生成しているのですか",
    answer:
      "記事の下書きは、公式発表や業界メディアの一次情報をAIに読ませて作成し、公開前に自動検査を通しています。検査では、出典URLの記載、一次情報に無い数値や固有名詞が入っていないこと、記事の構成が基準を満たすことを確認し、外れた原稿は公開せず破棄します。公開後に誤りのご指摘を受けた記事は、一次情報と突き合わせて確認し、訂正または削除します。",
  },
  {
    question: "記事の誤りを見つけたときはどうすればよいですか",
    answer:
      "お問い合わせの窓口からご指摘ください。内容を一次情報と突き合わせて確認し、誤りがあった場合は該当箇所を訂正するか、記事を削除します。訂正した記事には更新日を表示します。",
  },
  {
    question: "記事の内容を引用できますか",
    answer:
      "出典として当サイトのURLを明記すれば、引用は自由です。記事内の数値や仕様は各社の公式ドキュメントを一次情報としているため、重要な判断の前には記事末尾に記載した一次情報のリンク先で最新の内容を確認してください。",
  },
];

// E-E-A-T（経験・専門性・権威性・信頼性）のシグナルとして、収集元の一次情報源とFAQを明記する。
// 運営者個人の経歴は載せない方針。業務委託・相談窓口も意図的に置いていない（PVが十分に伸びた段階で検討する方針）。
export default function AboutPage() {
  return (
    <>
      <JsonLd data={faqPageJsonLd(`${SITE_URL}/about`, FAQ)} />
      <PageHeader eyebrow="About" title="運営者情報" crumbs={[{ name: "運営者情報" }]} />
      <div className={PROSE.page}>
      <h2>このサイトについて</h2>
      <p>
        {SITE_NAME}は、Google検索とAI検索（ChatGPT Search・Perplexity・Gemini・Google AI Overview/AI Mode）の
        最新アップデートを追い、SEOとGEO（Generative Engine Optimization、生成AI検索最適化）の実務ノウハウとして
        解説するメディアです。本サイトでは「AIO」「LLMO」と呼ばれる領域もまとめてGEOと表記します。
      </p>

      <h2>収集元にしている情報源</h2>
      <p>次の媒体を毎日巡回しています。記事の一次情報として優先するのは公式発表です。</p>
      <ul>
        {FEEDS.map((s) => (
          <li key={s.name}>
            <a href={s.home} target="_blank" rel="noopener">{s.name}</a>
            {s.kind === "official" ? "（公式）" : "（業界メディア）"}
          </li>
        ))}
      </ul>

      <h2>記事の作り方と編集方針</h2>
      <p>
        当サイトは、次の手順で毎日の記事を作っています。読んだ方が内容をどこまで信頼してよいか判断できるよう、
        手順をすべて公開します。
      </p>
      <ol>
        <li>上記の情報源を毎朝巡回し、SEO・GEOの実務に影響する話題を候補として集めます。</li>
        <li>候補のうち、公式発表または複数の媒体が扱った話題だけを記事化の対象にします。</li>
        <li>一次情報の本文をAIに読ませて下書きを作ります。一次情報に書かれていない数値・固有名詞は書きません。</li>
        <li>
          公開前に自動検査を通します。出典URLの記載、見出し構成、実務上の打ち手が書かれているかを確認し、
          基準を満たさない原稿は公開せず破棄します。
        </li>
        <li>公開後に誤りや古くなった記述が見つかった場合は、本文を訂正して更新日を表示するか、記事を取り下げます。</li>
      </ol>
      <p>
        記事はすべて出典を明記しています。他社の記事や公式ドキュメントの文章をそのまま転載することはせず、
        要点を当サイトの言葉で整理したうえで、一次情報へのリンクを記事末尾に置いています。
        当サイトの運営者は検索エンジンやAI検索サービスの関係者ではなく、記事の内容について各社から
        対価を受け取っていません。
      </p>

      <h2>よくある質問</h2>
      {FAQ.map((f) => (
        <div key={f.question}>
          <h3>{f.question}</h3>
          <p>{f.answer}</p>
        </div>
      ))}

      <h2>運営者と連絡先</h2>
      <p>
        当サイトは、検索とAI検索のアップデートを追う目的で個人が運営しています。実名は公開していませんが、
        記事の誤りのご指摘や権利関係のご連絡には問い合わせ窓口で対応します。
      </p>
      {HAS_CONTACT ? (
        <p>
          お問い合わせは<a href="/contact">お問い合わせページ</a>に記載の窓口
          {X_PROFILE_URL ? <>、または公式Xアカウント（<a href={X_PROFILE_URL} rel="me noopener" target="_blank">{X_HANDLE}</a>）</> : null}
          からお願いします。
        </p>
      ) : null}

      <h2>広告について</h2>
      <p>
        当サイトは第三者配信の広告（Google AdSense）を掲載する場合があります。広告の表示によって記事の内容が
        左右されることはありません。広告配信とCookieの扱いは<a href="/privacy">プライバシーポリシー</a>を、
        記事内容の免責と著作権の扱いは<a href="/disclaimer">免責事項</a>をご覧ください。
      </p>
      </div>
    </>
  );
}
