import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { CONTACT_EMAIL, CONTACT_FORM_URL, HAS_CONTACT, SITE_NAME, X_HANDLE, X_PROFILE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description: `${SITE_NAME}への記事の誤りのご指摘、権利関係のご連絡、その他のお問い合わせの窓口。`,
  alternates: { canonical: "/contact" },
};

// 窓口（NEXT_PUBLIC_CONTACT_EMAIL / NEXT_PUBLIC_CONTACT_FORM_URL / NEXT_PUBLIC_X_SCREEN_NAME）が
// 1つも設定されていないときは中身が無いページになるので、ビルド時に404にする。
export default function ContactPage() {
  if (!HAS_CONTACT) notFound();

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="お問い合わせ"
        lead="記事の誤りのご指摘、権利関係のご連絡、その他のお問い合わせはこちらへお願いします。"
        crumbs={[{ name: "お問い合わせ" }]}
      />
      <div className="prose prose-neutral mx-auto max-w-3xl px-5 py-14 dark:prose-invert sm:py-20">
        <h2>連絡先</h2>
        <ul>
          {CONTACT_EMAIL && (
            <li>
              メール：<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </li>
          )}
          {CONTACT_FORM_URL && (
            <li>
              フォーム：<a href={CONTACT_FORM_URL} target="_blank" rel="noopener">お問い合わせフォーム</a>
            </li>
          )}
          {X_PROFILE_URL && (
            <li>
              X（旧Twitter）：<a href={X_PROFILE_URL} rel="me noopener" target="_blank">{X_HANDLE}</a> へのリプライまたはDM
            </li>
          )}
        </ul>

        <h2>お受けする内容</h2>
        <ul>
          <li>記事の内容の誤り・古くなった情報のご指摘</li>
          <li>著作権など権利関係についてのご連絡（確認のうえ速やかに対応します）</li>
          <li>取り上げてほしいテーマ、記事へのご意見</li>
          <li>掲載・引用の可否についてのご確認</li>
        </ul>
        <p>
          個人が運営しているため、すべてのお問い合わせに返信できるとは限りません。数日以内に返信がない場合は、
          恐れ入りますが再送をお願いします。個別のSEO・GEO施策に関するご相談や診断は、現在お受けしていません。
        </p>

        <h2>お預かりした情報の扱い</h2>
        <p>
          いただいた連絡先と内容は、返信と内容の確認のためだけに利用し、第三者に提供しません。詳細は
          <Link href="/privacy">プライバシーポリシー</Link>をご覧ください。運営方針と情報源の一覧は
          <Link href="/about">運営者情報</Link>に記載しています。
        </p>
      </div>
    </>
  );
}
