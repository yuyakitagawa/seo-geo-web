import CoverArt from "./CoverArt";
import type { CategoryKey } from "@/lib/site";

// 一覧・固定ページの見出し。記事ヘッダーと同じ黒地にして、右側にキービジュアルを敷く。
export default function PageHeader({
  eyebrow,
  title,
  lead,
  art,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  /** 右側に出すキービジュアル。省略すると方眼だけの黒地になる */
  art?: { seed: number; category: CategoryKey };
}) {
  return (
    <header className="relative overflow-hidden bg-ink text-paper">
      <div className="bg-grid absolute inset-0 opacity-50" aria-hidden />
      {art && (
        <div
          className="absolute inset-y-0 right-0 hidden w-1/2 sm:block"
          style={{
            maskImage: "linear-gradient(to right, transparent, black 45%)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 45%)",
          }}
          aria-hidden
        >
          <CoverArt id={art.seed} category={art.category} />
        </div>
      )}
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
