// 連打と自動化された乱用を止めるための簡易な制限。/api/audit・/api/prompt-fit・/api/contact が使う。
// サーバーレスでインスタンスが分かれるため厳密な制限にはならない（正確さより、事故の抑制が目的）。
// IPは数え上げにしか使わず、どこにも記録しない。
//
// 制限は2段。1つ目はIPごと、2つ目はインスタンス全体。IPを変えながら叩かれるとIPごとの制限は
// すり抜けるため、インスタンスが1分あたりに受ける総数にも上限を置く。
//
// どちらの段も「上限に達していたら数えずに落とす」。落とした分まで数えると、
// 洪水を受けている間だけ配列が無限に伸び、1リクエストごとの走査が重くなる
// （費用を抑えるための仕組みが、費用の増える瞬間に一番重くなってしまう）。

const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_TRACKED_CLIENTS = 1_000;
/** このインスタンスが1分間に処理する総数の上限。実利用は1日数件なので、これを超えるのは乱用だけ。 */
const GLOBAL_LIMIT = 60;

let globalHits: number[] = [];

function recentHits(ip: string, now: number): number[] {
  const recent = (hits.get(ip) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (recent.length === 0) hits.delete(ip);
  return recent;
}

function pruneExpiredClients(now: number): void {
  if (hits.size < MAX_TRACKED_CLIENTS) return;
  for (const ip of hits.keys()) recentHits(ip, now);
}

export function rateLimited(ip: string, limit = 5): boolean {
  const now = Date.now();

  globalHits = globalHits.filter((timestamp) => now - timestamp < WINDOW_MS);
  if (globalHits.length >= GLOBAL_LIMIT) return true;

  pruneExpiredClients(now);
  const list = recentHits(ip, now);
  if (list.length >= limit) {
    hits.set(ip, list);
    return true;
  }

  globalHits.push(now);
  list.push(now);
  hits.set(ip, list);
  return false;
}

/** テスト用。数え上げた状態を捨てる（本番の経路からは呼ばない） */
export function resetRateLimit(): void {
  hits.clear();
  globalHits = [];
}

/** x-forwarded-for から呼び出し元を1つ取る。取れなければ "unknown" */
export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

/**
 * サイト自身のフォームからの呼び出しかを見る。ブラウザは GET/HEAD 以外のリクエストに必ず Origin を付けるため、
 * Origin が無い＝スクリプトからの直接呼び出しとして落とす。
 * 比較先は固定値ではなくリクエスト自身のホスト。これで本番・プレビュー・localhost が同じ判定で通る。
 */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
