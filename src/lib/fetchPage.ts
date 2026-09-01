// 任意のURLをサーバーから1本取得するための共通処理。/api/audit と /api/prompt-fit が使う。
// 回数制限は src/lib/rateLimit.ts。
// 社内ネットワークへの踏み台にされないよう、「スキーム・ポート・名前解決先IP」を
// リダイレクトの各ホップで検査する。ここを外さない。
import dns from "node:dns/promises";
import net from "node:net";

export const MAX_BYTES = 2_000_000;
export const TIMEOUT_MS = 12_000;
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

  // URL.hostname のIPv6リテラルは実行環境によって [] 付きになるため、DNS/IP判定の前に外す。
  const host = u.hostname.replace(/^\[|\]$/g, "");
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
export async function fetchChecked(raw: string, accept: string) {
  const redirects: string[] = [];
  let current = raw;
  for (let redirectCount = 0; ; redirectCount++) {
    const u = await assertPublicUrl(current);
    const res = await fetch(u, {
      redirect: "manual",
      headers: { "user-agent": UA, accept },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      if (redirectCount >= MAX_REDIRECTS) throw new Error("リダイレクトが多すぎます");
      current = new URL(res.headers.get("location")!, u).toString();
      redirects.push(current);
      continue;
    }
    return { res, finalUrl: u.toString(), redirects };
  }
}

/** 上限バイト数までしか読まない。巨大なファイルを掴まされても落ちないようにする */
export async function readCapped(res: Response): Promise<{ text: string; bytes: number }> {
  const reader = res.body?.getReader();
  if (!reader) return { text: "", bytes: 0 };
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const remaining = MAX_BYTES - bytes;
    if (value.byteLength <= remaining) {
      chunks.push(value);
      bytes += value.byteLength;
    } else {
      chunks.push(value.subarray(0, remaining));
      bytes = MAX_BYTES;
      await reader.cancel();
      break;
    }
  }
  const buf = new Uint8Array(bytes);
  let at = 0;
  for (const c of chunks) {
    buf.set(c, at);
    at += c.byteLength;
  }
  return { text: new TextDecoder("utf-8").decode(buf), bytes };
}
