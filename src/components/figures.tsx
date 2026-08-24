import type { ReactNode } from "react";

// 記事本文（MDX）に埋め込む図解コンポーネント。実画像の代わりにコードで描画する。
// - 自動生成パイプライン（scripts/generate.ts）でもClaudeがそのまま出力できる
// - テキストとして残るので検索エンジン・AIが読める（画像内の文字は読まれない）
// - ダークモード・スマホ幅に追従する
// 使い方は generate.ts の SYSTEM_PROMPT と README を参照。

type Tone = "seo" | "geo" | "news" | "accent" | "ink";

// Tailwindは動的クラスをパージするため完全なクラス名で持つ（categoryStyle.ts と同じ理由）
const TONE_BAR: Record<Tone, string> = {
  seo: "bg-seo",
  geo: "bg-geo",
  news: "bg-news",
  accent: "bg-accent",
  ink: "bg-ink dark:bg-paper",
};
const TONE_TEXT: Record<Tone, string> = {
  seo: "text-seo",
  geo: "text-geo",
  news: "text-news",
  accent: "text-accent",
  ink: "text-ink dark:text-paper",
};

// 共通の外枠。「画像」らしく本文から浮き上がる黒地カードにする。
function Frame({ title, caption, children }: { title: string; caption?: string; children: ReactNode }) {
  return (
    <figure className="not-prose my-10">
      <div className="relative overflow-hidden rounded-3xl bg-ink p-6 text-paper sm:p-8 dark:border dark:border-paper/15">
        <div className="bg-grid absolute inset-0 opacity-40" aria-hidden />
        <div className="relative">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Figure</p>
          <p className="mb-6 text-lg font-bold leading-snug tracking-tight sm:text-xl">{title}</p>
          {children}
        </div>
      </div>
      {caption && <figcaption className="mt-3 text-center text-xs text-mute">{caption}</figcaption>}
    </figure>
  );
}

/**
 * 比較図。2〜3個の対象をカードで並べる。
 * <FigureCompare title="SEOとGEOの違い" cols={[{ label: "SEO", tone: "seo", points: ["...", "..."] }, ...]} />
 */
export function FigureCompare({
  title,
  caption,
  cols,
}: {
  title: string;
  caption?: string;
  cols: { label: string; tone?: Tone; sub?: string; points: string[] }[];
}) {
  return (
    <Frame title={title} caption={caption}>
      <div className={`grid gap-3 ${cols.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {cols.map((c) => (
          <div key={c.label} className="overflow-hidden rounded-2xl bg-white/5 backdrop-blur">
            <div className={`h-1.5 ${TONE_BAR[c.tone ?? "accent"]}`} />
            <div className="p-4 sm:p-5">
              <p className={`text-base font-bold ${TONE_TEXT[c.tone ?? "accent"]}`}>{c.label}</p>
              {c.sub && <p className="mt-0.5 text-xs text-paper/60">{c.sub}</p>}
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-paper/90">
                {c.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-paper/40" aria-hidden />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

/**
 * やる／やらない図。✓と✕の2パネル。
 * <FigureDoDont title="..." dos={["..."]} donts={["..."]} />
 */
export function FigureDoDont({
  title,
  caption,
  dos,
  donts,
  doLabel = "やること",
  dontLabel = "やらなくていいこと",
}: {
  title: string;
  caption?: string;
  dos: string[];
  donts: string[];
  doLabel?: string;
  dontLabel?: string;
}) {
  const panel = (label: string, items: string[], positive: boolean) => (
    <div className="overflow-hidden rounded-2xl bg-white/5 backdrop-blur">
      <div className={`h-1.5 ${positive ? "bg-accent" : "bg-news"}`} />
      <div className="p-4 sm:p-5">
        <p className={`text-base font-bold ${positive ? "text-accent" : "text-news"}`}>{label}</p>
        <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-paper/90">
          {items.map((p) => (
            <li key={p} className="flex gap-2.5">
              <span
                className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  positive ? "bg-accent text-accent-ink" : "bg-news text-white"
                }`}
                aria-hidden
              >
                {positive ? "✓" : "✕"}
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
  return (
    <Frame title={title} caption={caption}>
      <div className="grid gap-3 sm:grid-cols-2">
        {panel(doLabel, dos, true)}
        {panel(dontLabel, donts, false)}
      </div>
    </Frame>
  );
}

/**
 * ステップ図。手順・流れを番号付きで並べる。
 * <FigureFlow title="..." steps={[{ label: "...", desc: "..." }, ...]} />
 */
export function FigureFlow({
  title,
  caption,
  steps,
}: {
  title: string;
  caption?: string;
  steps: { label: string; desc?: string }[];
}) {
  return (
    <Frame title={title} caption={caption}>
      <ol className="space-y-0">
        {steps.map((s, i) => (
          <li key={s.label} className="relative flex gap-4 pb-5 last:pb-0">
            {i < steps.length - 1 && <span className="absolute left-[15px] top-8 h-full w-px bg-paper/20" aria-hidden />}
            <span className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-ink">
              {i + 1}
            </span>
            <div className="pt-1">
              <p className="font-bold leading-snug">{s.label}</p>
              {s.desc && <p className="mt-1 text-sm leading-relaxed text-paper/70">{s.desc}</p>}
            </div>
          </li>
        ))}
      </ol>
    </Frame>
  );
}

/**
 * 数字カード。元記事にある数値だけを大きく見せる。
 * <FigureStats title="..." stats={[{ value: "40%", label: "...", note: "..." }, ...]} />
 */
export function FigureStats({
  title,
  caption,
  stats,
}: {
  title: string;
  caption?: string;
  stats: { value: string; label: string; note?: string }[];
}) {
  return (
    <Frame title={title} caption={caption}>
      <div className={`grid gap-3 ${stats.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white/5 p-4 backdrop-blur sm:p-5">
            <p className="text-3xl font-bold tracking-tight text-accent sm:text-4xl">{s.value}</p>
            <p className="mt-2 text-sm font-semibold leading-snug">{s.label}</p>
            {s.note && <p className="mt-1 text-xs leading-relaxed text-paper/60">{s.note}</p>}
          </div>
        ))}
      </div>
    </Frame>
  );
}

// MDXRemote の components に渡す一覧
export const MDX_FIGURES = { FigureCompare, FigureDoDont, FigureFlow, FigureStats };
