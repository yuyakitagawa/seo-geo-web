import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "免責事項",
  description: `${SITE_NAME}の免責事項。`,
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  return (
    <div className="prose prose-neutral max-w-none dark:prose-invert">
      <h1>免責事項</h1>
      <p>
        当サイトの記事は、公開時点で入手できる一次情報をもとに正確を期して作成していますが、検索エンジンや
        AI検索サービスの仕様は予告なく変更されます。記事の内容に基づいて行った施策の結果について、当サイトは
        責任を負いません。必ず各サービスの公式ドキュメントを併せてご確認ください。
      </p>
      <p>
        当サイトからリンクされた外部サイトの内容については、当サイトは責任を負いません。
      </p>
      <p>
        記事内で言及する製品名・サービス名は各社の商標または登録商標です。
      </p>
    </div>
  );
}
