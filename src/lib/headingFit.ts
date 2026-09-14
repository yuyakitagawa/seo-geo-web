// 見出しと、その下の本文が噛み合っているかを見る純関数。
//
// AI検索は見出しごとのまとまり（パッセージ）を抜き出して回答に使う。見出しが本文の内容を
// 言い当てていないと、その見出しで拾われたときに中身が答えになっていない、ということが起きる。
//
// 見るのは2つ。**どちらも「直し方が一意に決まるか」で選んでいる**。
//   1. 噛み合い: 見出しの重要語が本文に出てくるか（出てこない＝見出しと中身が別のことを指している）
//   2. 答えの形: 見出しが聞いていること（費用・手順・理由など）の答えの形が本文にあるか
//      「費用」の見出しに金額が1つも無い、「手順」の見出しに番号付きの手順が無い、など。
//
// **意味ベクトルは使わない**。埋め込みのコサインが測るのは「同じ話題か」であって「答えがあるか」ではない。
// 「GEOの費用は会社によって様々です」は見出しと同じ話題なので高く出るが、答えていない。近さ（文字bigramの
// TF-IDFのコサイン）は結果に載せるだけで**判定には使わない**。「近さ0.12」と言われても直しようがないため。
// 廃止した /tools/prompt-fit が読み手に刺さらなかったのは、この種の数値を前に出していたからだと見ている。
//
// 解析の部品（分かち書き・TF-IDF・重要語）は src/lib/promptFit.ts と共有する。判定を2か所に書かない。
import {
  INTENT_LABEL,
  buildIdf,
  cosine,
  detectIntent,
  formatChecks,
  keyTerms,
  presence,
  sentences,
  tokenize,
  toVec,
  type Block,
  type FormatCheck,
  type Intent,
  type TermHit,
} from "./promptFit";
// 画面と共有する定数は auditMeta.ts（何も import しない葉）に置く。ここから再エクスポートする
export { ANSWER_STATE_LABEL, HEADING_VERDICT_LABEL, MIN_TEXT, type AnswerState, type HeadingVerdict } from "./auditMeta";
import { MIN_TEXT, type AnswerState, type HeadingVerdict } from "./auditMeta";

/**
 * 見出しと本文の噛み合いを見ない、定型の見出し。
 * 「まとめ」「はじめに」のような見出しは、本文と語が重ならないのが当たり前なので判定しない
 * （ここを判定すると、直す必要のない見出しばかりが指摘に並ぶ）。
 */
const BOILERPLATE = [
  "まとめ", "はじめに", "おわりに", "結論", "概要", "目次", "補足", "注意点", "ポイント", "参考",
  "出典", "関連記事", "よくある質問", "faq", "q&a", "背景", "目的", "前提", "用語", "この記事について",
];



/** 見出しがこれより短いと重要語が取れない */
const MIN_HEADING = 4;

/** 重要語のうち、本文に出てこないものがこの割合を超えたら「弱い」 */
const WEAK_MISS_RATIO = 0.5;



/**
 * 答えをはぐらかす言い回し。**見出しが問いなのに書き出しがこれだと、その節は答えになっていない。**
 * 「GEOの費用は会社によって様々です」はAI検索から見ると費用の答えが無いのと同じ。
 * 埋め込みベクトルでは見出しと同じ話題として高く出てしまうが、語句でなら確実に捕まえられる。
 */
const HEDGE = /様々|さまざま|多種多様|千差万別|一概に|場合によ|ケースバイケース|人それぞれ|まちまち|によって異な|によって違|によります|次第です/;

/**
 * 答えが節の書き出しにあるかを見る意図。**本文の語句で判定できるものだけ**。
 * howto（番号付きの手順）と compare（表）は、ブロックに「リストや表があるか」しか無く
 * **どこにあるかが分からない**ので、位置は判定しない（分からないことを断定しない）。
 */
const POSITION_CHECKED: ReadonlySet<Intent> = new Set<Intent>(["price", "case", "definition", "reason", "judge"]);

