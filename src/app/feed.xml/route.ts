import { getAllArticles } from "@/lib/content";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

function escape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function GET() {
  const items = getAllArticles()
    .slice(0, 20)
    .map(
      (a) => `<item>
  <title>${escape(a.title)}</title>
  <link>${SITE_URL}/articles/${a.slug}</link>
  <guid isPermaLink="true">${SITE_URL}/articles/${a.slug}</guid>
  <pubDate>${new Date(`${a.date}T00:00:00+09:00`).toUTCString()}</pubDate>
  <description>${escape(a.description)}</description>
</item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escape(SITE_NAME)}</title>
  <link>${SITE_URL}</link>
  <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
  <description>${escape(SITE_DESCRIPTION)}</description>
  <language>ja</language>
${items}
</channel>
</rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
