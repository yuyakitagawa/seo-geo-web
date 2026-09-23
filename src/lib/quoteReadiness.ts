import { parse } from "node-html-parser";

export type QuoteCheckStatus = "pass" | "warn" | "fail";

export type QuoteCheck = {
  id: "opening" | "context" | "claim" | "specificity" | "reason" | "length";
  label: string;
  status: QuoteCheckStatus;
  detail: string;
};

export type QuoteBlockResult = {
  heading: string;
  level: number;
  candidate: string;
  checks: QuoteCheck[];
  verdict: "ready" | "review" | "weak";
};

export type QuoteReadinessResult = {
  blocks: QuoteBlockResult[];
  counts: Record<QuoteBlockResult["verdict"], number>;
};

type SourceBlock = { heading: string; level: number; paragraphs: string[] };

const SENTENCE_END = /[。！？!?]/;
const PREDICATE_END = /(?:です|ます|である|となる|になる|できる|必要だ|必要です|重要だ|重要です|指す|示す|含む|異なる|あります|ありません|ません|だ)[。！？!?]?$/;
const INTRO_OPENING = /^(?:近年|昨今|そもそも|まず|はじめに|この記事では|ここでは|本記事では|皆さんは|では[、,]|さて[、,])/;
const DEPENDENT_OPENING = /^(?:これ|それ|このこと|そのこと|この方法|その方法|上記|前述|先ほど|以下|このように|そのため|そこで|また[、,]|しかし[、,]|一方[、,]|つまり[、,]|したがって)/;
const CLAIM_FORM = /(?:とは.+(?:です|である|を指す)|には.+(?:必要|ある|あります)|理由は.+(?:です|である)|違いは.+(?:です|である)|するには.+(?:ます|必要|行う)|の場合.+(?:です|ます|なる)|は.+(?:です|ます|である|となる|になる|できる|を指す|を示す|を含む|と異なる))/;
const REASON_FORM = /(?:なぜなら|理由(?:は|として)|ため(?:です|である|、|に)|ので|からです|ことから)/;
const SPECIFICITY_FORM = /(?:例えば|具体的には|場合|ただし|一方で|に限り|によると|出典|調査|統計|\d+(?:[.,]\d+)?(?:%|％|年|月|日|円|件|人|倍|回))/;

function cleanText(value: string): string {
  return value.replace(/<br\s*\/?\s*>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/[ \t\f\v]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
}

function markdownBlocks(input: string): SourceBlock[] {
  const lines = input.split(/\r?\n/);
  const blocks: SourceBlock[] = [];
  let current: SourceBlock | null = null;
  let paragraph: string[] = [];
  const flushParagraph = () => {
    if (!current || paragraph.length === 0) return;
    const text = cleanText(paragraph.join(" "));
    if (text) current.paragraphs.push(text);
    paragraph = [];
  };
  for (const line of lines) {
    const heading = line.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      flushParagraph();
      if (heading[1].length <= 4) {
        current = { heading: cleanText(heading[2]), level: heading[1].length, paragraphs: [] };
        blocks.push(current);
      } else {
        current = null;
      }
    } else if (!line.trim()) {
      flushParagraph();
    } else if (current) {
      paragraph.push(line.replace(/^\s*(?:[-*+] |\d+[.)]\s+)/, ""));
    }
  }
  flushParagraph();
  return blocks;
}

function htmlBlocks(input: string): SourceBlock[] {
  const root = parse(input);
  const headings = root.querySelectorAll("h1, h2, h3, h4");
  return headings.map((heading) => {
    const level = Number(heading.tagName.slice(1));
    const paragraphs: string[] = [];
    let node = heading.nextElementSibling;
    while (node && !/^H[1-6]$/.test(node.tagName)) {
      if (["P", "LI", "BLOCKQUOTE", "DD"].includes(node.tagName)) {
        const text = cleanText(node.textContent);
        if (text) paragraphs.push(text);
      } else {
        for (const child of node.querySelectorAll("p, li, blockquote, dd")) {
          const text = cleanText(child.textContent);
          if (text) paragraphs.push(text);
        }
      }
      node = node.nextElementSibling;
    }
    return { heading: cleanText(heading.textContent), level, paragraphs };
  });
}

export function extractQuoteBlocks(input: string): SourceBlock[] {
  const looksLikeHtml = /<h[1-4](?:\s|>)/i.test(input);
  const blocks = (looksLikeHtml ? htmlBlocks(input) : markdownBlocks(input)).filter((block) => block.heading);
  // H1の直後がH2になるような「章をまとめる見出し」は、それ自体に本文がなくても欠陥ではない。
  // 配下の小見出しを持つ空の親見出しは診断対象から外し、本文のある節だけを採点する。
  return blocks.filter((block, index) => {
    if (block.paragraphs.length > 0) return true;
    const next = blocks[index + 1];
    return !next || next.level <= block.level;
  });
}

