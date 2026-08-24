import type { CategoryKey } from "./site";

// 記事のキービジュアル（アイキャッチ）をSVG文字列として生成する。
// 写真素材を持たない代わりに、記事idから決定的に図形を組み立てる。同じ記事は常に同じ絵になる。
// 文字列で返すのは、Reactの <img src="data:image/svg+xml,..."> と
// OGP画像生成（next/og の satori）の両方から同じ絵を使えるようにするため。
// SVG内にテキストは置かない（OGP側のラスタライザにフォントが無いと欠けるため）。

const W = 1200;
const H = 675;
const INK = "#0a0a0a";
const ACCENT = "#d7ff3b";
const CATEGORY_COLOR: Record<CategoryKey, string> = {
  seo: "#4f7cff",
  geo: "#a855f7",
  news: "#ff6b35",
};

// 決定的な擬似乱数（Lehmer）。記事idを種にする。
function rng(seed: number) {
  let s = (Math.abs(seed) * 48271) % 2147483647 || 1;
  return () => (s = (s * 48271) % 2147483647) / 2147483647;
}

const round = (n: number) => Math.round(n * 10) / 10;

/** 背景の方眼。全バリアント共通の下地 */
function grid() {
  const lines: string[] = [];
  for (let x = 75; x < W; x += 75) lines.push(`M${x} 0V${H}`);
  for (let y = 75; y < H; y += 75) lines.push(`M0 ${y}H${W}`);
  return `<path d="${lines.join("")}" stroke="#ffffff" stroke-opacity=".07" stroke-width="1"/>`;
}

/** 同心円。中心をずらして単調さを消す */
function rings(r: () => number, c: string) {
  const cx = round(340 + r() * 520);
  const cy = round(200 + r() * 280);
  const out: string[] = [];
  for (let i = 6; i >= 1; i--) {
    const rad = round(70 + i * 62);
    out.push(`<circle cx="${cx}" cy="${cy}" r="${rad}" fill="none" stroke="${c}" stroke-opacity="${round(0.15 + i * 0.1)}" stroke-width="${i === 3 ? 10 : 3}"/>`);
  }
  const a = r() * Math.PI * 2;
  out.push(`<circle cx="${round(cx + Math.cos(a) * 256)}" cy="${round(cy + Math.sin(a) * 256)}" r="24" fill="${ACCENT}"/>`);
  return out.join("");
}

/** 棒グラフ風。1本だけアクセント色にして視線を作る */
function bars(r: () => number, c: string) {
  const n = 11;
  const gap = 26;
  const w = (W - 200 - gap * (n - 1)) / n;
  const hit = Math.floor(r() * n);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const h = round(90 + r() * 400);
    const x = round(100 + i * (w + gap));
    out.push(
      `<rect x="${x}" y="${round(H - 60 - h)}" width="${round(w)}" height="${round(h)}" rx="8" fill="${i === hit ? ACCENT : c}" fill-opacity="${i === hit ? 1 : round(0.3 + (i / n) * 0.55)}"/>`
    );
  }
  return out.join("");
}

/** ドット行列。一区画だけ塗りを変えて「見つかっている状態」を表す */
function matrix(r: () => number, c: string) {
  const cols = 15;
  const rows = 8;
  const hx = Math.floor(r() * (cols - 3));
  const hy = Math.floor(r() * (rows - 2));
  const out: string[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const on = x >= hx && x < hx + 3 && y >= hy && y < hy + 2;
      out.push(
        `<circle cx="${round(75 + x * 75)}" cy="${round(60 + y * 75)}" r="${on ? 20 : 9}" fill="${on ? ACCENT : c}" fill-opacity="${on ? 1 : 0.45}"/>`
      );
    }
  }
  return out.join("");
}

/** 波。検索結果の流れ・時系列の変動を思わせる線 */
function waves(r: () => number, c: string) {
  const out: string[] = [];
  for (let i = 0; i < 5; i++) {
    const base = 140 + i * 95;
    const amp = 40 + r() * 70;
    const d = [`M-40 ${round(base)}`];
    for (let x = 0; x <= W + 80; x += 200) {
      d.push(`q 100 ${round((x / 200) % 2 === 0 ? -amp : amp)} 200 0`);
    }
    const accent = i === 2;
    out.push(`<path d="${d.join(" ")}" fill="none" stroke="${accent ? ACCENT : c}" stroke-opacity="${accent ? 1 : round(0.25 + i * 0.15)}" stroke-width="${accent ? 10 : 4}" stroke-linecap="round"/>`);
  }
  return out.join("");
}

/** ノードとリンク。引用・被リンクの関係図 */
function nodes(r: () => number, c: string) {
  const pts = Array.from({ length: 9 }, () => ({ x: round(140 + r() * (W - 280)), y: round(110 + r() * (H - 220)) }));
  const hub = pts[Math.floor(r() * pts.length)];
  const out: string[] = [];
  for (const p of pts) {
    if (p === hub) continue;
    out.push(`<line x1="${hub.x}" y1="${hub.y}" x2="${p.x}" y2="${p.y}" stroke="${c}" stroke-opacity=".45" stroke-width="3"/>`);
  }
  for (const p of pts) {
    if (p === hub) continue;
    out.push(`<circle cx="${p.x}" cy="${p.y}" r="16" fill="${c}"/>`);
  }
  out.push(`<circle cx="${hub.x}" cy="${hub.y}" r="52" fill="none" stroke="${ACCENT}" stroke-opacity=".5" stroke-width="4"/>`);
  out.push(`<circle cx="${hub.x}" cy="${hub.y}" r="30" fill="${ACCENT}"/>`);
  return out.join("");
}

/** 隅から広がる円弧。段階的な広がりを表す */
function arcs(r: () => number, c: string) {
  const fromRight = r() > 0.5;
  const ox = fromRight ? W - 60 : 60;
  const oy = H - 40;
  const out: string[] = [];
  for (let i = 8; i >= 1; i--) {
    const rad = 90 * i;
    const sweep = fromRight ? 0 : 1;
    out.push(
      `<path d="M${ox} ${round(oy - rad)} A${rad} ${rad} 0 0 ${sweep} ${round(fromRight ? ox - rad : ox + rad)} ${oy}" fill="none" stroke="${i === 4 ? ACCENT : c}" stroke-opacity="${i === 4 ? 1 : round(0.18 + i * 0.09)}" stroke-width="${i === 4 ? 14 : 6}" stroke-linecap="round"/>`
    );
  }
  out.push(`<circle cx="${ox}" cy="${oy}" r="26" fill="${ACCENT}"/>`);
  return out.join("");
}

const VARIANTS = [rings, bars, matrix, waves, nodes, arcs];

/** 記事idとカテゴリからキービジュアルのSVG文字列を作る */
export function coverArtSvg(seed: number, category: CategoryKey): string {
  const r = rng(seed + 7);
  const color = CATEGORY_COLOR[category];
  const draw = VARIANTS[Math.abs(seed) % VARIANTS.length];
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">`,
    `<rect width="${W}" height="${H}" fill="${INK}"/>`,
    grid(),
    draw(r, color),
    `</svg>`,
  ].join("");
}

/** <img src> にそのまま渡せる data URI */
export function coverArtDataUri(seed: number, category: CategoryKey): string {
  return `data:image/svg+xml,${encodeURIComponent(coverArtSvg(seed, category))}`;
}
