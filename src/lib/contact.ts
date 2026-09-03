// お問い合わせフォームの入力仕様と検証。クライアント（入力欄の上限表示）とAPIの両方が読むので、
// ここには環境変数を持ち込まない（送信先は src/lib/contact-notify.ts）。
import { SITE_NAME } from "./site";

/** 用件。プルダウンの選択肢であり、通知の件名にもなる */
export const CONTACT_TOPICS = {
  correction: "記事の誤り・古い情報の指摘",
  rights: "権利関係のご連絡",
  request: "取り上げてほしいテーマ",
  tool: "ツールの不具合",
  other: "その他",
} as const;

export type ContactTopic = keyof typeof CONTACT_TOPICS;

export const CONTACT_LIMITS = { name: 60, email: 254, message: 2000 } as const;
const MESSAGE_MIN = 10;

export type ContactInput = {
  topic: string;
  name: string;
  email: string;
  message: string;
};

export type ContactValid = ContactInput & { topic: ContactTopic };

/** 入力の検証。エラー文はそのまま画面に出す */
export function validateContact(raw: Partial<Record<keyof ContactInput, unknown>>): { ok: true; value: ContactValid } | { ok: false; error: string } {
  const topic = String(raw.topic ?? "").trim();
  const name = String(raw.name ?? "").trim();
  const email = String(raw.email ?? "").trim();
  const message = String(raw.message ?? "").trim();

  if (!(topic in CONTACT_TOPICS)) return { ok: false, error: "用件を選んでください" };
  if (name.length > CONTACT_LIMITS.name) return { ok: false, error: `お名前は${CONTACT_LIMITS.name}文字までです` };
  // 返信不要のご連絡もあるためメールは任意。入れる場合だけ形式を見る。
  if (email && (email.length > CONTACT_LIMITS.email || !/^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(email))) {
    return { ok: false, error: "メールアドレスの形式が正しくありません" };
  }
  if (message.length < MESSAGE_MIN) return { ok: false, error: `お問い合わせ内容は${MESSAGE_MIN}文字以上で入力してください` };
  if (message.length > CONTACT_LIMITS.message) return { ok: false, error: `お問い合わせ内容は${CONTACT_LIMITS.message}文字までです` };

  return { ok: true, value: { topic: topic as ContactTopic, name, email, message } };
}

/** 通知1通ぶんの文面。LINEもメール本文もこれをそのまま使う（プレーンテキスト） */
export function contactMessage(v: ContactValid): string {
  return [
    `📮 ${SITE_NAME} お問い合わせ`,
    "",
    `用件: ${CONTACT_TOPICS[v.topic]}`,
    `お名前: ${v.name || "（未記入）"}`,
    `返信先: ${v.email || "（未記入・返信不要）"}`,
    "",
    v.message,
  ].join("\n");
}

export function contactSubject(v: ContactValid): string {
  return `[${SITE_NAME}] ${CONTACT_TOPICS[v.topic]}${v.name ? `（${v.name}）` : ""}`;
}
