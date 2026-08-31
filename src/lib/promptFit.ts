// 狙っているプロンプト（AI検索でユーザーが打つ質問）に対して、ページの内容が合っているかを判定する。
// 取得（fetch）は src/app/api/prompt-fit/route.ts が担当し、ここは受け取った本文を判定するだけの純関数にする。
//
// 埋め込みAPIは使わない。日本語を形態素解析なしで扱うため、文字bigram（英数字は単語）でベクトル化し、
// 見出しごとのブロック単位でTF-IDFのコサイン類似度を取る。これで「どのブロックがそのプロンプトに
// 答えているか」が出る。加えて、プロンプトの重要語が本文に出てくるか、意図（定義/手順/比較/費用/事例/判断）に
// 合った形式（番号付きの手順・表・金額・数値）が揃っているかを見て、書き足す文の型まで返す。
import { parse, type HTMLElement } from "node-html-parser";

export type Verdict = "covered" | "weak" | "missing";
export const VERDICT_LABEL: Record<Verdict, string> = { covered: "答えている", weak: "弱い", missing: "答えていない" };

export type Intent = "definition" | "howto" | "compare" | "price" | "case" | "judge" | "other";
export const INTENT_LABEL: Record<Intent, string> = {
  definition: "定義を聞いている",
  howto: "手順を聞いている",
  compare: "比較を求めている",
  price: "費用を聞いている",
  case: "事例・効果を聞いている",
  judge: "やるべきかを聞いている",
  other: "情報を求めている",
};

export type Block = {
  heading: string;
  level: number;
  text: string;
  hasTable: boolean;
  hasOrderedList: boolean;
  hasList: boolean;
};

export type TermHit = { term: string; hit: "full" | "partial" | "none" };
export type FormatCheck = { ok: boolean; label: string; detail: string };

export type PromptFit = {
  prompt: string;
  intent: Intent;
  /** 総合の適合度 0-100 */
  fit: number;
  verdict: Verdict;
  /** プロンプトの重要語が本文に出てくる割合 0-100 */
  coverage: number;
  /** 最も近いブロックとの近さ 0-100 */
  nearness: number;
  terms: TermHit[];
  /** そのプロンプトに最も近い見出しブロック */
  best: { heading: string; level: number; excerpt: string } | null;
  /** 直答として使えている1文（先頭付近にあるもの） */
  answer: string | null;
  formats: FormatCheck[];
  fix: { note: string; heading: string; template: string; where: string; add: string[] };
};

export type PromptFitResult = {
  source: string;
  title: string;
  textLength: number;
  blocks: { heading: string; level: number; length: number }[];
  fits: PromptFit[];
  /** ページが実際に多く語っている語。狙ったプロンプトに無い語は targeted:false（＝ベクトルのズレ） */
  focus: { term: string; count: number; targeted: boolean }[];
  /** 1つのブロックが複数のプロンプトを兼任している箇所 */
  overlaps: { heading: string; prompts: string[] }[];
  counts: Record<Verdict, number>;
};

// ---------- 文字の扱い ----------

const KANJI = "\\u4E00-\\u9FFF\\u3005-\\u3007";
const HIRA = "\\u3041-\\u309F";
const KATA = "\\u30A1-\\u30FA\\u30FC\\u30FD\\u30FE";
/** ベクトル用。日本語はひらがなも含めた連なりをbigramにする */
const TOKEN_RUN = new RegExp(`[${KANJI}${HIRA}${KATA}]+|[a-z0-9][a-z0-9.+#_-]*`, "g");
/** 重要語用。助詞・語尾が中心のひらがなは拾わず、漢字・カタカナ・英数字の連なりだけを名詞として扱う */
const TERM_RUN = new RegExp(`[${KANJI}]+|[${KATA}]+|[a-z0-9][a-z0-9.+#_-]*`, "g");

function normalize(s: string): string {
  return s.normalize("NFKC").toLowerCase().replace(/\s+/g, " ");
}

