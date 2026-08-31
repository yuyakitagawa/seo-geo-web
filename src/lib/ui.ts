// デザインシステムのクラス定義。トークン（色・角丸・影・幅）は src/app/globals.css の @theme にある。
// ページ側は「新しい見た目を書く」のではなく、ここの定義を組み合わせる。定義が足りないと思ったら、
// 1回きりの指定をページに書くのではなく、ここに名前を足す（同じ形が2か所目に出た時点で足す）。
//
// 配色モードは globals.css のセマンティックトークンが吸収するので、`dark:` は原則書かない。
// 例外は「常に黒地」の帯（ヒーロー・PageHeader・記事ヘッダー）で、そこだけ ink / paper を直接使う。

/** クラスの連結。false / undefined は捨てる */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/** ページ幅。page=一覧・トップ / wide=中間 / text=本文 */
export const CONTAINER = {
  page: "mx-auto w-full max-w-page px-5",
  wide: "mx-auto w-full max-w-wide px-5",
  text: "mx-auto w-full max-w-text px-5",
} as const;

export type ContainerWidth = keyof typeof CONTAINER;

/** 面（カードやパネルの地）。card=白面 / outline=線だけ / invert=反転 / accent=ブランド色 */
export const SURFACE = {
  card: "rounded-card border border-line bg-surface",
  outline: "rounded-card border border-line",
  invert: "rounded-card bg-invert text-invert-fg",
  accent: "rounded-card bg-accent text-accent-ink",
  dashed: "rounded-card border border-dashed border-line-strong",
} as const;

export type SurfaceTone = keyof typeof SURFACE;

/** カードの内側の余白。tight=補助的な面 / card=標準 / roomy=見出しを置く面 / hero=最大 */
export const PADDING = {
  tight: "p-6",
  card: "p-6 sm:p-8",
  roomy: "p-7 sm:p-9",
  hero: "p-8 sm:p-12",
} as const;

export type CardPadding = keyof typeof PADDING;

/** リンクになっているカードのホバー（浮かせる）。静的なカードには付けない */
export const LIFT = "transition duration-500 hover:-translate-y-1 hover:shadow-lift";

/** セクションの上に置く小さいラベル。mute=通常 / accent=黒地の上 / faint=反転面・アクセント面の上 */
export const EYEBROW = {
  mute: "text-xs font-bold uppercase tracking-wider text-mute",
  accent: "text-xs font-bold uppercase tracking-wider text-accent",
  faint: "text-xs font-bold uppercase tracking-wider opacity-60",
} as const;

export type EyebrowTone = keyof typeof EYEBROW;

/** 見出し。section=ページ内のh2 / card=カード内のh3相当 / label=一覧の区切り（小さい見出し） */
export const HEADING = {
  section: "text-2xl font-bold tracking-tight",
  card: "text-lg font-bold tracking-tight",
  label: "text-sm font-semibold uppercase tracking-wider text-mute",
} as const;

/** 本文リンク（アクセント色の下線） */
export const LINK = "underline decoration-accent decoration-2 underline-offset-4";

/** ボタン。accent=主導線 / invert=黒地の面の上以外での主導線 / onAccent=アクセント面の上 / outline=副次 */
const BUTTON_VARIANT = {
  accent: "bg-accent text-accent-ink hover:opacity-80",
  invert: "bg-invert text-invert-fg hover:opacity-80",
  onAccent: "bg-accent-ink text-accent hover:opacity-80",
  outline: "border border-line-strong hover:bg-invert hover:text-invert-fg",
} as const;

const BUTTON_SIZE = {
  sm: "px-4 py-2 text-xs",
  md: "px-5 py-2.5 text-sm",
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANT;
export type ButtonSize = keyof typeof BUTTON_SIZE;

export function button(variant: ButtonVariant = "accent", size: ButtonSize = "md"): string {
  return cx("inline-flex items-center gap-2 rounded-full font-semibold transition", BUTTON_VARIANT[variant], BUTTON_SIZE[size]);
}

/** チップ（丸い小さいリンク）。タグ・カテゴリ・ページ内ジャンプに使う */
export const CHIP = "inline-flex items-center gap-2 rounded-full border border-line-strong px-3 py-1.5 text-sm transition hover:bg-invert hover:text-invert-fg";

/** 常に黒地の帯（ヒーロー・PageHeader）の上に置くチップ */
export const CHIP_ON_INK =
  "inline-flex items-center gap-2 rounded-full border border-paper/20 px-3.5 py-1.5 text-sm font-medium transition hover:border-paper hover:bg-paper hover:text-ink";

/** バッジ（リンクではないラベル）。色は呼び出し側で足す */
export const BADGE = {
  sm: "inline-flex items-center rounded-full px-2.5 py-1 text-2xs font-bold uppercase tracking-wider",
  md: "inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider",
} as const;

/** 番号付きの手順。丸数字と本文を並べる */
export const STEP = {
  list: "space-y-3",
  item: "flex gap-4",
  marker: "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-invert text-xs font-bold text-invert-fg",
} as const;

/** 表。横スクロールする枠と、その中のセル */
export const TABLE = {
  frame: "overflow-x-auto rounded-card border border-line",
  table: "w-full text-sm",
  head: "bg-fill text-left text-xs uppercase tracking-wider text-mute",
  headCell: "px-4 py-3",
  row: "border-t border-line align-top",
  cell: "px-4 py-4",
} as const;

/** 入力欄。input=1行 / area=複数行（コード・URL） / text=複数行（日本語の文章） */
export const FIELD = {
  input: "rounded-full border border-line-strong bg-canvas px-5 py-3 font-mono text-sm outline-none focus:border-accent",
  area: "resize-y rounded-panel border border-line-strong bg-canvas p-4 font-mono text-sm leading-relaxed outline-none focus:border-accent",
  text: "resize-y rounded-panel border border-line-strong bg-canvas px-5 py-4 text-sm leading-relaxed outline-none focus:border-accent",
} as const;

/** コードの表示面 */
export const CODE = "overflow-x-auto rounded-panel bg-fill p-4 font-mono text-xs leading-relaxed";

/** 本文（typographyプラグイン）。page=固定ページ・解説ページの枠ごと / body=枠は呼び出し側 */
export const PROSE = {
  body: "prose prose-neutral max-w-none dark:prose-invert",
  page: "prose prose-neutral mx-auto max-w-text px-5 py-14 dark:prose-invert sm:py-20",
} as const;
