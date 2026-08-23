// Google News RSS の記事URL（news.google.com/rss/articles/<id>）を元記事URLに復号する。
// 記事ページに埋め込まれた署名(data-n-a-sg)とタイムスタンプ(data-n-a-ts)を使って
// Google News 内部の batchexecute を呼ぶ方式。失敗したら元の Google News URL のまま返す。
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export function isGoogleNewsUrl(u: string) {
  return /^https:\/\/news\.google\.com\/rss\/articles\//.test(u);
}

export async function resolveGoogleNewsUrl(u: string): Promise<string> {
  try {
    const id = u.split("/rss/articles/")[1]?.split("?")[0];
    if (!id) return u;
    const page = await (await fetch(`https://news.google.com/rss/articles/${id}`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15000) })).text();
    const sg = page.match(/data-n-a-sg="([^"]+)"/)?.[1];
    const ts = page.match(/data-n-a-ts="([^"]+)"/)?.[1];
    if (!sg || !ts) return u;

    const inner = JSON.stringify(["garturlreq", [["X", "X", ["X", "X"], null, null, 1, 1, "US:en", null, 1, null, null, null, null, null, 0, 1], "X", "X", 1, [1, 1, 1], 1, 1, null, 0, 0, null, 0], id, Number(ts), sg]);
    const body = new URLSearchParams({ "f.req": JSON.stringify([[["Fbv4je", inner, null, "generic"]]]) });
    const res = await fetch("https://news.google.com/_/DotsSplashUi/data/batchexecute", {
      method: "POST",
      headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body,
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();
    // 応答は ")]}'" 付きの複数JSON。"Fbv4je" の結果文字列の中に [\"garturlres\",\"<url>\", ...] が入っている。
    const m = text.match(/garturlres\\",\\"(https?:[^"\\]+)/);
    return m ? m[1].replace(/\\u003d/g, "=").replace(/\\u0026/g, "&") : u;
  } catch {
    return u;
  }
}
