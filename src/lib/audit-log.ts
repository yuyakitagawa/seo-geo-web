// /tools/page-audit で検査されたページの記録。Supabase（stock-alert プロジェクトに相乗り）へ送る。
//
// 記録するのは「検査対象のホスト名とパス」と判定結果の要約だけ。次の2つは意図的に残さない:
//   - URLのクエリ文字列（トークンを含むURLを貼られても保存しないため）
//   - 検査を実行した人のIPアドレス・UA
// 保持期間30日は Supabase 側の関数 seogeo_log_audit が挿入のたびに古い行を削除して担保する。
// アプリに渡す鍵は publishable（anon）で、この関数の EXECUTE 以外は何もできない権限にしてある。

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || "";

/** 記録先が設定されていない環境（ローカル・プレビュー）では何もしない */
export const AUDIT_LOG_ENABLED = Boolean(SUPABASE_URL && SUPABASE_KEY);

const TIMEOUT_MS = 3_000;

export type AuditLogEntry = {
  /** 検査対象のURL。クエリ文字列はここで落とす */
  url: string;
  status?: number | null;
  high?: number;
  mid?: number;
  low?: number;
  findingIds?: string[];
  elapsedMs?: number | null;
  error?: string | null;
};

/** 記録に失敗しても診断結果の返却は妨げない（送信結果は握りつぶす） */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  if (!AUDIT_LOG_ENABLED) return;

  let host: string;
  let path: string;
  try {
    const u = new URL(entry.url);
    host = u.hostname;
    path = u.pathname;
  } catch {
    return;
  }
  if (!host) return;

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/seogeo_log_audit`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        authorization: `Bearer ${SUPABASE_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        p_host: host,
        p_path: path,
        p_status: entry.status ?? null,
        p_high: entry.high ?? 0,
        p_mid: entry.mid ?? 0,
        p_low: entry.low ?? 0,
        p_finding_ids: entry.findingIds ?? [],
        p_elapsed_ms: entry.elapsedMs ?? null,
        p_error: entry.error ?? null,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    // 記録は付随的な処理なので、失敗は無視する
  }
}
