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
export function Frame({ title, caption, children }: { title: string; caption?: ReactNode; children: ReactNode }) {
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
 * 比較図。2〜4個の対象をカードで並べる（3個なら横3列、それ以外は2列）。
 * <FigureCompare title="SEOとGEOの違い" cols={[{ label: "SEO", tone: "seo", points: ["...", "..."] }, ...]} />
 */
export function FigureCompare({
  title,
  caption,
  cols,
}: {
  title: string;
  caption?: ReactNode;
  cols: { label: string; tone?: Tone; sub?: string; points: string[] }[];
}) {
  return (
    <Frame title={title} caption={caption}>
      <div className={`grid gap-3 ${cols.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
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
  caption?: ReactNode;
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
  caption?: ReactNode;
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
  caption?: ReactNode;
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

/**
 * 横棒グラフ。増減が混在する場合は中央を0にした左右振り分けになる。
 * <FigureBars title="..." unit="%" bars={[{ label: "...", value: -42, note: "..." }]} />
 */
export function FigureBars({
  title,
  caption,
  unit = "",
  bars,
}: {
  title: string;
  caption?: ReactNode;
  /** 値に付ける単位。例: "%" "倍" */
  unit?: string;
  bars: { label: string; value: number; note?: string }[];
}) {
  const max = Math.max(...bars.map((b) => Math.abs(b.value)), 1);
  const diverging = bars.some((b) => b.value < 0);
  return (
    <Frame title={title} caption={caption}>
      <div className="space-y-7">
        {bars.map((b) => {
          const ratio = (Math.abs(b.value) / max) * (diverging ? 50 : 100);
          const negative = b.value < 0;
          return (
            <div key={b.label}>
              <div className="mb-2 flex items-baseline justify-between gap-4">
                <p className="text-sm font-semibold leading-snug">{b.label}</p>
                <p className={`shrink-0 text-xl font-bold tabular-nums ${negative ? "text-news" : "text-accent"}`}>
                  {b.value > 0 && diverging ? "+" : ""}
                  {b.value}
                  {unit}
                </p>
              </div>
              {/* 目盛り: divergingのときは中央が0 */}
              <div className="relative h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`absolute top-0 h-full rounded-full ${negative ? "bg-news" : "bg-accent"}`}
                  style={
                    diverging
                      ? negative
                        ? { right: "50%", width: `${ratio}%` }
                        : { left: "50%", width: `${ratio}%` }
                      : { left: 0, width: `${ratio}%` }
                  }
                />
                {diverging && <div className="absolute left-1/2 top-0 h-full w-px bg-paper/40" aria-hidden />}
              </div>
              {b.note && <p className="mt-1.5 text-xs leading-relaxed text-paper/60">{b.note}</p>}
            </div>
          );
        })}
      </div>
    </Frame>
  );
}

/**
 * 引用パネル。一次情報の一文を大きく見せて、本文の流れに視覚的な区切りを作る。
 * <FigureQuote text="..." source="Google 検索セントラル" />
 */
export function FigureQuote({ text, source }: { text: string; source?: ReactNode }) {
  return (
    <figure className="not-prose my-10 overflow-hidden rounded-3xl border-l-8 border-accent bg-ink p-6 text-paper sm:p-8 dark:border-y dark:border-r dark:border-y-paper/15 dark:border-r-paper/15">
      <blockquote className="text-lg font-bold leading-relaxed tracking-tight sm:text-2xl">「{text}」</blockquote>
      {source && <figcaption className="mt-4 text-sm text-paper/60">— {source}</figcaption>}
    </figure>
  );
}

/**
 * 処理の流れ図。段階を横に並べ、その段で落ちたときに何が起きるかを添える。
 * <FigurePipeline title="..." stages={[{ label: "クロール", desc: "...", fail: "..." }]} />
 */
export function FigurePipeline({
  title,
  caption,
  stages,
}: {
  title: string;
  caption?: ReactNode;
  stages: { label: string; desc?: string; fail?: string }[];
}) {
  return (
    <Frame title={title} caption={caption}>
      <div className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(0,1fr))] sm:grid-flow-col">
        {stages.map((st, i) => (
          <div key={st.label} className="relative rounded-2xl bg-white/5 p-4 backdrop-blur sm:p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-paper/40">Step {i + 1}</p>
            <p className="mt-1 text-base font-bold text-accent">{st.label}</p>
            {st.desc && <p className="mt-2 text-sm leading-relaxed text-paper/80">{st.desc}</p>}
            {st.fail && (
              <p className="mt-3 border-t border-paper/15 pt-3 text-xs leading-relaxed text-news">
                <span className="font-bold">ここで落ちると</span> {st.fail}
              </p>
            )}
            {i < stages.length - 1 && (
              <span
                className="absolute left-1/2 top-full z-10 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-ink sm:left-full sm:top-1/2 sm:-translate-x-1/2"
                aria-hidden
              >
                <span className="sm:hidden">↓</span>
                <span className="hidden sm:inline">→</span>
              </span>
            )}
          </div>
        ))}
      </div>
    </Frame>
  );
}

/**
 * 積み上げ図。土台から順に積む関係を、下ほど広いブロックで見せる。
 * layers は上（最後に積む層）から順に渡す。
 * <FigureStack title="..." layers={[{ label: "外部評価", desc: "...", tone: "geo" }, ...]} />
 */
export function FigureStack({
  title,
  caption,
  layers,
  baseNote,
}: {
  title: string;
  caption?: ReactNode;
  layers: { label: string; desc?: string; note?: string; tone?: Tone }[];
  /** 一番下に添える一行（例: 「下の層が欠けたまま上を積んでも評価は伸びない」） */
  baseNote?: string;
}) {
  return (
    <Frame title={title} caption={caption}>
      <div className="space-y-3">
        {layers.map((l, i) => {
          const width = 100 - (layers.length - 1 - i) * 12;
          return (
            <div key={l.label} className="mx-auto overflow-hidden rounded-2xl bg-white/5 backdrop-blur" style={{ maxWidth: `${width}%` }}>
              <div className="flex">
                <div className={`w-1.5 shrink-0 ${TONE_BAR[l.tone ?? "accent"]}`} />
                <div className="flex-1 p-4 sm:px-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className={`text-base font-bold ${TONE_TEXT[l.tone ?? "accent"]}`}>{l.label}</p>
                    {l.note && <p className="text-xs text-paper/50">{l.note}</p>}
                  </div>
                  {l.desc && <p className="mt-1.5 text-sm leading-relaxed text-paper/80">{l.desc}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {baseNote && (
        <p className="mt-4 border-t border-paper/15 pt-3 text-center text-xs leading-relaxed text-paper/60">{baseNote}</p>
      )}
    </Frame>
  );
}

/**
 * しきい値の帯。良好／改善が必要／不良の3区間を、境界の数値付きで見せる。
 * <FigureGauge title="..." items={[{ label: "LCP", good: "2.5秒", poor: "4.0秒", unitNote: "..." }]} />
 */
export function FigureGauge({
  title,
  caption,
  items,
  labels = ["良好", "改善が必要", "不良"],
}: {
  title: string;
  caption?: ReactNode;
  /** good = 良好の上限値、poor = 不良の下限値（表示用の文字列） */
  items: { label: string; sub?: string; good: string; poor: string; note?: string }[];
  labels?: [string, string, string] | string[];
}) {
  return (
    <Frame title={title} caption={caption}>
      <div className="space-y-7">
        {items.map((it) => (
          <div key={it.label}>
            <div className="mb-2 flex flex-wrap items-baseline gap-x-3">
              <p className="text-base font-bold">{it.label}</p>
              {it.sub && <p className="text-xs text-paper/60">{it.sub}</p>}
            </div>
            <div className="relative">
              <div className="flex h-3 overflow-hidden rounded-full">
                <div className="w-1/2 bg-accent" />
                <div className="w-1/4 bg-amber-400" />
                <div className="w-1/4 bg-news" />
              </div>
              {/* 境界の目盛り。数値は境界の真下に置く */}
              {[50, 75].map((x) => (
                <span key={x} className="absolute -top-1 h-5 w-px bg-paper/50" style={{ left: `${x}%` }} aria-hidden />
              ))}
            </div>
            <div className="relative mt-2 h-4">
              <span className="absolute -translate-x-1/2 text-[11px] font-semibold tabular-nums text-paper/80" style={{ left: "50%" }}>
                {it.good}
              </span>
              <span className="absolute -translate-x-1/2 text-[11px] font-semibold tabular-nums text-paper/80" style={{ left: "75%" }}>
                {it.poor}
              </span>
            </div>
            <div className="mt-1 flex text-[11px] font-semibold">
              <div className="w-1/2 text-accent">{labels[0]}</div>
              <div className="w-1/4 text-center text-amber-400">{labels[1]}</div>
              <div className="w-1/4 text-right text-news">{labels[2]}</div>
            </div>
            {it.note && <p className="mt-2 text-xs leading-relaxed text-paper/60">{it.note}</p>}
          </div>
        ))}
      </div>
    </Frame>
  );
}

/**
 * 期間の帯（ガント）。いつ何に手を付けるかを週単位で見せる。
 * <FigureTimeline title="..." axis={["1週","4週","8週","12週"]} rows={[{ label: "...", start: 0, span: 20 }]} />
 * start / span は全体を100とした割合で渡す。
 */
export function FigureTimeline({
  title,
  caption,
  axis,
  rows,
}: {
  title: string;
  caption?: ReactNode;
  axis: string[];
  rows: { label: string; start: number; span: number; desc?: string; tone?: Tone }[];
}) {
  return (
    <Frame title={title} caption={caption}>
      <div className="space-y-4">
        {rows.map((r) => (
          <div key={r.label} className="grid gap-1.5 sm:grid-cols-[minmax(0,11rem)_1fr] sm:items-center sm:gap-4">
            <div>
              <p className="text-sm font-bold leading-snug">{r.label}</p>
              {r.desc && <p className="mt-0.5 text-xs leading-relaxed text-paper/60">{r.desc}</p>}
            </div>
            <div className="relative h-7 rounded-full bg-white/10">
              <div
                className={`absolute inset-y-0 rounded-full ${TONE_BAR[r.tone ?? "accent"]}`}
                style={{ left: `${r.start}%`, width: `${r.span}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-4 sm:grid-cols-[minmax(0,11rem)_1fr]">
        <div className="hidden sm:block" />
        <div className="flex justify-between border-t border-paper/15 pt-2 text-[11px] tabular-nums text-paper/50">
          {axis.map((a) => (
            <span key={a}>{a}</span>
          ))}
        </div>
      </div>
    </Frame>
  );
}

// MDXRemote の components に渡す一覧
export const MDX_FIGURES = { FigureCompare, FigureDoDont, FigureFlow, FigureStats, FigureBars, FigureQuote, FigurePipeline, FigureStack, FigureGauge, FigureTimeline };
