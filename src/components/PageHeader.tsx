// 一覧・固定ページの見出し。記事ヘッダーと同じ黒地＋方眼にそろえる。
export default function PageHeader({
  eyebrow,
  title,
  lead,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
}) {
  return (
    <header className="relative overflow-hidden bg-ink text-paper">
      <div className="bg-grid absolute inset-0 opacity-50" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-5 pb-12 pt-16 sm:pb-16 sm:pt-24">
        <div className="max-w-2xl">
          {eyebrow && <p className="mb-3 text-xs font-bold uppercase tracking-wider text-accent">{eyebrow}</p>}
          <h1 className="text-[clamp(2.2rem,5vw,3.75rem)] font-bold leading-[1.05] tracking-tighter">{title}</h1>
          {lead && <p className="mt-5 text-paper/70 sm:text-lg">{lead}</p>}
        </div>
      </div>
    </header>
  );
}
