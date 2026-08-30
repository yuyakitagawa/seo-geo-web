// URLを1本取得して、SEO/GEOの観点で直すべき箇所を洗い出す検査。
// 取得（fetch）は src/app/api/audit/route.ts が担当し、ここは受け取ったHTMLを判定するだけの純関数にする。
// 指摘は「該当コード（実物）＋修正方針＋入れる場所＋修正後のコード」で返す。根拠がある項目には公式ドキュメントを添える。
// 「無い」ものの指摘は該当コードが取れないので、実物のheadや見出しを並べて追加位置に印を入れる（headSpot）。
import { parse, type HTMLElement } from "node-html-parser";
import { CRAWLERS } from "./crawlers";
import { check, parseRobots } from "./robots";

export type Severity = "high" | "mid" | "low" | "ok";
export type Area = "tech" | "seo" | "geo";

export const SEVERITY_LABEL: Record<Severity, string> = { high: "要修正", mid: "直したい", low: "検討", ok: "問題なし" };
export const AREA_LABEL: Record<Area, string> = { tech: "技術", seo: "SEO", geo: "GEO（AI検索）" };

export type Finding = {
  id: string;
  area: Area;
  severity: Severity;
  /** 何が問題か（結論を先に） */
  title: string;
  /** なぜ直すか。1〜2文 */
  detail: string;
  /** 実際のページから抜き出した該当コード */
  code?: string;
  /** どう直すか */
  fix?: string;
  /** 修正後のコード例 */
  fixCode?: string;
  /** どこに入れるか。実物の周辺コードに印をつけて返す */
  where?: { note: string; code?: string };
  source?: { title: string; url: string };
};

export type AuditInput = {
  /** 入力されたURL */
  url: string;
  /** リダイレクト後の最終URL */
  finalUrl: string;
  status: number;
  headers: Record<string, string>;
  html: string;
  /** 同じホストの /robots.txt（取得できなければ null） */
  robotsTxt: string | null;
  /** 同じホストの /llms.txt が 200 で返ったか */
  hasLlmsTxt: boolean;
  bytes: number;
  elapsedMs: number;
  redirects: string[];
};

export type AuditResult = {
  finalUrl: string;
  status: number;
  bytes: number;
  elapsedMs: number;
  redirects: string[];
  textLength: number;
  findings: Finding[];
  counts: Record<Severity, number>;
};

const G = (path: string, title: string) => ({ title, url: `https://developers.google.com/search/docs/${path}` });
const SRC = {
  title: G("appearance/snippet", "Google 検索セントラル: タイトルリンクとスニペットの管理"),
  starter: G("fundamentals/seo-starter-guide", "Google 検索セントラル: SEO スターター ガイド"),
  structured: G("appearance/structured-data/intro-structured-data", "Google 検索セントラル: 構造化データの仕組み"),
  article: G("appearance/structured-data/article", "Google 検索セントラル: Article 構造化データ"),
  faq: G("appearance/structured-data/faqpage", "Google 検索セントラル: FAQ 構造化データ"),
  robots: G("crawling-indexing/robots/intro", "Google 検索セントラル: robots.txt の概要"),
  ai: G("appearance/ai-features", "Google 検索セントラル: AI 機能と Google 検索"),
  helpful: G("fundamentals/creating-helpful-content", "Google 検索セントラル: 有用で信頼性の高いコンテンツの作成"),
  llms: { title: "llms.txt 提案仕様", url: "https://llmstxt.org/" },
};

/** タグをそのまま見せるための整形。長すぎる場合は省略する */
function snippet(s: string, max = 300): string {
  const one = s.replace(/\s+/g, " ").trim();
  return one.length > max ? one.slice(0, max) + " …" : one;
}

/** head の実物を並べ、追加する位置に印を入れる */
function headSpot(head: HTMLElement | null | undefined, marker: string): string | undefined {
  if (!head) return undefined;
  const tags = head.childNodes
    .filter((n): n is HTMLElement => typeof (n as HTMLElement).tagName === "string")
    .map((el) => snippet(`<${el.tagName.toLowerCase()}${el.rawAttrs ? " " + el.rawAttrs : ""}>`, 90));
  const shown = tags.slice(0, 5);
  const rest = tags.length - shown.length;
  return [
    "<head>",
    ...shown.map((t) => "  " + t),
    rest > 0 ? `  …（他 ${rest} 行）` : null,
    `  ${marker}`,
    "</head>",
  ]
    .filter((l): l is string => l !== null)
    .join("\n");
}

