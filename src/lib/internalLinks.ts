// 記事本文に内部リンクを差し込む純関数。**文言は1字も変えない**（既に本文にある語をリンクで包むだけ）。
//
// 2026-09-09 時点で、公開73本のうち62本が本文に内部リンクを1本も持っていなかった。
// 原因は生成プロンプト（scripts/prompt.ts）に指示が無かったことで、そちらは INTERNAL_LINK_RULES で直した。
// このファイルは**既に書かれてしまった記事**を後から直すためのもので、生成側の代わりではない。
//
// 書き換えを許すのは地の文だけ。コードフェンス・インラインコード・JSX（図解コンポーネント）・見出し・
// 既存のリンク・URL の中には触れない。加えて「## 結論」の最初の段落は、AI検索と強調スニペットが
// 抜き出す文なので対象外にする（scripts/prompt.ts の INTERNAL_LINK_RULES と同じ理由）。

export type LinkRule = {
  /** 本文に出てきたらリンクにする語。長い順に試すので、表記ゆれは全部並べてよい */
  phrases: string[];
  href: string;
  /** 用語集へのリンクは1記事1本までに制限する（用語リンクだらけの記事にしないため） */
  kind: "lesson" | "glossary" | "page";
};

export type Insertion = { phrase: string; href: string };

