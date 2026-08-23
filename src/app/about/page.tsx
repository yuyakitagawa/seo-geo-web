import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "運営者情報",
  description: `${SITE_NAME}の運営方針、記事の作り方、運営者の経歴について。`,
  alternates: { canonical: "/about" },
};

// E-E-A-T（経験・専門性・権威性・信頼性）のシグナルとして、運営者の実務経験と記事制作プロセスを明記する。
// 業務委託・相談窓口は意図的に置いていない（PVが十分に伸びた段階で検討する方針）。
export default function AboutPage() {
  return (
    <div className="prose prose-neutral mx-auto max-w-3xl px-5 py-16 dark:prose-invert sm:py-24">
      <h1>運営者情報</h1>

      <h2>このサイトについて</h2>
      <p>
        {SITE_NAME}は、Google検索とAI検索（ChatGPT Search・Perplexity・Gemini・Google AI Overview/AI Mode）の
        最新アップデートを追い、SEO・GEO（生成エンジン最適化）・AIO（AI Overview最適化）の実務ノウハウとして
        解説するメディアです。
      </p>

      <h2>運営者</h2>
      <p>
        検索プロダクト（Yahoo!検索）および大規模予約サービス（ホットペッパービューティー）でプロダクトマネージャーを
        務めた経験をもとに、「検索側の設計思想」と「サイト運営側の施策」の両面から解説します。
        また、EDINET大量保有報告書を集計するメディア
        <a href="https://kujira-watch.com/" target="_blank" rel="noopener">大口投資家の監視ブログ（kujira-watch.com）</a>
        を運営しており、SEO/AIO施策を自サイトで検証した結果も記事に反映しています。
      </p>

      <h2>記事の作り方</h2>
      <ol>
        <li>Google Search Central・各AI検索事業者の公式発表、主要な業界メディアを一次情報として毎日収集します。</li>
        <li>収集した情報をもとにAI（Claude）で下書きを生成します。</li>
        <li>運営者が内容を確認・加筆し、一次情報へのリンクを明記したうえで公開します。</li>
        <li>公式の仕様変更や誤りが判明した場合は記事を更新し、更新日を表示します。</li>
      </ol>
      <p>AIを下書きに使う旨は透明性のためここに明記しています。公開前に人間が確認していない記事は掲載しません。</p>

      <h2>広告について</h2>
      <p>当サイトはGoogle AdSenseによる広告を掲載しています。詳細は<a href="/privacy">プライバシーポリシー</a>をご覧ください。</p>
    </div>
  );
}
