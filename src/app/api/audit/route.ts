// URLを1本取得して src/lib/audit.ts で判定するAPI。/tools/page-audit のフォームから呼ばれる。
// 任意のURLをサーバーから取りに行く口なので、社内ネットワークへの踏み台にされないよう
// 「スキーム・ポート・名前解決先IP」をリダイレクトの各ホップで検査する。
import dns from "node:dns/promises";
import net from "node:net";
import { audit } from "@/lib/audit";
import { logAudit } from "@/lib/audit-log";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 2_000_000;
const TIMEOUT_MS = 12_000;
const MAX_REDIRECTS = 3;
const UA = "SeoGeoLabAuditBot/1.0 (+https://seo-geo-lab.com/tools/page-audit)";

// 到達してはいけないIP範囲（ループバック・プライベート・リンクローカル・CGNAT・ユニークローカル）
function isBlockedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
    return false;
  }
  const v6 = ip.toLowerCase();
  if (v6 === "::1" || v6 === "::") return true;
  if (v6.startsWith("fe80") || v6.startsWith("fc") || v6.startsWith("fd")) return true;
  // IPv4射影アドレス（::ffff:10.0.0.1 など）は v4 として見る
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedIp(mapped[1]);
  return false;
}

async function assertPublicUrl(raw: string): Promise<URL> {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error("URLの形式が正しくありません（https:// から入力してください）");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("http / https のURLだけ検査できます");
  if (u.port && u.port !== "80" && u.port !== "443") throw new Error("80 / 443 以外のポートは検査できません");

  const host = u.hostname;
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal")) throw new Error("このホストは検査できません");
  if (net.isIP(host)) {
    if (isBlockedIp(host)) throw new Error("このIPアドレスは検査できません");
    return u;
  }
  let addrs: { address: string }[];
  try {
    addrs = await dns.lookup(host, { all: true });
  } catch {
    throw new Error("ドメインを解決できませんでした");
  }
  if (addrs.length === 0 || addrs.some((a) => isBlockedIp(a.address))) throw new Error("このホストは検査できません");
  return u;
}

/** リダイレクトを自分で追う。各ホップで公開URLかを検査する */
async function fetchChecked(raw: string, accept: string) {
  const redirects: string[] = [];
  let current = raw;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const u = await assertPublicUrl(current);
    const res = await fetch(u, {
      redirect: "manual",
      headers: { "user-agent": UA, accept },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      current = new URL(res.headers.get("location")!, u).toString();
      redirects.push(current);
      continue;
    }
    return { res, finalUrl: u.toString(), redirects };
  }
  throw new Error("リダイレクトが多すぎます");
}

async function readCapped(res: Response): Promise<{ text: string; bytes: number }> {
  const reader = res.body?.getReader();
  if (!reader) return { text: "", bytes: 0 };
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    chunks.push(value);
    if (bytes > MAX_BYTES) {
      await reader.cancel();
      break;
    }
  }
  const buf = new Uint8Array(bytes);
  let at = 0;
  for (const c of chunks) {
    buf.set(c.subarray(0, Math.min(c.byteLength, bytes - at)), at);
    at += c.byteLength;
  }
  return { text: new TextDecoder("utf-8").decode(buf), bytes };
}

// 同一インスタンス内での連打だけを止める簡易な制限（サーバーレスなので厳密な制限にはならない）
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const LIMIT = 10;
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  return list.length > LIMIT;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) {
    return Response.json({ error: "短時間に検査しすぎです。1分ほど空けてから試してください。" }, { status: 429 });
  }

  let url: string;
  try {
    const body = (await request.json()) as { url?: unknown };
    url = String(body.url ?? "").trim();
  } catch {
    return Response.json({ error: "リクエストの形式が不正です" }, { status: 400 });
  }
  if (!url) return Response.json({ error: "URLを入力してください" }, { status: 400 });
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  const started = Date.now();
  try {
    const { res, finalUrl, redirects } = await fetchChecked(url, "text/html,application/xhtml+xml");
    const { text: html, bytes } = await readCapped(res);
    const elapsedMs = Date.now() - started;

    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => (headers[k.toLowerCase()] = v));

    const origin = new URL(finalUrl).origin;
    const [robotsTxt, hasLlmsTxt] = await Promise.all([
      fetchChecked(`${origin}/robots.txt`, "text/plain")
        .then(async ({ res: r }) => (r.ok ? (await readCapped(r)).text : null))
        .catch(() => null),
      fetchChecked(`${origin}/llms.txt`, "text/plain")
        .then(({ res: r }) => r.ok)
        .catch(() => false),
    ]);

    const result = audit({ url, finalUrl, status: res.status, headers, html, robotsTxt, hasLlmsTxt, bytes, elapsedMs, redirects });

    await logAudit({
      url: finalUrl,
      status: res.status,
      high: result.counts.high,
      mid: result.counts.mid,
      low: result.counts.low,
      findingIds: result.findings.map((f) => f.id),
      elapsedMs,
    });

    return Response.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "取得に失敗しました";
    const timedOut = /timeout|aborted|signal/i.test(message);
    const error = timedOut ? "取得がタイムアウトしました（12秒）" : message;
    await logAudit({ url, elapsedMs: Date.now() - started, error });
    return Response.json({ error }, { status: 400 });
  }
}
