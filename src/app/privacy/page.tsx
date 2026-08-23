import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: `${SITE_NAME}のプライバシーポリシー（アクセス解析・広告配信・Cookieの取り扱い）。`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="prose prose-neutral max-w-none dark:prose-invert">
      <h1>プライバシーポリシー</h1>

      <h2>広告の配信について</h2>
      <p>
        当サイトは第三者配信の広告サービス「Google AdSense」を利用しています。広告配信事業者は、ユーザーの興味に
        応じた広告を表示するためにCookieを使用することがあります。Cookieを無効にする方法やGoogle AdSenseに関する
        詳細は「<a href="https://policies.google.com/technologies/ads?hl=ja" target="_blank" rel="noopener">広告 – ポリシーと規約 – Google</a>」をご確認ください。
      </p>

      <h2>アクセス解析ツールについて</h2>
      <p>
        当サイトはGoogle Analyticsおよび Vercel Analytics を利用しています。これらはトラフィックデータの収集のために
        Cookieや匿名化された識別子を使用します。収集されるデータは匿名であり、個人を特定するものではありません。
      </p>

      <h2>個人情報の取り扱い</h2>
      <p>当サイトは現在、お問い合わせフォーム等による個人情報の収集を行っていません。</p>

      <h2>改定</h2>
      <p>本ポリシーは必要に応じて改定します。改定後の内容は本ページに掲載した時点で効力を生じます。</p>
    </div>
  );
}
