// AI可読性の左右比較。サーバーが返したHTML1本から、「ブラウザで人が見るもの」と
// 「JavaScriptを実行しないAI検索のクローラーが受け取るもの」の差だけを抜き出す。
// レンダリングはしないので、人が見る側はHTMLに書かれている手がかりから分かることだけを書く（推測で埋めない）。
// 判定（合否）はここでは出さない。指摘は src/lib/audit.ts が担当する。
import type { HTMLElement } from "node-html-parser";

export type AiViewRow = {
  /** 何を比べているか */
  label: string;
  /** ブラウザで人が見るもの */
  human: string;
  /** AIクローラーが受け取るもの */
  ai: string;
  /** gap=人には見えるがAIに届かない / extra=画面に出ないのにAIには届く / same=同じものが届く */
  kind: "gap" | "extra" | "same";
  /** 実物の抜粋 */
  code?: string;
};

export type AiView = {
  /** HTMLに最初から入っている本文の文字数 */
  textLength: number;
  rows: AiViewRow[];
};

/** ファイル名だけを出す（長いCDNのURLをそのまま並べない） */
function fileName(src: string): string {
  const path = src.split("?")[0].split("#")[0];
  const name = path.split("/").filter(Boolean).pop() ?? src;
  return name.length > 40 ? name.slice(0, 39) + "…" : name;
}

/** 画面に出ていないテキスト。属性・クラス・インラインstyleから分かるものだけを拾う */
const HIDDEN_CLASS = /(^|[\s_-])(sr-only|visually-hidden|screen-reader-text|a11y-hidden)([\s_-]|$)/i;