/** 本文のうち、リンクを差し込んではいけない位置に true を立てた配列を作る */
export function maskedPositions(body: string): boolean[] {
  const mask = new Array<boolean>(body.length).fill(false);
  const block = (start: number, end: number) => {
    for (let i = Math.max(0, start); i < Math.min(body.length, end); i++) mask[i] = true;
  };

  // コードフェンス（```…```）
  for (const m of body.matchAll(/^```[\s\S]*?^```/gm)) block(m.index!, m.index! + m[0].length);
  // インラインコード
  for (const m of body.matchAll(/`[^`\n]*`/g)) block(m.index!, m.index! + m[0].length);
  // 見出し行
  for (const m of body.matchAll(/^#{1,6} .*$/gm)) block(m.index!, m.index! + m[0].length);
  // 既存の Markdown リンク・画像
  for (const m of body.matchAll(/!?\[[^\]\n]*\]\([^)\n]*\)/g)) block(m.index!, m.index! + m[0].length);
  // 生のURL
  for (const m of body.matchAll(/https?:\/\/\S+/g)) block(m.index!, m.index! + m[0].length);
  // JSX（行頭の < から、閉じる /> または > を含む行の末尾まで）。図解コンポーネントは複数行に渡る
  for (const m of body.matchAll(/^<[A-Z][\s\S]*?^(?:.*?\/>|<\/[A-Za-z]+>)\s*$/gm)) block(m.index!, m.index! + m[0].length);
  // 1行で閉じる JSX
  for (const m of body.matchAll(/<[A-Z][^\n]*?\/>/g)) block(m.index!, m.index! + m[0].length);

  // 「## 結論」の最初の段落（見出しの次の空行までではなく、次の空行で区切られる1段落）
  const lead = body.match(/^## 結論[^\n]*\n+([^\n]+)/m);
  if (lead) {
    const start = body.indexOf(lead[1], lead.index!);
    block(start, start + lead[1].length);
  }
  return mask;
}

/** ASCII の語は前後が英数字だと部分一致なので弾く（例: research の中の search） */
function boundaryOk(body: string, at: number, phrase: string): boolean {
  if (!/^[\x20-\x7e]+$/.test(phrase)) return true; // 日本語を含む語は境界の判定をしない
  const before = body[at - 1] ?? " ";
  const after = body[at + phrase.length] ?? " ";
  return !/[A-Za-z0-9]/.test(before) && !/[A-Za-z0-9]/.test(after);
}

/**
 * 本文に内部リンクを差し込む。1つの href につき1本、語の**最初の出現**だけをリンクにする。
 * 返り値の body は、リンク記法を足した以外は入力と同一（語順・語尾・空白を変えない）。
 */
export function insertInternalLinks(
  body: string,
  rules: LinkRule[],
  opts: { maxLinks?: number; maxGlossary?: number; skipHrefs?: string[] } = {},
): { body: string; inserted: Insertion[] } {
  const maxLinks = opts.maxLinks ?? 3;
  const maxGlossary = opts.maxGlossary ?? 1;
  // 1段落に2本以上入れない（scripts/prompt.ts の INTERNAL_LINK_RULES と同じ規則）。
  // これが無いと「llms.txt（AIクローラーにサイト構造を伝える…）」の1文に3本入る。
  const paragraphOf = (at: number) => (body.slice(0, at).match(/\n\s*\n/g) ?? []).length;
  const skip = new Set(opts.skipHrefs ?? []);

  const mask = maskedPositions(body);
  // 既に本文にあるリンクも規則の勘定に入れる。入れないと2回目の実行で用語集リンクが2本目に増え、
  // リンクのある段落に2本目が入る（冪等でなくなる）。リンク先の重複も同じ理由で弾く
  const existing = [...body.matchAll(/\]\((\/[^)\s]*)\)/g)];
  const used = new Set(existing.map((m) => m[1]));
  const occupied = new Set(existing.map((m) => paragraphOf(m.index!)));

  // 候補を全部集めてから、本文の出現位置が早い順に採用する（記事の頭のほうが文脈が濃い）
  type Cand = { at: number; phrase: string; rule: LinkRule };
  const cands: Cand[] = [];
  for (const rule of rules) {
    if (skip.has(rule.href) || used.has(rule.href)) continue;
    let best: Cand | null = null;
    for (const phrase of [...rule.phrases].sort((a, b) => b.length - a.length)) {
      let from = 0;
      for (;;) {
        const at = body.indexOf(phrase, from);
        if (at < 0) break;
        const clear = !mask.slice(at, at + phrase.length).some(Boolean);
        if (clear && boundaryOk(body, at, phrase)) {
          if (!best || at < best.at) best = { at, phrase, rule };
          break;
        }
        from = at + 1;
      }
    }
    if (best) cands.push(best);
  }

  cands.sort((a, b) => a.at - b.at);

  const chosen: Cand[] = [];
  let glossary = existing.filter((m) => m[1].startsWith("/glossary")).length;
  for (const c of cands) {
    if (chosen.length >= maxLinks) break;
    if (c.rule.kind === "glossary" && glossary >= maxGlossary) continue;
    // 同じ語・同じリンク先は1本まで。リンク同士が重ならないことも確かめる
    if (chosen.some((x) => x.rule.href === c.rule.href)) continue;
    if (chosen.some((x) => c.at < x.at + x.phrase.length && x.at < c.at + c.phrase.length)) continue;
    if (occupied.has(paragraphOf(c.at)) || chosen.some((x) => paragraphOf(x.at) === paragraphOf(c.at))) continue;
    chosen.push(c);
    if (c.rule.kind === "glossary") glossary++;
  }

  // 後ろから差し込む（前の挿入で位置がずれないように）
  let out = body;
  for (const c of [...chosen].sort((a, b) => b.at - a.at)) {
    out = out.slice(0, c.at) + `[${c.phrase}](${c.rule.href})` + out.slice(c.at + c.phrase.length);
  }
  return { body: out, inserted: chosen.sort((a, b) => a.at - b.at).map((c) => ({ phrase: c.phrase, href: c.rule.href })) };
}

// ---------------------------------------------------------------------------
// リンク先の定義
// ---------------------------------------------------------------------------
//
// 語は「その語が出てきたら、リンク先を読みたくなる」ものだけを選ぶ。
// 「SEO」「クロール」のような、この媒体では全記事に出る語はリンクにしない（リンクが意味を持たなくなる）。

/** レッスンへのリンク語。教科書の該当章に送る。用語集より優先する（説明が深い側に送るため） */
const LESSON_PHRASES: Record<string, string[]> = {
  "search-intent": ["検索意図"],
  "long-tail": ["ロングテール"],
  technical: ["テクニカルSEO"],
  snippet: ["強調スニペット"],
  structure: ["内部リンク", "サイト構造"],
  domain: ["サブドメイン", "ドメイン構造"],
  "geo-implementation": ["AIクローラー", "robots.txt"],
  measurement: ["効果測定"],
  "updates-risk": ["コアアップデート"],
  "brand-entity": ["指名検索", "ブランド言及"],
};

/** 用語集からリンクにしない語。この媒体ではどの記事にも出るので、リンクにしても情報が増えない */
const GLOSSARY_DENY = new Set([
  "SEO", "GEO", "クロール", "インデックス", "クエリ", "スニペット", "検索意図", "コアアップデート",
  "AIクローラー", "robots.txt", "CTR", "表示回数", "レンダリング", "AI生成コンテンツ", "トラフィックの減少",
]);

type LessonLike = { slug: string };
type TermLike = { slug: string; term: string; aliases?: string[] };

/** レッスン・用語集からリンク規則を組み立てる。データは呼び出し側から渡す（テストで固定するため） */
export function buildLinkRules(lessons: LessonLike[], terms: TermLike[]): LinkRule[] {
  const rules: LinkRule[] = [];
  for (const l of lessons) {
    const phrases = LESSON_PHRASES[l.slug];
    if (phrases?.length) rules.push({ phrases, href: `/learn/${l.slug}`, kind: "lesson" });
  }
  for (const t of terms) {
    if (GLOSSARY_DENY.has(t.term)) continue;
    const phrases = [t.term, ...(t.aliases ?? [])].filter((p) => p.length >= 3 && !GLOSSARY_DENY.has(p));
    if (phrases.length) rules.push({ phrases, href: `/glossary#${t.slug}`, kind: "glossary" });
  }
  return rules;
}