function textOf(root: HTMLElement): string {
  const clone = parse(root.toString());
  clone.querySelectorAll("script, style, noscript, template, svg").forEach((n) => n.remove());
  return clone.text.replace(/\s+/g, " ").trim();
}

export function audit(input: AuditInput): AuditResult {
  const findings: Finding[] = [];
  const add = (f: Finding) => findings.push(f);

  const root = parse(input.html);
  const head = root.querySelector("head");
  const body = root.querySelector("body") ?? root;
  const text = textOf(body);
  const path = new URL(input.finalUrl).pathname;

  // ---------- 技術 ----------
  if (input.status !== 200) {
    add({
      id: "status",
      area: "tech",
      severity: "high",
      title: `HTTPステータスが ${input.status} を返しています`,
      detail: "200以外のページは検索にもAI検索にも載りません。まずここを直さないと他の項目は意味を持ちません。",
      code: `HTTP ${input.status} ${input.finalUrl}`,
      fix: "公開したいURLなら200を返すように直します。移転済みなら301で新URLへ、削除済みなら410を返します。",
    });
  }

  if (input.redirects.length > 0) {
    add({
      id: "redirect",
      area: "tech",
      severity: input.redirects.length > 1 ? "mid" : "low",
      title: `リダイレクトが${input.redirects.length}回発生しています`,
      detail: "リダイレクトが連鎖すると、クロール予算を消費し、表示も遅くなります。",
      code: [input.url, ...input.redirects].join("\n  → "),
      fix: "リンク元とサイトマップの記述を、最終URLに直接書き換えます。",
    });
  }

  const xRobots = input.headers["x-robots-tag"] ?? "";
  const metaRobots = head?.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "";
  const noindex = /noindex/i.test(xRobots) || /noindex/i.test(metaRobots);
  if (noindex) {
    add({
      id: "noindex",
      area: "tech",
      severity: "high",
      title: "noindex が指定されています",
      detail: "このページは検索結果に登録されません。AI検索の引用元にもなりません。",
      code: metaRobots ? `<meta name="robots" content="${metaRobots}">` : `X-Robots-Tag: ${xRobots}`,
      fix: "検索に載せたいページなら noindex を外します。意図的な除外なら、このページを対策対象から外します。",
      source: SRC.starter,
    });
  }

  const html = root.querySelector("html");
  const lang = html?.getAttribute("lang");
  if (!lang) {
    add({
      id: "lang",
      area: "tech",
      severity: "mid",
      title: "html要素に lang 属性がありません",
      detail: "言語が宣言されていないと、日本語ページとして扱われない場合があります。読み上げ環境にも影響します。",
      code: snippet(html ? `<html${html.rawAttrs ? " " + html.rawAttrs : ""}>` : "<html>"),
      fix: "日本語ページなら lang=\"ja\" を指定します。",
      fixCode: '<html lang="ja">',
    });
  }

  if (!head?.querySelector('meta[name="viewport"]')) {
    add({
      id: "viewport",
      area: "tech",
      severity: "mid",
      title: "viewport の指定がありません",
      detail: "スマートフォンで拡大縮小前提の表示になり、モバイルでの評価と回遊に影響します。",
      fix: "head に viewport を1行足します。",
      fixCode: '<meta name="viewport" content="width=device-width, initial-scale=1">',
      where: { note: "head の中。<meta charset> の直後が定番です。", code: headSpot(head, "<!-- ここに viewport を追加 -->") },
    });
  }

  const canonical = head?.querySelector('link[rel="canonical"]');
  const canonicalHref = canonical?.getAttribute("href") ?? "";
  if (!canonicalHref) {
    add({
      id: "canonical",
      area: "tech",
      severity: "mid",
      title: "canonical が指定されていません",
      detail: "パラメータ付きURLや末尾スラッシュ違いが別ページとして扱われ、評価が分散します。",
      fix: "自分自身の正規URLを絶対URLで指定します。",
      fixCode: `<link rel="canonical" href="${input.finalUrl}">`,
      where: { note: "head の中。title の近くにまとめると管理しやすくなります。", code: headSpot(head, "<!-- ここに canonical を追加 -->") },
      source: SRC.starter,
    });
  } else if (!/^https?:\/\//i.test(canonicalHref)) {
    add({
      id: "canonical-relative",
      area: "tech",
      severity: "low",
      title: "canonical が相対URLです",
      detail: "相対指定でも解釈されますが、絶対URLのほうが誤解釈が起きません。",
      code: `<link rel="canonical" href="${canonicalHref}">`,
      fix: "スキームとホストを含む絶対URLに直します。",
      fixCode: `<link rel="canonical" href="${input.finalUrl}">`,
    });
  }

  if (input.elapsedMs > 2000) {
    add({
      id: "slow",
      area: "tech",
      severity: input.elapsedMs > 4000 ? "mid" : "low",
      title: `HTMLの取得に ${(input.elapsedMs / 1000).toFixed(1)} 秒かかりました`,
      detail: "サーバーの応答が遅いと、クロール頻度と体感速度の両方に影響します。",
      code: `${input.elapsedMs} ms / ${(input.bytes / 1024).toFixed(0)} KB`,
      fix: "キャッシュ（CDN・静的化）とサーバー側の処理時間を見直します。",
    });
  }

  // ---------- SEO ----------
  const titleEl = head?.querySelector("title");
  const title = titleEl?.text.trim() ?? "";
  if (!title) {
    add({
      id: "title",
      area: "seo",
      severity: "high",
      title: "title がありません",
      detail: "検索結果の見出しになる最重要要素です。無い場合はGoogleが本文から生成します。",
      fix: "ページ固有の語を前半に入れた title を書きます。",
      fixCode: "<title>（ページ固有の語） | （サイト名）</title>",
      where: { note: "head の中。<meta charset> の直後に置きます。", code: headSpot(head, "<!-- ここに title を追加 -->") },
      source: SRC.title,
    });
  } else if (title.length > 60 || title.length < 10) {
    add({
      id: "title-length",
      area: "seo",
      severity: "low",
      title: `title が${title.length}文字です`,
      detail: "長すぎると検索結果で省略され、短すぎると内容が伝わりません。日本語では30字前後で主要な語が収まります。",
      code: `<title>${title}</title>`,
      fix: title.length > 60 ? "固有名詞を前半に残し、後半の修飾を削ります。" : "何のページかが分かる語を足します。",
      source: SRC.title,
    });
  }

  const descEl = head?.querySelector('meta[name="description"]');
  const desc = descEl?.getAttribute("content")?.trim() ?? "";
  if (!desc) {
    add({
      id: "description",
      area: "seo",
      severity: "mid",
      title: "meta description がありません",
      detail: "スニペットが本文から自動生成され、意図した要約が出せません。",
      fix: "90〜120字で、そのページだけの内容を書きます。",
      fixCode: '<meta name="description" content="（90〜120字の要約）">',
      where: { note: "head の中、title の直後。", code: headSpot(head, "<!-- ここに description を追加 -->") },
      source: SRC.title,
    });
  } else if (desc.length > 160) {
    add({
      id: "description-length",
      area: "seo",
      severity: "low",
      title: `meta description が${desc.length}文字です`,
      detail: "長い部分は検索結果で省略されます。前半に結論を置きます。",
      code: snippet(desc, 200),
      fix: "120字程度に削り、前半に結論を移します。",
    });
  }

  const firstHeadingEl = body.querySelector("h2, h3, h4, h5, h6");
  const firstHeadingSpot = firstHeadingEl ? `<!-- ここに h1 を追加 -->\n${snippet(firstHeadingEl.outerHTML, 140)}` : undefined;
  const h1s = body.querySelectorAll("h1");
  if (h1s.length === 0) {
    add({
      id: "h1",
      area: "seo",
      severity: "high",
      title: "h1 がありません",
      detail: "ページの主題を示す見出しが無いと、検索エンジンもAIも何のページか判断しにくくなります。",
      fix: "ページの主題を1つだけ h1 に置きます。",
      fixCode: "<h1>（このページの主題）</h1>",
      where: { note: "本文の一番上。既存の見出しより前に置きます。", code: firstHeadingSpot },
      source: SRC.starter,
    });
  } else if (h1s.length > 1) {
    add({
      id: "h1-multiple",
      area: "seo",
      severity: "mid",
      title: `h1 が${h1s.length}個あります`,
      detail: "主題が複数あると解釈され、どれがページの中心か伝わりません。",
      code: h1s.slice(0, 3).map((h) => snippet(h.outerHTML, 120)).join("\n"),
      fix: "主題の1つだけを h1 に残し、他は h2 に下げます。",
    });
  }

  // 見出しの階層飛び（h2 の前に h3 が出る等）
  const headings = body.querySelectorAll("h1, h2, h3, h4, h5, h6");
  let prev = 0;
  const jumps: string[] = [];
  for (const h of headings) {
    const level = Number(h.tagName.slice(1));
    if (prev && level > prev + 1) jumps.push(`h${prev} → h${level}: ${snippet(h.text, 40)}`);
    prev = level;
  }
  if (jumps.length > 0) {
    add({
      id: "heading-order",
      area: "seo",
      severity: "low",
      title: `見出しの階層が${jumps.length}か所で飛んでいます`,
      detail: "階層が飛ぶと、どのセクションに属する話かが機械的に読めません。AIが本文を切り出すときの単位もずれます。",
      code: jumps.slice(0, 5).join("\n"),
      fix: "見た目の大きさではなく、話の入れ子で h2 → h3 の順に振り直します。",
    });
  }

  const imgs = body.querySelectorAll("img");
  const noAlt = imgs.filter((i) => i.getAttribute("alt") === undefined);
  if (noAlt.length > 0) {
    add({
      id: "img-alt",
      area: "seo",
      severity: "mid",
      title: `alt の無い img が${noAlt.length}個あります（全${imgs.length}個）`,
      detail: "画像の内容がテキストとして残らず、画像検索にも読み上げにも使われません。",
      code: noAlt.slice(0, 3).map((i) => snippet(i.outerHTML, 140)).join("\n"),
      fix: "内容を説明する alt を書きます。装飾画像は alt=\"\" を明示します。",
      fixCode: '<img src="..." alt="（画像の内容を説明する文）">',
    });
  }

  const ogTitle = head?.querySelector('meta[property="og:title"]');
  const ogImage = head?.querySelector('meta[property="og:image"]');
  if (!ogTitle || !ogImage) {
    add({
      id: "ogp",
      area: "seo",
      severity: "low",
      title: "OGPの指定が不足しています",
      detail: "SNSやチャットに貼られたときのカードが作られず、クリック率が落ちます。",
      code: [ogTitle ? null : "og:title なし", ogImage ? null : "og:image なし"].filter(Boolean).join(" / "),
      fix: "og:title / og:description / og:image を head に足します。",
      where: { note: "head の中、既存の meta と並べて置きます。", code: headSpot(head, "<!-- ここに OGP を追加 -->") },
      fixCode: `<meta property="og:title" content="（ページタイトル）">\n<meta property="og:image" content="https://.../ogp.png">`,
    });
  }

  // ---------- 構造化データ ----------
  const ldNodes = root.querySelectorAll('script[type="application/ld+json"]');
  const types: string[] = [];
  let ldError = "";
  for (const n of ldNodes) {
    try {
      const data = JSON.parse(n.text);
      const list = Array.isArray(data) ? data : [data];
      for (const d of list) {
        const graph = Array.isArray(d?.["@graph"]) ? d["@graph"] : [d];
        for (const g of graph) if (g?.["@type"]) types.push(String(g["@type"]));
      }
    } catch (e) {
      ldError = (e as Error).message;
    }
  }
  if (ldNodes.length === 0) {
    add({
      id: "jsonld",
      area: "seo",
      severity: "mid",
      title: "構造化データ（JSON-LD）がありません",
      detail: "ページの種類・著者・日付が機械可読になりません。リッチリザルトの対象にもなりません。",
      fix: "記事ページなら Article、一覧なら ItemList、全ページに BreadcrumbList を入れます。",
      fixCode: `<script type="application/ld+json">\n{"@context":"https://schema.org","@type":"Article","headline":"...","datePublished":"2026-08-30"}\n</script>`,
      where: { note: "head の中（body の末尾でも読まれます）。", code: headSpot(head, "<!-- ここに JSON-LD を追加 -->") },
      source: SRC.structured,
    });
  } else if (ldError) {
    add({
      id: "jsonld-broken",
      area: "seo",
      severity: "high",
      title: "JSON-LD が壊れています（パースできません）",
      detail: "構文エラーがあると、その構造化データは丸ごと無視されます。",
      code: ldError,
      fix: "JSONとして正しいかを検証します。本文中の引用符やコメントが混ざっていないか確認します。",
      source: SRC.structured,
    });
  }

  const isArticleLike = types.some((t) => /Article|BlogPosting|NewsArticle/i.test(t));
  if (isArticleLike) {
    const raw = ldNodes.map((n) => n.text).join(" ");
    const missing = ["datePublished", "headline"].filter((k) => !raw.includes(k));
    if (missing.length > 0) {
      add({
        id: "article-props",
        area: "seo",
        severity: "low",
        title: `Article 構造化データに ${missing.join(" / ")} がありません`,
        detail: "見出しと公開日が無いと、記事としての基本情報が機械可読になりません。",
        fix: "headline と datePublished（更新があれば dateModified）を追加します。",
        source: SRC.article,
      });
    }
  }

  // ---------- GEO（AI検索） ----------
  const scripts = root.querySelectorAll("script").length;
  if (text.length < 400) {
    add({
      id: "thin-html",
      area: "geo",
      severity: "high",
      title: `サーバーが返すHTMLに本文が${text.length}文字しかありません`,
      detail:
        scripts > 3
          ? "本文がJavaScriptで描画されている可能性があります。AI検索のクローラーの多くはJSを実行しないため、引用対象になりません。"
          : "引用できる本文がほとんどありません。AI検索は抜き出せる文章がないページを回答に使えません。",
      code: `本文テキスト ${text.length}文字 / script ${scripts}個 / HTML ${(input.bytes / 1024).toFixed(0)}KB`,
      fix: "本文をサーバー側で出力します（SSR・静的生成）。ソースを表示して本文が入っているかで確認できます。",
      source: SRC.ai,
    });
  }

  // 冒頭の直答: 最初の見出しの次に出てくる段落
  const firstP = body.querySelectorAll("p").find((p) => p.text.trim().length > 20);
  const lead = firstP?.text.replace(/\s+/g, " ").trim() ?? "";
  const firstSentence = lead.split(/(?<=。)/)[0] ?? "";
  if (!lead) {
    add({
      id: "no-lead",
      area: "geo",
      severity: "mid",
      title: "冒頭に段落がありません",
      detail: "AI検索と強調スニペットは、質問にそのまま答える短い一段落を抜き出します。抜き出す対象がない状態です。",
      fix: "見出しの直後に、ページの問いへの答えを1〜3文で置きます。",
      where: { note: "h1 の直後、最初の h2 より前。" },
      source: SRC.ai,
    });
  } else if (firstSentence.length > 120) {
    add({
      id: "lead-long",
      area: "geo",
      severity: "low",
      title: `冒頭の1文が${firstSentence.length}文字あります`,
      detail: "1文が長いと、そのまま抜き出せる断片になりません。前置きから始まっている場合はさらに使われません。",
      code: snippet(firstSentence, 200),
      fix: "1文目を「主語＋結論」の60字以内に書き換え、背景は2文目以降に回します。",
      source: SRC.ai,
    });
  }

  const hasFaqJsonLd = types.some((t) => /FAQPage/i.test(t));
  const hasFaqHeading = headings.some((h) => /よくある質問|FAQ|Q&A/i.test(h.text));
  if (!hasFaqJsonLd && !hasFaqHeading) {
    add({
      id: "faq",
      area: "geo",
      severity: "low",
      title: "質問と回答の形式がありません",
      detail: "AI検索は質問文に対応する短い回答を探します。見出しを質問文にした節があると、そのまま引用の単位になります。",
      fix: "「よくある質問」の見出しを作り、質問文の見出しの直下に、単体で意味が通る2〜3文の回答を書きます。",
      fixCode: "## よくある質問\n### （質問文）\n（質問を読まなくても意味が通る回答）",
      where: { note: "本文の末尾。まとめの前後に節として置きます。" },
      source: SRC.faq,
    });
  } else if (hasFaqHeading && !hasFaqJsonLd) {
    add({
      id: "faq-jsonld",
      area: "geo",
      severity: "low",
      title: "FAQの見出しはありますが FAQPage 構造化データがありません",
      detail: "本文のFAQを機械可読にできていません。可視テキストと同じ文言で宣言します。",
      fix: "本文のQ&Aと一言一句同じ内容で FAQPage を出力します（別の文言を書かない）。",
      source: SRC.faq,
    });
  }

  const host = new URL(input.finalUrl).host;
  const links = body.querySelectorAll("a[href]");
  const externals = links.filter((a) => {
    const href = a.getAttribute("href") ?? "";
    return /^https?:\/\//i.test(href) && !href.includes(host);
  });
  if (externals.length === 0 && text.length > 800) {
    add({
      id: "citation",
      area: "geo",
      severity: "low",
      title: "外部の出典リンクがありません",
      detail: "数値や仕様の根拠が示されていないページは、AI検索が引用元として選びにくくなります。",
      fix: "引用した数値・仕様の一次情報へリンクします。記事末尾に出典一覧を置きます。",
      source: SRC.helpful,
    });
  }

  const hasDate =
    body.querySelector("time") !== null ||
    ldNodes.some((n) => /datePublished|dateModified/.test(n.text));
  if (!hasDate) {
    add({
      id: "date",
      area: "geo",
      severity: "mid",
      title: "公開日・更新日が機械可読になっていません",
      detail: "AI検索は情報の新しさを判断材料にします。日付が読めないページは古い情報として扱われる可能性があります。",
      fix: "本文に日付を表示し、time要素か構造化データで宣言します。",
      fixCode: '<time datetime="2026-08-30">2026年8月30日</time>',
      where: { note: "h1 の直下（本文の日付表示）。JSON-LD の datePublished でも構いません。" },
      source: SRC.article,
    });
  }

  // ---------- robots.txt ----------
  if (input.robotsTxt === null) {
    add({
      id: "robots-missing",
      area: "tech",
      severity: "low",
      title: "robots.txt を取得できませんでした",
      detail: "無くてもクロールはされますが、サイトマップの場所を伝える置き場が無くなります。",
      fix: "ルートに robots.txt を置き、Sitemap 行を書きます。",
      fixCode: "User-agent: *\nDisallow:\n\nSitemap: https://" + host + "/sitemap.xml",
      where: { note: `ドメイン直下に置きます: https://${host}/robots.txt` },
      source: SRC.robots,
    });
  } else {
    const robots = parseRobots(input.robotsTxt);
    const googlebot = check(robots, "Googlebot", path);
    if (!googlebot.allowed) {
      add({
        id: "robots-googlebot",
        area: "tech",
        severity: "high",
        title: "robots.txt が Googlebot のクロールをブロックしています",
        detail: "このページは取得されないため、検索にも AI Overview・AI Mode にも出ません。",
        code: googlebot.reason,
        fix: "対象パスの Disallow を外すか、Allow で例外を作ります。",
        source: SRC.robots,
      });
    }
    const blockedAi = CRAWLERS.filter((c) => c.purpose === "ai-search" && !check(robots, c.token, path).allowed);
    if (blockedAi.length > 0) {
      add({
        id: "robots-ai",
        area: "geo",
        severity: "high",
        title: `AI検索のクローラー${blockedAi.length}種をブロックしています`,
        detail: "回答内で引用・リンクされるためのクローラーです。学習用クローラーとは別で、止めると露出が消えます。",
        code: blockedAi.map((c) => `${c.token}（${c.vendor}）: ${check(robots, c.token, path).reason}`).join("\n"),
        fix: "学習用（GPTBot・ClaudeBot・CCBot など）と検索用（OAI-SearchBot・PerplexityBot・Claude-SearchBot）を分けて指定します。",
        fixCode: "User-agent: GPTBot\nDisallow: /\n\nUser-agent: OAI-SearchBot\nDisallow:",
      });
    }
    if (robots.sitemaps.length === 0) {
      add({
        id: "robots-sitemap",
        area: "tech",
        severity: "low",
        title: "robots.txt に Sitemap の記述がありません",
        detail: "サイトマップの場所を検索エンジンに伝える標準の方法です。",
        fix: "robots.txt の末尾に Sitemap 行を足します。",
        fixCode: `Sitemap: https://${host}/sitemap.xml`,
        where: { note: `https://${host}/robots.txt の末尾（User-agent ブロックの後）。` },
        source: SRC.robots,
      });
    }
  }

  if (!input.hasLlmsTxt) {
    add({
      id: "llms",
      area: "geo",
      severity: "low",
      title: "/llms.txt がありません",
      detail: "LLM向けにサイトの構成を案内する提案仕様です。検索順位への効果は確認されていないため、優先度は低い項目です。",
      fix: "サイトの主要ページと方針をMarkdownで書いた /llms.txt を置きます。効果を検証しながら進めます。",
      where: { note: `ドメイン直下に置きます: https://${host}/llms.txt` },
      source: SRC.llms,
    });
  }

  const counts: Record<Severity, number> = { high: 0, mid: 0, low: 0, ok: 0 };
  for (const f of findings) counts[f.severity]++;

  return {
    finalUrl: input.finalUrl,
    status: input.status,
    bytes: input.bytes,
    elapsedMs: input.elapsedMs,
    redirects: input.redirects,
    textLength: text.length,
    findings: findings.sort((a, b) => ({ high: 0, mid: 1, low: 2, ok: 3 })[a.severity] - ({ high: 0, mid: 1, low: 2, ok: 3 })[b.severity]),
    counts,
  };
}