function tokenize(s: string): string[] {
  const out: string[] = [];
  for (const run of normalize(s).match(TOKEN_RUN) ?? []) {
    if (/^[a-z0-9]/.test(run)) {
      if (run.length >= 2) out.push(run);
      continue;
    }
    if (run.length === 1) {
      out.push(run);
      continue;
    }
    for (let i = 0; i + 2 <= run.length; i++) out.push(run.slice(i, i + 2));
  }
  return out;
}

function sentences(text: string): string[] {
  const out: string[] = [];
  let cur = "";
  for (const ch of text) {
    cur += ch;
    if ("。．！？!?".includes(ch)) {
      const s = cur.trim();
      if (s) out.push(s);
      cur = "";
    }
  }
  const rest = cur.trim();
  if (rest) out.push(rest);
  return out;
}

// ---------- TF-IDF ----------

type Vec = Map<string, number>;

function buildIdf(docs: string[][]): { idf: Map<string, number>; fallback: number } {
  const n = docs.length || 1;
  const df = new Map<string, number>();
  for (const d of docs) for (const t of new Set(d)) df.set(t, (df.get(t) ?? 0) + 1);
  const idf = new Map<string, number>();
  // どの語も0にはしない（1ページ内が母集団なので、全ブロックに出る主題語を消してしまうと判定が壊れる）
  for (const [t, c] of df) idf.set(t, Math.log(1 + n / (c + 0.5)));
  return { idf, fallback: Math.log(1 + n / 0.5) };
}

/** ひらがなだけの2文字（助詞・語尾）は、どのページにも出るので重みを下げる */
const HIRA_ONLY = new RegExp(`^[${HIRA}]+$`);

function toVec(tokens: string[], idf: Map<string, number>, fallback: number): Vec {
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  const v: Vec = new Map();
  let norm = 0;
  for (const [t, c] of tf) {
    const w = (1 + Math.log(c)) * (idf.get(t) ?? fallback) * (HIRA_ONLY.test(t) ? 0.35 : 1);
    v.set(t, w);
    norm += w * w;
  }
  norm = Math.sqrt(norm) || 1;
  for (const [t, w] of v) v.set(t, w / norm);
  return v;
}

function cosine(a: Vec, b: Vec): number {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let s = 0;
  for (const [t, w] of small) {
    const o = large.get(t);
    if (o) s += w * o;
  }
  return s;
}

// ---------- プロンプトの読み取り ----------

/** 質問の形を作るだけで、話題そのものではない語。重みを下げる */
const GENERIC = new Set([
  "方法", "場合", "意味", "違い", "比較", "理由", "種類", "一覧", "手順", "必要", "注意", "点", "内容", "目的",
  "最新", "最近", "自分", "会社", "今", "何", "人", "的", "話", "件", "つ", "度",
]);

const INTENT_RULES: { intent: Intent; words: string[] }[] = [
  { intent: "price", words: ["料金", "価格", "費用", "相場", "いくら", "値段", "コスト", "無料"] },
  { intent: "compare", words: ["比較", "違い", "どっち", "どちら", "おすすめ", "ランキング", "選び方", "vs", "代わり"] },
  { intent: "howto", words: ["方法", "やり方", "手順", "どうやって", "作り方", "始め", "何から", "設定", "導入", "対処", "書き方", "使い方"] },
  { intent: "case", words: ["事例", "実例", "効果", "結果", "成功", "実績", "どのくらい", "どれくらい"] },
  { intent: "judge", words: ["べき", "必要", "意味ある", "効果ある", "やる価値", "損"] },
  { intent: "definition", words: ["とは", "意味", "何ですか", "なに", "定義", "仕組み", "どういう"] },
];

function detectIntent(prompt: string): Intent {
  const p = normalize(prompt);
  for (const r of INTENT_RULES) if (r.words.some((w) => p.includes(w))) return r.intent;
  return "other";
}

