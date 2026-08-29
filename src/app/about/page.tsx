import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import PageHeader from "@/components/PageHeader";
import { faqPageJsonLd, type FaqItem } from "@/lib/faq";
import { SITE_NAME, SITE_URL, X_HANDLE, X_PROFILE_URL } from "@/lib/site";
import { FEED_SOURCES } from "../../../scripts/sources";

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
      <div className="prose prose-neutral mx-auto max-w-3xl px-5 py-14 dark:prose-invert sm:py-20">
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

      <h2>よくある質問</h2>
      {FAQ.map((f) => (
        <div key={f.question}>
          <h3>{f.question}</h3>
          <p>{f.answer}</p>
        </div>
      ))}

      <h2>連絡先</h2>
      <p>
        記事の誤りのご指摘・ご意見は、公式Xアカウント
        {X_PROFILE_URL ? <>（<a href={X_PROFILE_URL} rel="me noopener" target="_blank">{X_HANDLE}</a>）</> : "（準備中）"}
        へのリプライまたはDMでお寄せください。実名・メールアドレスは公開していません。
      </p>

      <h2>広告について</h2>
      <p>当サイトはGoogle AdSenseによる広告を掲載しています。詳細は<a href="/privacy">プライバシーポリシー</a>をご覧ください。</p>
      </div>
    </>
  );
}
