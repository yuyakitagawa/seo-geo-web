import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { HAS_CONTACT, POLICY_UPDATED_LABEL, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: `${SITE_NAME}のプライバシーポリシー。アクセス解析（Google Analytics）・広告配信（Google AdSense）・Cookieの取り扱いと、無効化の方法を記載します。`,
  alternates: { canonical: "/privacy" },
};

// Google AdSense のプログラムポリシーは、掲載サイトに「第三者配信事業者によるCookieの使用」と
// 「パーソナライズ広告の無効化手段」の明示を求めている。文言を削るとポリシー違反になるので注意。
export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Privacy"
        title="プライバシーポリシー"
        lead="当サイトが取得する情報と、広告配信・アクセス解析でのCookieの扱いについて説明します。"
        crumbs={[{ name: "プライバシーポリシー" }]}
      />
      <div className="prose prose-neutral mx-auto max-w-3xl px-5 py-14 dark:prose-invert sm:py-20">
        <p>
          {SITE_NAME}（{SITE_URL}、以下「当サイト」）における個人情報およびCookie等の取り扱いについて、
          以下のとおり定めます。本ポリシーは当サイトのすべてのページに適用されます。
        </p>

        <h2>1. 運営者と連絡先</h2>
        <p>
          当サイトは個人が運営しています。運営方針と情報源の一覧は<Link href="/about">運営者情報</Link>に記載しています。
          本ポリシーに関するお問い合わせは
          {HAS_CONTACT ? <><Link href="/contact">お問い合わせ</Link>のページに記載の窓口</> : "当サイトの問い合わせ窓口"}
          までお願いします。
        </p>

        <h2>2. 取得する情報</h2>
        <p>当サイトは、氏名・住所・電話番号などの個人情報を入力していただくフォームを設置していません。取得するのは次の情報です。</p>
        <ul>
          <li>アクセス情報：閲覧ページ、参照元、滞在時間、ブラウザ・OSの種類、画面サイズ、おおよその地域（国・都道府県）</li>
          <li>Cookieおよび類似技術に保存される識別子（個人を特定しない匿名の識別子です）</li>
          <li>お問い合わせをいただいた場合、その連絡先とご記入いただいた内容</li>
        </ul>

        <h2>3. アクセス解析ツールについて</h2>
        <p>
          当サイトは、利用状況を把握するためにGoogleのアクセス解析ツール「Google アナリティクス」を利用しています。
          Google アナリティクスはトラフィックデータの収集のためにCookieを使用します。このトラフィックデータは匿名で
          収集されており、個人を特定するものではありません。
        </p>
        <p>
          この機能はブラウザのCookieを無効にすることで収集を拒否できます。Googleが提供する
          <a href="https://tools.google.com/dlpage/gaoptout?hl=ja" target="_blank" rel="noopener">Google アナリティクス オプトアウト アドオン</a>
          を導入することでも無効化できます。Google アナリティクスの規約については
          <a href="https://marketingplatform.google.com/about/analytics/terms/jp/" target="_blank" rel="noopener">Google アナリティクス利用規約</a>
          をご確認ください。
        </p>
        <p>
          また、表示速度と閲覧数の計測のためにVercel Analytics および Vercel Speed Insights を利用しています。
          いずれも個人を特定するCookieを使用せず、匿名の集計値のみを取得します。
        </p>

        <h2>4. 広告配信について</h2>
        <p>
          当サイトは、第三者配信の広告サービス「Google AdSense」を利用する場合があります。
          第三者配信事業者（Googleを含む）は、Cookieを使用して、ユーザーが過去に当サイトや他のウェブサイトに
          アクセスした際の情報に基づいて広告を配信します。
        </p>
        <p>
          Googleが広告Cookieを使用することにより、ユーザーが当サイトや他のサイトにアクセスした際の情報に基づいて、
          Googleやそのパートナーが適切な広告をユーザーに表示できます。
        </p>
        <p>ユーザーは、次の方法でパーソナライズ広告を無効にできます。</p>
        <ul>
          <li>
            <a href="https://myadcenter.google.com/" target="_blank" rel="noopener">Google のマイアドセンター（広告設定）</a>
            でパーソナライズ広告をオフにする
          </li>
          <li>
            <a href="https://optout.aboutads.info/" target="_blank" rel="noopener">aboutads.info</a>
            で第三者配信事業者のCookieを無効にする
          </li>
        </ul>
        <p>
          広告配信におけるCookieの取り扱いの詳細は
          <a href="https://policies.google.com/technologies/ads?hl=ja" target="_blank" rel="noopener">「広告 – ポリシーと規約 – Google」</a>
          をご確認ください。
        </p>

        <h2>5. Cookieの無効化</h2>
        <p>
          Cookieはブラウザの設定からいつでも無効化・削除できます。無効化した場合でも当サイトの記事は閲覧できますが、
          一部の機能が正しく動作しないことがあります。
        </p>

        <h2>6. EU・英国からアクセスされる方へ</h2>
        <p>
          EU一般データ保護規則（GDPR）および英国GDPRの対象となる地域からアクセスされた場合は、Cookieの使用と
          パーソナライズ広告について同意を求めるメッセージを表示し、同意いただいた範囲でのみCookieを使用します。
          同意はいつでも撤回できます。
        </p>

        <h2>7. 個人情報の第三者提供</h2>
        <p>
          お問い合わせでいただいた個人情報は、返信および内容の確認のためにのみ利用し、ご本人の同意なく第三者に
          提供・開示しません。ただし、法令に基づく開示請求があった場合はこの限りではありません。
          いただいた内容は、対応が完了し保存の必要がなくなった時点で削除します。
        </p>

        <h2>8. お子様のプライバシー</h2>
        <p>
          当サイトは13歳未満の方を対象としたコンテンツを提供しておらず、13歳未満の方から意図的に個人情報を
          取得することはありません。
        </p>

        <h2>9. 免責事項・著作権</h2>
        <p>
          記事内容の正確性、外部リンク先、および著作権の取り扱いについては<Link href="/disclaimer">免責事項</Link>に記載しています。
        </p>

        <h2>10. 本ポリシーの変更</h2>
        <p>
          本ポリシーは、法令の改正や当サイトの運営内容の変更に応じて予告なく改定することがあります。
          改定後の内容は、本ページに掲載した時点から効力を生じます。
        </p>

        <p className="text-sm text-mute">最終改定日：{POLICY_UPDATED_LABEL}</p>
      </div>
    </>
  );
}
