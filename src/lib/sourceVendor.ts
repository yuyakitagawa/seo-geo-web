import type { Source } from "./content";

// 一次情報の発信元（ベンダー）。記事の sources に、その会社自身が運営するドメインが
// 入っているときだけ「Google公式」バッジを出すための表。
// 報道メディア（Search Engine Journal・Search Engine Land・海外SEO情報ブログなど）は
// 二次情報なので入れない。ここに足すのは「その会社の発表・ドキュメントが載る場所」だけ。
export type Vendor = { key: string; label: string; hosts: string[] };

const VENDORS: Vendor[] = [
  // hosts はドメインの末尾一致。"google" は research.google / blog.google を拾う
  { key: "google", label: "Google", hosts: ["google.com", "google", "googleblog.com"] },
  { key: "openai", label: "OpenAI", hosts: ["openai.com"] },
  { key: "anthropic", label: "Anthropic", hosts: ["anthropic.com"] },
  { key: "microsoft", label: "Microsoft", hosts: ["bing.com", "microsoft.com"] },
  { key: "perplexity", label: "Perplexity", hosts: ["perplexity.ai"] },
];

// 会社のドメインではあるが一次情報ではない場所。集約・配信であって発表ではない。
const DENY = ["news.google.com", "groups.google.com", "sites.google.com"];

function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function match(h: string, vendor: Vendor): boolean {
  if (!h || DENY.includes(h)) return false;
  return vendor.hosts.some((s) => h === s || h.endsWith(`.${s}`));
}

/**
 * その記事の一次情報の主な発信元を1つ返す。該当が無ければ undefined。
 *
 * バッジは「この記事の一次情報が当事者自身の発表である」という意味なので、
 * 添え物として1本だけ公式ドキュメントを引いている記事では出さない。
 * 出す条件は次のどちらか。
 *   - 主出典（sources の先頭。生成時に主出典を先頭に置く）がそのベンダーのドメイン
 *   - 出典の半数以上がそのベンダーのドメイン
 * 両方を満たすベンダーが複数あれば、本数が多い方（同数なら先に出てくる方）。
 */
export function primaryVendor(sources: Source[]): Vendor | undefined {
  const hosts = sources.map((s) => host(s.url));
  let best: { vendor: Vendor; count: number; first: number } | undefined;
  for (const vendor of VENDORS) {
    const hit = hosts.map((h, i) => (match(h, vendor) ? i : -1)).filter((i) => i >= 0);
    if (hit.length === 0) continue;
    const isMain = hit[0] === 0 || hit.length * 2 >= hosts.length;
    if (!isMain) continue;
    const cand = { vendor, count: hit.length, first: hit[0] };
    if (!best || cand.count > best.count || (cand.count === best.count && cand.first < best.first)) best = cand;
  }
  return best?.vendor;
}
