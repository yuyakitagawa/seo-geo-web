// Cloudflare Workers の入口。/api/* だけここで受け、それ以外は静的ファイル（out/）をそのまま返す。
// 各APIの中身は Vercel と共通の api/*.ts（Web標準の Request → Response）。ここは振り分けだけを持ち、判定を書き足さない。
// 環境変数は nodejs_compat により process.env に入るので、src/lib 側はそのまま読める。
import { POST as audit } from "../api/audit";
import { POST as contact } from "../api/contact";
import { POST as quoteReadiness } from "../api/quote-readiness";
import { POST as siteReport } from "../api/site-report";

type Env = { ASSETS: { fetch(request: Request): Promise<Response> } };

const routes: Record<string, (request: Request) => Promise<Response>> = {
  "/api/audit": audit,
  "/api/contact": contact,
  "/api/quote-readiness": quoteReadiness,
  "/api/site-report": siteReport,
};

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    const handler = routes[pathname];
    if (!handler) return env.ASSETS.fetch(request);
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: { allow: "POST" } });
    }
    // src/lib/rateLimit.ts の clientIp() は x-forwarded-for を見る。Cloudflare では送り主が書ける値なので、
    // Cloudflare が付ける（偽れない）cf-connecting-ip で上書きしてから渡す。
    const headers = new Headers(request.headers);
    headers.set("x-forwarded-for", request.headers.get("cf-connecting-ip") ?? "unknown");
    return handler(new Request(request, { headers }));
  },
};

export default worker;
