// フォームから `/api/*` を呼ぶ共通処理。**何も import しない葉**（画面から読むため）。
//
// **応答がJSONでないときに原因を握りつぶさない**のがこのファイルの目的。
// `api/*.ts` はどの分岐でもJSONを返すので、JSONでない応答が来たということは、関数まで届いていないか、
// 関数が落ちたか、間に何かが挟まっている（プレビューのアクセス保護のログイン画面・タイムアウト・502）。
// 以前は3つの画面がそれぞれ `await res.json()` を try で囲み、失敗すると理由に関わらず
// 「通信に失敗しました」とだけ出していた。**画面にも報告にも原因が残らず切り分けができなかった**ので、
// HTTPステータスを文言に出す。
export type PostResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function postJson<T>(path: string, body: unknown, fallback: string): Promise<PostResult<T>> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // ここだけが本当の通信失敗（オフライン・DNS・接続断）
    return { ok: false, error: "通信できませんでした。ネットワークを確認して、時間を置いて試してください。" };
  }

  let text: string;
  try {
    text = await res.text();
  } catch {
    return { ok: false, error: `応答の受信が途中で切れました（HTTP ${res.status}）。時間を置いて試してください。` };
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return {
      ok: false,
      error: `サーバーがJSONを返しませんでした（HTTP ${res.status}）。APIまで届いていないか、処理が時間切れになっています。`,
    };
  }

  if (!res.ok) {
    const message = (data as { error?: unknown } | null)?.error;
    return { ok: false, error: typeof message === "string" && message ? message : `${fallback}（HTTP ${res.status}）` };
  }
  return { ok: true, data: data as T };
}