/** URL取得したページから、ナビゲーションやフッターを避けて診断対象の本文を選ぶ。 */
export function extractPageContentHtml(input: string): string {
  const root = parse(input);
  const target = root.querySelector("[itemprop='articleBody']")
    ?? root.querySelector("article")
    ?? root.querySelector("main")
    ?? root.querySelector("body")
    ?? root;
  return target.innerHTML;
}

function sentences(text: string): string[] {
  const output: string[] = [];
  let current = "";
  for (const char of text) {
    current += char;
    if (SENTENCE_END.test(char)) {
      output.push(current.trim());
      current = "";
    }
  }
  if (current.trim()) output.push(current.trim());
  return output;
}

function quoteCandidate(paragraphs: string[]): string {
  if (paragraphs.length === 0) return "";
  const first = sentences(paragraphs[0]);
  let candidate = "";
  for (const sentence of first.slice(0, 3)) {
    if (candidate && candidate.length + sentence.length > 240) break;
    candidate += sentence;
  }
  return candidate || paragraphs[0].slice(0, 240);
}

function analyzeBlock(block: SourceBlock): QuoteBlockResult {
  const candidate = quoteCandidate(block.paragraphs);
  if (!candidate) {
    const checks: QuoteCheck[] = [{ id: "opening", label: "見出し直後の本文", status: "fail", detail: "この見出しに本文がありません。" }];
    return { heading: block.heading, level: block.level, candidate: "", checks, verdict: "weak" };
  }

  const firstSentence = sentences(candidate)[0] ?? candidate;
  const checks: QuoteCheck[] = [];
  if (INTRO_OPENING.test(firstSentence)) {
    checks.push({ id: "opening", label: "冒頭の直接回答", status: "fail", detail: "冒頭が前置き・予告です。結論または定義から始めてください。" });
  } else if (PREDICATE_END.test(firstSentence)) {
    checks.push({ id: "opening", label: "冒頭の直接回答", status: "pass", detail: "最初の文が述語まで完結しています。" });
  } else {
    checks.push({ id: "opening", label: "冒頭の直接回答", status: "warn", detail: "最初の文だけでは、結論が完結しているか確認できません。" });
  }

  checks.push(DEPENDENT_OPENING.test(firstSentence)
    ? { id: "context", label: "文脈からの独立", status: "fail", detail: "指示語または接続表現から始まり、前の文章への依存があります。" }
    : { id: "context", label: "文脈からの独立", status: "pass", detail: "前の文章を必要とする始まり方は検出されませんでした。" });

  const hasTopic = /(?:とは|は|が|には|の場合)/.test(firstSentence);
  const hasClaim = CLAIM_FORM.test(firstSentence) || (hasTopic && PREDICATE_END.test(firstSentence));
  checks.push(hasClaim
    ? { id: "claim", label: "対象と主張", status: "pass", detail: "最初の文に対象と述語があります。" }
    : { id: "claim", label: "対象と主張", status: "warn", detail: "何について何を述べる文か、機械的には確認できませんでした。" });

  checks.push(SPECIFICITY_FORM.test(candidate)
    ? { id: "specificity", label: "理由・条件・具体性", status: "pass", detail: "条件、例、数値または出典の手掛かりがあります。" }
    : { id: "specificity", label: "理由・条件・具体性", status: "warn", detail: "条件・例・数値・出典は検出されませんでした。" });

  checks.push(REASON_FORM.test(candidate)
    ? { id: "reason", label: "結論を支える理由", status: "pass", detail: "結論と、その根拠になる理由が同じ引用候補にあります。" }
    : { id: "reason", label: "結論を支える理由", status: "warn", detail: "結論の根拠になる理由は検出されませんでした。" });

  const length = candidate.length;
  const lengthStatus: QuoteCheckStatus = length < 20 ? "warn" : length <= 240 ? "pass" : "warn";
  const lengthDetail = length < 20
    ? `${length}文字です。簡潔な回答として成立する場合もありますが、説明を補えるか確認してください。`
    : length <= 240
      ? `${length}文字で、ひとまとまりとして切り出せる長さです。`
      : `${length}文字です。主張を一つに絞れるか確認してください。`;
  checks.push({ id: "length", label: "引用候補のまとまり", status: lengthStatus, detail: lengthDetail });

  const fails = checks.filter((check) => check.status === "fail").length;
  const passes = checks.filter((check) => check.status === "pass").length;
  const verdict = fails > 0 ? "weak" : passes >= 5 ? "ready" : "review";
  return { heading: block.heading, level: block.level, candidate, checks, verdict };
}

export function diagnoseQuoteReadiness(input: string): QuoteReadinessResult {
  const blocks = extractQuoteBlocks(input).map(analyzeBlock);
  return {
    blocks,
    counts: {
      ready: blocks.filter((block) => block.verdict === "ready").length,
      review: blocks.filter((block) => block.verdict === "review").length,
      weak: blocks.filter((block) => block.verdict === "weak").length,
    },
  };
}