function keyTerms(prompt: string): { term: string; weight: number }[] {
  const text = normalize(prompt);
  const runs: { term: string; start: number; end: number }[] = [];
  TERM_RUN.lastIndex = 0;
  for (let m = TERM_RUN.exec(text); m; m = TERM_RUN.exec(text)) {
    runs.push({ term: m[0], start: m.index, end: m.index + m[0].length });
  }
  // 「AI検索」のように文字種が変わるだけで続いている語は、1語として扱うほうが specific になる
  const compounds = runs
    .slice(0, -1)
    .map((r, i) => (r.end === runs[i + 1].start ? r.term + runs[i + 1].term : ""))
    .filter((t) => t.length >= 3);

  const map = new Map<string, number>();
  for (const term of [...compounds, ...runs.map((r) => r.term)]) {
    if (term.length < 2 || map.has(term)) continue;
    map.set(term, (GENERIC.has(term) ? 0.4 : 1) * (term.length >= 4 ? 1.3 : 1));
  }
  // 長い語を含む短い語（ai検索 に対する ai）は、二重に数えないよう重みを下げる
  const terms = [...map].map(([term, weight]) => ({ term, weight }));
  for (const t of terms) {
    if (terms.some((o) => o.term !== t.term && o.term.includes(t.term))) t.weight *= 0.5;
  }
  return terms;
}

/** 判定は小文字に正規化して行うが、修正案に出す語は入力どおりの表記に戻す */
function originalCase(term: string, prompt: string): string {
  const at = prompt.toLowerCase().indexOf(term);
  return at >= 0 ? prompt.slice(at, at + term.length) : term;
}

/** 本文から拾った語も、本文どおりの表記に戻して見せる */
function displayCase(term: string, lower: string, raw: string): string {
  const at = lower.indexOf(term);
  return at >= 0 && raw.length === lower.length ? raw.slice(at, at + term.length) : term;
}

/** 本文にその語があるか。少し崩れていても拾えるよう、1文字欠けた形も見る */
function presence(term: string, text: string): TermHit["hit"] {
  if (text.includes(term)) return "full";
  if (term.length >= 3) {
    const w = term.length - 1;
    for (let i = 0; i + w <= term.length; i++) if (text.includes(term.slice(i, i + w))) return "partial";
  }
  return "none";
}

// ---------- 本文の切り出し ----------

const SKIP_TAGS = new Set([
  "script", "style", "noscript", "template", "svg", "iframe", "nav", "header", "footer", "aside", "form", "button", "select", "figure",
]);

function emptyBlock(heading = "", level = 0): Block {
  return { heading, level, text: "", hasTable: false, hasOrderedList: false, hasList: false };
}

function walk(node: HTMLElement, blocks: Block[]): void {
  for (const child of node.childNodes) {
    const el = child as HTMLElement;
    const tag = typeof el.tagName === "string" ? el.tagName.toLowerCase() : "";
    if (!tag) {
      const t = child.text;
      if (t && t.trim()) blocks[blocks.length - 1].text += " " + t.replace(/\s+/g, " ");
      continue;
    }
    if (SKIP_TAGS.has(tag)) continue;
    const h = tag.match(/^h([1-4])$/);
    if (h) {
      blocks.push(emptyBlock(el.text.replace(/\s+/g, " ").trim(), Number(h[1])));
      continue;
    }
    const cur = blocks[blocks.length - 1];
    if (tag === "table") cur.hasTable = true;
    if (tag === "ol") {
      cur.hasOrderedList = true;
      cur.hasList = true;
    }
    if (tag === "ul") cur.hasList = true;
    cur.text += " ";
    walk(el, blocks);
  }
}

export function blocksFromHtml(html: string): { title: string; blocks: Block[] } {
  const root = parse(html);
  root.querySelectorAll("script, style, noscript, template, svg, iframe").forEach((n) => n.remove());
  const title = root.querySelector("title")?.text.replace(/\s+/g, " ").trim() ?? "";
  const main = root.querySelector("main") ?? root.querySelector("article") ?? root.querySelector("body") ?? root;
  const blocks: Block[] = [emptyBlock()];
  walk(main, blocks);
  return { title, blocks: tidy(blocks) };
}

