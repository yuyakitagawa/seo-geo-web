// LINE Messaging API のPush送信。記事公開の通知（scripts/notify.ts）と
// お問い合わせの転送（src/lib/contact-notify.ts）が共有する。
// LINE_CHANNEL_ACCESS_TOKEN / LINE_USER_ID が無い環境では LINE_ENABLED が false になる。

export const LINE_ENABLED = Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_USER_ID);

const MAX_MESSAGES = 5; // 1回のpushで送れる上限
const MAX_CHARS = 4900; // 1メッセージの上限（5000）に少し余裕を持たせる
const TIMEOUT_MS = 8_000;

/** 送れたら true。未設定なら false（例外は投げない）。API側のエラーは例外にする */
export async function linePush(messages: string[]): Promise<boolean> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const to = process.env.LINE_USER_ID;
  if (!token || !to) return false;

  // 1回のpushで5通まで。超える分は続けて送る（黙って捨てると投稿文が欠ける）。
  for (let i = 0; i < messages.length; i += MAX_MESSAGES) {
    await pushOnce(token, to, messages.slice(i, i + MAX_MESSAGES));
  }
  return true;
}

async function pushOnce(token: string, to: string, messages: string[]): Promise<void> {
  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      to,
      messages: messages.map((text) => ({ type: "text", text: text.slice(0, MAX_CHARS) })),
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`LINE ${res.status} ${await res.text()}`);
}
