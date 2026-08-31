// お問い合わせの転送先。サイトのDBには何も保存せず、届いた内容をそのまま運営者へ送る。
//   LINE: LINE_CHANNEL_ACCESS_TOKEN / LINE_USER_ID（記事公開の通知と同じBot）
//   メール: RESEND_API_KEY / CONTACT_FROM_EMAIL / CONTACT_TO_EMAIL（Resend。ドメイン認証が要る）
// 両方設定されていれば両方へ送る。1つも設定されていない環境ではフォーム自体を出さない。
import { contactMessage, contactSubject, type ContactValid } from "@/lib/contact";
import { LINE_ENABLED, linePush } from "@/lib/line";
import { HAS_CONTACT } from "@/lib/site";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const CONTACT_FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || "";
const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL || "";

/** どの経路で運営者に届くか。/privacy の記載を実装に合わせるために公開する */
export const CONTACT_MAIL_ENABLED = Boolean(RESEND_API_KEY && CONTACT_FROM_EMAIL && CONTACT_TO_EMAIL);
export const CONTACT_LINE_ENABLED = LINE_ENABLED;

/** 転送先が1つも無ければフォームは出さない（送っても届かないため） */
export const CONTACT_FORM_ENABLED = CONTACT_LINE_ENABLED || CONTACT_MAIL_ENABLED;

/** /contact を公開するか。フォームか、envの窓口（メール・外部フォーム・X）のどれかがあればよい */
export const HAS_CONTACT_PAGE = CONTACT_FORM_ENABLED || HAS_CONTACT;

const TIMEOUT_MS = 8_000;

async function sendMail(v: ContactValid, body: string): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: CONTACT_FROM_EMAIL,
      to: [CONTACT_TO_EMAIL],
      // フォームに入力されたアドレスは差出人にはできない（なりすましになる）ので返信先に入れる。
      ...(v.email ? { reply_to: v.email } : {}),
      subject: contactSubject(v),
      text: body,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Resend ${res.status} ${await res.text()}`);
}

/** 設定されている宛先すべてに送る。1つでも届けば成功とする */
export async function deliverContact(v: ContactValid): Promise<boolean> {
  const body = contactMessage(v);
  const results = await Promise.allSettled([
    CONTACT_LINE_ENABLED ? linePush([body]) : Promise.resolve(false),
    CONTACT_MAIL_ENABLED ? sendMail(v, body).then(() => true) : Promise.resolve(false),
  ]);
  for (const r of results) {
    if (r.status === "rejected") console.error("お問い合わせの転送に失敗しました:", r.reason);
  }
  return results.some((r) => r.status === "fulfilled" && r.value === true);
}
