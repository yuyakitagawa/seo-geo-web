import { SITE_NAME } from "@/lib/site";

// 記事の共有ボタン。各SNSのSDKは読み込まず、公式のWeb Intent URLへの素のリンクだけで作る
// （SDKはページ表示が目に見えて遅くなるうえ、埋め込みは提供側の都合で描画されなくなることがある）。
// 共有経由の流入をGA4で識別できるようUTMを付ける。
export default function ShareButtons({ url, title }: { url: string; title: string }) {
  const shareUrl = `${url}?utm_source=share&utm_medium=social`;
  const encoded = encodeURIComponent(shareUrl);
  const links = [
    { label: "Xでポスト", href: `https://x.com/intent/post?text=${encodeURIComponent(`${title}｜${SITE_NAME}`)}&url=${encoded}` },
    { label: "はてなブックマーク", href: `https://b.hatena.ne.jp/entry/panel/?url=${encoded}` },
    { label: "LINEで送る", href: `https://social-plugins.line.me/lineit/share?url=${encoded}` },
  ];

  return (
    <section aria-label="この記事を共有" className="mt-12 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-6 dark:border-paper/10">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-mute">Share</p>
      {links.map((l) => (
        <a
          key={l.href}
          href={l.href}
          target="_blank"
          rel="noopener"
          className="rounded-full border border-ink/15 px-4 py-2 text-sm font-medium transition hover:bg-ink hover:text-paper dark:border-paper/15 dark:hover:bg-paper dark:hover:text-ink"
        >
          {l.label}
        </a>
      ))}
    </section>
  );
}
