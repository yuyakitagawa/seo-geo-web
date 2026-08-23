import { X_FOLLOW_URL, X_HANDLE } from "@/lib/site";

// 記事末尾のフォロー導線。Xが未設定の間は何も出さない。
export default function FollowCta() {
  if (!X_FOLLOW_URL) return null;
  return (
    <aside className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-ink p-6 text-paper dark:bg-paper dark:text-ink sm:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider opacity-60">Follow</p>
        <p className="mt-1 text-lg font-bold">検索のアップデートを毎日、Xでも</p>
      </div>
      <a href={X_FOLLOW_URL} target="_blank" rel="noopener" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink transition hover:opacity-80">
        {X_HANDLE} をフォロー
      </a>
    </aside>
  );
}