export function aiView(input: {
  body: HTMLElement;
  /** 本文として抽出できたテキスト */
  text: string;
  /** JSON-LD の @type */
  ldTypes: string[];
  metaDescription: string;
}): AiView {
  const { body, text, ldTypes, metaDescription } = input;
  const rows: AiViewRow[] = [];

  // 本文。空のコンテナだけを返しているページは、人が見る画面とAIが受け取るHTMLが別物になる
  const shells = body
    .querySelectorAll("#root, #app, #__next, #__nuxt, [data-reactroot], [data-server-rendered]")
    .filter((el) => el.text.replace(/\s+/g, "").length < 50);
  rows.push({
    label: "本文",
    human: shells.length > 0 ? "JavaScriptを実行してから画面に出る（HTMLは空の入れ物だけ）" : "HTMLに書かれている本文がそのまま表示される",
    ai: `HTMLに最初から入っている本文 ${text.length}字`,
    kind: shells.length > 0 ? "gap" : "same",
    code: shells.length > 0 ? shells.slice(0, 2).map((el) => `<${el.tagName.toLowerCase()}${el.rawAttrs ? " " + el.rawAttrs : ""}></${el.tagName.toLowerCase()}>`).join("\n") : undefined,
  });

  // 画像。中の文字は届かないので、alt があるかどうかがそのまま差になる
  const imgs = body.querySelectorAll("img");
  if (imgs.length > 0) {
    // alt="" は「装飾なので読まなくてよい」という正しい指定。alt そのものが無いものだけを差として数える
    const missing = imgs.filter((img) => img.getAttribute("alt") == null);
    const described = imgs.filter((img) => (img.getAttribute("alt") ?? "").trim().length > 0).length;
    const decorative = imgs.length - missing.length - described;
    rows.push({
      label: "画像の中の文字",
      human: `画像 ${imgs.length}枚が表示される`,
      ai:
        missing.length > 0
          ? `alt のある ${described}枚だけ文字で届く。${missing.length}枚は alt が無く、中身が分からない`
          : `${described}枚は alt で内容が届く${decorative > 0 ? `。${decorative}枚は alt="" で装飾と宣言されている` : ""}`,
      kind: missing.length > 0 ? "gap" : "same",
      code: missing.length > 0 ? missing.slice(0, 3).map((img) => fileName(img.getAttribute("src") ?? "(src なし)")).join("\n") : undefined,
    });
  }

  // 埋め込み。iframe は別文書、video/canvas は映像なので、中身は本文にならない
  const embeds = body.querySelectorAll("iframe, video, audio, canvas, object, embed");
  if (embeds.length > 0) {
    rows.push({
      label: "埋め込み（iframe・動画・canvas）",
      human: `${embeds.length}個が画面に表示される`,
      ai: "別の文書か映像なので中身は届かない。周りの本文で内容を説明しないと材料が無い",
      kind: "gap",
      code: embeds
        .slice(0, 3)
        .map((el) => `<${el.tagName.toLowerCase()} src="${fileName(el.getAttribute("src") ?? "")}">`)
        .join("\n"),
    });
  }

  // 引用させない宣言。人には見えているが、スニペットには使われない
  const nosnippet = body.querySelectorAll("[data-nosnippet]");
  if (nosnippet.length > 0) {
    rows.push({
      label: "引用させない宣言（data-nosnippet）",
      human: `${nosnippet.length}か所が画面に表示される`,
      ai: "スニペットに使わないよう宣言されているので、引用の材料にならない",
      kind: "gap",
      code: nosnippet.slice(0, 2).map((el) => el.text.replace(/\s+/g, " ").trim().slice(0, 80)).join("\n"),
    });
  }

  // 画面に出ていないのにHTMLには入っているテキスト。タブやアコーディオンの中身がここに入る
  const hiddenCandidates = body
    .querySelectorAll(
      "[hidden], [aria-hidden='true'], [style*='display'], [style*='visibility'], [class*='sr-only'], [class*='visually-hidden'], [class*='screen-reader'], [class*='a11y-hidden']",
    )
    .filter((el) => {
      const style = (el.getAttribute("style") ?? "").replace(/\s+/g, "");
      const isHidden =
        el.hasAttribute("hidden") ||
        el.getAttribute("aria-hidden") === "true" ||
        /display:none|visibility:hidden/i.test(style) ||
        HIDDEN_CLASS.test(el.getAttribute("class") ?? "");
      return isHidden && el.text.replace(/\s+/g, "").length >= 20;
    });
  // 入れ子は外側だけ数える（同じテキストを二重に数えない）
  const hiddenSet = new Set(hiddenCandidates);
  const hidden = hiddenCandidates.filter((el) => {
    for (let p = el.parentNode; p; p = p.parentNode) if (hiddenSet.has(p)) return false;
    return true;
  });
  if (hidden.length > 0) {
    const chars = hidden.reduce((n, el) => n + el.text.replace(/\s+/g, "").length, 0);
    rows.push({
      label: "画面に出ていない部分（タブ・アコーディオン・読み上げ用）",
      human: `${hidden.length}か所は操作するまで画面に出ない`,
      ai: `HTMLには入っているので ${chars}字がそのまま届く`,
      kind: "extra",
      code: hidden.slice(0, 2).map((el) => el.text.replace(/\s+/g, " ").trim().slice(0, 80)).join("\n"),
    });
  }

  // 属性のテキスト。画面には出ないがHTMLには書かれている
  const labels = body.querySelectorAll("[aria-label], [title]");
  if (labels.length > 0) {
    rows.push({
      label: "属性の文字（aria-label・title）",
      human: "画面には出ない（読み上げやマウスを乗せたときだけ）",
      ai: `${labels.length}件が届く。ボタンやリンクの意味はここで伝わる`,
      kind: "extra",
      code: labels
        .slice(0, 3)
        .map((el) => (el.getAttribute("aria-label") ?? el.getAttribute("title") ?? "").slice(0, 60))
        .filter(Boolean)
        .join("\n"),
    });
  }

  // JavaScriptが動かないときだけ出る文言。AIクローラーはこれを本文として読む
  // noscript の中身はタグごと文字列で入る。計測タグだけの noscript を「本文」と呼ばないよう、タグを外してから数える
  const noscriptText = (el: HTMLElement) => el.text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const noscripts = body.querySelectorAll("noscript").filter((el) => noscriptText(el).length >= 20);
  if (noscripts.length > 0) {
    rows.push({
      label: "noscript の中身",
      human: "JavaScriptが動くので画面には出ない",
      ai: "JavaScriptを実行しないクローラーはこの文言を本文として読む",
      kind: "extra",
      code: noscripts.slice(0, 2).map((el) => noscriptText(el).slice(0, 100)).join("\n"),
    });
  }

  if (ldTypes.length > 0) {
    rows.push({
      label: "構造化データ（JSON-LD）",
      human: "画面には出ない",
      ai: `@type: ${[...new Set(ldTypes)].join(", ")} が届く`,
      kind: "extra",
    });
  }

  if (metaDescription.trim().length > 0) {
    rows.push({
      label: "meta description",
      human: "画面には出ない",
      ai: `${metaDescription.trim().length}字が届く。要約を作るときの材料になる`,
      kind: "extra",
      code: metaDescription.trim().slice(0, 100),
    });
  }

  return { textLength: text.length, rows };
}
