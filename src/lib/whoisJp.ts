// .jp ドメインの登録年月日を JPRS の WHOIS（43/tcp）から取る。
// .jp は IANA の RDAP ブートストラップに載っていないため、RDAP では登録日が取れない。
// 接続先は whois.jprs.jp に固定してある（入力されたホストへは繋がないので、SSRFの経路にならない）。
import net from "node:net";
import type { Registration } from "./rdap";

const HOST = "whois.jprs.jp";
const PORT = 43;
const TIMEOUT_MS = 8_000;
const MAX_BYTES = 64_000;

/** 1問い合わせ＝1接続。応答を全部読んでから閉じる */
function query(domain: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let bytes = 0;
    const socket = net.createConnection({ host: HOST, port: PORT });
    socket.setTimeout(TIMEOUT_MS);
    const fail = (message: string) => {
      socket.destroy();
      reject(new Error(message));
    };
    socket.on("connect", () => socket.write(`${domain}/e\r\n`));
    socket.on("data", (chunk: Buffer) => {
      bytes += chunk.byteLength;
      if (bytes > MAX_BYTES) return fail("WHOIS の応答が大きすぎます");
      chunks.push(chunk);
    });
    socket.on("timeout", () => fail("WHOIS がタイムアウトしました（8秒）"));
    socket.on("error", () => fail("WHOIS に接続できませんでした"));
    socket.on("close", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

/** 「[ラベル] 値」の行を拾う。JPRS は日本語表示と英語表示（/e）でラベルが変わるので両方受ける */
function fields(text: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\[([^\]]+)\]\s*(.*)$/);
    if (!m) continue;
    const value = m[2].trim();
    if (value) map.set(m[1].trim().toLowerCase(), value);
  }
  return map;
}

function pick(map: Map<string, string>, labels: string[]): string | null {
  for (const label of labels) {
    const value = map.get(label.toLowerCase());
    if (value) return value;
  }
  return null;
}

/** 「2001/03/22」「2026/04/01 01:05:04 (JST)」から日付だけを ISO にする */
function toIso(value: string | null): string | null {
  const m = value?.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (!m) return null;
  const iso = `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}T00:00:00Z`;
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}

/**
 * .jp の登録情報を返す。見つからなければ null、通信に失敗したときは Error。
 * co.jp のように有効期限の欄が無く、状態が「Connected (2027/08/31)」の形で期限を持つ場合も拾う。
 */
export async function lookupWhoisJp(domain: string): Promise<Registration | null> {
  const text = await query(domain);
  const map = fields(text);
  if (map.size === 0 || /No match|該当するデータがありません/i.test(text)) return null;

  const status = pick(map, ["status", "state", "状態"]);
  const registeredAt = toIso(pick(map, ["created on", "registered date", "登録年月日", "接続年月日"]));
  const expiresAt = toIso(pick(map, ["expires on", "有効期限"])) ?? (status ? toIso(status) : null);
  if (!registeredAt && !expiresAt) return null;

  return {
    domain: (pick(map, ["domain name", "ドメイン名"]) ?? domain).toLowerCase(),
    registeredAt,
    updatedAt: toIso(pick(map, ["last updated", "最終更新"])),
    expiresAt,
    registrar: pick(map, ["registrar", "指定事業者"]),
    // JPRS の WHOIS は EPP ステータスを返さない。状態欄（Active / Connected）はそのまま渡す
    statuses: status ? [status.toLowerCase()] : [],
    dnssec: null,
    nameservers: [],
    source: "WHOIS",
  };
}
