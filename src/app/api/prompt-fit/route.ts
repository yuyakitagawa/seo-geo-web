// 狙っているプロンプトにページが合っているかを判定するAPI。/tools/prompt-fit のフォームから呼ばれる。
// URLを取りに行く場合の取得（SSRF対策・バイト上限・回数制限）は src/lib/fetchPage.ts、判定は src/lib/promptFit.ts。
// 外部のAIや埋め込みAPIは呼ばない。計算はすべてこのサーバー内で完結する。
import { clientIp, fetchChecked, rateLimited, readCapped } from "@/lib/fetchPage";
import { analyze, blocksFromHtml, blocksFromText } from "@/lib/promptFit";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_PROMPTS = 5;
const MAX_PROMPT_LENGTH = 120;
const MAX_TEXT_LENGTH = 120_000;

function readPrompts(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : String(raw ?? "").split("\n");
  const seen = new Set<string>();
  for (const item of list) {
    const p = String(item ?? "").replace(/\s+/g, " ").trim();
    if (!p) continue;
    if (p.length > MAX_PROMPT_LENGTH) throw new Error(`プロンプトは1本${MAX_PROMPT_LENGTH}文字までです`);
    seen.add(p);
    if (seen.size >= MAX_PROMPTS) break;
  }
  return [...seen];
}

export async function POST(request: Request) {
  if (rateLimited(clientIp(request))) {
    return Response.json({ error: "短時間に検査しすぎです。1分ほど空けてから試してください。" }, { status: 429 });
  }

  let url = "";
  let text = "";
  let prompts: string[] = [];
  try {
    const body = (await request.json()) as { url?: unknown; text?: unknown; prompts?: unknown };
    url = String(body.url ?? "").trim();
    text = String(body.text ?? "").slice(0, MAX_TEXT_LENGTH);
    prompts = readPrompts(body.prompts);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "リクエストの形式が不正です" }, { status: 400 });
  }
  if (prompts.length === 0) return Response.json({ error: "狙っているプロンプトを1行に1本ずつ入力してください" }, { status: 400 });

  // 原稿を貼り付けた場合は取得しない（公開前のページを確認できるようにする）
  if (text.trim()) {
    const { title, blocks } = blocksFromText(text);
    if (blocks.length === 0) return Response.json({ error: "本文が読み取れませんでした" }, { status: 400 });
    return Response.json(analyze({ source: "貼り付けた原稿", title, blocks, prompts }));
  }

  if (!url) return Response.json({ error: "URLを入力するか、原稿を貼り付けてください" }, { status: 400 });
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  try {
    const { res, finalUrl } = await fetchChecked(url, "text/html,application/xhtml+xml");
    if (res.status !== 200) return Response.json({ error: `ページが HTTP ${res.status} を返しました` }, { status: 400 });
    const { text: html } = await readCapped(res);
    const { title, blocks } = blocksFromHtml(html);
    return Response.json(analyze({ source: finalUrl, title, blocks, prompts }));
  } catch (e) {
    const message = e instanceof Error ? e.message : "取得に失敗しました";
    const timedOut = /timeout|aborted|signal/i.test(message);
    return Response.json({ error: timedOut ? "取得がタイムアウトしました（12秒）" : message }, { status: 400 });
  }
}
