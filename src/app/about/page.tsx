import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { SITE_NAME, X_HANDLE, X_PROFILE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "運営者情報",
  description: `${SITE_NAME}の運営方針、記事の作り方、運営者の経歴について。`,
  alternates: { canonical: "/about" },
};

// E-E-A-T（経験・専門性・権威性・信頼性）のシグナルとして、運営者の実務経験と記事制作プロセスを明記する。
// 業務委託・相談窓口は意図的に置いていない（PVが十分に伸びた段階で検討する方針）。
export default function AboutPage() {
  return (
    <>
      <PageHeader eyebrow="About" title="運営者情報" art={{ seed: 5, category: "news" }} />
      <div className="prose prose-neutral mx-auto max-w-3xl px-5 py-14 dark:prose-invert sm:py-20">
      <h2>このサイトについて</h2>
      <p>
        {SITE_NAME}は、Google検索とAI検索（ChatGPT Search・Perplexity・Gemini・Google AI Overview/AI Mode）の
        最新アップデートを追い、SEOとGEO（Generative Engine Optimization、生成AI検索最適化）の実務ノウハウとして
        解説するメディアです。本サイトでは「AIO」「LLMO」と呼ばれる領域もまとめてGEOと表記します。
      </p>

      <h2>運営者</h2>
      <p>
        国内大手の検索サービスおよび大規模予約サービスでプロダクトマネージャーを
        務めた経験をもとに、「検索側の設計思想」と「サイト運営側の施策」の両面から解説します。
      </p>

      <h2>記事の作り方</h2>
      <ol>
        <li>Google Search Central・各AI検索事業者の公式発表、主要な業界メディアを一次情報として毎日収集します。</li>
        <li>収集した情報をもとにAI（Claude）で下書きを生成します。</li>
        <li>運営者が内容を確認・加筆し、一次情報へのリンクを明記したうえで公開します。</li>
        <li>公式の仕様変更や誤りが判明した場合は記事を更新し、更新日を表示します。</li>
      </ol>
      <p>AIを下書きに使う旨は透明性のためここに明記しています。公開前に人間が確認していない記事は掲載しません。</p>

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