/** 貼り付けた原稿（Markdown または素のテキスト）を読む */
export function blocksFromText(src: string): { title: string; blocks: Block[] } {
  const blocks: Block[] = [emptyBlock()];
  let title = "";
  const cleaned = src.replace(/```[\s\S]*?```/g, " ").replace(/<[A-Za-z/][^>]*>/g, " ");
  for (const line of cleaned.split("\n")) {
    const h = line.match(/^(#{1,4})\s+(.+)$/);
    if (h) {
      const heading = h[2].replace(/\s+/g, " ").trim();
      if (!title && h[1].length === 1) title = heading;
      blocks.push(emptyBlock(heading, h[1].length));
      continue;
    }
    const cur = blocks[blocks.length - 1];
    if (/^\s*\|/.test(line)) cur.hasTable = true;
    if (/^\s*\d+[.)]\s/.test(line)) {
      cur.hasOrderedList = true;
      cur.hasList = true;
    }
    if (/^\s*[-*+・]\s/.test(line)) cur.hasList = true;
    cur.text += " " + plainLine(line);
  }
  return { title, blocks: tidy(blocks) };
}

/** 原稿に混じるMDX/HTMLのタグ・URL・記号を落として、読める文だけにする */
function plainLine(line: string): string {
  return line
    .replace(/<[^>]*>/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[`*_>|]+/g, " ")
    .replace(/^\s*[#\-+・]+\s*/, " ")
    .replace(/\s+/g, " ");
}

function tidy(blocks: Block[]): Block[] {
  const cleaned = blocks
    .map((b) => ({ ...b, text: b.text.replace(/\s+/g, " ").trim() }))
    .filter((b) => b.heading || b.text.length >= 20);
  return cleaned.slice(0, 80);
}

// ---------- 修正案 ----------

const TEMPLATE: Record<Intent, (topic: string, add: string) => string> = {
  definition: (t, a) => `${t}とは、〈結論を1文で〉。\n\n〈定義の補足を2〜3文。${a}に触れる〉\n\n出典: 〈一次情報のURL〉`,
  howto: (t, a) => `${t}の手順は次の3ステップです。\n\n1. 〈やること〉——〈1文の補足〉\n2. 〈やること〉——〈1文の補足〉\n3. 〈やること〉——〈1文の補足〉\n\n〈${a}をどこかのステップ内で必ず書く〉`,
  compare: (t, a) => `結論から言うと、〈条件A〉なら〈X〉、〈条件B〉なら〈Y〉です。\n\n| 項目 | X | Y |\n| --- | --- | --- |\n| 〈${a}〉 | 〈値〉 | 〈値〉 |\n| 費用 | 〈値〉 | 〈値〉 |\n\n〈選び分けの理由を2文〉`,
  price: (t, a) => `${t}は〈金額〉です（〈確認日〉時点）。\n\n〈内訳・条件を2〜3文。${a}に触れる〉\n\n出典: 〈公式の料金ページURL〉`,
  case: (t, a) => `〈主語〉は〈施策〉を行い、〈期間〉で〈数値〉が〈変化〉しました。\n\n〈条件と再現性の注意を2文。${a}に触れる〉\n\n出典: 〈一次情報のURL〉`,
  judge: (t, a) => `結論: 〈条件A〉なら必要、〈条件B〉なら不要です。\n\n〈判断の分かれ目を2〜3文。${a}に触れる〉`,
  other: (t, a) => `${t}については、〈結論を1文で〉。\n\n〈根拠と補足を2〜3文。${a}に触れる〉\n\n出典: 〈一次情報のURL〉`,
};

function formatChecks(intent: Intent, block: Block | null, pageText: string): FormatCheck[] {
  const text = block?.text ?? pageText;
  const checks: FormatCheck[] = [];
  const push = (ok: boolean, label: string, detail: string) => checks.push({ ok, label, detail });
  switch (intent) {
    case "howto":
      push(
        Boolean(block?.hasOrderedList) || /(^|\D)1[.．)、]\s*\S/.test(text) || /ステップ|手順/.test(text),
        "番号付きの手順",
        "手順を聞くプロンプトです。番号付きリストにすると、AIが順番のある回答としてそのまま引用できます。"
      );
      break;
    case "compare":
      push(
        Boolean(block?.hasTable) || /どちらを|向いて|向く|に対して|一方/.test(text),
        "比較の表または選び分けの一文",
        "比較のプロンプトです。項目・A・Bの表と「〜ならA、〜ならB」の一文があると、AIが比較結果として引用できます。"
      );
      break;
    case "price":
      push(/\d[\d,]*\s*(円|万円|ドル|usd|\$)/i.test(text), "具体的な金額", "費用のプロンプトです。金額と確認時点を書かないと、AIは他サイトの数字を使います。");
      break;
    case "case":
      push(/\d[\d,.]*\s*(%|％|倍|件|人|pv|回)/i.test(text), "数値の実績", "事例・効果のプロンプトです。数値と出典が無い記述は引用されにくくなります。");
      break;
    case "definition":
      push(/とは[、。 ]|といいます|を指します|のことです/.test(text), "定義文", "定義のプロンプトです。「〜とは、〜です」の形の文を1つ置くと、そのまま定義として引用されます。");
      break;
    case "judge":
      push(/結論|必要|不要|べき|場合は/.test(text), "結論の明示", "判断を求めるプロンプトです。「〈条件〉なら必要、〈条件〉なら不要」と条件つきで言い切ります。");
      break;
    default:
      break;
  }
  return checks;
}

// ---------- 本体 ----------

export type PromptFitInput = { source: string; title?: string; blocks: Block[]; prompts: string[] };

export function analyze(input: PromptFitInput): PromptFitResult {
  const blocks = input.blocks;
  const pageRaw = blocks
    .map((b) => `${b.heading} ${b.text}`)
    .join(" ")
    .normalize("NFKC")
    .replace(/\s+/g, " ");
  const pageText = pageRaw.toLowerCase();
  const docs = blocks.map((b) => tokenize(`${b.heading} ${b.heading} ${b.text}`));
  const { idf, fallback } = buildIdf(docs);
  const blockVecs = docs.map((d) => toVec(d, idf, fallback));

  const fits: PromptFit[] = input.prompts.map((prompt) => {
    const intent = detectIntent(prompt);
    const terms = keyTerms(prompt);
    const hits: TermHit[] = terms.map((t) => ({ term: originalCase(t.term, prompt), hit: presence(t.term, pageText) }));
    const totalWeight = terms.reduce((s, t) => s + t.weight, 0) || 1;
    const gained = terms.reduce((s, t, i) => s + t.weight * (hits[i].hit === "full" ? 1 : hits[i].hit === "partial" ? 0.5 : 0), 0);
    // 一般語ではない語が丸ごと欠けているなら、他が埋まっていてもカバーできているとは言えない
    const coreMissing = terms.some((t, i) => t.weight >= 1 && hits[i].hit === "none");
    const coverage = (gained / totalWeight) * (coreMissing ? 0.6 : 1);

    const pv = toVec(tokenize(prompt), idf, fallback);
    let bestIndex = -1;
    let bestCos = 0;
    blockVecs.forEach((v, i) => {
      const c = cosine(pv, v);
      if (c > bestCos) {
        bestCos = c;
        bestIndex = i;
      }
    });
    const bestBlock = bestIndex >= 0 ? blocks[bestIndex] : null;
    // コサインは文字bigramなので絶対値が小さい。0.30 を「十分近い」として正規化する
    const nearness = Math.min(1, bestCos / 0.3);

    // 直答: 最も近いブロックの先頭3文のうち、プロンプトの重要語を2つ以上含む文
    const need = Math.min(2, terms.length);
    const answer =
      sentences(bestBlock?.text ?? "")
        .slice(0, 3)
        .find((s) => {
          const n = normalize(s);
          const hit = terms.filter((t) => n.includes(t.term)).length;
          return hit >= need && n.length >= 20 && n.length <= 220;
        }) ?? null;

    const formats = formatChecks(intent, bestBlock, pageText);
    const formatRate = formats.length ? formats.filter((f) => f.ok).length / formats.length : 1;
    const fit = Math.round(100 * (0.45 * coverage + 0.25 * nearness + 0.2 * (answer ? 1 : 0) + 0.1 * formatRate));
    const verdict: Verdict = fit >= 70 ? "covered" : fit >= 40 ? "weak" : "missing";

    const missing = hits.filter((h) => h.hit !== "full").map((h) => h.term);
    const topic = originalCase(terms.filter((t) => !GENERIC.has(t.term)).map((t) => t.term)[0] ?? prompt, prompt);
    const addText = missing.length > 0 ? missing.join("・") : "プロンプトの言葉";
    const note =
      verdict === "missing"
        ? "このプロンプトに答えているブロックがありません。見出しごと新しく足します。"
        : coverage < 0.6
          ? "近いブロックはありますが、プロンプトで使われている語が本文に足りません。言い換えずに同じ語を本文に入れます。"
          : !answer
            ? "内容は書かれていますが、ブロックの先頭に結論の1文がありません。AI検索は先頭の1〜2文を引用します。"
            : "形式が意図に合っていません。下の型に合わせて足します。";

    return {
      prompt,
      intent,
      fit,
      verdict,
      coverage: Math.round(coverage * 100),
      nearness: Math.round(nearness * 100),
      terms: hits,
      best: bestBlock ? { heading: bestBlock.heading || "（見出しなしの冒頭）", level: bestBlock.level, excerpt: bestBlock.text.slice(0, 160) } : null,
      answer,
      formats,
      fix: {
        note,
        heading: `## ${prompt.replace(/[?？]\s*$/, "")}`,
        template: TEMPLATE[intent](topic, addText),
        where:
          verdict === "missing" || !bestBlock
            ? "本文の後半に、新しい見出しとして足します（既存の見出しと内容が重ならない位置）。"
            : `「${bestBlock.heading || "冒頭"}」の直後。既存のブロックを書き換えるほうが、見出しを増やすより効きます。`,
        add: missing,
      },
    };
  });

  // ページが実際に多く語っている語。プロンプトに無い語が多いほど、狙いから離れている
  const promptTerms = new Set(input.prompts.flatMap((p) => keyTerms(p).map((t) => t.term)));
  const freq = new Map<string, number>();
  for (const term of pageText.match(TERM_RUN) ?? []) {
    if (term.length < 2 || GENERIC.has(term)) continue;
    freq.set(term, (freq.get(term) ?? 0) + 1);
  }
  const focus = [...freq]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, 12)
    .map(([term, count]) => ({
      term: displayCase(term, pageText, pageRaw),
      count,
      targeted: [...promptTerms].some((p) => p.includes(term) || term.includes(p)),
    }));

  const byHeading = new Map<string, string[]>();
  for (const f of fits) {
    if (!f.best || f.verdict === "missing") continue;
    const key = f.best.heading;
    byHeading.set(key, [...(byHeading.get(key) ?? []), f.prompt]);
  }
  const overlaps = [...byHeading]
    .filter(([, prompts]) => prompts.length >= 2)
    .map(([heading, prompts]) => ({ heading, prompts }));

  const counts: Record<Verdict, number> = { covered: 0, weak: 0, missing: 0 };
  for (const f of fits) counts[f.verdict] += 1;

  return {
    source: input.source,
    title: input.title ?? "",
    textLength: pageText.length,
    blocks: blocks.map((b) => ({ heading: b.heading, level: b.level, length: b.text.length })),
    fits,
    focus,
    overlaps,
    counts,
  };
}
