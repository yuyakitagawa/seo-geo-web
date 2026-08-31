import type { Metadata } from "next";
import Link from "next/link";
import { PageDatesJsonLd } from "@/components/PageDates";
import PageHeader from "@/components/PageHeader";
import { HAS_CONTACT, POLICY_UPDATED, POLICY_UPDATED_LABEL, SITE_NAME } from "@/lib/site";
import { PROSE } from "@/lib/ui";

export const metadata: Metadata = {
  title: "免責事項",
  description: `${SITE_NAME}の免責事項。記事内容の正確性、外部リンク、著作権と引用の扱い、権利者からの連絡窓口について記載します。`,
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  return (
    <>
      <PageDatesJsonLd path="/disclaimer" name="免責事項" updated={POLICY_UPDATED} />
      <PageHeader
        eyebrow="Disclaimer"
        title="免責事項"
        lead="記事の正確性、外部リンク、著作権と引用の扱いについての当サイトの立場です。"
        crumbs={[{ name: "免責事項" }]}
      />
      <div className={PROSE.page}>
        <h2>記事内容について</h2>
        <p>
          当サイトの記事は、公開時点で入手できる一次情報をもとに正確を期して作成していますが、内容の正確性・
          完全性・有用性を保証するものではありません。検索エンジンやAI検索サービスの仕様は予告なく変更されます。
          記事の内容に基づいて行った施策の結果について、当サイトは一切の責任を負いません。実施の前に、
          各記事の末尾に記載した一次情報（公式ドキュメント）で最新の内容をご確認ください。
        </p>
        <p>
          誤りを見つけられた場合は{HAS_CONTACT ? <><Link href="/contact">お問い合わせ</Link>から</> : "問い合わせ窓口から"}
          ご指摘ください。確認のうえ、該当記事を訂正または削除します。
        </p>

        <h2>外部リンクについて</h2>
        <p>
          当サイトからリンクした外部サイトの内容、およびそれによって生じた損害について、当サイトは責任を負いません。
          リンク先の情報については各サイトの管理者にお問い合わせください。当サイトへのリンクは原則として自由で、
          事前の連絡は不要です。
        </p>

        <h2>著作権と引用について</h2>
        <p>
          当サイトの記事の著作権は{SITE_NAME}に帰属します。記事を引用される場合は、引用元として当該記事のURLを
          明記してください。本文全体の転載、および内容を書き換えただけの再掲載はお断りします。
        </p>
        <p>
          当サイトの記事は、他社の公式発表や報道を出典として参照し、その要点を当サイトの言葉で整理したものです。
          出典元の文章をそのまま転載することはせず、引用が必要な場合は引用の範囲を明示したうえで出典を記載します。
          記事内で言及する製品名・サービス名・企業名は、各社の商標または登録商標です。
        </p>
        <p>
          掲載内容に著作権上の問題があると判断された権利者の方は{HAS_CONTACT ? <><Link href="/contact">お問い合わせ</Link>から</> : "問い合わせ窓口から"}
          ご連絡ください。確認のうえ、速やかに削除等の対応を行います。
        </p>

        <h2>記事の作成方法について</h2>
        <p>
          当サイトの記事は、一次情報をもとにAIを用いて作成し、出典の有無・記載内容の形式を機械的に検査したうえで
          公開しています。作成の手順と検査の内容は<Link href="/about">運営者情報</Link>に記載しています。
        </p>

        <h2>広告について</h2>
        <p>
          当サイトは第三者配信の広告を掲載する場合があります。表示される広告の内容は配信事業者が決定するもので、
          当サイトが個別の広告主やその商品・サービスを推奨するものではありません。広告配信とCookieの扱いは
          <Link href="/privacy">プライバシーポリシー</Link>をご覧ください。
        </p>

        <p className="text-sm text-mute">最終改定日：<time dateTime={POLICY_UPDATED}>{POLICY_UPDATED_LABEL}</time></p>
      </div>
    </>
  );
}
