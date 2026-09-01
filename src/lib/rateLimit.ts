// 連打を止めるためだけの簡易な回数制限。/api/audit・/api/prompt-fit・/api/contact が使う。
// サーバーレスでインスタンスが分かれるため厳密な制限にはならない（正確さより、事故の抑制が目的）。
// IPは数え上げにしか使わず、どこにも記録しない。

const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_TRACKED_CLIENTS = 1_000;

function recentHits(ip: string, now: number): number[] {
  const recent = (hits.get(ip) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (recent.length === 0) hits.delete(ip);
  return recent;
}

function pruneExpiredClients(now: number): void {
  if (hits.size < MAX_TRACKED_CLIENTS) return;
  for (const ip of hits.keys()) recentHits(ip, now);
}

export function rateLimited(ip: string, limit = 10): boolean {
  const now = Date.now();
  pruneExpiredClients(now);
  const list = recentHits(ip, now);
  list.push(now);
  hits.set(ip, list);
  return list.length > limit;
}

/** x-forwarded-for から呼び出し元を1つ取る。取れなければ "unknown" */
export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}
