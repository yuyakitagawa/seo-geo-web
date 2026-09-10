# 独自記事の英語版（/en）

独自記事（`original: true`）だけ英語版を作り、`/en/articles/<slug>` で配る。2026-09-10 着手。
ブランチ `feat/en-original-articles`（worktree: `/Users/kitagawayuuya/seo-geo-web-en`）。

## 手順
- [x] 日本語の全ページを `src/app/(ja)/` へ移す（URLは不変。`<html lang="en">` を出すため英語版に別のルートレイアウトが要る）
- [x] 英語版の読み込み（`src/lib/content-en.ts`）・文言（`src/lib/en.ts`）・検査（`src/lib/enRules.ts` + `content-en.test.ts`）
- [x] `/en`・`/en/articles/[slug]`・OGP画像・404（`src/app/(en)/en/`）
- [x] 日本語記事の hreflang と「English」リンク、sitemap、llms.txt
- [x] 図解・目次・KeyPoints・パンくずの英語の既定値（`MDX_FIGURES_EN` / `label` / `lang`）
- [x] 既存の独自記事7本（id 30 / 37 / 38 / 39 / 70 / 71 / 75）を英訳（75 は作業中に main へ入ったもの）
- [x] 英訳スクリプト `npm run translate:en -- <id>`（`scripts/translate-en.ts`）
- [x] typecheck / test / lint / verify:api / build
- [ ] 英訳6本をオーナーが確認
- [ ] 最新 main を取り込んで PR → マージ

## 英訳で見つかった日本語版の要確認点（英訳では原文どおりにしてある）
- id 30: 「約3300万URLのうち引用されたのは約50%（2340万URL）」— 2,340万/3,300万は約71%。Ahrefs の元記事で要確認
- id 37: ClaudeBot のパス数が 2,259 と 2,257、GPTBot が 1,380 と 1,379 で箇所により違う
- id 38: FAQ で「手順は3ステップ」、図（FigureFlow）は4ステップ
