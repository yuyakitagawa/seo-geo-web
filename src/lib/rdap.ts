// RDAP（RFC 9083）でドメインの登録情報を取る。認証もAPIキーも要らない。
// 問い合わせ先は IANA のブートストラップ（RFC 9224）で TLD から引く。第三者の中継サービスは経由しない。
// **.jp は IANA のブートストラップに載っていない**ので、ここでは取れない（src/lib/whoisJp.ts が担当する）。
import { fetchChecked, readCapped } from "./fetchPage";
import { topLevelDomain } from "./domain";

const BOOTSTRAP_URL = "https://data.iana.org/rdap/dns.json";
const BOOTSTRAP_TTL_MS = 24 * 60 * 60 * 1000;

export type Registration = {
  /** RDAP が返したドメイン名 */
  domain: string;
  registeredAt: string | null;
  updatedAt: string | null;
  expiresAt: string | null;
  registrar: string | null;
  /** EPPステータス（RDAP は "client transfer prohibited" のように空白区切りで返す） */
  statuses: string[];
  /** DNSSEC で署名されているか。RDAP が secureDNS を返さなければ null */
  dnssec: boolean | null;
  nameservers: string[];
  /** 情報源の表示用。.jp だけ WHOIS になる */
  source: "RDAP" | "WHOIS";
};

/** IANA のブートストラップ（RFC 9224）。[[TLD群], [RDAPのベースURL群]] の並び */
type Bootstrap = { services: [string[], string[]][] };

let cached: { at: number; map: Map<string, string> } | null = null;

async function bootstrapMap(): Promise<Map<string, string>> {
  if (cached && Date.now() - cached.at < BOOTSTRAP_TTL_MS) return cached.map;
  const { res } = await fetchChecked(BOOTSTRAP_URL, "application/json");
  if (!res.ok) throw new Error(`IANA のRDAP一覧を取得できませんでした（HTTP ${res.status}）`);
  const { text } = await readCapped(res);
  const data = JSON.parse(text) as Bootstrap;
  const map = new Map<string, string>();
  for (const [tlds, urls] of data.services ?? []) {
    const base = urls.find((u) => u.startsWith("https://")) ?? urls[0];
    if (!base) continue;
    for (const tld of tlds) map.set(tld.toLowerCase(), base.endsWith("/") ? base : `${base}/`);
  }
  cached = { at: Date.now(), map };
  return map;
}

/** RDAP の vCard 配列から表示名（fn）を取り出す */
function vcardName(entity: unknown): string | null {
  const vcard = (entity as { vcardArray?: unknown[] } | undefined)?.vcardArray;
  if (!Array.isArray(vcard) || !Array.isArray(vcard[1])) return null;
  for (const field of vcard[1] as unknown[]) {
    if (Array.isArray(field) && field[0] === "fn" && typeof field[3] === "string") return field[3];
  }
  return null;
}

type RdapDomain = {
  ldhName?: string;
  status?: string[];
  events?: { eventAction?: string; eventDate?: string }[];
  entities?: { roles?: string[] }[];
  nameservers?: { ldhName?: string }[];
  secureDNS?: { delegationSigned?: boolean };
};

function eventDate(body: RdapDomain, action: string): string | null {
  const hit = body.events?.find((e) => e.eventAction?.toLowerCase() === action);
  const date = hit?.eventDate;
  return date && !Number.isNaN(Date.parse(date)) ? new Date(date).toISOString() : null;
}

/**
 * 登録情報を取る。RDAP に対応していないTLD・見つからないドメインは null を返し、
 * 通信そのものに失敗したときだけ Error を投げる（呼び出し側で「取得できませんでした」と出す）。
 */
export async function lookupRdap(domain: string): Promise<Registration | null> {
  const base = (await bootstrapMap()).get(topLevelDomain(domain));
  if (!base) return null;

  const { res } = await fetchChecked(`${base}domain/${encodeURIComponent(domain)}`, "application/rdap+json, application/json");
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`登録情報の取得に失敗しました（HTTP ${res.status}）`);
  const { text } = await readCapped(res);
  const body = JSON.parse(text) as RdapDomain;

  return {
    domain: (body.ldhName ?? domain).toLowerCase(),
    registeredAt: eventDate(body, "registration"),
    updatedAt: eventDate(body, "last changed"),
    expiresAt: eventDate(body, "expiration"),
    registrar: body.entities?.map((e) => (e.roles?.includes("registrar") ? vcardName(e) : null)).find((n) => n) ?? null,
    statuses: (body.status ?? []).map((s) => s.toLowerCase()),
    dnssec: typeof body.secureDNS?.delegationSigned === "boolean" ? body.secureDNS.delegationSigned : null,
    nameservers: (body.nameservers ?? []).map((n) => n.ldhName?.toLowerCase()).filter((n): n is string => Boolean(n)),
    source: "RDAP",
  };
}
