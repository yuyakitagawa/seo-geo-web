// 生成記事から「AIが書いた文章の型」を機械的に落とす。scripts/article.ts の validate() が呼ぶ。
//
// 2026-09-11、記事76を人手で直したときに数えたら、本文の太字が32箇所あった。
// 全段落に強調が付いていて、どこが要点か分からない状態になっていた。
// 同じ数え方で全79記事を見ると、太字の中央値は0で、独自記事だけが 50/48/42/38 と突出していた
// （0037 / 0070 / 0030 / 0075）。文体ルール（scripts/prompt.ts の styleRules）だけでは戻るので、
// 生成時に機械で見張る。
//
// 判定は「数えれば分かるもの」だけに絞る。「〜ではなく、〜です」のような言い回しは
// 正しく使う場面があり、機械で区別できないためプロンプト側の指示に置く。
//
// 検査の対象は本文の散文だけ。コードフェンスと図解コンポーネントのpropsは、
// ログの引用やラベルとして太字・記号を含むことがあるので除いて数える。

/** 本文に置ける太字の上限。既存79記事のうち69本がこの数以内に収まっている */
export const MAX_BOLD = 10;

/** 散文だけを取り出す（コードフェンスと図解コンポーネントを落とす） */
export function proseOnly(content: string): string {
  return content.replace(/```[\s\S]*?```/g, "").replace(/<Figure[A-Za-z]+[\s\S]*?\/>/g, "");
}

/**
 * 段落まるごとが太字1本の文でできている「決め台詞」を返す。
 * 前の段落を言い直すだけで新しい事実を足さない形になりやすく、記事76では2箇所あった。
 *
 * 「**1. ドメインが4年古い**」のような小見出し代わりのラベルは、直後の段落に本文が続く構造なので除く。
 * 見分けは文末で付ける（文なら「。」で終わるか、です・ます・ません・でした で終わる）。
 */
export function soloBoldParagraphs(content: string): string[] {
  return proseOnly(content)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => {
      const m = /^\*\*([^*\n]+)\*\*[。、]?$/.exec(p);
      if (!m) return false;
      return /(。|です|ます|ません|でした)$/.test(m[1].trim());
    });
}

/** 本文の太字の数 */
export function countBold(content: string): number {
  return (proseOnly(content).match(/\*\*/g) ?? []).length / 2;
}

/** 検出した問題を日本語で返す。空配列なら問題なし */
export function aiToneErrors(content: string): string[] {
  const errors: string[] = [];
  const bold = countBold(content);
  if (bold > MAX_BOLD) errors.push(`本文の太字が${bold}箇所（${MAX_BOLD}箇所まで。要点だけに絞る）`);
  for (const p of soloBoldParagraphs(content)) {
    errors.push(`段落全体が太字の決め台詞:${p.slice(0, 30)}（前の段落に統合するか、新しい事実を足す）`);
  }
  return errors;
}
