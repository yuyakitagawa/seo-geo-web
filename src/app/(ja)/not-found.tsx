import Link from "next/link";
import { CONTAINER, cx } from "@/lib/ui";

export default function NotFound() {
  return (
    <div className={cx(CONTAINER.page, "py-32 text-center")}>
      <h1 className="text-2xl font-bold">ページが見つかりません</h1>
      <p className="mt-4"><Link href="/" className="underline">トップへ戻る</Link></p>
    </div>
  );
}
