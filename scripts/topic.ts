// タイトルから「同じ話題か」を判定する。collect（クラスタ化＝スコア）と pick（重複記事の防止）で同じ基準を使う。
// 英語はストップワード除去＋3文字以上、日本語はカタカナ語・英字・漢字2字以上の連続を語として扱う。
const STOP = new Set(
  "the a an of to in on for and or with is are at by from as how why what your you new via about into vs over up out more its it this that these those".split(" ")
);

export function tokens(title: string): Set<string> {
  const t = title.toLowerCase().replace(/via @\w+/g, "").replace(/[【】\[\]「」『』（）()：:,.!?？！–—-]/g, " ");
  const words = new Set<string>();
  for (const w of t.match(/[a-z0-9][a-z0-9.+-]{2,}/g) ?? []) if (!STOP.has(w)) words.add(w);
  for (const w of t.match(/[ァ-ヶー]{2,}|[一-龠]{2,}/g) ?? []) words.add(w);
  return words;
}

export function sameTopic(a: Set<string>, b: Set<string>) {
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  const jaccard = shared / (a.size + b.size - shared || 1);
  return shared >= 3 || jaccard >= 0.34;
}
