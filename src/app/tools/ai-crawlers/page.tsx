import type { Metadata } from "next";
import AiCrawlerChecker from "@/components/AiCrawlerChecker";
import JsonLd from "@/components/JsonLd";
import PageHeader from "@/components/PageHeader";
import { CRAWLERS } from "@/lib/crawlers";
import { faqPageJsonLd, type FaqItem } from "@/lib/faq";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { CONTAINER, HEADING, LINK, PADDING, SURFACE, cx } from "@/lib/ui";

const PATH = "/tools/ai-crawlers";
const url = `${SITE_URL}${PATH}`;
const TITLE = "AI検索クローラー robots.txt チェッカー";
const DESCRIPTION =
  "robots.txt を貼るだけで、GPTBot・OAI-SearchBot・PerplexityBot・ClaudeBot・Google-Extended など14種のAI検索/AI学習クローラーを許可しているかを判定します。ブラウザ内で完結し、入力は送信しません。無料・登録不要。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
};

// 一次情報（各社の公式ドキュメント）。記事と同じく、根拠はページ内に出す。
const SOURCES = [...new Map(CRAWLERS.map((c) => [c.source.url, c.source])).values()];

const FAQ: FaqItem[] = [
  {
    question: "robots.txt でAIのクローラーをブロックすると、Google検索の順位は下がりますか",
    answer:
      "GPTBot や ClaudeBot などAI学習用クローラーのブロックは、Google検索の掲載や順位には影響しません。Google-Extended も、Geminiアプリなどの学習・グラウンディングを制御するトークンで、Google検索への掲載には影響しないと公式に明記されています。",
  },
  {
    question: "Google-Extended をブロックすればAI Overviewに出なくなりますか",
    answer:
      "なりません。AI Overview と AI Mode は Google 検索の一部で、制御は Googlebot 向けの robots.txt と nosnippet などのプレビュー制御です。Google-Extended は Gemini アプリと Vertex AI 向けの学習・グラウンディングだけを制御します。",
  },
  {
    question: "GPTBot をブロックするとChatGPTの回答に出なくなりますか",
    answer:
      "GPTBot は学習用のクローラーで、ChatGPTの検索結果への表示は OAI-SearchBot が担当します。OpenAI は2つの設定が独立していると説明しているため、GPTBot だけをブロックしても検索結果には表示され得ます。",
  },
  {
    question: "このツールに入力した robots.txt はどこかに送信されますか",
    answer:
      "送信されません。判定はすべて閲覧しているブラウザの中で実行され、サーバーには何も保存されません。URLを入力して自動取得する形式にしていないのも同じ理由です。",
  },
];

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": `${url}#app`,
  name: TITLE,
  url,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  browserRequirements: "JavaScriptが有効なブラウザ",
  description: DESCRIPTION,
  offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
  isAccessibleForFree: true,
  publisher: { "@id": `${SITE_URL}/#organization` },
  citation: SOURCES.map((s) => ({ "@type": "CreativeWork", name: s.title, url: s.url })),
};

export default function AiCrawlersToolPage() {
  return (
    <>
      <JsonLd data={softwareJsonLd} />
      <JsonLd data={faqPageJsonLd(url, FAQ)} />
      <PageHeader
        eyebrow="Tool · 無料・登録不要"
        title={TITLE}
        lead="robots.txt を貼ると、AI検索に引用されるためのクローラーと、AIの学習に使われるクローラーを分けて判定します。"
        crumbs={[{ name: "ツール", href: "/tools" }, { name: TITLE }]}
      />

      <div className={cx(CONTAINER.wide, "space-y-14 py-14 sm:py-20")}>
        {/* 直答段落。AI検索と強調スニペットはここを抜き出す */}
        <p className="leading-relaxed text-mute">
          AI検索のクローラーは「回答に引用するために読むもの」と「モデルの学習に使うために読むもの」に分かれ、robots.txt では別々に指定します。
          このツールは{CRAWLERS.length}種のクローラーについて、貼り付けた robots.txt がどちらを許可しているかを1画面で判定します。
          判定はブラウザ内で完結し、入力は送信されません。
        </p>

        <AiCrawlerChecker />

        <section className="space-y-4">
          <h2 className={HEADING.section}>判定でよく誤解される3点</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                t: "学習の拒否とAI検索の拒否は別",
                d: "GPTBot（学習）を止めても OAI-SearchBot（検索）を許可していれば、ChatGPTの検索結果には出ます。両者は独立した設定です。",
              },
              {
                t: "Google-Extended では AI Overview は止まらない",
                d: "AI Overview・AI Mode は検索の一部で、制御は Googlebot と nosnippet 系です。Google-Extended は Gemini アプリなどの学習・グラウンディング用です。",
              },
              {
                t: "ユーザー起点のアクセスは別扱い",
                d: "ChatGPT-User や Perplexity-User はユーザーの操作で動くため、robots.txt が適用されない場合があると各社が明記しています。",
              },
            ].map((x) => (
              <div key={x.t} className={cx(SURFACE.outline, PADDING.tight)}>
                <p className="font-bold leading-snug">{x.t}</p>
                <p className="mt-2 text-sm leading-relaxed text-mute">{x.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className={HEADING.section}>よくある質問</h2>
          <dl className="space-y-5">
            {FAQ.map((f) => (
              <div key={f.question} className={cx(SURFACE.outline, PADDING.tight)}>
                <dt className="font-bold leading-snug">{f.question}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-mute">{f.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className={HEADING.section}>出典</h2>
          <p className="mt-1 text-sm text-mute">
            クローラー名と用途は、各社の公式ドキュメントで確認しています（確認日 {CRAWLERS[0].verified}）。
            仕様は変わるため、設定前に各ページを確認してください。
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {SOURCES.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener" className={LINK}>
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-xs text-mute">
          {SITE_NAME}は判定結果の正確性を保証しません。robots.txt の解釈はクローラーごとに異なる場合があります。
        </p>
      </div>
    </>
  );
}
