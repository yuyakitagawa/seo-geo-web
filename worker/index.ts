// サイトは 2026-10-25 に閉鎖した（docs/progress_close-site.md）。全URL（ページ・/api/*・robots.txt・sitemap.xml を含む）に 410 Gone を返す。
// robots.txt も 410 にするのは、4xx の robots.txt はクロール制限なしとして扱われ、各URLの 410 を検索エンジンが受け取れるようにするため。
// 再開するときはこのファイルと wrangler.jsonc を閉鎖前のコミットに戻す。
const NOTICE = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>SEO GEO Lab は閉鎖しました</title>
<style>
  :root { color-scheme: light dark; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px;
         font-family: system-ui, -apple-system, "Hiragino Sans", sans-serif; line-height: 1.8;
         background: #fafafa; color: #222; }
  @media (prefers-color-scheme: dark) { body { background: #111; color: #eee; } }
  main { max-width: 32rem; }
  h1 { font-size: 1.25rem; margin: 0 0 .75rem; }
  p { margin: 0 0 .5rem; }
</style>
</head>
<body>
<main>
  <h1>このサイトは閉鎖しました</h1>
  <p>SEO GEO Lab はサイトの運営を終了しました。これまでご覧いただき、ありがとうございました。</p>
  <p lang="en">This site has been closed. Thank you for reading.</p>
</main>
</body>
</html>
`;

const worker = {
  async fetch(request: Request): Promise<Response> {
    const headers = {
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex",
      "cache-control": "public, max-age=3600",
    };
    return new Response(request.method === "HEAD" ? null : NOTICE, { status: 410, headers });
  },
};

export default worker;
