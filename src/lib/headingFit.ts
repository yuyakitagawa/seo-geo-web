// 見出しと、その下の本文が噛み合っているかを見る純関数。
//
// AI検索は見出しごとのまとまり（パッセージ）を抜き出して回答に使う。見出しが本文の内容を
// 言い当てていないと、その見出しで拾われたときに中身が答えになっていない、ということが起きる。
//
// **判定の主軸は「見出しの重要語が本文に出てくるか」**にする。近さ（コサイン類似度）も出すが、
// 判定には使わない（参考値）。「近さ0.12」と言われても直しようがないが、「見出しの語が本文に
// 1つも無い」なら直し方が一意に決まるため。廃止した /tools/prompt-fit が読み手に刺さらなかった
// のは、この種の数値を前に出していたからだと見ている。
//
// 解析の部品（分かち書き・TF-IDF・重要語）は src/lib/promptFit.ts と共有する。判定を2か所に書かない。
import { buildIdf, cosine, keyTerms, presence, sentences, tokenize, toVec, type Block, type TermHit } from "./promptFit";

/**
 * 見出しと本文の噛み合いを見ない、定型の見出し。
 * 「まとめ」「はじめに」のような見出しは、本文と語が重ならないのが当たり前なので判定しない
 * （ここを判定すると、直す必要のない見出しばかりが指摘に並ぶ）。
 */
const BOILERPLATE = [
  "まとめ", "はじめに", "おわりに", "結論", "概要", "目次", "補足", "注意点", "ポイント", "参考",
  "出典", "関連記事", "よくある質問", "faq", "q&a", "背景", "目的", "前提", "用語", "この記事について",
];

/** 本文がこれより短いブロックは判定しない（判定の材料が足りない） */
export const MIN_TEXT = 120;

/** 見出しがこれより短いと重要語が取れない */
const MIN_HEADING = 4;

/** 重要語のうち、本文に出てこないものがこの割合を超えたら「弱い」 */
const WEAK_MISS_RATIO = 0.5;

export type HeadingVerdict = "ok" | "weak" | "off";

export const HEADING_VERDICT_LABEL: Record<HeadingVerdict, string> = {
  ok: "噛み合っている",
  weak: "弱い",
  off: "噛み合っていない",
};

export type HeadingFit = {
  heading: string;
  level: number;
  /** 見出しと本文の近さ（0〜1）。同じページの他ブロックを母集団にしたTF-IDFのコサイン。**参考値** */
  closeness: number;
  /** 見出しの重要語が本文に出てくるか */
  terms: TermHit[];
  /** 見出しの直後の1文。ここが見出しへの答えになっているのが理想 */
  lead: string;
  verdict: HeadingVerdict;
  /** なぜその判定になったか（そのまま指摘文に使う） */
  reason: string;
};

export type HeadingFitResult = {
  fits: HeadingFit[];
  /** 判定しなかった見出しの数（定型の見出し・本文が短いブロック） */
  skipped: number;
};

function isBoilerplate(heading: string): boolean {
  const h = heading.normalize("NFKC").toLowerCase().replace(/[\s　]/g, "");
  return BOILERPLATE.some((b) => h === b || h.startsWith(b) || h.endsWith(b));
}

/**
 * 見出しごとに、その本文と噛み合っているかを見る。
 * 判定できないブロック（定型の見出し・本文が短い）は数だけ返し、指摘には出さない。
 */
export function headingFit(blocks: Block[]): HeadingFitResult {
  const target = blocks.filter((b) => b.heading.length >= MIN_HEADING && b.text.length >= MIN_TEXT && !isBoilerplate(b.heading));
  const skipped = blocks.filter((b) => b.heading.length > 0).length - target.length;
  if (target.length === 0) return { fits: [], skipped: Math.max(0, skipped) };

  // IDFの母集団は同じページの本文ブロック。ページ全体で共通の語（サイト名・主題）の効きを抑える
  const docs = target.map((b) => tokenize(b.text));
  const { idf, fallback } = buildIdf(docs);

  const fits = target.map((block, i) => {
    const closeness = cosine(toVec(tokenize(block.heading), idf, fallback), toVec(docs[i], idf, fallback));
    const terms: TermHit[] = keyTerms(block.heading)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5)
      .map(({ term }) => ({ term, hit: presence(term, block.text) }));

    const missing = terms.filter((t) => t.hit === "none");
    const found = terms.filter((t) => t.hit === "full");
    const lead = sentences(block.text)[0] ?? "";

    let verdict: HeadingVerdict = "ok";
    let reason = "見出しの語が本文に出てきます。";
    if (terms.length > 0 && found.length === 0) {
      verdict = "off";
      reason = `見出しの語（${terms.map((t) => t.term).join("・")}）が本文に1つも出てきません。見出しと中身が別のことを指しています。`;
    } else if (terms.length > 0 && missing.length / terms.length > WEAK_MISS_RATIO) {
      verdict = "weak";
      reason = `見出しの語のうち ${missing.map((t) => t.term).join("・")} が本文にありません。見出しが本文より広い（または狭い）可能性があります。`;
    }

    return { heading: block.heading, level: block.level, closeness: Math.round(closeness * 100) / 100, terms, lead, verdict, reason };
  });

  return { fits, skipped: Math.max(0, skipped) };
}
