// 公開URLを1本取得し、見出し直後の本文を引用しやすさ診断にかけるAPI。
// SSRF対策・サイズ上限は共通の fetchPage.ts に任せる。
import { fetchChecked, readCapped } from "../src/lib/fetchPage";
import { diagnoseQuoteReadiness, extractPageContentHtml } from "../src/lib/quoteReadiness";
import { clientIp, rateLimited, sameOrigin } from "../src/lib/rateLimit";

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: "引用しやすさ診断のフォームから実行してください" }, { status: 403 });
  }
  if (rateLimited(clientIp(request))) {
    return Response.json({ error: "短時間に診断しすぎです。1分ほど空けてから試してください。" }, { status: 429 });
  }

  let url: string;
  try {
    const body = (await request.json()) as { url?: unknown };
    url = String(body.url ?? "").trim();
  } catch {
    return Response.json({ error: "リクエストの形式が不正です" }, { status: 400 });
  }
  if (!url) return Response.json({ error: "URLを入力してください" }, { status: 400 });
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  try {
    const { res, finalUrl } = await fetchChecked(url, "text/html,application/xhtml+xml");
    if (!res.ok) {
      await res.body?.cancel();
      return Response.json({ error: `ページを取得できませんでした（HTTP ${res.status}）` }, { status: 400 });
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) {
      await res.body?.cancel();
      return Response.json({ error: "HTMLページのURLを入力してください" }, { status: 400 });
    }
    const body = await readCapped(res);
    if (body.truncated) return Response.json({ error: "ページのHTMLが大きすぎます（上限2MB）" }, { status: 413 });

    const result = diagnoseQuoteReadiness(extractPageContentHtml(body.text));
    if (result.blocks.length === 0) {
      return Response.json({ error: "取得したHTMLにH2〜H6の見出しが見つかりませんでした" }, { status: 422 });
    }
    return Response.json({ ...result, finalUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "取得に失敗しました";
    return Response.json({ error: /timeout|aborted|signal/i.test(message) ? "取得がタイムアウトしました（12秒）" : message }, { status: 400 });
  }
}
