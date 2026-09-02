// 被リンクの規模を Open PageRank から取る。Common Crawl のリンクグラフを元に算出された公開データ。
// OPEN_PAGERANK_API_KEY が無ければ何も取りに行かず null を返す（ローカル・プレビューは未設定でよい）。
// 接続先は固定。入力されたドメインは本文（JSON）に入るだけで、URLには入らない。
const ENDPOINT = "https://openpagerank.keywordseverywhere.com/v1/domains/bulk";
const TIMEOUT_MS = 10_000;

export type LinkProfile = {
  /** 0〜10。Common Crawl のリンクグラフ上の PageRank */
  openPageRank: number | null;
  /** 世界順位（小さいほど上） */
  worldRank: number | null;
  /** 被リンク元ドメイン数 */
  referringDomains: number | null;
  /** リンクグラフの集計時点 */
  asOf: string | null;
};

export function linkDataConfigured(): boolean {
  return Boolean(process.env.OPEN_PAGERANK_API_KEY);
}

/** レスポンスの読み取りはここだけ。APIの形が変わったら直すのはこの関数 */
function parse(body: unknown, asOf: string | null): LinkProfile | null {
  const row = (body as { results?: unknown[] } | null)?.results?.[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  const num = (v: unknown): number | null => {
    const n = typeof v === "string" ? Number(v) : v;
    return typeof n === "number" && Number.isFinite(n) ? n : null;
  };
  return {
    openPageRank: num(row.open_page_rank),
    worldRank: num(row.rank),
    referringDomains: num(row.referring_domains),
    asOf,
  };
}

/**
 * 被リンクの数値を返す。キー未設定なら null（＝未計測）、通信・認証に失敗したときは Error。
 */
export async function lookupLinkProfile(domain: string): Promise<LinkProfile | null> {
  const key = process.env.OPEN_PAGERANK_API_KEY;
  if (!key) return null;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ domains: [domain], include_history: false }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.status === 401 || res.status === 403) throw new Error("被リンクデータの認証に失敗しました（APIキーを確認してください）");
  if (res.status === 429) throw new Error("被リンクデータの取得回数が上限に達しました。時間を置いて試してください");
  if (!res.ok) throw new Error(`被リンクデータの取得に失敗しました（HTTP ${res.status}）`);

  const body = (await res.json()) as { as_of?: unknown };
  return parse(body, typeof body.as_of === "string" ? body.as_of : null);
}
