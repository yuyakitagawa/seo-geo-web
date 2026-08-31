import Breadcrumbs, { type Crumb } from "./Breadcrumbs";
import { CONTAINER, cx } from "@/lib/ui";
import { Eyebrow } from "./ui";

// 一覧・固定ページの見出し。記事ヘッダーと同じ黒地＋方眼にそろえる。
export default function PageHeader({
  eyebrow,
  title,
  lead,
  crumbs,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  /** パンくず（ホームは自動で先頭に付く）。渡すとBreadcrumbList JSON-LDも出る */
  crumbs?: Crumb[];
}) {
  return (
    <header className="relative overflow-hidden bg-ink text-paper">
      <div className="bg-grid absolute inset-0 opacity-50" aria-hidden />
      <div className={cx(CONTAINER.page, "relative pb-12 pt-16 sm:pb-16 sm:pt-24")}>
        <div className="max-w-2xl">
          {crumbs && crumbs.length > 0 && <Breadcrumbs items={crumbs} />}
          {eyebrow && <Eyebrow tone="accent" className="mb-3">{eyebrow}</Eyebrow>}
          <h1 className="text-[clamp(2.2rem,5vw,3.75rem)] font-bold leading-[1.05] tracking-tighter">{title}</h1>
          {lead && <p className="mt-5 text-paper/70 sm:text-lg">{lead}</p>}
        </div>
      </div>
    </header>
  );
}
