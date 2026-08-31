import { X_FOLLOW_URL, X_HANDLE } from "@/lib/site";
import { PADDING, SURFACE, cx } from "@/lib/ui";
import { Button, Eyebrow } from "./ui";

// 記事末尾のフォロー導線。Xが未設定の間は何も出さない。
export default function FollowCta() {
  if (!X_FOLLOW_URL) return null;
  return (
    <aside className={cx(SURFACE.invert, PADDING.card, "mt-12 flex flex-wrap items-center justify-between gap-4")}>
      <div>
        <Eyebrow tone="faint">Follow</Eyebrow>
        <p className="mt-1 text-lg font-bold">検索のアップデートを毎日、Xでも</p>
      </div>
      <Button href={X_FOLLOW_URL} external>
        {X_HANDLE} をフォロー
      </Button>
    </aside>
  );
}
