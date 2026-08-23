import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-2xl font-bold">ページが見つかりません</h1>
      <p className="mt-4"><Link href="/" className="underline">トップへ戻る</Link></p>
    </div>
  );
}
