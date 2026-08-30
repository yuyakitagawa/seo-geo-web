import type { CategoryKey } from "@/lib/site";

// 記事のキービジュアル。写真素材を持たない方針なので、記事ID（slug）から決定的に図柄を生成する。
// - 素材の権利処理・保存が不要で、毎朝の自動生成パイプラインでも人手が要らない
// - インラインSVGなので追加リクエストゼロ、ダークモード・任意サイズに追従する
// - 同じ記事は常に同じ図柄（乱数はslugをシードにした擬似乱数）

const CATEGORY_HEX: Record<CategoryKey, string> = { seo: "#4f7cff", geo: "#a855f7", news: "#ff6b35" };
const ACCENT = "#2994b9";

const W = 1200;
const H = 600;

/** FNV-1a。slugを32bitのシードに畳む */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32。シードが同じなら常に同じ数列を返す */
function makeRandom(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

type Draw = (rand: () => number, color: string) => React.ReactNode;

/** 同心円。検索クエリが広がっていく様子 */
const orbit: Draw = (rand, color) => {
  const cx = r1(W * (0.6 + rand() * 0.25));
  const cy = r1(H * (0.3 + rand() * 0.4));
  const rings = 7 + Math.floor(rand() * 4);
  const step = 46 + rand() * 26;
  const hot = 1 + Math.floor(rand() * (rings - 1));
  return (
    <>
      {Array.from({ length: rings }, (_, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r1(step * (i + 1))}
          fill="none"
          stroke={i === hot ? ACCENT : color}
          strokeWidth={i === hot ? 7 : 3}
          opacity={i === hot ? 1 : r1(0.7 - i * 0.05)}
        />
      ))}
      <circle cx={cx} cy={cy} r={22} fill={ACCENT} />
      {Array.from({ length: 3 }, (_, i) => {
        const a = rand() * Math.PI * 2;
        const d = step * (1 + Math.floor(rand() * rings));
        return <circle key={i} cx={r1(cx + Math.cos(a) * d)} cy={r1(cy + Math.sin(a) * d)} r={16} fill={color} />;
      })}
    </>
  );
};

/** 縦棒。順位・トラフィックの変動 */
const bars: Draw = (rand, color) => {
  const count = 16 + Math.floor(rand() * 10);
  const gap = W / count;
  const hot = Math.floor(rand() * count);
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const h = r1(H * (0.12 + rand() * 0.8));
        return (
          <rect
            key={i}
            x={r1(i * gap + gap * 0.2)}
            y={r1(H - h)}
            width={r1(gap * 0.6)}
            height={h}
            rx={r1(gap * 0.3)}
            fill={i === hot ? ACCENT : color}
            opacity={i === hot ? 1 : r1(0.4 + rand() * 0.5)}
          />
        );
      })}
    </>
  );
};

/** ノードとエッジ。エンティティ／ナレッジグラフ */
const nodes: Draw = (rand, color) => {
  const pts = Array.from({ length: 11 }, () => ({ x: r1(rand() * W), y: r1(rand() * H) }));
  const edges: [number, number][] = [];
  pts.forEach((p, i) => {
    const near = pts
      .map((q, j) => ({ j, d: (p.x - q.x) ** 2 + (p.y - q.y) ** 2 }))
      .filter((e) => e.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    near.forEach((e) => i < e.j && edges.push([i, e.j]));
  });
  const hot = Math.floor(rand() * pts.length);
  return (
    <>
      {edges.map(([a, b], i) => (
        <line key={i} x1={pts[a].x} y1={pts[a].y} x2={pts[b].x} y2={pts[b].y} stroke={color} strokeWidth={3} opacity={0.6} />
      ))}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === hot ? 30 : r1(10 + rand() * 14)} fill={i === hot ? ACCENT : color} opacity={i === hot ? 1 : 0.8} />
      ))}
    </>
  );
};

/** 重なる波。継続的な変化 */
const waves: Draw = (rand, color) => {
  const layers = 6;
  const base = 0.25 + rand() * 0.3;
  const hot = Math.floor(rand() * layers);
  return (
    <>
      {Array.from({ length: layers }, (_, i) => {
        const amp = 30 + rand() * 70;
        const phase = rand() * Math.PI * 2;
        const y = H * base + i * (H * 0.11);
        const d = Array.from({ length: 25 }, (_, k) => {
          const x = (W / 24) * k;
          return `${k === 0 ? "M" : "L"}${r1(x)} ${r1(y + Math.sin(phase + k * 0.5) * amp)}`;
        }).join(" ");
        return <path key={i} d={d} fill="none" stroke={i === hot ? ACCENT : color} strokeWidth={i === hot ? 10 : 5} opacity={i === hot ? 1 : r1(0.75 - i * 0.08)} strokeLinecap="round" />;
      })}
    </>
  );
};

/** タイル。インデックス／SERPの面 */
const mosaic: Draw = (rand, color) => {
  const cols = 12;
  const rows = 6;
  const cw = W / cols;
  const ch = H / rows;
  return (
    <>
      {Array.from({ length: cols * rows }, (_, i) => {
        const v = rand();
        if (v < 0.45) return null;
        const x = (i % cols) * cw;
        const y = Math.floor(i / cols) * ch;
        const accent = v > 0.94;
        return (
          <rect
            key={i}
            x={r1(x + cw * 0.12)}
            y={r1(y + ch * 0.12)}
            width={r1(cw * 0.76)}
            height={r1(ch * 0.76)}
            rx={14}
            fill={accent ? ACCENT : color}
            opacity={accent ? 1 : r1(0.25 + (v - 0.45) * 1.2)}
          />
        );
      })}
    </>
  );
};

const VARIANTS: Draw[] = [orbit, bars, nodes, waves, mosaic];

/**
 * 記事のキービジュアル。親要素いっぱいに広がる装飾なので aria-hidden。
 * 親側で bg-ink と overflow-hidden、必要なら高さ（aspect-*）を指定する。
 */
export default function KeyVisual({ slug, category, className = "" }: { slug: string; category: CategoryKey; className?: string }) {
  const seed = hash(`${category}:${slug}`);
  const rand = makeRandom(seed);
  const draw = VARIANTS[seed % VARIANTS.length];
  const color = CATEGORY_HEX[category];
  // グラデーションの向き。gradientTransform の回転は基準点が図形の左上でズレるため座標で指定する。
  const dir = [
    { x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
    { x1: "100%", y1: "0%", x2: "0%", y2: "100%" },
    { x1: "0%", y1: "100%", x2: "100%", y2: "0%" },
    { x1: "0%", y1: "0%", x2: "100%", y2: "0%" },
  ][Math.floor(rand() * 4)];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden className={`absolute inset-0 size-full ${className}`}>
      <defs>
        <linearGradient id={`kv-bg-${seed}`} {...dir}>
          <stop offset="0%" stopColor="#0a0a0a" />
          <stop offset="45%" stopColor="#0a0a0a" />
          <stop offset="100%" stopColor={color} stopOpacity={0.85} />
        </linearGradient>
        <radialGradient id={`kv-glow-${seed}`}>
          <stop offset="0%" stopColor={color} stopOpacity={0.5} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#kv-bg-${seed})`} />
      <ellipse cx={r1(W * (0.2 + rand() * 0.6))} cy={r1(H * rand())} rx={W * 0.45} ry={H * 0.6} fill={`url(#kv-glow-${seed})`} />
      {draw(rand, color)}
    </svg>
  );
}
