// /about が解説ページ（/geo・/seo）の焼き直しに戻らないことを検査する。
//
// 2026-09-07、/about は Search Console で「クロール済み - インデックス未登録」になっていた。
// FAQの前半3問が /geo の FAQ とほぼ同じ回答を持ち、同じサイト内で同じ問いに二重に答えていた。
// 規約（src/lib/about.ts のコメント）だけでは、次に質問を足すときに同じことが起きる。ここで機械的に見張る。
import assert from "node:assert/strict";
import test from "node:test";
import { ABOUT_FAQ, aboutFacts } from "./about";
import { GUIDE_LIST } from "./guides";
import type { FaqItem } from "./faq";

const normalize = (s: string) => s.replace(/[\s、。「」（）()・,.\-—]/g, "");

const GUIDE_FAQ: FaqItem[] = GUIDE_LIST.flatMap((g) => g.faq);
const GUIDE_ANSWERS = GUIDE_FAQ.map((f) => normalize(f.answer)).join("\n");

test("/about のFAQが解説ページのFAQと同じ文章を持たない", () => {
  // 25文字の連続一致を重複とみなす（言い回しを少し変えただけの焼き直しも捕まる）
  const WINDOW = 25;
  const dupes: string[] = [];
  for (const item of ABOUT_FAQ) {
    const answer = normalize(item.answer);
    for (let i = 0; i + WINDOW <= answer.length; i++) {
      const chunk = answer.slice(i, i + WINDOW);
      if (GUIDE_ANSWERS.includes(chunk)) {
        dupes.push(`${item.question}: 「${chunk}」が /geo・/seo のFAQと同じ`);
        break;
      }
    }
  }
  assert.deepEqual(dupes, []);
});

test("/about のFAQに用語の定義を聞く質問を置かない", () => {
  // 定義は /geo /seo /glossary が担当する。運営者情報は運営の実態だけに答える。
  const definitional = ABOUT_FAQ.filter((f) => /(GEO|SEO|AIO|LLMO|AEO)/.test(f.question) && /(とは|違い)/.test(f.question));
  assert.deepEqual(definitional.map((f) => f.question), []);
});

test("/about の質問が解説ページの質問と重ならない", () => {
  const guideQuestions = new Set(GUIDE_FAQ.map((f) => normalize(f.question)));
  const same = ABOUT_FAQ.filter((f) => guideQuestions.has(normalize(f.question)));
  assert.deepEqual(same.map((f) => f.question), []);
});

test("/about が載せる数字をサイトのデータから数えている", () => {
  const facts = aboutFacts();
  assert.ok(facts.articles > 0, "記事数が0本になっている");
  assert.equal(facts.news + facts.howto, facts.articles, "ニュースと解説の合計が総数と合わない");
  assert.ok(facts.original <= facts.articles);
  assert.ok(facts.official > 0 && facts.official <= facts.feeds);
  assert.ok(facts.tools > 0);
  assert.match(facts.updated, /^\d{4}-\d{2}-\d{2}$/);
  // 更新日は記事の最新公開日以上（現況を載せているページなので記事側の更新に追従する）
  if (facts.latest) assert.ok(facts.updated >= facts.latest);
});