/** 節の書き出しとみなす文の数 */
const LEAD_SENTENCES = 2;

export type HeadingFit = {
  heading: string;
  level: number;
  /** 見出しと本文の近さ（0〜1）。同じページの他ブロックを母集団にしたTF-IDFのコサイン。**参考値** */
  closeness: number;
  /** 見出しの重要語が本文に出てくるか */
  terms: TermHit[];
  /** 見出しの直後の1文。ここが見出しへの答えになっているのが理想 */
  lead: string;
  /** 見出しが何を聞いているか。聞いている形でなければ "other" */
  intent: Intent;
  /** 見出しが何を聞いているかの日本語ラベル */
  intentLabel: string;
  /**
   * 聞いていることの「答えの形」が本文にあるか。
   * 意図が取れない見出し（"other"。体言止めの見出しなど）では null＝判定しない。
   */
  answer: FormatCheck | null;
  /**
   * 答えとして適切かの判定。`answer` が null のときは "skip"。
   *   ok   … 答えの形が節の書き出しにある
   *   late … 答えの形はあるが節の後ろにしかない（AI検索は節の先頭を抜き出すので前に出す）
   *   hedge… 書き出しが逃げ表現で、答えの形も無い（「費用は会社によって様々です」など）
   *   none … 答えの形が無い
   */
  answerState: AnswerState;
  /** なぜその判定になったか。そのまま直し方になる */
  answerReason: string;
  verdict: HeadingVerdict;
  /** なぜその判定になったか（そのまま指摘文に使う） */
  reason: string;
};

export type HeadingFitResult = {
  fits: HeadingFit[];
  /** 判定しなかった見出しの数（定型の見出し・本文が短いブロック） */
  skipped: number;
  /** 答えとして適切でない見出し（答えが無い・言い切っていない・後ろにある） */
  unanswered: HeadingFit[];
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
  if (target.length === 0) return { fits: [], skipped: Math.max(0, skipped), unanswered: [] };

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

    // 見出しを「問い」として読み、その答えが本文にあるか・適切かを見る。判定は promptFit と共有する
    const intent = detectIntent(block.heading);
    const answer = intent === "other" ? null : formatChecks(intent, block, block.text)[0] ?? null;

    const leadText = sentences(block.text).slice(0, LEAD_SENTENCES).join("");
    let answerState: AnswerState = "skip";
    let answerReason = "見出しから何を聞いているかが読み取れないので判定していません。";
    if (answer) {
      const label = answer.label;
      if (!answer.ok) {
        // 答えの形が無い。書き出しがはぐらかしていれば、直し方は「言い切る」で一意に決まる
        if (HEDGE.test(leadText)) {
          answerState = "hedge";
          answerReason = `${label}が無く、書き出しが「${leadText.slice(0, 40)}…」と言い切っていません。AI検索はこの節を答えとして抜き出せません。`;
        } else {
          answerState = "none";
          answerReason = `${label}が本文にありません。${answer.detail}`;
        }
      } else if (POSITION_CHECKED.has(intent) && !formatChecks(intent, null, leadText)[0]?.ok) {
        // 答えはあるが節の後ろにしかない。AI検索は見出しごとのまとまりを頭から読む
        answerState = "late";
        answerReason = `${label}は本文にありますが、節の書き出しにありません。AI検索は見出しの直後から抜き出すので、答えを先頭に出します。`;
      } else {
        answerState = "ok";
        answerReason = `${label}が節の書き出しにあります。`;
      }
    }

    return {
      heading: block.heading,
      level: block.level,
      closeness: Math.round(closeness * 100) / 100,
      terms,
      lead,
      intent,
      intentLabel: INTENT_LABEL[intent],
      answer,
      answerState,
      answerReason,
      verdict,
      reason,
    };
  });

  return { fits, skipped: Math.max(0, skipped), unanswered: fits.filter((f) => f.answerState === "none" || f.answerState === "hedge" || f.answerState === "late") };
}
