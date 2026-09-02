// ドメイン単位の評価API。/tools/domain-power のフォームから呼ばれる。
// 取得は RDAP（src/lib/rdap.ts）・JPRS WHOIS（src/lib/whoisJp.ts）・Open PageRank（src/lib/openPageRank.ts）、
// 判定は src/lib/domainPower.ts の純関数。入力は記録しない。
import { parseDomain } from "@/lib/domain";
import { evaluateDomain } from "@/lib/domainPower";
import { linkDataConfigured, lookupLinkProfile } from "@/lib/openPageRank";
import { lookupRdap, type Registration } from "@/lib/rdap";
import { clientIp, rateLimited } from "@/lib/rateLimit";
import { lookupWhoisJp } from "@/lib/whoisJp";

export const runtime = "nodejs";
export const maxDuration = 30;

const message = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

/** RDAP で取れなければ、.jp だけ JPRS の WHOIS に回す */
async function lookupRegistration(domain: string, suffix: string): Promise<Registration | null> {
  const viaRdap = await lookupRdap(domain);
  if (viaRdap || !suffix.endsWith("jp")) return viaRdap;
  return lookupWhoisJp(domain);
}

export async function POST(request: Request) {
  if (rateLimited(clientIp(request))) {
    return Response.json({ error: "短時間に検査しすぎです。1分ほど空けてから試してください。" }, { status: 429 });
  }

  let raw: string;
  try {
    const body = (await request.json()) as { domain?: unknown };
    raw = String(body.domain ?? "").trim();
  } catch {
    return Response.json({ error: "リクエストの形式が不正です" }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseDomain(raw);
  } catch (e) {
    return Response.json({ error: message(e, "ドメインの形式が正しくありません") }, { status: 400 });
  }

  const [registration, links] = await Promise.all([
    lookupRegistration(parsed.domain, parsed.suffix).then(
      (value) => ({ value, error: null as string | null }),
      (e: unknown) => ({ value: null, error: message(e, "登録情報の取得に失敗しました") }),
    ),
    lookupLinkProfile(parsed.domain).then(
      (value) => ({ value, error: null as string | null }),
      (e: unknown) => ({ value: null, error: message(e, "被リンクデータの取得に失敗しました") }),
    ),
  ]);

  return Response.json(
    evaluateDomain({
      host: parsed.host,
      domain: parsed.domain,
      suffix: parsed.suffix,
      registration: registration.value,
      registrationError: registration.error,
      links: links.value,
      linksError: links.error,
      linksConfigured: linkDataConfigured(),
      now: Date.now(),
    }),
  );
}
