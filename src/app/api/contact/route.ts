// お問い合わせフォームの送信先。検証は src/lib/contact.ts、転送は src/lib/contact-notify.ts。
// 内容はここでも記録しない（ログにも出さない）。届かなかったときだけエラーを返す。
import { validateContact } from "@/lib/contact";
import { CONTACT_FORM_ENABLED, deliverContact } from "@/lib/contact-notify";
import { clientIp, rateLimited } from "@/lib/rateLimit";

export const runtime = "nodejs";

// 人が手で書く長さの下限。これより速い送信は自動投稿とみなす。
const MIN_ELAPSED_MS = 3_000;

export async function POST(request: Request) {
  if (!CONTACT_FORM_ENABLED) {
    return Response.json({ error: "フォームは現在停止しています" }, { status: 503 });
  }
  if (rateLimited(clientIp(request), 3)) {
    return Response.json({ error: "短時間に送信しすぎです。1分ほど空けてから試してください。" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "リクエストの形式が不正です" }, { status: 400 });
  }

  // ハニーポット（人には見えない入力欄）と、開いてすぐの送信は捨てる。
  // 捨てたことが分かると回避されるので、送信できたときと同じ応答を返す。
  const trap = String(body.company ?? "").trim();
  const elapsed = Number(body.elapsed ?? 0);
  if (trap || !Number.isFinite(elapsed) || elapsed < MIN_ELAPSED_MS) return Response.json({ ok: true });

  const check = validateContact(body);
  if (!check.ok) return Response.json({ error: check.error }, { status: 400 });

  try {
    if (!(await deliverContact(check.value))) throw new Error("no delivery channel succeeded");
  } catch {
    return Response.json(
      { error: "送信に失敗しました。時間をおいて試すか、お問い合わせページ記載の窓口からご連絡ください。" },
      { status: 502 },
    );
  }
  return Response.json({ ok: true });
}
